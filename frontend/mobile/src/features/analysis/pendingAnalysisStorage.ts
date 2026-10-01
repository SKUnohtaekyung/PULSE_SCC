import * as SecureStore from 'expo-secure-store';

export type PendingAnalysis = {
  jobId: string;
  storeName: string;
  category: string;
  naverPlaceUrl: string;
  progressSteps: string[];
};

const keyPrefix = 'scc.analysis.pending.v1.';
const memoryValues = new Map<string, PendingAnalysis>();
let available: boolean | null = null;

const keyFor = (userId: string) => keyPrefix + userId;

async function isAvailable() {
  if (available !== null) return available;
  try {
    available = await SecureStore.isAvailableAsync();
  } catch {
    available = false;
  }
  return available;
}

function parsePendingAnalysis(raw: string): PendingAnalysis | null {
  try {
    const value = JSON.parse(raw) as Partial<PendingAnalysis>;
    if (
      typeof value.jobId !== 'string' ||
      typeof value.storeName !== 'string' ||
      typeof value.category !== 'string' ||
      typeof value.naverPlaceUrl !== 'string' ||
      !Array.isArray(value.progressSteps) ||
      value.progressSteps.some((step) => typeof step !== 'string')
    ) {
      return null;
    }
    return {
      jobId: value.jobId,
      storeName: value.storeName,
      category: value.category,
      naverPlaceUrl: value.naverPlaceUrl,
      progressSteps: value.progressSteps.slice(-20),
    };
  } catch {
    return null;
  }
}

export async function readPendingAnalysis(userId: string): Promise<PendingAnalysis | null> {
  const storageKey = keyFor(userId);
  if (!(await isAvailable())) return memoryValues.get(storageKey) ?? null;
  try {
    const raw = await SecureStore.getItemAsync(storageKey);
    if (!raw) return null;
    const parsed = parsePendingAnalysis(raw);
    if (!parsed) await SecureStore.deleteItemAsync(storageKey);
    return parsed;
  } catch {
    return null;
  }
}

export async function writePendingAnalysis(userId: string, value: PendingAnalysis) {
  const storageKey = keyFor(userId);
  memoryValues.set(storageKey, value);
  if (!(await isAvailable())) return;
  try {
    await SecureStore.setItemAsync(storageKey, JSON.stringify(value));
  } catch {
    // 저장할 수 없는 환경에서는 현재 실행의 메모리 값만 유지한다.
  }
}

export async function clearPendingAnalysis(userId: string) {
  const storageKey = keyFor(userId);
  memoryValues.delete(storageKey);
  if (!(await isAvailable())) return;
  try {
    await SecureStore.deleteItemAsync(storageKey);
  } catch {
    // 서버 소유권 검사가 최종 경계이므로 삭제 실패가 다른 계정의 작업 접근으로 이어지지 않는다.
  }
}
