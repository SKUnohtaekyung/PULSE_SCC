export const palette = {
  royalBlue: '#002B7A',
  royalBlue90: '#002B7AE6',
  royalBlue80: '#002B7ACC',
  royalBlue60: '#002B7A99',
  royalBlue40: '#002B7A66',
  royalBlue10: '#002B7A1A',
  royalBlue05: '#002B7A0D',
  actionOrange: '#FF5A36',
  actionOrange80: '#FF5A36CC',
  actionOrange20: '#FF5A3633',
  actionOrange10: '#FF5A361A',
  // 포커스 링 전용. actionOrange는 화면 배경 위에서 2.89:1이라 비텍스트 기준 3:1을 넘지 못한다.
  focusOrange: '#E03E16',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  page: '#F5F7FA',
  ink: '#191F28',
  // 손님 유형 자리표시 그림에만 쓰는 색. 정보를 전하지 않는 장식이라 본문·아이콘 색과 섞지 않는다.
  illustrationSkin: '#F7D6B8',
  illustrationSkinShade: '#EBC3A0',
  illustrationInk: '#2B2622',
  illustrationHairBrown: '#5A3A2A',
  illustrationHairDark: '#3B2F2A',
  illustrationOlive: '#6E7B5B',
  illustrationOliveShade: '#56613F',
  illustrationCoral: '#C8644A',
  illustrationSlate: '#72819E',
  illustrationCapBrim: '#0B1E4F',
  illustrationGold: '#E8B04A',
  illustrationNose: '#D39A76',
  illustrationBlush: '#F2A08C',
  illustrationMouth: '#8A4B3A',
  illustrationBlue: '#DCE7F7',
  illustrationPeach: '#FBE3DC',
  illustrationMint: '#E2ECE4',
  success: '#059669',
  // 큰 면적에 쓰는 연한 초록. 진한 초록을 넓게 깔면 화면을 잡아먹는다(2026-09-27 디자인 리뷰).
  successSubtle: '#D1FAE5',
  warning: '#D97706',
  warningStrong: '#B45309',
  error: '#DC2626',
  errorStrong: '#B91C1C',
} as const;

export const colors = {
  background: {
    canvas: palette.page,
    surface: palette.white,
    subtle: palette.slate50,
    emphasized: palette.slate100,
    inverse: palette.slate900,
  },
  text: {
    primary: palette.ink,
    secondary: palette.slate600,
    strong: palette.slate900,
    inverse: palette.white,
    brand: palette.royalBlue,
    disabled: palette.slate400,
  },
  border: {
    default: palette.slate200,
    strong: palette.slate300,
    control: palette.slate500,
    brand: palette.royalBlue40,
    error: palette.error,
  },
  brand: {
    primary: palette.royalBlue,
    onPrimary: palette.white,
    strongOverlay: palette.royalBlue90,
    subduedOverlay: palette.royalBlue80,
    inactiveOverlay: palette.royalBlue60,
    tint: palette.royalBlue10,
    stripe: palette.royalBlue05,
  },
  action: {
    primary: palette.actionOrange,
    onPrimary: palette.ink,
    sourceOverlay: palette.actionOrange80,
    interactionOverlay: palette.actionOrange20,
    tint: palette.actionOrange10,
  },
  status: {
    success: palette.success,
    successSubtle: palette.successSubtle,
    warning: palette.warning,
    error: palette.error,
    warningText: palette.warningStrong,
    errorText: palette.errorStrong,
  },
  destructive: {
    primary: palette.errorStrong,
    onPrimary: palette.white,
    text: palette.errorStrong,
  },
  // 손님 유형 자리표시 그림 전용. 유형을 색으로 구분하지 않는다 — 이름과 리뷰 수가 그 일을 한다.
  illustration: {
    skin: palette.illustrationSkin,
    skinShade: palette.illustrationSkinShade,
    backgrounds: [palette.illustrationBlue, palette.illustrationPeach, palette.illustrationMint],
    /** 눈·눈썹·안경·짧은 머리 */
    ink: palette.illustrationInk,
    hairBrown: palette.illustrationHairBrown,
    hairDark: palette.illustrationHairDark,
    /** 세 사람의 옷. 순서는 backgrounds와 같고, 각 옷은 자기 배경과 3:1 이상이다(verify:tokens). */
    outfits: [palette.illustrationOlive, palette.illustrationCoral, palette.illustrationSlate],
    outfitShade: palette.illustrationOliveShade,
    cap: palette.royalBlue,
    capBrim: palette.illustrationCapBrim,
    earring: palette.illustrationGold,
    nose: palette.illustrationNose,
    blush: palette.illustrationBlush,
    mouth: palette.illustrationMouth,
    highlight: palette.white,
  },
  focus: {
    // 입력 포커스 같은 작은 포인트에 주황을 쓴다. 넓은 버튼 배경에는 쓰지 않는다(2026-09-27 디자인 리뷰).
    ring: palette.focusOrange,
  },
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
} as const;

