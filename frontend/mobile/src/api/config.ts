import Constants from 'expo-constants';

const readBaseUrl = () => {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim().replace(/\/+$/, '');
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const fromExtra = extra?.apiBaseUrl;
  if (typeof fromExtra === 'string' && fromExtra.trim()) return fromExtra.trim().replace(/\/+$/, '');
  // Android 에뮬레이터의 10.0.2.2는 개발 PC의 localhost다.
  // 배포 빌드는 반드시 EXPO_PUBLIC_API_BASE_URL 또는 expo.extra.apiBaseUrl을 제공해야 한다.
  return __DEV__ ? 'http://10.0.2.2:8080' : null;
};

export const apiBaseUrl = readBaseUrl();

// Google 로그인에 쓰는 웹 애플리케이션 유형 OAuth 클라이언트 ID다. 비밀 값이 아니다.
// 서버의 GOOGLE_CLIENT_ID와 같은 값이어야 한다. 없으면 Google 로그인을 시작하지 않는다.
const readGoogleWebClientId = () => {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim();
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const fromExtra = extra?.googleWebClientId;
  if (typeof fromExtra === 'string' && fromExtra.trim()) return fromExtra.trim();
  return null;
};

export const googleWebClientId = readGoogleWebClientId();

// 전시 시연에서 미리 분석해 둔 계정으로 바로 들어가는 테스트 계정이다. 시연용 APK를 빌드할 때만
// 두 값을 넣는다. 넣은 값은 APK 안에 그대로 들어가므로 시연 전용 계정에만 쓴다. 둘 중 하나라도
// 없으면 로그인 화면에 테스트 계정 버튼을 그리지 않는다.
const readDemoAccount = () => {
  const email = process.env.EXPO_PUBLIC_DEMO_LOGIN_EMAIL?.trim();
  const password = process.env.EXPO_PUBLIC_DEMO_LOGIN_PASSWORD;
  if (!email || !password?.trim()) return null;
  return { email, password };
};

export const demoAccount = readDemoAccount();
