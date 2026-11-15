import Svg, { Circle, Path, Rect } from 'react-native-svg';

// 시연 앱의 결과 화면에서 쓰는 작은 표시 아이콘(리뷰·안내·주의·화살표).
// 모두 장식이라 읽지 않는다 — 옆의 글자가 같은 뜻을 전한다.

type IconProps = { color: string; size?: number };

/** 리뷰에서 확인 — 문서 */
export function ReviewIcon({ color, size = 14 }: IconProps) {
  return (
    <Svg accessibilityElementsHidden height={size} importantForAccessibility="no" viewBox="0 0 16 16" width={size}>
      <Rect fill="none" height={12} rx={2} stroke={color} strokeWidth={1.6} width={11} x={2.5} y={2} />
      <Path d="M5.5 6h5M5.5 9h5M5.5 12h3" stroke={color} strokeLinecap="round" strokeWidth={1.6} />
    </Svg>
  );
}

/** 안내 — 동그라미 안 i */
export function InfoIcon({ color, size = 14 }: IconProps) {
  return (
    <Svg accessibilityElementsHidden height={size} importantForAccessibility="no" viewBox="0 0 16 16" width={size}>
      <Circle cx={8} cy={8} fill="none" r={6.3} stroke={color} strokeWidth={1.4} />
      <Path d="M8 7.2v4" stroke={color} strokeLinecap="round" strokeWidth={1.5} />
      <Circle cx={8} cy={5} fill={color} r={0.9} />
    </Svg>
  );
}

/** 주의 — 삼각형 */
export function WarningIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg accessibilityElementsHidden height={size} importantForAccessibility="no" viewBox="0 0 16 16" width={size}>
      <Path d="M8 2.2l6.2 11H1.8z" fill="none" stroke={color} strokeLinejoin="round" strokeWidth={1.4} />
      <Path d="M8 6.6v3.2" stroke={color} strokeLinecap="round" strokeWidth={1.5} />
      <Circle cx={8} cy={11.6} fill={color} r={0.8} />
    </Svg>
  );
}

export function ChevronIcon({ color, size = 12, direction = 'right' }: IconProps & { direction?: 'right' | 'down' | 'up' }) {
  const rotate = direction === 'down' ? 90 : direction === 'up' ? -90 : 0;
  return (
    <Svg
      accessibilityElementsHidden
      height={size}
      importantForAccessibility="no"
      style={{ transform: [{ rotate: `${rotate}deg` }] }}
      viewBox="0 0 12 12"
      width={size}
    >
      <Path d="M4.5 2.5L8 6l-3.5 3.5" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} />
    </Svg>
  );
}

/** 사실 → 행동으로 이어짐 */
export function ArrowDownIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg accessibilityElementsHidden height={size} importantForAccessibility="no" viewBox="0 0 16 16" width={size}>
      <Path d="M8 2.5v10M4 9l4 4 4-4" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
    </Svg>
  );
}
