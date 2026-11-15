import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import {
  accessibility,
  colors,
  layout,
  palette,
  spacing,
  typography,
} from '../src/design/tokens/foundation.ts';

const fontAssets = {
  'OFL.txt': 'D31DDD9F2BED32FD7E302A205CF2380BA0DE6529152D239EF99CFB6F261BFC04',
  'Pretendard-Bold.otf': '2E91915FAB54DF71CC9598EBF608B2BDB54C6FE3C066AC61DFF0BC44FCA71CC7',
  'Pretendard-Medium.otf': 'D39E50E4BB52B4993B6A4EEB821A171254745BD824446AF01E1F616B89FFACE0',
  'Pretendard-Regular.otf': '3FFBACDE6AB8411F1D2DB54BB9B1F0B3EE2A738932033722CF0388C06AED1C93',
  'Pretendard-SemiBold.otf': 'C89BC43027DC7CDE5726E96223376F8EEC09302B2FC1F8147FD5B57CFC376118',
};

const fail = (message) => {
  throw new Error(message);
};

const assert = (condition, message) => {
  if (!condition) fail(message);
};

const colorPattern = /^#[0-9A-F]{6}([0-9A-F]{2})?$/;

for (const [fileName, expectedHash] of Object.entries(fontAssets)) {
  const contents = await readFile(new URL(`../assets/fonts/${fileName}`, import.meta.url));
  const actualHash = createHash('sha256').update(contents).digest('hex').toUpperCase();
  assert(actualHash === expectedHash, `${fileName}: SHA-256이 기록과 다릅니다.`);
}

console.log(`Font assets: ${Object.keys(fontAssets).length} verified`);

for (const [name, value] of Object.entries(palette)) {
  assert(colorPattern.test(value), `${name}: 올바른 HEX 색상이 아닙니다 (${value})`);
}

const channel = (value) => {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  assert(hex.length === 7, `대비 검증에는 불투명 6자리 HEX만 사용할 수 있습니다 (${hex})`);
  const values = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  return 0.2126 * channel(values[0]) + 0.7152 * channel(values[1]) + 0.0722 * channel(values[2]);
};

const contrastRatio = (foreground, background) => {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
};

const contrastChecks = [
  ['본문 / 카드', colors.text.primary, colors.background.surface, accessibility.contrast.normalText],
  ['보조 본문 / 카드', colors.text.secondary, colors.background.surface, accessibility.contrast.normalText],
  ['브랜드 텍스트 / 카드', colors.text.brand, colors.background.surface, accessibility.contrast.normalText],
  ['반전 텍스트 / 브랜드', colors.brand.onPrimary, colors.brand.primary, accessibility.contrast.normalText],
  ['CTA 텍스트 / CTA', colors.action.onPrimary, colors.action.primary, accessibility.contrast.normalText],
  ['성공 신호 / 카드', colors.status.success, colors.background.surface, accessibility.contrast.nonText],
  ['주의 신호 / 카드', colors.status.warning, colors.background.surface, accessibility.contrast.nonText],
  // status.error는 규칙상 비텍스트 신호지만, 카드 위 텍스트 기준(4.5:1)까지 만족하는지 더 엄격하게 확인한다.
  ['오류 원색 / 카드', colors.status.error, colors.background.surface, accessibility.contrast.normalText],
  // 화면 배경(canvas)과 보조 배경 위 조합. 상태 모델의 오류·주의·삭제 표현이 카드 밖에도 놓인다.
  ['본문 / 화면 배경', colors.text.primary, colors.background.canvas, accessibility.contrast.normalText],
  ['보조 본문 / 화면 배경', colors.text.secondary, colors.background.canvas, accessibility.contrast.normalText],
  ['보조 본문 / 강조 배경', colors.text.secondary, colors.background.emphasized, accessibility.contrast.normalText],
  ['브랜드 텍스트 / 화면 배경', colors.text.brand, colors.background.canvas, accessibility.contrast.normalText],
  ['오류 강조 텍스트 / 화면 배경', colors.status.errorText, colors.background.canvas, accessibility.contrast.normalText],
  ['오류 강조 텍스트 / 강조 배경', colors.status.errorText, colors.background.emphasized, accessibility.contrast.normalText],
  ['주의 텍스트 / 카드', colors.status.warningText, colors.background.surface, accessibility.contrast.normalText],
  ['주의 텍스트 / 화면 배경', colors.status.warningText, colors.background.canvas, accessibility.contrast.normalText],
  ['주의 텍스트 / 강조 배경', colors.status.warningText, colors.background.emphasized, accessibility.contrast.normalText],
  ['성공 신호 / 화면 배경', colors.status.success, colors.background.canvas, accessibility.contrast.nonText],
  ['오류 경계 / 카드', colors.border.error, colors.background.surface, accessibility.contrast.nonText],
  ['입력 경계 / 카드', colors.border.control, colors.background.surface, accessibility.contrast.nonText],
  ['입력 경계 / 화면 배경', colors.border.control, colors.background.canvas, accessibility.contrast.nonText],
  ['포커스 링 / 화면 배경', colors.focus.ring, colors.background.canvas, accessibility.contrast.nonText],
  ['포커스 링 / 카드', colors.focus.ring, colors.background.surface, accessibility.contrast.nonText],
  ['성공 아이콘 / 연한 성공 배경', colors.status.success, colors.status.successSubtle, accessibility.contrast.nonText],
  ['강조 아이콘 / 강조 원', colors.action.onPrimary, colors.action.primary, accessibility.contrast.normalText],
  ['활성 강조 아이콘 / 브랜드 원', colors.brand.onPrimary, colors.brand.primary, accessibility.contrast.nonText],
  // 자리표시 그림: 사람마다 옷이 자기 배경 원에서 구분돼야 하고, 눈·눈썹이 얼굴에서 보여야 한다.
  ...colors.illustration.backgrounds.map((background, index) => [
    `그림 옷 ${index + 1} / 그림 배경 ${index + 1}`,
    colors.illustration.outfits[index],
    background,
    accessibility.contrast.nonText,
  ]),
  ['그림 눈·눈썹 / 얼굴', colors.illustration.ink, colors.illustration.skin, accessibility.contrast.nonText],
  ['그림 갈색 눈썹 / 얼굴', colors.illustration.hairBrown, colors.illustration.skin, accessibility.contrast.nonText],
  ['그림 짙은 눈썹 / 얼굴', colors.illustration.hairDark, colors.illustration.skin, accessibility.contrast.nonText],
  ['삭제 텍스트 / 삭제 버튼', colors.destructive.onPrimary, colors.destructive.primary, accessibility.contrast.normalText],
  ['삭제 링크 / 카드', colors.destructive.text, colors.background.surface, accessibility.contrast.normalText],
  ['삭제 링크 / 화면 배경', colors.destructive.text, colors.background.canvas, accessibility.contrast.normalText],
  ...Object.entries(colors.perspective).flatMap(([name, tone]) => [
    [`관점 이름(${name}) / 카드`, tone.text, colors.background.surface, accessibility.contrast.normalText],
    [`관점 아이콘(${name}) / 연한 바탕`, tone.accent, tone.tint, accessibility.contrast.nonText],
    [`관점 강조선(${name}) / 카드`, tone.accent, colors.background.surface, accessibility.contrast.nonText],
  ]),
  ...Object.entries(colors.podium).map(([name, tone]) => [
    `순위 숫자(${name}) / 순위 단상`,
    tone.on,
    tone.background,
    accessibility.contrast.normalText,
  ]),
];

