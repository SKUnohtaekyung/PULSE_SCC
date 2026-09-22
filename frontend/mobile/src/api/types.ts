// API 계약 타입. 정본은 docs/architecture/API.md와 실제 원격 백엔드 코드다.
// 아래 모양은 2026-09-22 기준 origin/feat/TASK-011-authentication(74d6df8)의 AuthController와
// origin/feat/TASK-012-analysis-pipeline(a4ab15b)의 AnalysisController·AnalysisRepository에서 읽었다.
// API.md §4.2와 다른 점은 주석으로 적는다. 병합 후 다시 대조한다.

export type ApiUser = {
  id: string;
  email: string;
  hasSavedAnalysis: boolean;
};

// API.md §4.2는 accessToken·expiresAt·user·hasSavedAnalysis를 적지만,
// 실제 AuthController.SessionResponse는 아래 네 토큰 필드와 user를 준다.
export type SessionResponse = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: ApiUser;
};

export type JobStatusValue = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

// API.md §5.2의 progressStep 전체. 서버가 모든 단계를 보내지는 않는다(SCREEN_STATES §5).
export const progressSteps = [
  'QUEUED',
  'RESOLVING_STORE',
  'COLLECTING_REVIEWS',
  'PREPROCESSING',
  'ANALYZING',
  'RETRIEVING_KNOWLEDGE',
  'GENERATING_ADVICE',
  'GENERATING_IMAGE',
  'VALIDATING_RESULT',
  'COMPLETED',
  'FAILED',
] as const;

export type ProgressStep = (typeof progressSteps)[number];

export type JobError = {
  code: string;
  message: string;
};

export type JobCreated = {
  jobId: string;
  status: JobStatusValue;
  progressStep: string;
  message: string;
  createdAt: string;
};

export type JobStatus = {
  jobId: string;
  status: JobStatusValue;
  progressStep: string;
  message: string;
  retryable: boolean;
  analysisId: string | null;
  error: JobError | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateJobRequest = {
  storeName: string;
  category: string;
  naverPlaceUrl: string;
};

export type EvidencePreview = {
  reviewId: string;
  excerpt: string;
  writtenAt: string;
};

export type PerspectiveBlock = {
  reviewFacts: { id: string; text: string }[];
  aiInterpretations: { id: string; text: string }[];
  evidencePreview: EvidencePreview[];
  evidenceCount: number;
};

export const perspectiveKeys = ['positive', 'negative', 'perception', 'priority'] as const;

export type PerspectiveKey = (typeof perspectiveKeys)[number];

export type Advice = {
  id: string;
  reviewFact: string;
  suggestedAction: string;
  details: {
    aiInterpretation: string;
    knowledgeReferences: { title: string; locator: string }[];
  };
  evidencePreview?: EvidencePreview[];
};

export type PersonaImage = {
  id: string;
  url: string;
  altText: string;
  generatedByAi: boolean;
};

export type Persona = {
  id: string;
  label: string;
  summary: string;
  // caveat는 API.md에 없고 실제 응답에만 있다.
  caveat?: string | null;
  image: PersonaImage;
  perspectives: Partial<Record<PerspectiveKey, PerspectiveBlock>>;
  advice: Advice[];
};

export type PodiumSlot = {
  rank: number;
  status: 'FILLED' | 'EMPTY';
  topicReviewCount?: number;
  reason?: { code: string; message: string };
  // 빈 슬롯에는 persona 키가 없을 수 있다(SCREEN_STATES §6.1).
  persona?: Persona | null;
};

export type AnalysisMetadata = {
  platform: string;
  collectedReviewCount: number;
  validReviewCount: number;
  collectedAt: string;
  analyzedAt: string;
  containsReviewsOlderThanTwoYears: boolean;
};

export type AnalysisResult = {
  analysisId: string;
  jobId: string;
  store: { name: string; category: string; naverPlaceUrl: string };
  metadata: AnalysisMetadata;
  limitations: { code: string; message: string }[];
  podium: PodiumSlot[];
};

export type SavedAnalysisReplaced = {
  analysisId: string;
  savedAt: string;
};
