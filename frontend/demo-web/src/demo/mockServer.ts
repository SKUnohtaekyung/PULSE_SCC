import type { ApiRequest, ApiResponse } from '@/api/transport';
import type {
  AnalysisResult,
  ApiUser,
  EvidencePage,
  JobStatus,
  NotificationItem,
  PerspectiveBlock,
  PerspectiveKey,
  PodiumSlot,
  SessionResponse,
} from '@/api/types';
import { perspectiveKeys } from '@/api/types';
import { type DemoPersonaKey, demoMetadata, demoPersonas, demoStoreDefaults, reviewsFor, topicReviewCountFor } from '@/demo/fixtures';
import { readItem, writeItem } from '@/demo/webStorage';

// 시연 사이트의 가짜 백엔드. 실제 API 계약(docs/architecture/API.md)과 같은 경로·응답 모양·오류 코드를 쓴다.
// 서버 대신 브라우저 안에서 동작하며, 상태는 localStorage(scc.demo.state.v1)에 남긴다.
//
// 결과의 가게는 입력과 관계없이 늘 예시 가게다. 지어낸 리뷰가 사용자가 입력한 실제 가게 이름에
// 붙어 그 가게의 리뷰처럼 읽히지 않게 하려는 것이다(2026-11-11 독립 리뷰 High 1).
//
// 시연 시나리오는 입력값으로 고른다(README의 "시연 시나리오" 절):
// - 가게 주소에 `notfound` → 가게를 찾지 못함
// - 가게 주소에 `fail` → 자동 재시도를 모두 쓴 실패(첫 시도만. 다시 요청하면 성공)
// - 가게 이름에 `리뷰부족` → 유효 리뷰 부족

export const demoAccountCredentials = { email: 'demo@pulse.example', password: 'pulse-demo' };

/**
 * 시연 계정만 비밀번호를 확인한다. 가입한 계정의 비밀번호는 저장하지 않는다 —
 * 공개 사이트의 브라우저 저장소에 사용자가 넣은 비밀번호를 남기지 않기 위해서다(독립 리뷰 Medium 5).
 * 그래서 가입한 계정은 어떤 비밀번호로도 로그인된다.
 */
type DemoUser = ApiUser;
type DemoJob = {
  jobId: string;
  userId: string;
  storeName: string;
  category: string;
  naverPlaceUrl: string;
  createdAt: number;
  attempt: number;
};

type DemoState = {
  users: DemoUser[];
  jobs: DemoJob[];
  savedJobIdByUser: Record<string, string>;
  notificationsByUser: Record<string, NotificationItem[]>;
  notificationEnabledByUser: Record<string, boolean>;
  /** 완료·실패 처리를 마친 작업. 한 작업을 두 번 처리하지 않는다. */
  finishedJobIds?: string[];
};

const stateKey = 'scc.demo.state.v1';
const demoUserId = 'demo-user-1';

const initialState = (): DemoState => ({
  users: [{ id: demoUserId, email: demoAccountCredentials.email, hasSavedAnalysis: false }],
  jobs: [],
  savedJobIdByUser: {},
  notificationsByUser: {},
  notificationEnabledByUser: {},
  finishedJobIds: [],
});

function loadState(): DemoState {
  const raw = readItem(stateKey);
  if (!raw) return initialState();
  try {
    const parsed = JSON.parse(raw) as DemoState;
    if (!Array.isArray(parsed.users) || !Array.isArray(parsed.jobs)) return initialState();
    return parsed;
  } catch {
    return initialState();
  }
}

let state = loadState();
const persist = () => writeItem(stateKey, JSON.stringify(state));

// ── 응답 도우미 ───────────────────────────────────────────────────────────

const json = (status: number, body: unknown): ApiResponse => ({ status, body });
const fail = (status: number, code: string, message: string) =>
  json(status, { error: { code, message } });
/** 봉투 없는 401. 클라이언트는 토큰을 갱신하고 다시 보낸다(공통 불변식 12). */
const unauthorized = () => json(401, null);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** 실제 네트워크처럼 짧게 기다린다. 0이면 화면 전환이 깜빡이고, 길면 시연이 늘어진다. */
const latency = () => wait(180 + Math.floor(Math.random() * 220));

const publicUser = (user: DemoUser): ApiUser => ({
  id: user.id,
  email: user.email,
  hasSavedAnalysis: Boolean(state.savedJobIdByUser[user.id]),
});

