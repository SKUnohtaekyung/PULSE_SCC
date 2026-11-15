import { readItem, removeItem, writeItem } from '@/demo/webStorage';

// 시연 사이트는 웹이라 expo-secure-store 대신 브라우저 저장소에 둔다(demo/webStorage.ts).

export type PendingAnalysis = {
  jobId: string;
  storeName: string;
  category: string;
  naverPlaceUrl: string;
  progressSteps: string[];
};

const keyPrefix = 'scc.analysis.pending.v1.';

const keyFor = (userId: string) => keyPrefix + userId;

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
  const raw = readItem(storageKey);
  if (!raw) return null;
  const parsed = parsePendingAnalysis(raw);
  if (!parsed) removeItem(storageKey);
  return parsed;
}

export async function writePendingAnalysis(userId: string, value: PendingAnalysis) {
  writeItem(keyFor(userId), JSON.stringify(value));
}

export async function clearPendingAnalysis(userId: string) {
  removeItem(keyFor(userId));
}
