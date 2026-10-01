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