const session = (user: DemoUser): SessionResponse => {
  const now = Date.now();
  return {
    accessToken: `demo-access.${user.id}.${now}`,
    accessTokenExpiresAt: new Date(now + 60 * 60 * 1000).toISOString(),
    refreshToken: `demo-refresh.${user.id}.${now}`,
    refreshTokenExpiresAt: new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString(),
    user: publicUser(user),
  };
};

function userFromAuth(request: ApiRequest): DemoUser | null {
  const header = request.headers?.Authorization ?? '';
  const match = /^Bearer demo-access\.([^.]+)\./.exec(header);
  if (!match) return null;
  return state.users.find((user) => user.id === match[1]) ?? null;
}

// ── 분석 진행 ─────────────────────────────────────────────────────────────

// 실제 서버가 기록하는 단계만 쓴다(API.md §5.2: QUEUED → COLLECTING_REVIEWS → ANALYZING →
// GENERATING_IMAGE → COMPLETED). 시연은 그림을 만들지 않으므로 GENERATING_IMAGE는 보내지 않는다.
// 실제 분석은 수 분 걸리지만 시연은 약 10초로 줄였다(README "시연 시나리오").
const completedAt = 9600;
const timeline: { step: string; at: number; message: string }[] = [
  { step: 'QUEUED', at: 0, message: '분석을 준비하고 있어요.' },
  { step: 'COLLECTING_REVIEWS', at: 1500, message: '예시 리뷰를 불러오고 있어요.' },
  { step: 'ANALYZING', at: 4500, message: '손님 유형을 찾고 있어요.' },
  { step: 'COMPLETED', at: completedAt, message: '분석을 마쳤어요.' },
];

type Scenario = 'normal' | 'notFound' | 'retryExhausted' | 'insufficient';

function scenarioOf(job: DemoJob): Scenario {
  const url = job.naverPlaceUrl.toLowerCase();
  if (url.includes('notfound')) return 'notFound';
  // 다시 요청하면 성공하도록 같은 주소의 첫 시도만 실패시킨다.
  if (url.includes('fail') && job.attempt === 0) return 'retryExhausted';
  if (job.storeName.includes('리뷰부족')) return 'insufficient';
  return 'normal';
}

// FAILED 작업의 retryable은 계약상 늘 false다(API.md §5.3 아래 문단).
const failures: Record<Exclude<Scenario, 'normal'>, { at: number; error: Record<string, unknown> }> = {
  notFound: {
    at: 2000,
    error: { code: 'STORE_NOT_FOUND', message: '가게를 찾지 못했어요.' },
  },
  retryExhausted: {
    at: 6500,
    error: {
      code: 'ANALYSIS_RETRY_EXHAUSTED',
      message: '여러 번 시도했지만 분석을 마치지 못했어요. 잠시 뒤에 다시 요청해 주세요.',
    },
  },
  insufficient: {
    at: 4000,
    error: {
      code: 'INSUFFICIENT_VALID_REVIEWS',
      message: '분석 가능한 리뷰가 31건으로 기준 50건보다 적습니다.',
      validReviewCount: 31,
      minimumValidReviewCount: 50,
    },
  },
};

