import { buildFixtureResult, type FixtureResultOptions } from '@/api/fixtures/data';
import type { AnalysisResult, CreateJobRequest, JobStatus, JobStatusValue } from '@/api/types';

// 백엔드가 아직 병합·배포되지 않아 쓰는 고정 fixture 서버다(SCREEN_STATES §10).
// 실제 endpoint 경로·요청·응답 모양은 원격 백엔드 코드(AuthController·AnalysisController·
// AnalysisRepository, 2026-09-22 기준)를 그대로 따른다. 타입은 실제 API와 같은 것을 쓴다.

export type FixtureScenario =
  | 'first'
  | 'partial'
  | 'noPersona'
  | 'imageMissing'
  | 'insufficient'
  | 'retryable'
  | 'fatal'
  | 'storeNotFound'
  | 'unsupportedUrl'
  | 'imageGenerationFailed'
  | 'expiredAccessToken'
  | 'idempotencyReused';

export const fixtureScenarios: { key: FixtureScenario; label: string; note: string }[] = [
  { key: 'first', label: '첫 분석 성공', note: '손님 유형 3개까지 채워진 결과' },
  { key: 'partial', label: '유형 부족', note: '손님 유형 2개, 빈 슬롯 1개' },
  { key: 'noPersona', label: '유형 0개', note: '세 슬롯이 모두 빈 결과' },
  { key: 'imageMissing', label: '이미지 조회 실패', note: '1위 이미지를 불러오지 못하는 결과' },
  { key: 'insufficient', label: '리뷰 부족', note: '유효 리뷰 50건 미만으로 실패' },
  { key: 'retryable', label: '재시도 가능 실패', note: '첫 시도만 실패하고 다시 시도하면 성공' },
  { key: 'fatal', label: '서비스 문제', note: '다시 시도해도 지금은 끝낼 수 없는 실패' },
  { key: 'storeNotFound', label: '가게 못 찾음', note: '입력 화면으로 돌아가는 실패' },
  { key: 'unsupportedUrl', label: '지원하지 않는 주소', note: '작업 생성 자체가 거부됨' },
  { key: 'imageGenerationFailed', label: '이미지 생성 실패', note: '이미지 생성 단계에서 실패' },
  { key: 'expiredAccessToken', label: '액세스 토큰 만료', note: '봉투 없는 401 → 토큰 갱신 후 재전송' },
  { key: 'idempotencyReused', label: '멱등 키 거부', note: '첫 요청이 409, 새 키로 다시 요청' },
];

export const fixtureAccount = {
  email: 'owner@example.com',
  password: 'pulse1234',
};

export type FixtureRequest = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export type FixtureResponse = {
  status: number;
  body: unknown;
};

type Job = {
  id: string;
  analysisId: string;
  request: CreateJobRequest;
  createdAt: number;
  scenario: FixtureScenario;
  attempt: number;
};

type Session = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpired: boolean;
  /** 이 세션으로 로그인한 계정. 가입한 계정과 예시 계정을 구분해서 돌려준다. */
  email: string;
};

const userId = '8bf5c78a-0000-4000-8000-000000000001';

const timing = {
  queuedMs: 1500,
  collectingMs: 4000,
};

let scenario: FixtureScenario = 'first';
let session: Session | null = null;
let savedAnalysis: AnalysisResult | null = null;
let jobs = new Map<string, Job>();
let results = new Map<string, AnalysisResult>();
let idempotencyKeys = new Map<string, string>();
let jobAttempts = 0;
let tokenSeq = 0;
let notificationsEnabled = true;
/** 가입으로 만든 계정. 가입 뒤에는 이 계정으로도 로그인할 수 있다. */
let registeredAccount: { email: string; password: string } | null = null;

/** 현재 약관 버전. 가입 요청의 동의 버전과 비교한다. */
const legalVersions = { termsVersion: '2026-09-01', privacyVersion: '2026-09-01' };

/**
 * 상황을 바꾸면 작업과 저장본을 모두 비운다.
 * 각 상황을 '저장본이 없는 사용자의 첫 분석'에서 시작해야 이번 Slice의 흐름을 그대로 볼 수 있다.
 * 로그인 세션은 유지한다.
 */