export const radii = {
  none: 0,
  small: 8,
  control: 12,
  panel: 24,
  pill: 9999,
} as const;

export const strokes = {
  hairline: 1,
  focus: 2,
} as const;

export const fontFamilies = {
  regular: 'PretendardRegular',
  medium: 'PretendardMedium',
  semibold: 'PretendardSemiBold',
  bold: 'PretendardBold',
} as const;

const tracking = (fontSize: number) => Number((-0.02 * fontSize).toFixed(2));

const textStyle = (
  fontFamily: (typeof fontFamilies)[keyof typeof fontFamilies],
  fontSize: number,
  lineHeight: number,
) =>
  ({
    fontFamily,
    fontSize,
    lineHeight,
    letterSpacing: tracking(fontSize),
  }) as const;

export const typography = {
  head1: textStyle(fontFamilies.bold, 34, 48),
  head2: textStyle(fontFamilies.semibold, 32, 45),
  head3: textStyle(fontFamilies.semibold, 26, 37),
  head4: textStyle(fontFamilies.semibold, 22, 31),
  head5: textStyle(fontFamilies.semibold, 20, 28),
  body1: textStyle(fontFamilies.bold, 18, 27),
  body2: textStyle(fontFamilies.medium, 18, 27),
  body3: textStyle(fontFamilies.regular, 18, 27),
  body4: textStyle(fontFamilies.regular, 16, 24),
  body5: textStyle(fontFamilies.bold, 14, 21),
  body6: textStyle(fontFamilies.semibold, 14, 21),
  body7: textStyle(fontFamilies.regular, 14, 21),
  caption: textStyle(fontFamilies.regular, 12, 18),
  buttonMain: textStyle(fontFamilies.semibold, 16, 24),
  buttonSub: textStyle(fontFamilies.medium, 15, 22),
  errorText: textStyle(fontFamilies.medium, 13, 20),
} as const;

export const shadows = {
  soft: {
    boxShadow: '0 4px 20px rgba(0, 43, 122, 0.15)',
    elevation: 4,
  },
} as const;

export const motion = {
  duration: {
    instant: 0,
    quick: 150,
    standard: 200,
    emphasized: 250,
    reveal: 300,
  },
} as const;

export const layout = {
  breakpoint: {
    compact: 0,
    medium: 600,
    expanded: 1024,
  },
  pagePadding: {
    compact: spacing[4],
    medium: spacing[6],
    expanded: spacing[8],
  },
  readingMaxWidth: 640,
  contentMaxWidth: 960,
  touchTargetMin: 44,
} as const;

export const accessibility = {
  standard: 'WCAG 2.2',
  level: 'AA',
  contrast: {
    normalText: 4.5,
    largeText: 3,
    nonText: 3,
  },
  targetSizeMinimum: 24,
  productTouchTargetMinimum: layout.touchTargetMin,
} as const;

export const lightTheme = {
  colors,
  spacing,
  radii,
  strokes,
  typography,
  shadows,
  motion,
  layout,
  accessibility,
} as const;

export type LightTheme = typeof lightTheme;
