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
  ['성공 아이콘 / 카드', colors.status.success, colors.background.surface, accessibility.contrast.nonText],
  ['주의 아이콘 / 카드', colors.status.warning, colors.background.surface, accessibility.contrast.nonText],
  ['오류 텍스트 / 카드', colors.status.error, colors.background.surface, accessibility.contrast.normalText],
];

for (const [name, foreground, background, minimum] of contrastChecks) {
  const ratio = contrastRatio(foreground, background);
  assert(ratio >= minimum, `${name}: ${ratio.toFixed(2)}:1은 ${minimum}:1 미만입니다.`);
  console.log(`${name}: ${ratio.toFixed(2)}:1 (기준 ${minimum}:1)`);
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