// 원래 값이 특정 배경에서 기준에 못 미친다는 사실을 고정해 둔다. 값을 바꾸면 규칙(DESIGN_SYSTEM §3.3)도 다시 본다.
const knownLimits = [
  ['오류 원색 텍스트 / 화면 배경', colors.status.error, colors.background.canvas, accessibility.contrast.normalText],
  ['주의 원색 아이콘 / 화면 배경', colors.status.warning, colors.background.canvas, accessibility.contrast.nonText],
  ['주의 원색 텍스트 / 카드', colors.status.warning, colors.background.surface, accessibility.contrast.normalText],
  ['포커스 링 / 삭제 버튼 (맞닿을 때)', colors.focus.ring, colors.destructive.primary, accessibility.contrast.nonText],
  ['포커스 링 / 브랜드 버튼 (맞닿을 때)', colors.focus.ring, colors.brand.primary, accessibility.contrast.nonText],
];

for (const [name, foreground, background, minimum] of contrastChecks) {
  const ratio = contrastRatio(foreground, background);
  assert(ratio >= minimum, `${name}: ${ratio.toFixed(2)}:1은 ${minimum}:1 미만입니다.`);
  console.log(`${name}: ${ratio.toFixed(2)}:1 (기준 ${minimum}:1)`);
}

for (const [name, foreground, background, minimum] of knownLimits) {
  const ratio = contrastRatio(foreground, background);
  assert(
    ratio < minimum,
    `${name}: ${ratio.toFixed(2)}:1로 기준을 넘습니다. 사용 제한 규칙이 여전히 필요한지 확인하세요.`,
  );
  console.log(`${name}: ${ratio.toFixed(4)}:1 — 기준 ${minimum}:1 미만, 사용 금지 조합`);
}

const spacingValues = Object.values(spacing);
for (let index = 1; index < spacingValues.length; index += 1) {
  assert(spacingValues[index] > spacingValues[index - 1], 'spacing 값은 오름차순이어야 합니다.');
  assert(spacingValues[index] % 4 === 0, 'spacing 값은 4px 기본 단위를 따라야 합니다.');
}

for (const [name, style] of Object.entries(typography)) {
  assert(style.lineHeight >= style.fontSize, `${name}: lineHeight가 fontSize보다 작습니다.`);
  assert(style.letterSpacing === Number((-0.02 * style.fontSize).toFixed(2)), `${name}: 자간이 -2%가 아닙니다.`);
}

assert(
  layout.breakpoint.compact < layout.breakpoint.medium &&
    layout.breakpoint.medium < layout.breakpoint.expanded,
  'breakpoint는 compact < medium < expanded 순이어야 합니다.',
);
assert(
  layout.touchTargetMin >= accessibility.targetSizeMinimum,
  '제품 터치 영역이 WCAG 2.2 AA 최소값보다 작습니다.',
);

console.log('Design token verification: PASS');
