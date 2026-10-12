import Svg, { Circle, Path } from 'react-native-svg';

import type { PerspectiveKey } from '@/api/types';

// 결과의 4개 관점 아이콘. NavIcons와 같은 규칙 — 24×24 격자, 굵기 2, 둥근 끝·둥근 모서리(DESIGN_SYSTEM §3.6).
// 관점은 색만으로 구분하지 않는다. 이 아이콘과 관점 이름이 함께 놓인다.

const stroke = 2;

function Frame({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      {children}
    </Svg>
  );
}

const line = (color: string) =>
  ({
    stroke: color,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: stroke,
  }) as const;

/** 먼저 볼 것 — 깃발 */
function PriorityIcon({ color, size }: { color: string; size: number }) {
  return (
    <Frame size={size}>
      <Path d="M6 21V4" {...line(color)} />
      <Path d="M6 4.5h10.5l-2.4 4 2.4 4H6" {...line(color)} />
    </Frame>
  );
}

/** 잘하고 있는 점 — 웃는 얼굴 */
function PositiveIcon({ color, size }: { color: string; size: number }) {
  return (
    <Frame size={size}>
      <Circle cx={12} cy={12} r={8.5} {...line(color)} />
      <Path d="M9 9.8v.4M15 9.8v.4" {...line(color)} />
      <Path d="M8.6 13.8c.8 1.3 2 2 3.4 2s2.6-.7 3.4-2" {...line(color)} />
    </Frame>
  );
}

/** 손님이 불편해한 점 — 아쉬운 얼굴 */
function NegativeIcon({ color, size }: { color: string; size: number }) {
  return (
    <Frame size={size}>
      <Circle cx={12} cy={12} r={8.5} {...line(color)} />
      <Path d="M9 9.8v.4M15 9.8v.4" {...line(color)} />
      <Path d="M8.6 16c.8-1.3 2-2 3.4-2s2.6.7 3.4 2" {...line(color)} />
    </Frame>
  );
}

/** 손님이 기억하는 모습 — 말풍선 */
function PerceptionIcon({ color, size }: { color: string; size: number }) {
  return (
    <Frame size={size}>
      <Path
        d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-6.2L8.5 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5Z"
        {...line(color)}
      />
      <Path d="M8 11h8" {...line(color)} />
    </Frame>
  );
}

const icons: Record<PerspectiveKey, typeof PriorityIcon> = {
  priority: PriorityIcon,
  positive: PositiveIcon,
  negative: NegativeIcon,
  perception: PerceptionIcon,
};

export function PerspectiveIcon({
  perspective,
  color,
  size = 24,
}: {
  perspective: PerspectiveKey;
  color: string;
  size?: number;
}) {
  const Icon = icons[perspective];
  return <Icon color={color} size={size} />;
}
