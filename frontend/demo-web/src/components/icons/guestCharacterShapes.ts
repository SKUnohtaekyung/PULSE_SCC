// 손님 유형 자리표시 그림의 도형 정의. 앱(`GuestCharacter.tsx`)과 Figma 보드 생성기(`generate.mjs`)가
// 이 한 파일을 함께 읽는다 — 도형을 두 곳에 따로 적으면 한쪽만 고쳐지기 때문이다.
// 보드 생성기가 node로 직접 읽으므로 이 파일은 다른 모듈을 import하지 않는다. 색은 인자로 받는다.
//
// 세 사람은 서로 다른 사람이다(2026-09-28 사용자 선택): 안경 쓴 짧은 머리, 올림머리에 귀걸이, 모자에 후드.
// 순위 자리마다 모습이 정해지고, 유형과 짝짓지 않는다 — 유형은 서버가 그때그때 정하기 때문이다.
// 특정 인물로 읽히지 않게 이목구비는 점·짧은 선으로만 둔다(DESIGN_SYSTEM §3.6).

export type GuestIllustrationColors = {
  skin: string;
  skinShade: string;
  backgrounds: readonly string[];
  ink: string;
  hairBrown: string;
  hairDark: string;
  outfits: readonly string[];
  outfitShade: string;
  cap: string;
  capBrim: string;
  earring: string;
  nose: string;
  blush: string;
  mouth: string;
  highlight: string;
};

type Paint = {
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
};
// 선 끝과 꺾임은 그리는 쪽에서 늘 둥글게 한다. fill이 없는 도형은 채우지 않는다(SVG 기본값 검정 방지).

export type GuestShape =
  | ({ type: 'circle'; cx: number; cy: number; r: number } & Paint)
  | ({ type: 'ellipse'; cx: number; cy: number; rx: number; ry: number } & Paint)
  | ({ type: 'path'; d: string } & Paint);

/** 64×64 격자. 바깥 원(반지름 32)으로 자르는 것은 그리는 쪽이 한다. */
export const GUEST_VIEWBOX = 64;

/** 세 사람 모두 같은 얼굴 틀(목·귀·얼굴)을 쓴다. */
const faceBase = (c: GuestIllustrationColors): GuestShape[] => [
  { type: 'path', d: 'M28 36h8v9a4 4 0 0 1-8 0Z', fill: c.skinShade },
  { type: 'circle', cx: 21.2, cy: 29.5, r: 2.6, fill: c.skinShade },
  { type: 'circle', cx: 42.8, cy: 29.5, r: 2.6, fill: c.skinShade },
  { type: 'ellipse', cx: 32, cy: 28, rx: 11, ry: 12.4, fill: c.skin },
];

/** 코·볼·입. 입 모양만 사람마다 다르다. */
const faceDetails = (c: GuestIllustrationColors, mouth: string): GuestShape[] => [
  { type: 'path', d: 'M31.4 33q.6 1.1 1.4.2', stroke: c.nose, strokeWidth: 1.2 },
  { type: 'circle', cx: 24.6, cy: 34.6, r: 2, fill: c.blush, opacity: 0.45 },
  { type: 'circle', cx: 39.4, cy: 34.6, r: 2, fill: c.blush, opacity: 0.45 },
  { type: 'path', d: mouth, stroke: c.mouth, strokeWidth: 1.4 },
];

const openEyes = (c: GuestIllustrationColors): GuestShape[] => [
  { type: 'ellipse', cx: 27.4, cy: 30.2, rx: 1.35, ry: 1.7, fill: c.ink },
  { type: 'ellipse', cx: 36.6, cy: 30.2, rx: 1.35, ry: 1.7, fill: c.ink },
];

const shoulders = (fill: string): GuestShape => ({
  type: 'path',
  d: 'M9 66c1-12 10-19.5 23-19.5S54 54 55 66Z',
  fill,
});

