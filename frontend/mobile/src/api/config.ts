import Constants from 'expo-constants';

// 실행 모드. 백엔드가 아직 병합·배포되지 않아 기본값은 fixture다(SCREEN_STATES §10).
// 실제 서버에 붙일 때는 EXPO_PUBLIC_API_BASE_URL을 주면 http 모드로 바뀐다.
export type ApiMode = 'fixture' | 'http';

const readBaseUrl = () => {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim().replace(/\/+$/, '');
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const fromExtra = extra?.apiBaseUrl;
  if (typeof fromExtra === 'string' && fromExtra.trim()) return fromExtra.trim().replace(/\/+$/, '');
  return null;
};

export const apiBaseUrl = readBaseUrl();
export const apiMode: ApiMode = apiBaseUrl ? 'http' : 'fixture';
export const isFixtureMode = apiMode === 'fixture';
