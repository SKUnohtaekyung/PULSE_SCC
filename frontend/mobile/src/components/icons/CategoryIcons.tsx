import type { ReactNode } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// 업종 아이콘. NavIcons와 같은 규칙 — 24×24 격자, 굵기 2, 둥근 끝·둥근 모서리(DESIGN_SYSTEM §3.6).
// 업종은 아이콘만으로 구분하지 않는다. 항상 업종 이름과 함께 놓인다.

const stroke = 2;

const line = (color: string) =>
  ({
    stroke: color,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: stroke,
  }) as const;

function Frame({ size, children }: { size: number; children: ReactNode }) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      {children}
    </Svg>
  );
}

type IconProps = { color: string; size: number };

/** 한식 — 김이 오르는 그릇 */
function KoreanIcon({ color, size }: IconProps) {
  return (
    <Frame size={size}>
      <Path d="M4 12h16a8 8 0 0 1-16 0Z" {...line(color)} />
      <Path d="M9 4c-.9 1.1.9 1.9 0 3M13.5 4c-.9 1.1.9 1.9 0 3" {...line(color)} />
    </Frame>
  );
}

/** 중식 — 그릇과 젓가락 */
function ChineseIcon({ color, size }: IconProps) {
  return (
    <Frame size={size}>
      <Path d="M4 13h16a8 8 0 0 1-16 0Z" {...line(color)} />
      <Path d="M9 3.5 13 13M13.5 3.5 16 13" {...line(color)} />
    </Frame>
  );
}

/** 일식 — 생선 */
function JapaneseIcon({ color, size }: IconProps) {
  return (
    <Frame size={size}>
      <Path
        d="M3.5 12c2.4-3.8 6.2-5 9.8-3.6 2 .8 3.4 2.1 4.2 3.6-.8 1.5-2.2 2.8-4.2 3.6-3.6 1.4-7.4.2-9.8-3.6Z"
        {...line(color)}
      />
      <Path d="m17.5 12 3-3v6l-3-3Z" {...line(color)} />
      <Circle cx={7.8} cy={11.4} fill={color} r={0.9} />
    </Frame>
  );
}

/** 양식 — 포크와 나이프 */
function WesternIcon({ color, size }: IconProps) {
  return (
    <Frame size={size}>
      <Path d="M7 3.5v5.8a2 2 0 0 0 4 0V3.5M9 3.5v17" {...line(color)} />
      <Path d="M16.5 20.5v-17c-2 1.6-3 4.2-3 7.8h3" {...line(color)} />
    </Frame>
  );
}

/** 카페/디저트 — 김이 오르는 잔 */
function CafeIcon({ color, size }: IconProps) {
  return (
    <Frame size={size}>
      <Path d="M5 9.5h11V14a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9.5Z" {...line(color)} />
      <Path d="M16 11h1.5a2.3 2.3 0 0 1 0 4.6H16" {...line(color)} />
      <Path d="M8.5 4v2.2M12 4v2.2" {...line(color)} />
    </Frame>
  );
}

/** 주점 — 맥주잔 */
function PubIcon({ color, size }: IconProps) {
  return (
    <Frame size={size}>
      <Path d="M6 8h9v11a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 6 19V8Z" {...line(color)} />
      <Path d="M15 10.5h1.8a2 2 0 0 1 2 2V15a2 2 0 0 1-2 2H15" {...line(color)} />
      <Path d="M6 8a2.4 2.4 0 0 1 4.4-1.6A2.5 2.5 0 0 1 15 8" {...line(color)} />
    </Frame>
  );
}

/** 기타 — 점 세 개 */
function OtherIcon({ color, size }: IconProps) {
  return (
    <Frame size={size}>
      <Circle cx={6} cy={12} fill={color} r={1.6} />
      <Circle cx={12} cy={12} fill={color} r={1.6} />
      <Circle cx={18} cy={12} fill={color} r={1.6} />
    </Frame>
  );
}

const icons: Record<string, (props: IconProps) => ReactNode> = {
  한식: KoreanIcon,
  중식: ChineseIcon,
  일식: JapaneseIcon,
  양식: WesternIcon,
  '카페/디저트': CafeIcon,
  주점: PubIcon,
  기타: OtherIcon,
};

/** 업종 이름에 맞는 아이콘. 모르는 이름이면 기타 아이콘을 쓴다. */
export function CategoryIcon({ category, color, size = 24 }: { category: string; color: string; size?: number }) {
  const Icon = icons[category] ?? OtherIcon;
  return <Icon color={color} size={size} />;
}
