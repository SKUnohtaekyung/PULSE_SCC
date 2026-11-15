import { handleDemoRequest } from '@/demo/mockServer';

// 시연 사이트(frontend/demo-web)의 전송 계층. 원본 앱(frontend/mobile)은 여기서 fetch로 서버를 부른다.
// 시연 사이트는 서버 없이 브라우저 안의 가짜 백엔드(demo/mockServer.ts)에 보낸다.
// 화면 코드와 ApiClient는 원본과 같으므로 토큰 갱신·오류 봉투 처리도 그대로 거친다.

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

export const sendRequest: (request: ApiRequest) => Promise<ApiResponse> = handleDemoRequest;

/** 시연 사이트에는 내려받을 PNG가 없다. 손님 유형 그림은 api/personaImages.ts가 코드로 그린다. */
export async function sendBinaryRequest(request: ApiRequest): Promise<ApiBinaryResponse> {
  void request;
  return {
    status: 404,
    data: null,
    body: { error: { code: 'IMAGE_NOT_FOUND', message: '시연 사이트에는 이미지 파일이 없어요.' } },
  };
}