export function setFixtureScenario(next: FixtureScenario) {
  scenario = next;
  jobs = new Map();
  results = new Map();
  idempotencyKeys = new Map();
  jobAttempts = 0;
  savedAnalysis = null;
  // 이미 로그인한 상태에서 골라도 바로 확인할 수 있게, 지금 가진 액세스 토큰을 만료로 표시한다.
  // 다음 요청이 봉투 없는 401을 받고 앱이 토큰을 갱신한 뒤 다시 보낸다(공통 불변식 12).
  if (session) session.accessTokenExpired = next === 'expiredAccessToken';
}

export function getFixtureScenario() {
  return scenario;
}

const uuid = (seed: number, suffix: string) =>
  `${suffix}-0000-4000-8000-${String(seed).padStart(12, '0')}`;

const envelope = (
  status: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
): FixtureResponse => ({
  status,
  body: { error: { code, message, ...extra } },
});

/** 원격 백엔드의 SecurityConfig는 인증 실패 응답을 따로 정의하지 않아 봉투 없는 401이 온다(불변식 12). */
const envelopeless401 = (): FixtureResponse => ({ status: 401, body: null });

const issueSession = (expired: boolean, email: string): Session => {
  tokenSeq += 1;
  return {
    accessToken: `fixture-access-${tokenSeq}`,
    refreshToken: `fixture-refresh-${tokenSeq}`,
    accessTokenExpired: expired,
    email,
  };
};

const sessionBody = (current: Session) => ({
  accessToken: current.accessToken,
  accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  refreshToken: current.refreshToken,
  refreshTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  user: {
    id: userId,
    email: current.email,
    hasSavedAnalysis: savedAnalysis !== null,
  },
});

const readBearer = (request: FixtureRequest) => {
  const header = request.headers?.Authorization ?? request.headers?.authorization ?? '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
};

const isAuthorized = (request: FixtureRequest) => {
  const token = readBearer(request);
  if (!session || !token) return false;
  if (token !== session.accessToken) return false;
  return !session.accessTokenExpired;
};

const resultOptions = (current: FixtureScenario): FixtureResultOptions => {
  if (current === 'partial') return { personaCount: 2 };
  if (current === 'noPersona') return { personaCount: 0 };
  if (current === 'imageMissing') return { personaCount: 3, breakFirstImage: true };
  return { personaCount: 3 };
};

const failureFor = (
  job: Job,
): { code: string; message: string; retryable: boolean } | null => {
  switch (job.scenario) {
    case 'insufficient':
      return {
        code: 'INSUFFICIENT_VALID_REVIEWS',
        message: '분석에 사용할 수 있는 리뷰가 충분하지 않습니다.',
        retryable: false,
      };
    case 'retryable':
      // 첫 작업만 실패한다. 새 Idempotency-Key로 다시 요청하면 성공한다(불변식 13).
      return job.attempt === 1
        ? {
            code: 'REVIEW_COLLECTION_BLOCKED',
            message: '리뷰를 수집하지 못했습니다.',
            retryable: true,
          }
        : null;
    case 'fatal':
      return {
        code: 'ANALYSIS_SERVICE_REJECTED',
        message: '분석 서비스가 요청을 처리하지 못했습니다.',
        retryable: false,
      };
    case 'storeNotFound':
      return {
        code: 'STORE_NOT_FOUND',
        message: '잠시 후 다시 시도해 주세요.',
        retryable: false,
      };
    case 'imageGenerationFailed':
      return {
        code: 'IMAGE_GENERATION_FAILED',
        message: '손님 유형 이미지를 만들지 못했습니다.',
        retryable: true,
      };
    default:
      return null;
  }
};

const completeJob = (job: Job) => {
  const existing = results.get(job.id);
  if (existing) return existing;
  const result = buildFixtureResult(job.analysisId, job.id, job.request, resultOptions(job.scenario));
  results.set(job.id, result);
  // 서버는 작업을 COMPLETED로 바꾸는 같은 트랜잭션에서 저장본이 없는 계정에 첫 결과를 저장한다(API.md §3.2).
  if (!savedAnalysis) savedAnalysis = result;
  return result;
};