/** 안경 쓴 짧은 머리. 렌즈 바깥에서 귀까지 안경다리를 긋는다. */
const glasses = (c: GuestIllustrationColors): GuestShape[] => [
  shoulders(c.outfits[0]),
  { type: 'path', d: 'M26 46.8l6 5.2 6-5.2', stroke: c.outfitShade, strokeWidth: 1.6 },
  ...faceBase(c),
  {
    type: 'path',
    d: 'M20.6 27.6c-1.4-9.4 4.6-15.6 11.6-15.6 7.8 0 12.6 5.4 11.8 13.4-1.6-3.8-5.2-6.4-10.4-6.8-2.6 3-7.6 5.6-13 9Z',
    fill: c.ink,
  },
  { type: 'path', d: 'M25.4 24.6q2-.9 4 0M34.6 24.6q2-.9 4 0', stroke: c.ink, strokeWidth: 1.4 },
  ...openEyes(c),
  ...faceDetails(c, 'M29.8 36.4q2.2 1.5 4.4 0'),
  // 렌즈에는 옅은 반사만 둔다. 눈이 렌즈 안에서 보여야 한다.
  { type: 'circle', cx: 27.4, cy: 29.8, r: 3.7, fill: c.highlight, fillOpacity: 0.25, stroke: c.ink, strokeWidth: 1.4 },
  { type: 'circle', cx: 36.6, cy: 29.8, r: 3.7, fill: c.highlight, fillOpacity: 0.25, stroke: c.ink, strokeWidth: 1.4 },
  { type: 'path', d: 'M31.1 29.5q.9-.7 1.8 0', stroke: c.ink, strokeWidth: 1.4 },
  // 안경다리 — 렌즈 바깥쪽에서 귀 위로
  { type: 'path', d: 'M23.7 29.3 20.4 28.1M40.3 29.3l3.3-1.2', stroke: c.ink, strokeWidth: 1.4 },
];

/** 올림머리에 귀걸이. 눈은 감고 웃는 곡선이다. */
const bun = (c: GuestIllustrationColors): GuestShape[] => [
  shoulders(c.outfits[1]),
  { type: 'circle', cx: 32, cy: 12.2, r: 5.6, fill: c.hairBrown },
  ...faceBase(c),
  {
    type: 'path',
    d: 'M20.4 29c-1.8-10.2 4.6-16.4 11.6-16.4s13.4 6.2 11.6 16.4c-2.6-5-6.4-8.6-12-9.4-1.6 3.6-6.4 7.2-11.2 9.4Z',
    fill: c.hairBrown,
  },
  { type: 'path', d: 'M25.6 26q1.8-.8 3.6 0M34.8 26q1.8-.8 3.6 0', stroke: c.hairBrown, strokeWidth: 1.4 },
  { type: 'path', d: 'M25.9 30.2q1.5-1.5 3 0M35.1 30.2q1.5-1.5 3 0', stroke: c.ink, strokeWidth: 1.5 },
  ...faceDetails(c, 'M29.6 36.2q2.4 2 4.8 0'),
  { type: 'circle', cx: 21, cy: 33.6, r: 1.3, fill: c.earring },
  { type: 'circle', cx: 43, cy: 33.6, r: 1.3, fill: c.earring },
];

/** 모자에 후드. 눈썹을 조금 굵게, 입은 곧은 선이다. */
const cap = (c: GuestIllustrationColors): GuestShape[] => [
  shoulders(c.outfits[2]),
  { type: 'path', d: 'M28 47.5v6M36 47.5v6', stroke: c.highlight, strokeWidth: 1.4 },
  ...faceBase(c),
  {
    type: 'path',
    d: 'M21.2 28.4c-.6-2.6-.4-4.6.6-6.2h20.4c1 1.6 1.2 3.6.6 6.2-.8-2-2-3.2-3.6-3.6H24.8c-1.6.4-2.8 1.6-3.6 3.6Z',
    fill: c.hairDark,
  },
  { type: 'path', d: 'M20.6 22.6c0-6.6 5-11 11.4-11s11.4 4.4 11.4 11Z', fill: c.cap },
  { type: 'path', d: 'M20.6 22.4h19.8c3 0 5.6.8 6.8 2.4H20.6Z', fill: c.capBrim },
  { type: 'path', d: 'M25.2 27q2.1-.5 4.2.2M34.6 27.2q2.1-.7 4.2-.2', stroke: c.hairDark, strokeWidth: 1.8 },
  ...openEyes(c),
  ...faceDetails(c, 'M30.2 36.6h3.6'),
];

const people = [glasses, bun, cap];

/** variant(순위나 목록 인덱스)에 해당하는 사람의 배경색과 도형 목록. 그리는 순서대로다. */
export function guestCharacterShapes(variant: number, c: GuestIllustrationColors) {
  const index = Math.abs(variant) % people.length;
  return {
    background: c.backgrounds[index % c.backgrounds.length],
    shapes: people[index](c),
  };
}
