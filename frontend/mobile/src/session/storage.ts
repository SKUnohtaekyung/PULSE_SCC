import * as SecureStore from 'expo-secure-store';

import type { Tokens } from '@/api/client';

// 토큰은 안전 저장소에 둔다(SCREEN_STATES §3.1 APP-BOOTING).
// SecureStore를 쓸 수 없는 환경에서는 저장하지 않고 이번 실행에서만 유지한다.
// 저장하지 못했다는 사실은 숨기지 않고 secureStorageAvailable로 알린다.

const key = 'scc.session.tokens';

let memoryTokens: Tokens | null = null;
let available: boolean | null = null;

async function isAvailable() {
  if (available !== null) return available;
  try {
    available = await SecureStore.isAvailableAsync();
  } catch {
    available = false;
  }
  return available;
}

export async function secureStorageAvailable() {
  return isAvailable();
}

export async function readTokens(): Promise<Tokens | null> {
  if (!(await isAvailable())) return memoryTokens;
  try {
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Tokens>;
    if (typeof parsed.accessToken !== 'string' || typeof parsed.refreshToken !== 'string') {
      return null;
    }
    return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
  } catch {
    return null;
  }
}

export async function writeTokens(tokens: Tokens) {
  memoryTokens = tokens;
  if (!(await isAvailable())) return;
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(tokens));
  } catch {
    // 저장 실패는 이번 실행의 로그인 상태에 영향을 주지 않는다. 다음 실행에서 다시 로그인한다.
  }
}

export async function clearTokens() {
  memoryTokens = null;
  if (!(await isAvailable())) return;
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // 지우지 못해도 메모리 토큰은 비웠으므로 이번 실행에서는 인증 요청을 보내지 않는다.
  }
}
