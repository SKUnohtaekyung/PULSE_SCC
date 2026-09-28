import { ApiError, NetworkError } from '@/api/errors';

// 오류를 사용자 문구로 바꾸는 공통 규칙이다. 정본은 SCREEN_STATES 공통 불변식 9·11.
//
// 1. 화면이 아는 코드(§2.1 표)는 화면이 정한 문구를 쓴다.
// 2. 표에 없는 코드는 서버 error.message를 그대로 보여준다.
// 3. 봉투가 없는 오류(서버 기본 4xx·5xx, 게이트웨이 응답 등)는 원인을 단정하지 않는 일반 문구를 쓴다.
// 4. 응답을 받지 못했으면 연결 안내를 쓴다.
//
// 화면마다 이 분기를 다시 쓰면 §2.1 표와 어긋나기 쉬워 한곳에 모은다.

export function resolveErrorMessage(
  error: unknown,
  options: {
    /** 이 화면이 문구를 정해 둔 코드. 키는 error.code다. */
    known?: Record<string, string>;
    /** 봉투가 없거나 ApiError가 아닐 때 쓸 일반 문구. */
    fallback: string;
    /** 응답을 받지 못했을 때 쓸 문구. 없으면 기본 연결 안내를 쓴다. */
    offline?: string;
  },
): string {
  if (error instanceof NetworkError) {
    return options.offline ?? '인터넷에 연결되지 않았어요. 연결한 뒤 다시 시도해 주세요.';
  }
  if (!(error instanceof ApiError)) return options.fallback;
  if (error.code === null) return options.fallback;
  return options.known?.[error.code] ?? error.message;
}
