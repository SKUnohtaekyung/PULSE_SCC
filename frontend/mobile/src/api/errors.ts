// 서버 오류 봉투와 앱 오류 타입. 규칙 정본은 SCREEN_STATES 공통 불변식 9·11·12다.
// 봉투: { "error": { "code", "message", ... } }. 부가 필드는 API와 브랜치마다 다르므로
// fieldErrors·retryable·traceId는 있을 수도 없을 수도 있는 값으로 다룬다.

export type FieldError = {
  field: string;
  code?: string;
  message: string;
};

export class ApiError extends Error {
  /** 봉투의 error.code. 봉투가 없으면 null이다(불변식 11·12). */
  readonly code: string | null;
  readonly status: number;
  readonly retryable: boolean | null;
  readonly fieldErrors: FieldError[];

  constructor(params: {
    code: string | null;
    message: string;
    status: number;
    retryable?: boolean | null;
    fieldErrors?: FieldError[];
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.status = params.status;
    this.retryable = params.retryable ?? null;
    this.fieldErrors = params.fieldErrors ?? [];
  }

  /** 봉투 없는 401 — 액세스 토큰 만료로 보고 갱신 후 재전송한다(불변식 12). */
  get isEnvelopelessUnauthorized() {
    return this.status === 401 && this.code === null;
  }
}

/** 응답 자체를 받지 못한 상태. 같은 제출의 재전송에는 같은 Idempotency-Key를 쓴다(불변식 13). */
export class NetworkError extends Error {
  constructor(message = '네트워크에 연결하지 못했어요.') {
    super(message);
    this.name = 'NetworkError';
  }
}

const genericMessage = '요청을 처리하지 못했어요. 잠시 뒤에 다시 시도해 주세요.';

const asString = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null);

const readFieldErrors = (value: unknown): FieldError[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const record = item as Record<string, unknown>;
    const field = asString(record.field);
    const message = asString(record.message);
    if (!field || !message) return [];
    return [{ field, code: asString(record.code) ?? undefined, message }];
  });
};

/** 응답 본문에서 오류 봉투를 읽는다. 봉투가 없으면 code가 null인 ApiError를 만든다. */
export function toApiError(status: number, body: unknown): ApiError {
  const envelope =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>).error : undefined;

  if (typeof envelope !== 'object' || envelope === null) {
    return new ApiError({ code: null, message: genericMessage, status });
  }

  const record = envelope as Record<string, unknown>;
  const code = asString(record.code);
  if (!code) {
    return new ApiError({ code: null, message: genericMessage, status });
  }

  return new ApiError({
    code,
    message: asString(record.message) ?? genericMessage,
    status,
    retryable: typeof record.retryable === 'boolean' ? record.retryable : null,
    fieldErrors: readFieldErrors(record.fieldErrors),
  });
}

/** 세션이 만료·폐기돼 다시 로그인해야 하는 상태(AUTH-EXPIRED). */
export class SessionExpiredError extends Error {
  constructor(message = '로그인이 만료됐어요. 다시 로그인해 주세요.') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

/** 세션 만료로 볼 오류 코드(SCREEN_STATES §2.1). */
export const sessionExpiredCodes = [
  'INVALID_REFRESH_TOKEN',
  'SESSION_REVOKED',
  'ACCOUNT_NOT_ACTIVE',
  'ACCOUNT_NOT_FOUND',
];