function jobStatus(job: DemoJob): JobStatus {
  const elapsed = Date.now() - job.createdAt;
  const base = {
    jobId: job.jobId,
    createdAt: new Date(job.createdAt).toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const scenario = scenarioOf(job);
  if (scenario !== 'normal' && elapsed >= failures[scenario].at) {
    const failure = failures[scenario];
    finishJob(job, failure.error.message as string);
    return {
      ...base,
      status: 'FAILED',
      progressStep: 'FAILED',
      message: failure.error.message as string,
      retryable: false,
      analysisId: null,
      error: failure.error as JobStatus['error'],
    };
  }
  const current = [...timeline].reverse().find((entry) => elapsed >= entry.at) ?? timeline[0];
  const completed = current.step === 'COMPLETED';
  if (completed) finishJob(job, null);
  return {
    ...base,
    status: completed ? 'COMPLETED' : current.step === 'QUEUED' ? 'QUEUED' : 'RUNNING',
    progressStep: current.step,
    message: current.message,
    retryable: false,
    analysisId: completed ? analysisIdOf(job.jobId) : null,
    error: null,
  };
}

const analysisIdOf = (jobId: string) => 'demo-analysis-' + jobId.replace(/^demo-job-/, '');
const jobIdOf = (analysisId: string) => 'demo-job-' + analysisId.replace(/^demo-analysis-/, '');
const isCompleted = (job: DemoJob) => scenarioOf(job) === 'normal' && Date.now() - job.createdAt >= completedAt;

/**
 * 작업이 끝났을 때의 처리를 한 번만 한다. 실제 서버는 작업이 끝나는 순간 처리하지만, 가짜 서버에는
 * 시간이 흐르는 프로세스가 없어 상태를 조회할 때 처리한다(README "가짜 서버의 한계").
 * - 저장본이 없는 사용자의 첫 완료 분석은 바로 저장한다(SCREEN_STATES §7, AnalyzeScreen.resolveCompletion).
 * - 알림 설정이 켜져 있으면 완료·실패 알림을 남긴다(API.md §8).
 */
function finishJob(job: DemoJob, failureMessage: string | null) {
  state.finishedJobIds ??= [];
  if (state.finishedJobIds.includes(job.jobId)) return;
  state.finishedJobIds.push(job.jobId);
  if (failureMessage === null) state.savedJobIdByUser[job.userId] ??= job.jobId;
  if (state.notificationEnabledByUser[job.userId] ?? true) {
    (state.notificationsByUser[job.userId] ??= []).unshift({
      id: 'demo-notice-' + job.jobId,
      type: failureMessage === null ? 'ANALYSIS_COMPLETED' : 'ANALYSIS_FAILED',
      message:
        failureMessage === null
          ? `${demoStoreDefaults.storeName} 분석을 마쳤어요. 결과를 확인해 보세요.`
          : `${demoStoreDefaults.storeName} 분석을 마치지 못했어요. ${failureMessage}`,
      createdAt: new Date().toISOString(),
    });
  }
  persist();
}

// ── 결과 조립 ─────────────────────────────────────────────────────────────

function perspectiveBlock(personaIndex: number, key: PerspectiveKey): PerspectiveBlock {
  const persona = demoPersonas[personaIndex];
  const reviews = reviewsFor(persona.key, key);
  return {
    reviewFacts: persona.facts[key].map((text, index) => ({ id: `fact-${persona.key}-${key}-${index}`, text })),
    aiInterpretations: persona.interpretations[key].map((text, index) => ({
      id: `interpretation-${persona.key}-${key}-${index}`,
      text,
    })),
    evidencePreview: reviews.slice(0, 2).map((review) => ({
      reviewId: review.id,
      excerpt: review.excerpt,
      writtenAt: review.writtenAt,
    })),
    evidenceCount: reviews.length,
  };
}

function buildResult(job: DemoJob): AnalysisResult {
  const podium: PodiumSlot[] = demoPersonas.map((persona, index) => ({
    rank: index + 1,
    status: 'FILLED',
    topicReviewCount: topicReviewCountFor(persona.key),
    persona: {
      id: `demo-persona-${persona.key}`,
      label: persona.label,
      summary: persona.summary,
      caveat: persona.caveat,
      image: {
        id: `demo-${persona.key}`,
        url: `/api/v1/persona-images/demo-${persona.key}`,
        altText: persona.altText,
        generatedByAi: true,
      },
      perspectives: Object.fromEntries(
        perspectiveKeys.map((key) => [key, perspectiveBlock(index, key)]),
      ) as Record<PerspectiveKey, PerspectiveBlock>,
      advice: persona.advice.map(({ evidence, ...advice }, adviceIndex) => {
        // 제안의 근거는 그 제안을 만든 '손님이 불편해한 점' 리뷰다(fixtures의 evidence 순서).
        const negatives = reviewsFor(persona.key, 'negative');
        return {
          ...advice,
          id: `advice-${persona.key}-${adviceIndex}`,
          evidencePreview: evidence
            .map((position) => negatives[position])
            .filter((review) => review !== undefined)
            .map((review) => ({ reviewId: review.id, excerpt: review.excerpt, writtenAt: review.writtenAt })),
        };
      }),
    },
  }));
  const finishedAt = new Date(job.createdAt + completedAt).toISOString();
  return {
    analysisId: analysisIdOf(job.jobId),
    jobId: job.jobId,
    // 입력과 관계없이 예시 가게다(파일 머리 주석).
    store: {
      name: demoStoreDefaults.storeName,
      category: demoStoreDefaults.category,
      naverPlaceUrl: demoStoreDefaults.naverPlaceUrl,
    },
    metadata: { ...demoMetadata, collectedAt: finishedAt, analyzedAt: finishedAt },
    limitations: [
      { code: 'DEMO_SAMPLE_DATA', message: '시연용 예시 데이터예요. 실제 가게의 리뷰가 아니에요.' },
    ],
    podium,
  };
}

const evidencePerspectives = ['positive', 'negative', 'perception', 'priority', 'advice'];

function evidencePage(user: DemoUser, analysisId: string, query: URLSearchParams): ApiResponse {
  const job = state.jobs.find((candidate) => analysisIdOf(candidate.jobId) === analysisId);
  const personaKey = (query.get('personaId') ?? '').replace(/^demo-persona-/, '');
  // 다른 사용자의 분석·분석에 없는 손님 유형은 존재 여부를 드러내지 않고 404로 답한다(API.md §7).
  if (!job || job.userId !== user.id || !isCompleted(job) || !demoPersonas.some((p) => p.key === personaKey)) {
    return fail(404, 'ANALYSIS_NOT_FOUND', '분석을 찾지 못했어요.');
  }
  const perspective = (query.get('perspective') ?? '').toLowerCase();
  const limitText = query.get('limit');
  const limit = limitText === null ? 20 : Number(limitText);
  if (!evidencePerspectives.includes(perspective) || !Number.isInteger(limit) || limit < 1 || limit > 120) {
    return fail(400, 'INVALID_EVIDENCE_REQUEST', '근거 조회 조건이 올바르지 않아요.');
  }
  const cursor = query.get('cursor');
  const offset = cursor === null ? 0 : Number(cursor);
  if (!Number.isInteger(offset) || offset < 0) {
    return fail(400, 'INVALID_EVIDENCE_CURSOR', '근거 목록 위치가 올바르지 않아요.');
  }
  // "검토해 볼 행동"의 근거는 불편 리뷰에서 나온다(결과 조립과 같은 기준).
  const source = perspective === 'advice' ? 'negative' : perspective;
  const all = reviewsFor(personaKey as DemoPersonaKey, source as PerspectiveKey);
  const items = all.slice(offset, offset + limit).map((review) => ({
    reviewId: review.id,
    excerpt: review.excerpt,
    rating: review.rating,
    writtenAt: review.writtenAt,
    platform: 'NAVER',
  }));
  const next = offset + limit < all.length ? String(offset + limit) : null;
  const page: EvidencePage = { items, nextCursor: next };
  return json(200, page);
}

// ── 라우터 ────────────────────────────────────────────────────────────────

type Body = Record<string, unknown>;
const bodyOf = (request: ApiRequest) => (request.body ?? {}) as Body;
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export async function handleDemoRequest(request: ApiRequest): Promise<ApiResponse> {
  await latency();
  state = loadState();
  const [pathname, search = ''] = request.path.split('?');
  const query = new URLSearchParams(search);
  const route = `${request.method} ${pathname}`;

  // 인증이 필요 없는 요청
  if (route === 'GET /api/v1/legal-documents') {
    return json(200, { termsVersion: 'demo-2026-09', privacyVersion: 'demo-2026-09' });
  }
  if (route === 'POST /api/v1/auth/login') {
    const email = text(bodyOf(request).email).toLowerCase();
    const password = text(bodyOf(request).password);
    const user = state.users.find((candidate) => candidate.email === email);
    const passwordOk = user?.id !== demoUserId || password === demoAccountCredentials.password;
    if (!user || !passwordOk) {
      return fail(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 맞지 않아요.');
    }
    return json(200, session(user));
  }
  if (route === 'POST /api/v1/auth/google') {
    return json(200, session(state.users.find((user) => user.id === demoUserId) ?? initialState().users[0]));
  }
  if (route === 'POST /api/v1/auth/register') {
    const email = text(bodyOf(request).email).toLowerCase();
    if (state.users.some((user) => user.email === email)) {
      return fail(409, 'EMAIL_ALREADY_EXISTS', '이미 가입한 이메일이에요.');
    }
    const user: DemoUser = { id: 'demo-user-' + (state.users.length + 1), email, hasSavedAnalysis: false };
    state.users.push(user);
    persist();
    return json(201, session(user));
  }
  if (route === 'POST /api/v1/auth/refresh') {
    const match = /^demo-refresh\.([^.]+)\./.exec(text(bodyOf(request).refreshToken));
    const user = match ? state.users.find((candidate) => candidate.id === match[1]) : null;
    return user ? json(200, session(user)) : fail(401, 'INVALID_REFRESH_TOKEN', '다시 로그인해 주세요.');
  }

  // 인증이 필요한 요청
  const user = userFromAuth(request);
  if (!user) return unauthorized();

  if (route === 'GET /api/v1/auth/session') return json(200, publicUser(user));
  if (route === 'POST /api/v1/auth/logout') return json(204, null);

  if (route === 'POST /api/v1/analysis-jobs') {
    const body = bodyOf(request);
    const idempotencyKey = request.headers?.['Idempotency-Key'] ?? String(Date.now());
    // 같은 키는 같은 사용자 안에서만 같은 작업이다.
    const jobId = `demo-job-${user.id.replace(/[^a-zA-Z0-9]/g, '')}${idempotencyKey.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
    const existing = state.jobs.find((job) => job.jobId === jobId);
    const input = {
      storeName: text(body.storeName),
      category: text(body.category),
      naverPlaceUrl: text(body.naverPlaceUrl),
    };
    if (
      existing &&
      (existing.storeName !== input.storeName ||
        existing.category !== input.category ||
        existing.naverPlaceUrl !== input.naverPlaceUrl)
    ) {
      return fail(409, 'IDEMPOTENCY_KEY_REUSED', '같은 요청 키로 다른 내용을 보냈어요.');
    }
    const previous = state.jobs.filter(
      (job) => job.userId === user.id && job.naverPlaceUrl === input.naverPlaceUrl,
    ).length;
    const job: DemoJob = existing ?? { jobId, userId: user.id, ...input, createdAt: Date.now(), attempt: previous };
    if (!existing) {
      state.jobs.push(job);
      persist();
    }
    return json(202, {
      jobId: job.jobId,
      status: 'QUEUED',
      progressStep: 'QUEUED',
      message: timeline[0].message,
      createdAt: new Date(job.createdAt).toISOString(),
    });
  }

  const jobMatch = /^\/api\/v1\/analysis-jobs\/([^/]+)(\/result)?$/.exec(pathname);
  if (request.method === 'GET' && jobMatch) {
    const job = state.jobs.find((candidate) => candidate.jobId === jobMatch[1] && candidate.userId === user.id);
    if (!job) return fail(404, 'ANALYSIS_NOT_FOUND', '분석 작업을 찾지 못했어요.');
    const status = jobStatus(job);
    if (!jobMatch[2]) return json(200, status);
    if (status.status !== 'COMPLETED') return fail(409, 'ANALYSIS_NOT_COMPLETED', '분석이 아직 끝나지 않았어요.');
    return json(200, buildResult(job));
  }

  if (route === 'GET /api/v1/me/saved-analysis') {
    const jobId = state.savedJobIdByUser[user.id];
    const job = jobId ? state.jobs.find((candidate) => candidate.jobId === jobId) : null;
    if (!job) return fail(404, 'SAVED_ANALYSIS_NOT_FOUND', '저장한 분석이 없어요.');
    return json(200, buildResult(job));
  }

  const saveMatch = /^\/api\/v1\/me\/saved-analysis\/([^/]+)$/.exec(pathname);
  if (request.method === 'PUT' && saveMatch) {
    const jobId = jobIdOf(saveMatch[1]);
    const job = state.jobs.find((candidate) => candidate.jobId === jobId && candidate.userId === user.id);
    if (!job || !isCompleted(job)) return fail(404, 'ANALYSIS_NOT_FOUND', '분석을 찾지 못했어요.');
    state.savedJobIdByUser[user.id] = jobId;
    persist();
    return json(200, { analysisId: saveMatch[1], savedAt: new Date().toISOString() });
  }

  const evidenceMatch = /^\/api\/v1\/analyses\/([^/]+)\/evidence$/.exec(pathname);
  if (request.method === 'GET' && evidenceMatch) return evidencePage(user, evidenceMatch[1], query);

  if (route === 'GET /api/v1/me/notifications') return json(200, state.notificationsByUser[user.id] ?? []);
  if (route === 'GET /api/v1/me/notification-settings') {
    return json(200, { analysisResultEnabled: state.notificationEnabledByUser[user.id] ?? true });
  }
  if (route === 'PATCH /api/v1/me/notification-settings') {
    const enabled = Boolean(bodyOf(request).analysisResultEnabled);
    state.notificationEnabledByUser[user.id] = enabled;
    persist();
    return json(200, { analysisResultEnabled: enabled });
  }

  return fail(404, 'DEMO_ROUTE_NOT_FOUND', `시연 서버에 없는 요청이에요: ${route}`);
}
