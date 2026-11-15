import { demoAccountCredentials } from '@/demo/mockServer';

// 시연 사이트 설정. 원본 앱(frontend/mobile/src/api/config.ts)은 서버 주소·Google 클라이언트 ID·
// 시연 계정을 환경변수에서 읽는다. 시연 사이트는 서버를 부르지 않으므로 아래 값만 쓴다.

/** 서버를 부르지 않는다. 전송 계층은 demo/mockServer.ts로 바로 간다. */
export const apiBaseUrl = 'demo://in-browser';

/** Google 로그인은 시연 계정으로 바로 들어간다(features/auth/googleSignIn.ts). */
export const googleWebClientId = 'demo';

/** 로그인 화면의 "테스트 계정으로 시작" 버튼이 쓰는 시연 계정. 비밀 값이 아니다. */
export const demoAccount = demoAccountCredentials;
