import { apiBaseUrl, isFixtureMode } from '@/api/config';
import { NetworkError } from '@/api/errors';
import { handleFixtureRequest } from '@/api/fixtures/server';

export type ApiRequest = {
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export type ApiResponse = {
  status: number;
  body: unknown;
};

/** fixture 응답도 네트워크처럼 약간의 지연을 준다. 로딩 상태가 화면에서 보이도록. */
const fixtureDelayMs = 350;

/**
 * 한 요청이 기다리는 최대 시간.
 * 응답이 오지 않는 요청을 끊지 않으면 분석 진행 화면의 상태 조회가 영영 멈춘 채로 남는다.
 * 끊긴 요청은 '응답을 받지 못한 요청'이므로 NetworkError로 다룬다(SCREEN_STATES 공통 불변식 13).
 * 분석 polling·백오프 정책 자체는 아직 미정이다(§11).
 */
const requestTimeoutMs = 15000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function fixtureTransport(request: ApiRequest): Promise<ApiResponse> {
  await sleep(fixtureDelayMs);
  return handleFixtureRequest(request);
}

async function httpTransport(request: ApiRequest): Promise<ApiResponse> {
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

export const sendRequest: (request: ApiRequest) => Promise<ApiResponse> = isFixtureMode
  ? fixtureTransport
  : httpTransport;
