import { apiBaseUrl } from '@/api/config';
import { NetworkError } from '@/api/errors';

export type ApiRequest = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export type ApiResponse = {
  status: number;
  body: unknown;
};

export type ApiBinaryResponse = {
  status: number;
  data: Uint8Array | null;
  body: unknown;
};

/**
 * 한 요청이 기다리는 최대 시간.
 * 응답이 오지 않는 요청을 끊지 않으면 분석 진행 화면의 상태 조회가 영영 멈춘 채로 남는다.
 * 끊긴 요청은 '응답을 받지 못한 요청'이므로 NetworkError로 다룬다(SCREEN_STATES 공통 불변식 13).
 * 분석 polling·백오프 정책 자체는 아직 미정이다(§11).
 */
const requestTimeoutMs = 15000;

async function httpTransport(request: ApiRequest): Promise<ApiResponse> {
  if (!apiBaseUrl) throw new NetworkError();
  const headers: Record<string, string> = { Accept: 'application/json', ...request.headers };
  if (request.body !== undefined) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

  let response: Response;
  try {
    response = await fetch(apiBaseUrl + request.path, {
      method: request.method,
      headers,
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      signal: controller.signal,
    });
  } catch {
    throw new NetworkError();
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return { status: 204, body: null };

  const raw = await response.text();
  if (!raw) return { status: response.status, body: null };
  try {
    return { status: response.status, body: JSON.parse(raw) as unknown };
  } catch {
    // 봉투가 아닌 응답(서버 기본 오류 페이지 등)은 본문 없이 다룬다(불변식 11).
    return { status: response.status, body: null };
  }
}

export const sendRequest: (request: ApiRequest) => Promise<ApiResponse> = httpTransport;

/**
 * 인증이 필요한 이미지처럼 JSON이 아닌 응답을 받는다. 실패 응답만 오류 봉투로 읽어
 * ApiClient가 일반 API와 같은 토큰 갱신 규칙을 적용할 수 있게 한다.
 */
export async function sendBinaryRequest(request: ApiRequest): Promise<ApiBinaryResponse> {
  if (!apiBaseUrl) throw new NetworkError();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

  let response: Response;
  try {
    response = await fetch(apiBaseUrl + request.path, {
      method: request.method,
      headers: { Accept: 'image/png', ...request.headers },
      signal: controller.signal,
    });
  } catch {
    throw new NetworkError();
  } finally {
    clearTimeout(timer);
  }

  if (response.ok) {
    return {
      status: response.status,
      data: new Uint8Array(await response.arrayBuffer()),
      body: null,
    };
  }

  const raw = await response.text();
  if (!raw) return { status: response.status, data: null, body: null };
  try {
    return { status: response.status, data: null, body: JSON.parse(raw) as unknown };
  } catch {
    return { status: response.status, data: null, body: null };
  }
}
