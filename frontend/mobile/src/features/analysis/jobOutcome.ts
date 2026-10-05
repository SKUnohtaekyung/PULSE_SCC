import type { JobStatus } from '@/api/types';

// 작업 실패를 화면 상태로 바꾼다. 정본은 SCREEN_STATES §2.1과 §5.1이다.
// - 입력을 고쳐야 하는 실패는 가게 입력 화면으로 돌아간다(STORE-NOT-FOUND, STORE-UNSUPPORTED-URL).
// - 그 밖의 실패는 작업의 retryable 값으로 재시도 가능·불가를 가른다.
// - §2.1 표에 있는 코드는 앱 문구를 쓰고, 표에 없는 코드만 서버 error.message를 쓴다(공통 불변식 11).
// - 작업 상태 조회 자체가 실패한 것(5xx 등)은 작업 실패가 아니다. 작업은 서버에서 계속 돌고 있을 수
//   있으므로 새 작업을 만들지 않고 같은 작업을 다시 조회한다(불변식 11의 재시도 행동, #34).

export type JobFailure =
  | { kind: 'storeNotFound' }
  | { kind: 'unsupportedUrl' }
  | { kind: 'insufficient' }
  | { kind: 'imageGenerationFailed'; message: string }
  | { kind: 'retryable'; message: string }
  | { kind: 'fatal'; message: string }
  | { kind: 'statusUnavailable'; message: string };

export const statusUnavailableFailure: JobFailure = {
  kind: 'statusUnavailable',
  message: '분석은 계속되고 있을 수 있어요. 진행 상태를 다시 확인해 주세요.',
};

const knownAnalysisCodes = [
  'REVIEW_COLLECTION_BLOCKED',
  'ANALYSIS_OUTPUT_INVALID',
  'INTERNAL_ANALYSIS_SERVICE_UNAVAILABLE',
  'ANALYSIS_SERVICE_REJECTED',
  'ANALYSIS_CONFIGURATION_MISSING',
  'ANALYSIS_TIMEOUT',
];

const retryableCopy = '일시적인 문제로 분석을 마치지 못했어요. 다시 시도할 수 있어요.';
const fatalCopy = '서비스 쪽 문제로 지금은 분석을 마칠 수 없어요. 잠시 뒤에 다시 시도해 주세요.';

export function readJobFailure(job: JobStatus): JobFailure {
  const code = job.error?.code ?? null;

  if (code === 'STORE_NOT_FOUND') return { kind: 'storeNotFound' };
  if (code === 'INVALID_NAVER_PLACE_URL') return { kind: 'unsupportedUrl' };
  if (code === 'INSUFFICIENT_VALID_REVIEWS') return { kind: 'insufficient' };
  if (code === 'IMAGE_GENERATION_FAILED') {
    return {
      kind: 'imageGenerationFailed',
      message: '손님 유형 이미지를 만들지 못해 분석을 마치지 못했어요. 다시 시도할 수 있어요.',
    };
  }

  const known = code !== null && knownAnalysisCodes.includes(code);
  const serverMessage = job.error?.message ?? job.message;

  if (job.retryable) {
    return { kind: 'retryable', message: known || !code ? retryableCopy : serverMessage };
  }
  return { kind: 'fatal', message: known || !code ? fatalCopy : serverMessage };
}

const progressLabels: Record<string, string> = {
  QUEUED: '분석 준비 중',
  RESOLVING_STORE: '가게 확인 중',
  COLLECTING_REVIEWS: '네이버 리뷰 수집 중',
  PREPROCESSING: '리뷰를 정리 중',
  ANALYZING: '반복되는 손님 경험 분석 중',
  RETRIEVING_KNOWLEDGE: '관련 운영·마케팅 지식 확인 중',
  GENERATING_ADVICE: '검토할 행동 정리 중',
  GENERATING_IMAGE: '손님 유형 이미지 생성 중',
  VALIDATING_RESULT: '결과와 근거 확인 중',
  COMPLETED: '분석 완료',
};

const progressPercentages: Record<string, number> = {
  QUEUED: 8,
  RESOLVING_STORE: 18,
  COLLECTING_REVIEWS: 36,
  PREPROCESSING: 52,
  ANALYZING: 68,
  RETRIEVING_KNOWLEDGE: 74,
  GENERATING_ADVICE: 82,
  GENERATING_IMAGE: 90,
  VALIDATING_RESULT: 96,
  COMPLETED: 100,
};

/** 앱이 모르는 단계 값은 '분석 중'으로 표시한다(SCREEN_STATES §5). */
export function progressLabel(step: string) {
  return progressLabels[step] ?? '분석 중';
}

/** 서버가 확인해 준 단계의 위치다. 경과 시간이나 완료 예상 시간을 뜻하지 않는다. */
export function progressPercent(step: string) {
  return progressPercentages[step] ?? 8;
}
