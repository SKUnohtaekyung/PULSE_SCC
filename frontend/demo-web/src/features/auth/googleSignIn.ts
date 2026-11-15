// 시연 사이트의 Google 로그인. 원본 앱(frontend/mobile)은 네이티브 Google 계정 선택 창을 띄우지만,
// 시연 사이트는 실제 Google 계정을 쓰지 않는다. 누르면 시연 계정으로 들어가는 가짜 ID 토큰을 돌려준다.
// 가짜 백엔드(demo/mockServer.ts)는 이 토큰을 검증하지 않고 시연 계정 세션을 발급한다.

export type GoogleSignInOutcome =
  | { type: 'success'; idToken: string }
  | { type: 'cancelled' }
  /** 빌드에 웹 클라이언트 ID가 없다. */
  | { type: 'notConfigured' }
  /** 이 앱 빌드에 Google 로그인 모듈이 없다(Expo Go). */
  | { type: 'unsupported' }
  | { type: 'playServicesUnavailable' }
  | { type: 'failed' };

export async function requestGoogleIdToken(): Promise<GoogleSignInOutcome> {
  return { type: 'success', idToken: 'demo-google-id-token' };
}
