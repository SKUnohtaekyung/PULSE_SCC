// PULSE Step 6 Figma 정본화용 SVG 생성기.
// 토큰 값은 frontend/mobile/src/design/tokens/foundation.ts에서 직접 읽는다. 값이 바뀌면 이 스크립트로 다시 뽑는다.
// 실행: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON docs/design/figma/TASK-020/generate.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { colors, radii, spacing, strokes, typography } from '../../../../frontend/mobile/src/design/tokens/foundation.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'svg');
const require = createRequire(join(here, '../../../../frontend/mobile/package.json'));
const Jimp = require('jimp-compact');

// ---------- 기본 도구 ----------

const esc = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const weightOf = { PretendardRegular: 400, PretendardMedium: 500, PretendardSemiBold: 600, PretendardBold: 700 };

const rect = (x, y, w, h, { fill = 'none', stroke, sw = strokes.hairline, r = 0, dash, opacity } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"` +
  (stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : '') +
  (dash ? ` stroke-dasharray="${dash}"` : '') +
  (opacity !== undefined ? ` opacity="${opacity}"` : '') +
  '/>';

const circle = (cx, cy, r, { fill = 'none', stroke, sw = strokes.hairline } = {}) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ''}/>`;

const line = (x1, y1, x2, y2, { stroke = colors.border.strong, sw = strokes.hairline, dash } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;

// 글자 폭 근사: 한글·전각은 글자 크기, 라틴·숫자는 0.56배
const measure = (value, size) =>
  [...String(value)].reduce((sum, ch) => sum + (/[ᄀ-ᇿ㄰-㆏가-힯　-〿·—…]/.test(ch) ? size : size * 0.56), 0);

// y는 글상자 위쪽. lines는 문자열 또는 배열(명시적 줄바꿈)
const text = (x, y, lines, style, color, { anchor = 'start', weight } = {}) => {
  const list = Array.isArray(lines) ? lines : [lines];
  const w = weight ?? weightOf[style.fontFamily] ?? 400;
  return list
    .map((value, index) => {
      const baseline = y + index * style.lineHeight + style.lineHeight / 2 + style.fontSize * 0.35;
      return `<text x="${x}" y="${baseline.toFixed(1)}" font-family="Pretendard" font-size="${style.fontSize}" font-weight="${w}" letter-spacing="${style.letterSpacing}" fill="${color}" text-anchor="${anchor}">${esc(value)}</text>`;
    })
    .join('');
};

const idCount = new Map();
const uniqueId = (name) => {
  const n = (idCount.get(name) ?? 0) + 1;
  idCount.set(name, n);
  return n === 1 ? name : `${name} ${n}`;
};

const group = (name, body, dx = 0, dy = 0) =>
  `<g id="${esc(uniqueId(name))}"${dx || dy ? ` transform="translate(${dx} ${dy})"` : ''}>${body}</g>`;

const svg = (width, height, body) =>
  (idCount.clear(), '') +
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
  rect(0, 0, width, height, { fill: colors.background.surface }) +
  body +
  '</svg>';

const boardTitle = (title, subtitle) =>
  text(64, 48, title, typography.head3, colors.text.strong) +
  text(64, 92, subtitle, typography.body7, colors.text.secondary);

const footer = (width, height) =>
  text(width - 64, height - 48, 'PULSE · TASK-020 Step 6 · 가상 데이터 · 정본: docs/design/synthesis/TASK-020', typography.caption, colors.text.secondary, {
    anchor: 'end',
  });

// ---------- 휴대폰 화면 ----------

const PHONE_W = 360;
const PHONE_H = 800;
const PAD = spacing[4];

const statusBar = (tone) => {
  const ink = tone === 'light' ? colors.text.inverse : colors.text.primary;
  return (
    text(PAD, 4, '9:41', typography.body6, ink) +
    rect(PHONE_W - 48, 10, 22, 11, { stroke: ink, r: 3 }) +
    rect(PHONE_W - 46, 12, 16, 7, { fill: ink, r: 1.5 })
  );
};

const phone = (name, caption, content, { statusTone = 'dark', background = colors.background.canvas, top = colors.background.canvas, overlay = '' } = {}) =>
  group(
    `Screen/${name}`,
    text(0, -40, caption, typography.body5, colors.text.strong) +
      `<clipPath id="clip-${name}">${rect(0, 0, PHONE_W, PHONE_H, { r: radii.panel })}</clipPath>` +
      `<g clip-path="url(#clip-${name})">` +
      rect(0, 0, PHONE_W, PHONE_H, { fill: background }) +
      rect(0, 0, PHONE_W, 32, { fill: top }) +
      content +
      statusBar(statusTone) +
      overlay +
      '</g>' +
      rect(0, 0, PHONE_W, PHONE_H, { stroke: colors.border.strong, r: radii.panel, sw: 2 }),
  );

// ---------- 컴포넌트 ----------

const primaryButton = (x, y, w, label, { tone = 'action', disabled = false } = {}) => {
  const fill = tone === 'destructive' ? colors.destructive.primary : colors.action.primary;
  const ink = tone === 'destructive' ? colors.destructive.onPrimary : colors.action.onPrimary;
  return group(
    `Button/Primary/${label}`,
    rect(x, y, w, 52, { fill, r: radii.control, opacity: disabled ? 0.6 : undefined }) +
      text(x + w / 2, y + 14, label, typography.buttonMain, ink, { anchor: 'middle' }),
  );
};

const outlineButton = (x, y, w, label) =>
  group(
    `Button/Outline/${label}`,
    rect(x, y, w, 52, { fill: colors.background.surface, stroke: colors.brand.primary, r: radii.control }) +
      text(x + w / 2, y + 14, label, typography.buttonMain, colors.text.brand, { anchor: 'middle' }),
  );

const quietButton = (x, y, w, label) =>
  group(
    `Button/Quiet/${label}`,
    rect(x, y, w, 48, { fill: colors.background.emphasized, r: radii.control }) +
      text(x + w / 2, y + 13, label, typography.buttonSub, colors.text.primary, { anchor: 'middle' }),
  );

const chip = (x, y, label, selected = false) => {
  const w = Math.round(measure(label, 14) + 32);
  return {
    w,
    svg: group(
      `Chip/${selected ? 'Selected' : 'Default'}/${label}`,
      rect(x, y, w, 44, {
        fill: selected ? colors.brand.primary : colors.background.surface,
        stroke: selected ? colors.brand.primary : colors.border.control,
        r: radii.control,
      }) + text(x + 16, y + 11.5, label, typography.body6, selected ? colors.brand.onPrimary : colors.text.primary),
    ),
  };
};

const chipRow = (x, y, labels, selected, maxW) => {
  let cx = x;
  let cy = y;
  let out = '';
  for (const label of labels) {
    const probe = chip(0, 0, label).w;
    if (cx + probe > x + maxW) {
      cx = x;
      cy += 52;
    }
    const c = chip(cx, cy, label, label === selected);
    out += c.svg;
    cx += c.w + 8;
  }
  return { svg: out, bottom: cy + 44 };
};

const field = (x, y, w, label, value, { state = 'default', placeholder = false, error } = {}) => {
  const stroke = state === 'error' ? colors.border.error : state === 'focus' ? colors.focus.ring : colors.border.control;
  const sw = state === 'default' ? strokes.hairline : strokes.focus;
  return group(
    `TextField/${state}/${label}`,
    text(x, y, label, typography.body6, colors.text.primary) +
      rect(x, y + 29, w, 52, { fill: colors.background.surface, stroke, sw, r: radii.control }) +
      text(x + 16, y + 43, value, typography.body4, placeholder ? colors.text.secondary : colors.text.primary) +
      (error ? text(x, y + 89, (Array.isArray(error) ? error : [error]).map((lineText, index) => (index === 0 ? `! ${lineText}` : `   ${lineText}`)), typography.errorText, colors.status.errorText) : ''),
  );
};

const doneRow = (x, y, w, label, value) =>
  group(
    `InputDoneRow/${label}`,
    text(x, y, label, typography.caption, colors.text.secondary) +
      text(x, y + 20, value, typography.body5, colors.text.primary) +
      text(x + w, y + 10, '수정', typography.body6, colors.text.brand, { anchor: 'end' }) +
      line(x, y + 56, x + w, y + 56, { stroke: colors.border.default }),
  );

const card = (x, y, w, h, body, { r = radii.panel } = {}) =>
  rect(x, y, w, h, { fill: colors.background.surface, stroke: colors.border.default, r }) + body;

const navyHeader = ({ first = true, title = true } = {}) => {
  const h = title ? 150 : 96;
  return group(
    'Header/Navy',
    rect(0, 0, PHONE_W, h, { fill: colors.brand.primary }) +
      text(PAD, 44, 'PULSE', typography.head4, colors.text.inverse) +
      (first
        ? rect(PAD + 88, 46, 62, 28, { stroke: colors.text.inverse, r: radii.pill }) +
          text(PAD + 119, 49, '첫 분석', typography.body6, colors.text.inverse, { anchor: 'middle' })
        : '') +
      (title ? text(PAD, 96, '우리 가게 리뷰를 분석해요', typography.head4, colors.text.inverse) : ''),
  );
};

const stepRow = (x, y, kind, label, note) => {
  let marker;
  if (kind === 'done') {
    marker = circle(x + 16, y + 16, 12, { fill: colors.status.success }) + text(x + 16, y + 5.5, '✓', typography.body5, colors.text.inverse, { anchor: 'middle' });
  } else if (kind === 'running') {
    marker =
      circle(x + 16, y + 16, 10, { stroke: colors.border.default, sw: 3 }) +
      `<path d="M ${x + 16} ${y + 6} A 10 10 0 0 1 ${x + 26} ${y + 16}" fill="none" stroke="${colors.brand.primary}" stroke-width="3" stroke-linecap="round"/>`;
  } else if (kind === 'paused') {
    marker = circle(x + 16, y + 16, 11, { stroke: colors.border.control, sw: strokes.focus }) + rect(x + 10, y + 15, 12, 2, { fill: colors.border.control });
  } else {
    marker = circle(x + 16, y + 16, 12, { fill: colors.status.errorText }) + text(x + 16, y + 5.5, '!', typography.body5, colors.text.inverse, { anchor: 'middle' });
  }
  const style = kind === 'running' || kind === 'failed' ? typography.body1 : typography.body4;
  const color = kind === 'running' ? colors.text.primary : kind === 'failed' ? colors.status.errorText : colors.text.secondary;
  return group(
    `ProgressStep/${kind}`,
    marker + text(x + 44, y + 16 - style.lineHeight / 2, label, style, color) + (note ? text(x + 44, y + 30, note, typography.caption, colors.text.secondary) : ''),
  );
};

const bottomNav = (active) => {
  const y = PHONE_H - 72;
  const current = active === 'analysis';
  return group(
    `BottomNavigation/${active}`,
    rect(0, y, PHONE_W, 72, { fill: colors.background.surface }) +
      line(0, y, PHONE_W, y, { stroke: colors.border.default }) +
      text(60, y + 42, '홈', typography.caption, current ? colors.text.secondary : colors.text.brand, { anchor: 'middle' }) +
      rect(52, y + 14, 16, 16, { stroke: current ? colors.text.secondary : colors.brand.primary, sw: 2, r: 3 }) +
      circle(180, y + 10, 28, { fill: current ? colors.brand.primary : colors.action.primary, stroke: colors.background.surface, sw: 4 }) +
      [[-6, 8], [0, 14], [6, 20]]
        .map(([dx, hgt]) => rect(180 + dx - 2, y + 20 - hgt, 4, hgt, { fill: current ? colors.brand.onPrimary : colors.action.onPrimary, r: 2 }))
        .join('') +
      text(180, y + 46, '분석하기', typography.caption, colors.text.brand, { anchor: 'middle' }) +
      circle(300, y + 17, 5, { stroke: colors.text.secondary, sw: 2 }) +
      text(300, y + 42, '마이페이지', typography.caption, colors.text.secondary, { anchor: 'middle' }),
  );
};

const warningNotice = (x, y, w, lines) => {
  const list = Array.isArray(lines) ? lines : [lines];
  const h = 32 + list.length * typography.body6.lineHeight;
  return group(
    'Notice/Warning',
    rect(x, y, w, h, { fill: colors.background.surface, stroke: colors.border.default, r: radii.control }) +
      rect(x, y, 4, h, { fill: colors.status.warning }) +
      text(x + 18, y + 16, '!', typography.body5, colors.status.warningText) +
      text(x + 34, y + 16, list, typography.body6, colors.text.primary),
  );
};

// ---------- 결과 화면 조각 ----------

const personaFiles = {
  revisit: 'revisit-memory.png',
  spice: 'spice-control.png',
  solo: 'solo-comfort.png',
};
const images = {};

let imagesAsPlaceholder = false;
const image = (key, x, y, size) =>
  imagesAsPlaceholder
    ? rect(x, y, size, size, { fill: colors.background.emphasized, r: radii.small })
    : `<image x="${x}" y="${y}" width="${size}" height="${size}" xlink:href="${images[key]}" preserveAspectRatio="xMidYMid meet"/>`;

const resultHeader = () =>
  group(
    'Header/Result',
    text(PAD, 44, 'PULSE', typography.head4, colors.brand.primary) +
      line(PAD + 84, 50, PAD + 84, 70, { stroke: colors.border.strong }) +
      text(PAD + 94, 49, '손님 분석', typography.body7, colors.text.secondary),
  );

const resultHero = (y, { eyebrow = '리뷰 분석 완료', body = ['네이버 공개 리뷰 59건에서', '손님 유형 3개를 찾았어요.'], date = '2026.09.18' } = {}) =>
  group(
    'ResultHero',
    rect(PAD, y, PHONE_W - PAD * 2, 232, { fill: colors.brand.primary, r: radii.panel }) +
      text(PAD + 20, y + 20, eyebrow, typography.caption, colors.text.inverse) +
      text(PAD + 20, y + 42, '영등원조쌈밥', typography.head4, colors.text.inverse) +
      text(PAD + 20, y + 80, body, typography.body7, colors.text.inverse) +
      text(PAD + 20, y + 128, [`수집 ${date}`, `분석 완료 ${date}`], typography.body5, colors.text.inverse) +
      rect(PAD + 16, y + 172, PHONE_W - PAD * 2 - 32, 48, { fill: colors.background.surface, r: radii.control }) +
      text(PAD + 28, y + 178, ['i  공개 리뷰 작성자가 전체 손님을', '    대표하지 않을 수 있어요.'], typography.caption, colors.text.secondary),
  );

// slots: [{ kind: 'filled'|'empty', key, name, selected, reason }]
const podium = (y, slots, title = '손님 유형 TOP 3') => {
  const x0 = PAD;
  const w = PHONE_W - PAD * 2;
  let body = rect(x0, y, w, 236, { fill: colors.background.surface, stroke: colors.border.default, r: radii.panel });
  body += text(x0 + 20, y + 16, '리뷰에서 많이 반복된 순서', typography.caption, colors.text.brand);
  body += text(x0 + 20, y + 34, title, typography.head5, colors.text.strong);
  const gap = 8;
  const inner = w - 40;
  const anySelected = slots.some((slot) => slot.selected);
  const widths = slots.map((slot) => (!anySelected ? (inner - gap * 2) / 3 : slot.selected ? 124 : (inner - 124 - gap * 2) / 2));
  let sx = x0 + 20;
  slots.forEach((slot, index) => {
    const sw = widths[index];
    const sy = y + 76;
    if (slot.kind === 'empty') {
      body += group(
        'PodiumSlot/Empty',
        rect(sx, sy, sw, 140, { stroke: colors.border.control, r: radii.control, dash: '6 4' }) +
          text(sx + sw / 2, sy + 44, slot.reason, typography.caption, colors.text.secondary, { anchor: 'middle' }),
      );
    } else {
      const size = slot.selected ? 64 : 44;
      body += group(
        `PodiumSlot/${slot.selected ? 'Selected' : 'Filled'}`,
        rect(sx, sy, sw, 140, {
          fill: colors.background.surface,
          stroke: slot.selected ? colors.brand.primary : colors.border.default,
          sw: slot.selected ? strokes.focus : strokes.hairline,
          r: radii.control,
        }) +
          (slot.image === 'loading'
            ? rect(sx + (sw - size) / 2, sy + 10, size, size, { fill: colors.background.emphasized, r: radii.small })
            : image(slot.key, sx + (sw - size) / 2, sy + 10, size)) +
          text(sx + sw / 2, sy + (slot.selected ? 86 : 64), slot.name, typography.body5, colors.text.primary, { anchor: 'middle' }),
      );
    }
    sx += sw + gap;
  });
  return group('Podium', body);
};

const fullPodium = [
  { kind: 'filled', key: 'revisit', name: '추억 재방문형', selected: true },
  { kind: 'filled', key: 'spice', name: ['매운맛', '조절형'] },
  { kind: 'filled', key: 'solo', name: ['혼밥', '안심형'] },
];

// ---------- 화면 ----------

const W = PHONE_W - PAD * 2;

const screenInput = (step, { reanalysis = false, errors = {}, notice = false } = {}) => {
  let body = navyHeader({ first: !reanalysis });
  let y = 170;
  if (notice) {
    body += card(PAD, y, W, 48, text(PAD + 16, y + 13, '입력한 내용은 그대로 두었어요.', typography.body6, colors.text.primary), { r: radii.control });
    y += 64;
  }
  const inner = [];
  let cy = y + 20;
  const ix = PAD + 20;
  const iw = W - 40;
  if (step === 1 || errors.name) {
    inner.push(field(ix, cy, iw, '가게 이름', step === 1 ? '예: 영등원조쌈밥' : '영등원조쌈밥', { placeholder: step === 1, state: errors.name ? 'error' : step === 1 ? 'focus' : 'default', error: errors.name }));
    cy += (errors.name ? 100 + 24 + ((Array.isArray(errors.name) ? errors.name.length : 1) - 1) * typography.errorText.lineHeight : 100);
  } else {
    inner.push(doneRow(ix, cy, iw, '가게 이름', '영등원조쌈밥'));
    cy += 72;
  }
  if (step >= 2) {
    if (step === 2) {
      inner.push(text(ix, cy, '업종', typography.body6, colors.text.primary));
      const row = chipRow(ix, cy + 30, ['한식', '중식', '일식', '양식', '카페/디저트', '주점', '기타'], null, iw);
      inner.push(row.svg);
      cy = row.bottom + 20;
    } else {
      inner.push(doneRow(ix, cy, iw, '업종', '한식'));
      cy += 72;
    }
  }
  if (step === 3) {
    inner.push(field(ix, cy, iw, '네이버 가게 URL', 'https://naver.me/example', { state: errors.url ? 'error' : 'default', error: errors.url }));
    cy += (errors.url ? 100 + 24 + ((Array.isArray(errors.url) ? errors.url.length : 1) - 1) * typography.errorText.lineHeight : 100);
  }
  body += card(PAD, y, W, cy - y, inner.join(''));
  y = cy + 16;
  if (step === 1) body += primaryButton(PAD, y, W, '다음');
  if (step === 3) body += primaryButton(PAD, y, W, notice ? '다시 분석하기' : '분석하기');
  if (reanalysis) body += bottomNav('analysis');
  return body;
};

const summaryCard = (y) =>
  card(PAD, y, W, 56, text(PAD + 16, y + 16, '영등원조쌈밥 · 한식 · naver.me/…', typography.body7, colors.text.primary) + text(PAD + W - 16, y + 16, '입력 보기', typography.body6, colors.text.brand, { anchor: 'end' }), { r: radii.control });

const screenProgress = () =>
  navyHeader() +
  summaryCard(170) +
  card(PAD, 242, W, 170, stepRow(PAD + 16, 262, 'done', '분석 준비 완료') + stepRow(PAD + 16, 310, 'running', '네이버 리뷰 수집 중') + text(PAD + 20, 364, '단계가 바뀌면 아래에 이어서 보여드려요.', typography.body7, colors.text.secondary));

const screenFailed = (message, action) =>
  navyHeader() +
  summaryCard(170) +
  card(
    PAD,
    242,
    W,
    268,
    stepRow(PAD + 16, 262, 'done', '분석 준비 완료') +
      stepRow(PAD + 16, 310, 'paused', '네이버 리뷰 수집 중', '여기까지 진행했어요') +
      line(PAD + 20, 374, PAD + W - 20, 374, { stroke: colors.border.default }) +
      stepRow(PAD + 16, 390, 'failed', '분석을 마치지 못했어요') +
      text(PAD + 20, 434, message, typography.body4, colors.text.primary),
  ) +
  primaryButton(PAD, 526, W, action);

const screenFirstSaved = () =>
  navyHeader({ first: false, title: false }) +
  circle(180, 236, 40, { fill: colors.status.success }) +
  text(180, 220, '✓', typography.head2, colors.text.inverse, { anchor: 'middle' }) +
  text(180, 296, '첫 분석 결과를 저장했어요', typography.head4, colors.text.strong, { anchor: 'middle' }) +
  text(180, 336, '홈에서 언제든 다시 볼 수 있어요.', typography.body4, colors.text.secondary, { anchor: 'middle' }) +
  card(PAD, 376, W, 76, text(180, 390, '영등원조쌈밥', typography.body5, colors.text.primary, { anchor: 'middle' }) + text(180, 414, '분석에 쓴 리뷰 59건 · 손님 유형 3개', typography.body7, colors.text.secondary, { anchor: 'middle' }), { r: radii.control }) +
  primaryButton(PAD, 472, W, '결과 보기');

const screenHome = (slots = fullPodium, heroBody) =>
  resultHeader() + resultHero(96, heroBody ? { body: heroBody } : {}) + podium(344, slots) + bottomNav('home');

const saveBar = (y) =>
  group(
    'SaveChoiceBar',
    rect(0, y, PHONE_W, PHONE_H - y, { fill: colors.background.surface }) +
      line(0, y, PHONE_W, y, { stroke: colors.border.default }) +
      primaryButton(PAD, y + 12, W, '새 결과로 바꾸기') +
      outlineButton(PAD, y + 72, W, '기존 결과 유지') +
      text(PAD, y + 132, ['기존 결과를 유지하면 이번 새 결과는 저장되지 않고,', '이 화면을 닫은 뒤에는 다시 볼 수 없을 수 있어요.'], typography.caption, colors.text.secondary),
  );

const screenPreview = () =>
  resultHeader() +
  warningNotice(PAD, 84, W, ['새 분석 결과예요.', '아직 저장된 결과를 바꾸지 않았어요.']) +
  resultHero(168, { eyebrow: '새 분석 결과 · 저장 전', date: '2026.09.20' }) +
  podium(416, fullPodium) +
  saveBar(PHONE_H - 184);

const behindDialog = () => {
  imagesAsPlaceholder = true;
  const body = screenPreview();
  imagesAsPlaceholder = false;
  return body;
};

const scrim = () => rect(0, 0, PHONE_W, PHONE_H, { fill: colors.background.inverse, opacity: 0.5 });

const replaceDialog = () =>
  scrim() +
  group(
    'Dialog/ReplaceConfirm',
    rect(20, 250, PHONE_W - 40, 268, { fill: colors.background.surface, r: radii.panel }) +
      text(44, 274, '저장된 결과를 바꿀까요?', typography.head5, colors.text.strong) +
      rect(44, 318, PHONE_W - 88, 64, { fill: colors.background.subtle, stroke: colors.border.default, r: radii.control }) +
      text(56, 328, '지금 저장된 결과', typography.caption, colors.text.secondary) +
      text(56, 348, '영등원조쌈밥 · 2026.09.18 분석', typography.body6, colors.text.primary) +
      text(44, 396, ['바꾸면 이전 결과는 앱에서', '다시 볼 수 없어요.'], typography.body4, colors.text.primary) +
      quietButton(44, 452, 128, '취소') +
      group('Button/Destructive/바꾸기', rect(180, 452, PHONE_W - 224, 48, { fill: colors.destructive.primary, r: radii.control }) + text(180 + (PHONE_W - 224) / 2, 464, '바꾸기', typography.buttonMain, colors.destructive.onPrimary, { anchor: 'middle' })),
  );

const leaveDialog = () =>
  scrim() +
  group(
    'Dialog/LeaveChoice',
    rect(20, 214, PHONE_W - 40, 332, { fill: colors.background.surface, r: radii.panel }) +
      text(44, 238, '새 결과를 어떻게 할까요?', typography.head5, colors.text.strong) +
      text(44, 280, ['선택하지 않고 나가면 새 결과를', '다시 볼 수 없을 수 있어요.'], typography.body4, colors.text.primary) +
      group('Button/Outline/새 결과로 바꾸기', rect(44, 342, PHONE_W - 88, 48, { stroke: colors.brand.primary, r: radii.control }) + text(180, 354, '새 결과로 바꾸기', typography.buttonSub, colors.text.brand, { anchor: 'middle' })) +
      group('Button/Outline/기존 결과 유지', rect(44, 398, PHONE_W - 88, 48, { stroke: colors.brand.primary, r: radii.control }) + text(180, 410, '기존 결과 유지', typography.buttonSub, colors.text.brand, { anchor: 'middle' })) +
      quietButton(44, 454, PHONE_W - 88, '계속 보기'),
  );

const screenImageStates = () =>
  resultHeader() +
  ['loading', 'error']
    .map((kind, index) => {
      const y = 96 + index * 230;
      return card(
        PAD,
        y,
        W,
        210,
        rect(PAD + 20, y + 20, 120, 120, { fill: colors.background.emphasized, r: radii.control }) +
          (kind === 'loading'
            ? text(PAD + 80, y + 70, ['이미지를', '불러오는 중'], typography.caption, colors.text.secondary, { anchor: 'middle' })
            : text(PAD + 80, y + 40, '!', typography.body5, colors.status.warningText, { anchor: 'middle' }) +
              text(PAD + 80, y + 64, ['이미지를 불러오지', '못했어요'], typography.caption, colors.text.secondary, { anchor: 'middle' }) +
              text(PAD + 80, y + 110, '다시 불러오기', typography.body6, colors.text.brand, { anchor: 'middle' })) +
          text(PAD + 156, y + 30, '1위 손님 유형', typography.caption, colors.text.brand) +
          text(PAD + 156, y + 50, '추억 재방문형', typography.head5, colors.text.strong) +
          text(PAD + 156, y + 84, ['변함없는 맛을', '다시 찾는 방문'], typography.body7, colors.text.secondary),
      );
    })
    .join('') +
  bottomNav('home');

// ---------- 보드 ----------

const phonesBoard = (title, subtitle, screens) => {
  const gap = 64;
  const width = 64 * 2 + screens.length * PHONE_W + (screens.length - 1) * gap;
  const height = 160 + 40 + PHONE_H + 120;
  const body =
    boardTitle(title, subtitle) +
    screens.map((screen, index) => `<g transform="translate(${64 + index * (PHONE_W + gap)} 200)">${phone(screen.name, screen.caption, screen.body, screen.options)}</g>`).join('') +
    footer(width, height);
  return svg(width, height, body);
};

const boardIaFlow = () => {
  const width = 1920;
  const height = 1080;
  const box = (x, y, w, label, sub, { tone = 'default' } = {}) =>
    group(
      `Node/${label}`,
      rect(x, y, w, sub ? 64 : 44, {
        fill: tone === 'brand' ? colors.brand.tint : tone === 'warn' ? colors.background.subtle : colors.background.surface,
        stroke: tone === 'brand' ? colors.border.brand : colors.border.control,
        r: radii.control,
      }) +
        text(x + 14, y + 10, label, typography.body6, colors.text.primary) +
        (sub ? text(x + 14, y + 34, sub, typography.caption, colors.text.secondary) : ''),
    );
  const arrow = (x1, y1, x2, y2, label) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const head = [0.5, -0.5].map((d) => `${x2 - 10 * Math.cos(angle + d)},${y2 - 10 * Math.sin(angle + d)}`).join(' ');
    return (
      line(x1, y1, x2, y2, { stroke: colors.text.secondary, sw: 1.5 }) +
      `<polygon points="${x2},${y2} ${head}" fill="${colors.text.secondary}"/>` +
      (label ? text((x1 + x2) / 2 + 6, (y1 + y2) / 2 - 22, label, typography.caption, colors.text.secondary) : '')
    );
  };

  let ia = text(64, 150, 'IA — 앱 구조', typography.head5, colors.text.strong);
  ia += box(64, 200, 220, '앱 시작', 'APP-BOOTING · 세션 복원');
  ia += box(64, 290, 220, '로그인·가입', 'SC-AUTH');
  ia += box(64, 380, 220, '첫 분석 (내비 없음)', 'SC-001 → SC-003 → 첫 저장', { tone: 'brand' });
  ia += box(340, 200, 220, '홈', 'SC-011 저장 결과 1개', { tone: 'brand' });
  ia += box(340, 290, 220, '분석하기', 'SC-001 → SC-003 → 새 결과 확인');
  ia += box(340, 380, 220, '마이페이지', 'SC-012 알림·설정·탈퇴');
  ia += box(620, 200, 240, '결과 (홈 안)', 'TOP3 → 4관점 → 근거 → 제안');
  ia += box(620, 290, 240, '새 결과 미리보기', 'RESULT-UNSAVED-PREVIEW + 저장 선택');
  ia += box(620, 380, 240, '근거 전체 보기', 'SC-005 (API 미구현)', { tone: 'warn' });
  ia += arrow(284, 222, 340, 222) + arrow(284, 322, 340, 322) + arrow(560, 222, 620, 222) + arrow(560, 322, 620, 322);
  ia += text(64, 470, '하단 내비게이션: 홈 · 분석하기(가운데) · 마이페이지. 저장 결과가 없을 때와 첫 저장 완료·새 결과 미리보기에서는 숨긴다(NAV-HIDDEN).', typography.body7, colors.text.secondary);

  let flow = text(64, 540, 'Flow — Step 5 합성 범위', typography.head5, colors.text.strong);
  const fy = 600;
  flow += box(64, fy, 200, '가게 정보 입력', '이름 → 업종 → URL 차례로', { tone: 'brand' });
  flow += box(330, fy, 200, '진행 목록', '받은 단계만 쌓기', { tone: 'brand' });
  flow += box(600, fy - 80, 220, '첫 저장 완료 화면', '저장본 = 이 결과');
  flow += box(600, fy + 30, 220, '새 결과 미리보기', '저장본 ≠ 이 결과');
  flow += box(600, fy + 140, 220, '실패 결과 행', '원인 + 다음 행동 하나', { tone: 'warn' });
  flow += box(900, fy - 80, 180, '홈', '결과 보기');
  flow += box(900, fy + 30, 260, '교체 확인 대화상자', '최종 바꾸기 = destructive');
  flow += arrow(264, fy + 32, 330, fy + 32);
  flow += arrow(530, fy + 20, 600, fy - 48) + arrow(530, fy + 32, 600, fy + 62) + arrow(530, fy + 44, 600, fy + 172);
  flow += arrow(820, fy - 48, 900, fy - 48) + arrow(820, fy + 62, 900, fy + 62, '바꾸기');
  flow += box(330, fy + 170, 220, '입력으로 복귀', '가게 못 찾음·URL 오류, 값 유지', { tone: 'warn' });
  flow += arrow(430, fy + 64, 430, fy + 170, '입력 수정 필요') + arrow(330, fy + 202, 164, fy + 64);
  flow += text(600, fy + 100, '기존 결과 유지 → 확인 없이 바로 홈', typography.caption, colors.text.secondary);
  flow += arrow(1160, fy + 62, 1250, fy + 62) + box(1250, fy + 30, 160, '홈', '새 결과 / 기존 결과');

  const notes = text(1480, 200, ['정본', '· 상태·전이: SCREEN_STATES.md', '· 합성 결정: synthesis/TASK-020', '· 토큰 값: foundation.ts', '· 이 보드는 사람이 보는 사본이다', '  코드와 다르면 코드·정본을 따른다'], typography.body7, colors.text.secondary);

  return svg(width, height, boardTitle('01 · IA & Flow', 'Step 5 합성 범위의 구조와 이동. 새 결과 미리보기·교체는 SCREEN_STATES §10의 다음 Slice. 흐름 세부는 §7') + ia + flow + notes + footer(width, height));
};

const boardFoundation = () => {
  const width = 1920;
  const height = 1080;
  const swatches = [
    ['brand.primary', colors.brand.primary],
    ['action.primary', colors.action.primary],
    ['action.onPrimary', colors.action.onPrimary],
    ['background.canvas', colors.background.canvas],
    ['background.surface', colors.background.surface],
    ['background.emphasized', colors.background.emphasized],
    ['text.primary', colors.text.primary],
    ['text.secondary', colors.text.secondary],
    ['border.default', colors.border.default],
    ['border.control', colors.border.control],
    ['focus.ring', colors.focus.ring],
    ['status.success', colors.status.success],
    ['status.warning', colors.status.warning],
    ['status.warningText', colors.status.warningText],
    ['status.errorText', colors.status.errorText],
    ['destructive.primary', colors.destructive.primary],
  ];
  let body = boardTitle('02 · Foundation', '토큰 값은 foundation.ts에서 생성. 사용 규칙은 DESIGN_SYSTEM §3');
  body += text(64, 150, 'Color', typography.head5, colors.text.strong);
  swatches.forEach(([name, value], index) => {
    const x = 64 + (index % 4) * 200;
    const y = 200 + Math.floor(index / 4) * 110;
    body += group(`Color/${name}`, rect(x, y, 180, 56, { fill: value, stroke: colors.border.default, r: radii.small }) + text(x, y + 62, name, typography.body6, colors.text.primary) + text(x, y + 82, value, typography.caption, colors.text.secondary));
  });
  body += text(960, 150, 'Type — Pretendard', typography.head5, colors.text.strong);
  let ty = 200;
  for (const [name, style] of Object.entries(typography)) {
    body += group(`Type/${name}`, text(960, ty, name, typography.caption, colors.text.brand) + text(1100, ty - (style.lineHeight - 18) / 2, '손님이 남긴 신호', style, colors.text.primary) + text(1560, ty, `${style.fontSize}/${style.lineHeight} · ${weightOf[style.fontFamily]}`, typography.caption, colors.text.secondary));
    ty += Math.max(style.lineHeight, 24) + 8;
  }
  body += text(64, 680, 'Spacing (4px 단위)', typography.head5, colors.text.strong);
  let sx = 64;
  for (const [name, value] of Object.entries(spacing)) {
    if (!value) continue;
    body += group(`Spacing/${name}`, rect(sx, 730, value, value, { fill: colors.brand.tint, stroke: colors.border.brand }) + text(sx, 870, `${name}`, typography.caption, colors.text.secondary));
    sx += Math.max(value, 20) + 16;
  }
  body += text(64, 910, 'Radius', typography.head5, colors.text.strong);
  [['small', radii.small], ['control', radii.control], ['panel', radii.panel]].forEach(([name, value], index) => {
    body += group(`Radius/${name}`, rect(64 + index * 150, 950, 120, 64, { fill: colors.background.subtle, stroke: colors.border.control, r: value }) + text(64 + index * 150, 1020, `${name} ${value}`, typography.caption, colors.text.secondary));
  });
  return svg(width, height, body + footer(width, height));
};

const boardComponents = () => {
  const width = 1920;
  const height = 1400;
  let body = boardTitle('03 · Components', '구현 예정 공용 컴포넌트와 상태. 이름은 DESIGN_SYSTEM §5.3 목록 기준');
  const col = (x, y, title) => text(x, y, title, typography.body5, colors.text.strong);
  body += col(64, 150, 'Button');
  body += primaryButton(64, 190, 320, '분석하기') + text(400, 204, 'default', typography.caption, colors.text.secondary);
  body += rect(64, 254, 320, 52, { stroke: colors.border.control, r: radii.control, dash: '6 4' }) + text(224, 268, 'loading · disabled — 표현 미정', typography.body7, colors.text.secondary, { anchor: 'middle' }) + text(400, 262, ['DESIGN_SYSTEM §13: 공용 컴포넌트 구현 전 결정.', '§5.4대로 두 상태를 시각적으로 구분해야 한다'], typography.caption, colors.text.secondary);
  body += outlineButton(64, 318, 320, '기존 결과 유지') + text(400, 332, 'outline', typography.caption, colors.text.secondary);
  body += quietButton(64, 382, 320, '취소') + text(400, 394, 'quiet', typography.caption, colors.text.secondary);
  body += primaryButton(64, 442, 320, '바꾸기', { tone: 'destructive' }) + text(400, 456, 'destructive — 되돌릴 수 없는 최종 확인에만', typography.caption, colors.text.secondary);

  body += col(760, 150, 'TextField');
  body += field(760, 190, 320, '가게 이름', '예: 영등원조쌈밥', { placeholder: true }) + text(1100, 232, 'default · placeholder', typography.caption, colors.text.secondary);
  body += field(760, 296, 320, '가게 이름', '영등원조쌈밥', { state: 'focus' }) + text(1100, 338, 'focus — focus.ring 2px', typography.caption, colors.text.secondary);
  body += field(760, 402, 320, '네이버 가게 URL', 'https://example.com', { state: 'error', error: ['네이버 가게 주소만 분석할 수 있어요.', 'naver.me 또는 naver.com 주소를 넣어 주세요.'] }) + text(1100, 444, 'error — border.error + errorText', typography.caption, colors.text.secondary);
  body += doneRow(760, 540, 320, '가게 이름', '영등원조쌈밥') + text(1100, 552, 'InputDoneRow — 답한 칸을 접은 상태', typography.caption, colors.text.secondary);

  body += col(1460, 150, 'Chip (업종)');
  body += chip(1460, 190, '한식', true).svg + chip(1540, 190, '중식').svg + text(1460, 244, 'selected · default — radio 역할', typography.caption, colors.text.secondary);
  body += col(1460, 300, 'ProgressStep');
  body += stepRow(1460, 340, 'done', '분석 준비 완료') + stepRow(1460, 388, 'running', '네이버 리뷰 수집 중') + stepRow(1460, 436, 'paused', '네이버 리뷰 수집 중', '여기까지 진행했어요') + stepRow(1460, 500, 'failed', '분석을 마치지 못했어요');
  body += text(1460, 548, ['done · running · paused(실패 뒤 멈춤) · failed', '앞으로 올 단계는 그리지 않는다'], typography.caption, colors.text.secondary);

  body += col(64, 620, 'Notice');
  body += warningNotice(64, 660, 560, '새 분석 결과예요. 아직 저장된 결과를 바꾸지 않았어요.');
  body += col(64, 760, 'BottomNavigation');
  body += group('BottomNavigation/home', bottomNav('home'), 64, 800 - (PHONE_H - 72)) + text(64, 880, 'home 선택 — 가운데 분석하기는 오렌지', typography.caption, colors.text.secondary);
  body += group('BottomNavigation/analysis', bottomNav('analysis'), 64, 920 - (PHONE_H - 72)) + text(64, 1000, ['analysis 선택 — 가운데를 네이비로 바꿔', '화면 안 오렌지 주요 버튼과 경쟁하지 않게 한다'], typography.caption, colors.text.secondary);

  body += col(760, 620, 'PodiumSlot');
  body += group('Podium/Normal', podium(0, fullPodium), 760 - PAD, 660);
  body += group('Podium/Partial', podium(0, [fullPodium[0], { kind: 'filled', key: 'solo', name: ['혼밥', '안심형'] }, { kind: 'empty', reason: ['3위는', '근거가', '부족해', '비웠어요'] }]), 1160 - PAD, 660);
  body += group('Podium/NoPersona', podium(0, [{ kind: 'empty', reason: ['근거', '부족'] }, { kind: 'empty', reason: ['근거', '부족'] }, { kind: 'empty', reason: ['근거', '부족'] }], '손님 유형 TOP 3'), 1560 - PAD, 660);
  body += text(760, 912, ['Normal · Partial(빈 칸 점선 border.control) · NoPersona(세 칸 모두 비움, 선택 콘텐츠 없음)', '빈 칸은 점선, 로딩은 채운 회색으로 모양을 나눈다'], typography.caption, colors.text.secondary);

  body += col(64, 1080, 'Dialog');
  body += text(64, 1116, ['교체 확인: 제목 · 지금 저장된 결과 · 되돌릴 수 없음 문장 · 취소(quiet) + 바꾸기(destructive)', '뒤로가기: 제목 · 문장 · 새 결과로 바꾸기(outline) · 기존 결과 유지(outline) · 계속 보기(quiet)', '어두운 배경은 background.inverse 50%, 상태 표시줄·내비 바까지 덮는다'], typography.body7, colors.text.secondary);
  return svg(width, height, body + footer(width, height));
};

const boardAssets = () => {
  const width = 1920;
  const height = 1080;
  let body = boardTitle('04 · Assets', '제품 에셋 규칙은 DESIGN_SYSTEM §3.6. 아래 이미지는 프로토타입 전용이며 제품 화풍으로 확정하지 않았다');
  const items = [
    ['revisit', '추억 재방문형', 'revisit-memory.png'],
    ['spice', '매운맛 조절형', 'spice-control.png'],
    ['solo', '혼밥 안심형', 'solo-comfort.png'],
  ];
  items.forEach(([key, name, file], index) => {
    const x = 64 + index * 420;
    body += group(`Asset/${file}`, rect(x, 180, 360, 360, { fill: colors.background.subtle, stroke: colors.border.default, r: radii.panel }) + image(key, x + 40, 220, 280) + text(x, 560, name, typography.body5, colors.text.primary) + text(x, 584, file, typography.caption, colors.text.secondary));
  });
  body += text(64, 660, ['사용처', '· 결과 프로토타입의 TOP3 포디움과 선택 유형 카드', '', '사용 금지', '· 제품 화면(실제 분석 결과)의 페르소나 이미지로 쓰지 않는다 — 실제 이미지는 분석 결과가 준다', '· 사람·얼굴·인구통계를 암시하는 이미지로 바꾸지 않는다', '· 이미지만으로 유형을 설명하지 않는다 — 유형 이름·특징·근거가 항상 함께', '', '표시 규칙', '· 선택한 유형 카드의 이미지에 \'AI 생성 이미지\'를 표시한다(포디움 작은 이미지는 레이블 없이, 선택 카드에서 고지)', '· 로딩·조회 실패 대체 표현은 코드로 그린다(03 Components)', '· 아이콘 공급원은 미정 — Vertical Slice 착수 전 결정(DESIGN_SYSTEM §13)'], typography.body4, colors.text.primary);
  body += text(1320, 180, ['원본', 'frontend/mobile/assets/images/personas/prototype/', '출처·해시: 같은 폴더 README.md', '', '이 보드의 이미지는 파일 크기를 줄이려고', '240px로 축소한 사본이다'], typography.body7, colors.text.secondary);
  return svg(width, height, body + footer(width, height));
};

// ---------- 실행 ----------

const loadImages = async () => {
  for (const [key, file] of Object.entries(personaFiles)) {
    const img = await Jimp.read(join(here, '../../../../frontend/mobile/assets/images/personas/prototype', file));
    img.resize(240, Jimp.AUTO);
    const buffer = await img.getBufferAsync(Jimp.MIME_PNG);
    images[key] = `data:image/png;base64,${buffer.toString('base64')}`;
  }
};

await loadImages();
mkdirSync(outDir, { recursive: true });

const boards = {
  '01-ia-flow.svg': boardIaFlow(),
  '02-foundation.svg': boardFoundation(),
  '03-components.svg': boardComponents(),
  '04-assets.svg': boardAssets(),
  '05-final-first-analysis.svg': phonesBoard('05 · Final UI — 첫 분석', '입력은 한 화면에서 차례로 펼치고, 진행은 받은 단계만 쌓는다. 첫 저장은 별도 완료 화면', [
    { name: 'Input-1-Name', caption: '① 가게 이름', body: screenInput(1), options: { statusTone: 'light', top: colors.brand.primary } },
    { name: 'Input-2-Category', caption: '② 업종 — 칩을 고르면 바로 다음', body: screenInput(2), options: { statusTone: 'light', top: colors.brand.primary } },
    { name: 'Input-3-Url', caption: '③ 네이버 가게 URL', body: screenInput(3), options: { statusTone: 'light', top: colors.brand.primary } },
    { name: 'Progress', caption: '④ 진행 목록', body: screenProgress(), options: { statusTone: 'light', top: colors.brand.primary } },
    { name: 'FirstSaved', caption: '⑤ 첫 저장 완료 → 결과 보기', body: screenFirstSaved(), options: { statusTone: 'light', top: colors.brand.primary } },
    { name: 'Home', caption: '⑥ 홈 (저장 결과)', body: screenHome(), options: {} },
  ]),
  '06-final-failures.svg': phonesBoard('06 · Final UI — 실패', '실패 단계는 알 수 없으므로 마지막 행은 멈추고 목록 끝에 실패 결과 행. 입력을 고쳐야 하면 입력으로 복귀', [
    { name: 'Failed-Retryable', caption: '재시도 가능 실패', body: screenFailed(['일시적인 문제로 분석을 마치지 못했어요.', '다시 시도할 수 있어요.'], '다시 분석하기'), options: { statusTone: 'light', top: colors.brand.primary } },
    { name: 'Failed-Insufficient', caption: '리뷰 부족 (50건 미만)', body: screenFailed(['분석에 필요한 리뷰가 50건보다 적어', '결과를 만들지 못했어요.'], '가게 정보 다시 입력'), options: { statusTone: 'light', top: colors.brand.primary } },
    { name: 'Failed-Fatal', caption: '서비스 문제', body: screenFailed(['서비스 쪽 문제로 지금은 분석을 마칠 수', '없어요. 잠시 뒤에 다시 시도해 주세요.'], '입력 화면으로'), options: { statusTone: 'light', top: colors.brand.primary } },
    { name: 'Store-NotFound', caption: '가게 못 찾음 → 입력으로 복귀', body: screenInput(3, { notice: true, errors: { name: ['가게를 찾지 못했어요.', '가게 이름을 확인해 주세요.'], url: ['가게를 찾지 못했어요.', '네이버 가게 URL을 확인해 주세요.'] } }), options: { statusTone: 'light', top: colors.brand.primary } },
  ]),
  '07-final-reanalysis.svg': phonesBoard('07 · Final UI — 다시 분석과 저장 선택 (다음 Slice)', '첫 Vertical Slice 다음에 연결한다(SCREEN_STATES §10). 저장 선택은 미리보기 첫 화면부터 하단 고정, 교체만 확인, 미리보기에서는 하단 내비게이션을 숨긴다', [
    { name: 'Reanalysis-Input', caption: '다시 분석 — 내비의 분석하기는 네이비', body: screenInput(3, { reanalysis: true }), options: { statusTone: 'light', top: colors.brand.primary } },
    { name: 'Preview', caption: '새 결과 미리보기', body: screenPreview(), options: {} },
    { name: 'Replace-Confirm', caption: '교체 확인 (배경 이미지는 회색으로 대체)', body: behindDialog(), options: { overlay: replaceDialog() } },
    { name: 'Leave-Choice', caption: '뒤로가기 (배경 이미지는 회색으로 대체)', body: behindDialog(), options: { overlay: leaveDialog() } },
  ]),
  '08-final-result-states.svg': phonesBoard('08 · Final UI — 결과 상태', '빈 칸은 점선. 이미지 로딩(IMAGE-LOADING)은 채운 회색 영역과 문장, 조회 실패(IMAGE-LOAD-ERROR)는 같은 영역에 주의 아이콘·문장·다시 불러오기', [
    {
      name: 'Result-Partial',
      caption: '유형 2개만 찾음',
      body: screenHome([fullPodium[0], { kind: 'filled', key: 'solo', name: ['혼밥', '안심형'] }, { kind: 'empty', reason: ['3위는', '근거가', '부족해', '비웠어요'] }], ['네이버 공개 리뷰 54건에서', '손님 유형 2개를 찾았어요.']),
      options: {},
    },
    {
      name: 'Result-NoPersona',
      caption: '유형 0개',
      body: screenHome([{ kind: 'empty', reason: ['근거', '부족'] }, { kind: 'empty', reason: ['근거', '부족'] }, { kind: 'empty', reason: ['근거', '부족'] }], ['리뷰는 모았지만 근거를 충족한', '손님 유형을 찾지 못했어요.']),
      options: {},
    },
    { name: 'Image-States', caption: '이미지 불러오는 중 · 실패', body: screenImageStates(), options: {} },
  ]),
};

for (const [file, content] of Object.entries(boards)) {
  writeFileSync(join(outDir, file), content);
  console.log(`${file}  ${(content.length / 1024).toFixed(0)} KB`);
}
