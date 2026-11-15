// 시연 사이트의 브라우저 저장소. 사생활 보호 창·차단된 사이트 데이터에서는 접근만으로 예외가 나므로
// 모든 읽기·쓰기를 감싸고, 쓸 수 없으면 이번 실행의 메모리 값만 유지한다.

const memory = new Map<string, string>();

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readItem(key: string): string | null {
  const store = storage();
  if (store) {
    try {
      // 브라우저 저장소를 쓸 수 있으면 그것이 정본이다. 다른 탭에서 "처음부터"로 지운 값을
      // 이 탭의 메모리 사본으로 되살리지 않는다.
      return store.getItem(key);
    } catch {
      // 읽기만 막힌 경우 메모리 값으로 대신한다.
    }
  }
  return memory.get(key) ?? null;
}

export function writeItem(key: string, value: string) {
  memory.set(key, value);
  try {
    storage()?.setItem(key, value);
  } catch {
    // 메모리 값만 유지한다.
  }
}

export function removeItem(key: string) {
  memory.delete(key);
  try {
    storage()?.removeItem(key);
  } catch {
    // 메모리 값은 이미 지웠다.
  }
}

/** 시연 데이터(가짜 서버 상태·로그인·진행 중 분석)를 모두 지운다. */
export function clearDemoKeys() {
  for (const key of [...memory.keys()]) if (key.startsWith('scc.')) memory.delete(key);
  try {
    const store = storage();
    if (!store) return;
    const keys: string[] = [];
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);
      if (key?.startsWith('scc.')) keys.push(key);
    }
    keys.forEach((key) => store.removeItem(key));
  } catch {
    // 지우지 못한 값은 다음 초기화에서 다시 시도한다.
  }
}
