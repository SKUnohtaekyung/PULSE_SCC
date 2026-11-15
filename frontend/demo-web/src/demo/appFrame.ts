import { useWindowDimensions } from 'react-native';

// 시연 사이트는 "앱 그 자체"를 보여 준다(2026-11-11 사용자 결정). PC에서 열어도 화면 가운데에 휴대폰 폭의 앱이
// 뜨고, 휴대폰에서 열면 화면 전체가 앱이다. 앱은 이 폭보다 넓어지지 않으므로 태블릿용 넓은 배치도 쓰지 않는다.

/** 앱 기둥의 최대 폭(px). 큰 휴대폰 화면 폭에 맞췄다. */
export const appMaxWidth = 430;

/** 앱이 실제로 쓰는 폭. 창이 더 넓어도 앱 기둥 폭을 넘지 않는다. 화면 폭에 따른 판단은 모두 이 값으로 한다. */
export function useAppWidth() {
  const { width } = useWindowDimensions();
  return Math.min(width, appMaxWidth);
}

/** 사이트 기준 경로(예: /PULSE_SCC). app.json의 experiments.baseUrl과 같다. */
export const siteBase = '/PULSE_SCC';