const jobStatus = (job: Job): JobStatus => {
  const elapsed = Date.now() - job.createdAt;
  const failure = failureFor(job);

  let status: JobStatusValue = 'QUEUED';
  let progressStep = 'QUEUED';
  let message = '분석 작업을 준비하고 있습니다.';

  if (elapsed >= timing.collectingMs) {
    if (failure) {
      // 원격 백엔드는 실패 시 progressStep을 FAILED로 덮어써 실패 단계를 알 수 없다(SCREEN_STATES §5.1).
      status = 'FAILED';
      progressStep = 'FAILED';
      message = failure.message;
    } else {
      status = 'COMPLETED';
      progressStep = 'COMPLETED';
      message = '분석이 끝났습니다.';
      completeJob(job);
    }
  } else if (elapsed >= timing.queuedMs) {
    status = 'RUNNING';
    progressStep = 'COLLECTING_REVIEWS';
    message = '네이버 리뷰를 수집하고 있습니다.';
  }

  return {
    jobId: job.id,
    status,
    progressStep,
    message,
    retryable: status === 'FAILED' ? (failure?.retryable ?? false) : false,
    analysisId: status === 'COMPLETED' ? job.analysisId : null,
    error: status === 'FAILED' && failure ? { code: failure.code, message: failure.message } : null,
    createdAt: new Date(job.createdAt).toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const isNaverHost = (value: string) => {
  const host = /^(?:https?:\/\/)?([^/?#:]+)/i.exec(value.trim())?.[1]?.toLowerCase() ?? '';
  return ['naver.me', 'naver.com'].some((domain) => host === domain || host.endsWith('.' + domain));
};

const readBody = (request: FixtureRequest) =>
  (typeof request.body === 'object' && request.body !== null
    ? (request.body as Record<string, unknown>)
    : {});

function handleAuth(request: FixtureRequest): FixtureResponse | null {
  if (request.path === '/api/v1/auth/login' && request.method === 'POST') {
    const body = readBody(request);
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const fieldErrors: { field: string; code: string; message: string }[] = [];
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      fieldErrors.push({ field: 'email', code: 'INVALID_VALUE', message: '이메일 형식을 확인해 주세요.' });
    }
    if (password.length < 8) {
      fieldErrors.push({ field: 'password', code: 'INVALID_VALUE', message: '비밀번호는 8자 이상입니다.' });
    }
    if (fieldErrors.length > 0) {
      return envelope(400, 'INVALID_INPUT', '입력값을 확인해 주세요.', { fieldErrors });
    }
    const known =
      (email === fixtureAccount.email && password === fixtureAccount.password) ||
      (registeredAccount !== null &&
        email === registeredAccount.email &&
        password === registeredAccount.password);
    if (!known) {
      return envelope(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    session = issueSession(scenario === 'expiredAccessToken', email);
    return { status: 200, body: sessionBody(session) };
  }

  if (request.path === '/api/v1/legal-documents' && request.method === 'GET') {
    return {
      status: 200,
      body: {
        termsVersion: legalVersions.termsVersion,
        privacyVersion: legalVersions.privacyVersion,
      },
    };
  }

  if (request.path === '/api/v1/auth/register' && request.method === 'POST') {
    const body = readBody(request);
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const phoneNumber = typeof body.phoneNumber === 'string' ? body.phoneNumber.trim() : '';
    const termsVersion = typeof body.termsVersion === 'string' ? body.termsVersion : '';
    const privacyVersion = typeof body.privacyVersion === 'string' ? body.privacyVersion : '';

    const fieldErrors: { field: string; code: string; message: string }[] = [];
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      fieldErrors.push({ field: 'email', code: 'INVALID_VALUE', message: '이메일 형식을 확인해 주세요.' });
    }
    if (password.length < 8) {
      fieldErrors.push({ field: 'password', code: 'INVALID_VALUE', message: '비밀번호는 8자 이상입니다.' });
    }
    if (!/^\+?\d{8,15}$/.test(phoneNumber.replace(/[^\d+]/g, ''))) {
      fieldErrors.push({
        field: 'phoneNumber',
        code: 'INVALID_VALUE',
        message: '전화번호를 다시 확인해 주세요. 예: 010-1234-5678',
      });
    }
    if (fieldErrors.length > 0) {
      return envelope(400, 'INVALID_INPUT', '입력값을 확인해 주세요.', { fieldErrors });
    }
    if (
      termsVersion !== legalVersions.termsVersion ||
      privacyVersion !== legalVersions.privacyVersion
    ) {
      return envelope(400, 'CURRENT_LEGAL_CONSENT_REQUIRED', '약관에 다시 동의해 주세요.');
    }
    if (email === fixtureAccount.email || email === registeredAccount?.email) {
      return envelope(409, 'EMAIL_ALREADY_EXISTS', '이미 가입된 이메일입니다.');
    }

    registeredAccount = { email, password };
    savedAnalysis = null;
    session = issueSession(false, email);
    return { status: 201, body: sessionBody(session) };
  }

  if (request.path === '/api/v1/auth/refresh' && request.method === 'POST') {
    const body = readBody(request);
    const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : '';
    if (!session || refreshToken !== session.refreshToken) {
      return envelope(401, 'INVALID_REFRESH_TOKEN', '다시 로그인해 주세요.');
    }
    session = issueSession(false, session.email);
    return { status: 200, body: sessionBody(session) };
  }

  if (request.path === '/api/v1/auth/session' && request.method === 'GET') {
    if (!isAuthorized(request)) return envelopeless401();
    return {
      status: 200,
      body: { id: userId, email: session?.email ?? fixtureAccount.email, hasSavedAnalysis: savedAnalysis !== null },
    };
  }

  if (request.path === '/api/v1/auth/logout' && request.method === 'POST') {
    if (!isAuthorized(request)) return envelopeless401();
    session = null;
    return { status: 204, body: null };
  }

  return null;
}

function handleAnalysis(request: FixtureRequest): FixtureResponse | null {
  if (request.path === '/api/v1/analysis-jobs' && request.method === 'POST') {
    if (!isAuthorized(request)) return envelopeless401();
    const body = readBody(request);
    const storeName = typeof body.storeName === 'string' ? body.storeName.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    const naverPlaceUrl = typeof body.naverPlaceUrl === 'string' ? body.naverPlaceUrl.trim() : '';
    const key = request.headers?.['Idempotency-Key'] ?? '';

    if (!storeName || !category) {
      // 분석 API는 현재 필드별 정보를 주지 않는다(SCREEN_STATES §2.1).
      return envelope(400, 'INVALID_INPUT', '가게 정보를 확인해 주세요.', { retryable: false, fields: [] });
    }
    if (!naverPlaceUrl || !isNaverHost(naverPlaceUrl) || scenario === 'unsupportedUrl') {
      return envelope(400, 'INVALID_NAVER_PLACE_URL', '지원하는 네이버 가게 주소를 입력해 주세요.', {
        retryable: false,
        fields: [],
      });
    }
    if (!key) {
      return envelope(400, 'INVALID_REQUEST', 'Idempotency-Key가 필요합니다.', { retryable: false, fields: [] });
    }

    const known = idempotencyKeys.get(key);
    if (known) {
      const existing = jobs.get(known);
      if (existing) {
        const status = jobStatus(existing);
        return {
          status: 202,
          body: {
            jobId: existing.id,
            status: status.status,
            progressStep: status.progressStep,
            message: status.message,
            createdAt: status.createdAt,
          },
        };
      }
    }

    if (scenario === 'idempotencyReused' && jobAttempts === 0) {
      jobAttempts += 1;
      return envelope(409, 'IDEMPOTENCY_KEY_REUSED', '같은 요청 키로 만든 다른 작업이 있습니다.', {
        retryable: false,
        fields: [],
      });
    }

    jobAttempts += 1;
    const job: Job = {
      id: uuid(jobAttempts, '6af9a900'),
      analysisId: uuid(jobAttempts, '87adf76d'),
      request: { storeName, category, naverPlaceUrl },
      createdAt: Date.now(),
      scenario,
      attempt: jobAttempts,
    };
    jobs.set(job.id, job);
    idempotencyKeys.set(key, job.id);
    return {
      status: 202,
      body: {
        jobId: job.id,
        status: 'QUEUED',
        progressStep: 'QUEUED',
        message: '분석 작업을 준비하고 있습니다.',
        createdAt: new Date(job.createdAt).toISOString(),
      },
    };
  }

  const statusMatch = /^\/api\/v1\/analysis-jobs\/([^/]+)$/.exec(request.path);
  if (statusMatch && request.method === 'GET') {
    if (!isAuthorized(request)) return envelopeless401();
    const job = jobs.get(statusMatch[1]);
    if (!job) return envelope(404, 'ANALYSIS_NOT_FOUND', '분석 작업을 찾을 수 없습니다.');
    return { status: 200, body: jobStatus(job) };
  }

  const resultMatch = /^\/api\/v1\/analysis-jobs\/([^/]+)\/result$/.exec(request.path);
  if (resultMatch && request.method === 'GET') {
    if (!isAuthorized(request)) return envelopeless401();
    const job = jobs.get(resultMatch[1]);
    if (!job) return envelope(404, 'ANALYSIS_NOT_FOUND', '분석 작업을 찾을 수 없습니다.');
    const status = jobStatus(job);
    if (status.status !== 'COMPLETED') {
      return envelope(409, 'ANALYSIS_NOT_COMPLETED', '아직 분석이 끝나지 않았습니다.');
    }
    return { status: 200, body: results.get(job.id) ?? completeJob(job) };
  }

  if (request.path === '/api/v1/me/saved-analysis' && request.method === 'GET') {
    if (!isAuthorized(request)) return envelopeless401();
    if (!savedAnalysis) {
      return envelope(404, 'SAVED_ANALYSIS_NOT_FOUND', '저장된 분석 결과가 없습니다.');
    }
    return { status: 200, body: savedAnalysis };
  }

  const evidenceMatch = /^\/api\/v1\/analyses\/([^/?]+)\/evidence/.exec(request.path);
  if (evidenceMatch && request.method === 'GET') {
    if (!isAuthorized(request)) return envelopeless401();
    const query = new URLSearchParams(request.path.split('?')[1] ?? '');
    const cursor = Number(query.get('cursor') ?? '0');
    const limit = Number(query.get('limit') ?? '20');
    const total = 47;
    const start = Number.isFinite(cursor) ? cursor : 0;
    const end = Math.min(start + limit, total);
    const items = Array.from({ length: Math.max(end - start, 0) }, (_, index) => {
      const order = start + index + 1;
      return {
        reviewId: 'review-' + order,
        excerpt: '예시 근거 리뷰 ' + order + '번이에요. 실제 리뷰가 아니라 화면 확인용 문장입니다.',
        rating: 4,
        writtenAt: '2026-0' + ((order % 8) + 1) + '-1' + (order % 9),
        platform: 'NAVER',
      };
    });
    return { status: 200, body: { items, nextCursor: end < total ? String(end) : null } };
  }

  if (request.path === '/api/v1/me/notifications' && request.method === 'GET') {
    if (!isAuthorized(request)) return envelopeless401();
    const items = savedAnalysis
      ? [
          {
            id: 'notification-1',
            type: 'ANALYSIS_COMPLETED',
            message: savedAnalysis.store.name + ' 분석이 끝났어요.',
            createdAt: savedAnalysis.metadata.analyzedAt,
          },
        ]
      : [];
    return { status: 200, body: items };
  }

  if (request.path === '/api/v1/me/notification-settings') {
    if (!isAuthorized(request)) return envelopeless401();
    if (request.method === 'GET') {
      return { status: 200, body: { analysisResultEnabled: notificationsEnabled } };
    }
    if (request.method === 'PATCH') {
      const body = readBody(request);
      if (typeof body.analysisResultEnabled !== 'boolean') {
        return envelope(400, 'INVALID_INPUT', '설정 값을 확인해 주세요.');
      }
      notificationsEnabled = body.analysisResultEnabled;
      return { status: 200, body: { analysisResultEnabled: notificationsEnabled } };
    }
  }

  const replaceMatch = /^\/api\/v1\/me\/saved-analysis\/([^/]+)$/.exec(request.path);
  if (replaceMatch && request.method === 'PUT') {
    if (!isAuthorized(request)) return envelopeless401();
    const analysisId = replaceMatch[1];
    const target = [...results.values()].find((item) => item.analysisId === analysisId);
    if (!target) return envelope(404, 'ANALYSIS_NOT_FOUND', '분석 결과를 찾을 수 없습니다.');
    savedAnalysis = target;
    return { status: 200, body: { analysisId, savedAt: new Date().toISOString() } };
  }

  return null;
}

export function handleFixtureRequest(request: FixtureRequest): FixtureResponse {
  return (
    handleAuth(request) ??
    handleAnalysis(request) ?? {
      status: 404,
      body: { error: { code: 'NOT_FOUND', message: '요청한 주소를 찾을 수 없습니다.' } },
    }
  );
}
