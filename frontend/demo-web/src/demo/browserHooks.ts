import { useSyncExternalStore } from 'react';

// 브라우저 상태를 읽는 훅. 정적 렌더(서버)에서는 서버 값을, 브라우저에서는 실제 값을 돌려준다.
// 이펙트 안에서 상태를 바꾸지 않아 첫 그리기와 정적 HTML이 어긋나지 않는다.

const noopSubscribe = () => () => {};

/** 브라우저에서 그리는 중인가. 재생기·iframe처럼 window가 필요한 것을 붙일 때 쓴다. */
export function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** CSS 미디어 쿼리 결과. 서버에서는 fallback을 쓴다. */
export function useMediaQuery(query: string, fallback = false) {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : fallback),
    () => fallback,
  );
}
