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
