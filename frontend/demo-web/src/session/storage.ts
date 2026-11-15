import type { Tokens } from '@/api/client';
import { readItem, removeItem, writeItem } from '@/demo/webStorage';

// 시연 사이트의 토큰 저장소. 원본 앱은 expo-secure-store를 쓰지만 웹에는 그 구현이 없다.
// 시연 토큰은 가짜 백엔드만 읽는 값이라 비밀이 아니므로 브라우저 저장소에 둔다.
// 새로고침해도 로그인과 진행 상태가 이어지게 하려는 것이다.

const key = 'scc.session.tokens';

export async function readTokens(): Promise<Tokens | null> {
  const raw = readItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Tokens>;
    if (typeof parsed.accessToken !== 'string' || typeof parsed.refreshToken !== 'string') return null;
    return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
  } catch {
    return null;
  }
}

export async function writeTokens(tokens: Tokens) {
  writeItem(key, JSON.stringify(tokens));
}

export async function clearTokens() {
  removeItem(key);
}
