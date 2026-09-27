// 생성한 보드 SVG를 검사한다. 사람이 눈으로 보는 것만으로는 놓친다 —
// 2026-09-27 독립 리뷰가 좌표를 직접 재서 프레임 이탈 6건과 글자 겹침 17건을 찾았고,
// 그 뒤 리뷰는 이 검사기가 보지 않던 축(세로·가림·프레임 없는 보드)에서 또 찾았다.
// 5차 리뷰는 가림을 비율(70%)로 재면 글자 끝 몇 자가 가려져도 통과한다는 것과,
// 선만 있는 도형(점선 원)이 글자를 가로지르는 경우를 보지 않는다는 것을 찾았다.
//
// 1. 프레임 이탈 — 글자가 휴대폰 화면의 좌우·아래로 나가는가 (화면 프레임 안 글자만)
// 2. 글자 겹침 — 같은 묶음 안에서 글자끼리 포개지는가
// 3. 가림 — 나중에 그린 불투명 도형이 글자를 반 글자 넓이보다 많이 덮는가
// 4. 테두리 관통 — 사각형·원의 테두리 선이 글자 상자를 가로지르는가
// 5. 도형 이탈 — 화면 프레임 안의 채운 사각형(버튼·카드)이 프레임 밖으로 나가 잘리는가
//
// 묶음: 화면 프레임(Screen/*) 하나가 한 묶음이고, 프레임 밖 글자·도형은 보드마다 한 묶음이다.
// 2~4는 모든 글자가 받는다. 1·5는 화면 프레임 안에서만 뜻이 있어 프레임 밖 글자·도형은 받지 않는다.
// 보지 않는 것: <path>·<line>·<polygon>·<image> 도형, 사각형 모서리 둥글기(rx — 넓게 잡는 쪽),
// 실제 글꼴의 글자 폭(shared.mjs의 measure 근사를 쓴다).
//
// 실행: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON docs/design/figma/TASK-020/check.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PHONE_H, PHONE_W, measure } from './shared.mjs';

const svgDir = join(dirname(fileURLToPath(import.meta.url)), 'svg');

/**
 * SVG를 한 번 훑어 글자와 도형을 절대 좌표로 뽑는다.
 * 프레임 배정은 좌표가 아니라 그룹 구조로 한다 — 좌표로 하면 옆 화면 것으로 잘못 잡힌다.
 */
function parse(svg) {
  const texts = [];
  const shapes = [];
  const stack = [{ dx: 0, dy: 0, k: 1, screen: null, dialog: false }];
  let order = 0;

  const token =
    /<g\b[^>]*>|<\/g>|<text\b[^>]*>([^<]*)<\/text>|<rect\b[^>]*\/>|<circle\b[^>]*\/>|<path\b[^>]*\/>/g;
  let m;
  while ((m = token.exec(svg))) {
    const tag = m[0];
    order += 1;

    if (tag === '</g>') {
      if (stack.length > 1) stack.pop();
      continue;
    }

    const top = stack[stack.length - 1];

    if (tag.startsWith('<g')) {
      const t = /translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/.exec(tag);
      const s = /scale\(\s*(-?[\d.]+)/.exec(tag);
      const id = /id="([^"]+)"/.exec(tag)?.[1] ?? '';
      const next = {
        dx: top.dx + (t ? Number(t[1]) * top.k : 0),
        dy: top.dy + (t ? Number(t[2]) * top.k : 0),
        k: top.k * (s ? Number(s[1]) : 1),
        screen: top.screen,
        dialog: top.dialog || id.startsWith('Dialog/'),
      };
      if (id.startsWith('Screen/')) next.screen = { name: id, dx: next.dx, dy: next.dy };
      stack.push(next);
      continue;
    }

    if (tag.startsWith('<text')) {
      const value = m[1] ?? '';
      if (!value.trim()) continue;
      const x = Number(/\bx="(-?[\d.]+)"/.exec(tag)?.[1] ?? 0);
      const y = Number(/\by="(-?[\d.]+)"/.exec(tag)?.[1] ?? 0);
      const size = Number(/font-size="([\d.]+)"/.exec(tag)?.[1] ?? 16);
      const anchor = /text-anchor="(\w+)"/.exec(tag)?.[1] ?? 'start';
      const w = measure(value, size) * top.k;
      const ax = x * top.k + top.dx;
      const ay = y * top.k + top.dy;
      const left = anchor === 'middle' ? ax - w / 2 : anchor === 'end' ? ax - w : ax;
      texts.push({
        value,
        order,
        size: size * top.k,
        left,
        right: left + w,
        // baseline 기준 잉크 상자. 위로 0.72em, 아래로 0.22em.
        top: ay - size * 0.72 * top.k,
        bottom: ay + size * 0.22 * top.k,
        screen: top.screen,
        dialog: top.dialog,
      });
      continue;
    }

    if (tag.startsWith('<path')) continue;

    // 도형. 불투명하게 채웠으면 가림 검사에, 테두리 선이 있으면 관통 검사에 쓴다.
    const fill = /\bfill="([^"]+)"/.exec(tag)?.[1];
    const opacity = Number(/\bopacity="([\d.]+)"/.exec(tag)?.[1] ?? 1);
    const filled = Boolean(fill) && fill !== 'none' && !fill.startsWith('url(') && opacity >= 0.95;
    const strokeColor = /\bstroke="([^"]+)"/.exec(tag)?.[1];
    const stroked = Boolean(strokeColor) && strokeColor !== 'none';
    if (!filled && !stroked) continue;
    const base = { order, filled, stroked, screen: top.screen, dialog: top.dialog };

    if (tag.startsWith('<rect')) {
      const x = Number(/\bx="(-?[\d.]+)"/.exec(tag)?.[1] ?? 0);
      const y = Number(/\by="(-?[\d.]+)"/.exec(tag)?.[1] ?? 0);
      const w = Number(/width="([\d.]+)"/.exec(tag)?.[1] ?? 0);
      const h = Number(/height="([\d.]+)"/.exec(tag)?.[1] ?? 0);
      shapes.push({
        ...base,
        kind: 'rect',
        left: x * top.k + top.dx,
        top: y * top.k + top.dy,
        right: (x + w) * top.k + top.dx,
        bottom: (y + h) * top.k + top.dy,
      });
    } else {
      const cx = Number(/\bcx="(-?[\d.]+)"/.exec(tag)?.[1] ?? 0);
      const cy = Number(/\bcy="(-?[\d.]+)"/.exec(tag)?.[1] ?? 0);
      const r = Number(/\br="([\d.]+)"/.exec(tag)?.[1] ?? 0);
      const R = r * top.k;
      const X = cx * top.k + top.dx;
      const Y = cy * top.k + top.dy;
      // 원은 원 모양 그대로 잰다. 안쪽 정사각형으로 근사하면 가장자리 가림을 놓친다(5차 리뷰).
      // 테두리가 있으면 선 두께의 절반만큼 바깥까지 덮는다(하단 가운데 버튼의 흰 테두리 4 — 6차 리뷰).
      const sw = stroked ? Number(/stroke-width="([d.]+)"/.exec(tag)?.[1] ?? 1) * top.k : 0;
      const cover = R + sw / 2;
      shapes.push({
        ...base,
        kind: 'circle',
        cx: X,
        cy: Y,
        r: R,
        cover,
        left: X - cover,
        top: Y - cover,
        right: X + cover,
        bottom: Y + cover,
      });
    }
  }
  return { texts, shapes };
}

const box = (a, b) => {
  const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return x > 1 && y > 1 ? { x: Math.round(x), y: Math.round(y) } : null;
};

/** 도형 s가 글자 상자 t를 덮는 넓이(px²). 원은 0.5px 격자로 센다. */
const coveredArea = (t, s) => {
  const left = Math.max(t.left, s.left);
  const right = Math.min(t.right, s.right);
  const top = Math.max(t.top, s.top);
  const bottom = Math.min(t.bottom, s.bottom);
  if (right <= left || bottom <= top) return 0;
  if (s.kind === 'rect') return (right - left) * (bottom - top);
  const step = 0.5;
  let n = 0;
  for (let x = left + step / 2; x < right; x += step) {
    for (let y = top + step / 2; y < bottom; y += step) {
      if ((x - s.cx) ** 2 + (y - s.cy) ** 2 <= s.cover ** 2) n += 1;
    }
  }
  return n * step * step;
};

/**
 * 가림 기준은 절대 넓이다. 반 글자(글자 상자 높이 × 글자 크기 × 0.5)보다 많이 덮이면 가림이다.
 * 비율로 재면 긴 문장의 끝 몇 자가 가려져도 통과한다 — 5차 리뷰가 찾은 14% 가림이 그 경우다.
 */
const covers = (t, s) => coveredArea(t, s) > (t.bottom - t.top) * t.size * 0.5;

/** 테두리 선이 글자 상자를 가로지르는가. 선이 상자 안쪽으로 1px 넘게 들어와야 센다. */
const crosses = (t, s) => {
  const inner = { left: t.left + 1, right: t.right - 1, top: t.top + 1, bottom: t.bottom - 1 };
  if (inner.right <= inner.left || inner.bottom <= inner.top) return false;
  if (s.kind === 'rect') {
    const spansX = inner.right > s.left && inner.left < s.right;
    const spansY = inner.bottom > s.top && inner.top < s.bottom;
    const vertical = spansY && [s.left, s.right].some((x) => x > inner.left && x < inner.right);
    const horizontal = spansX && [s.top, s.bottom].some((y) => y > inner.top && y < inner.bottom);
    return vertical || horizontal;
  }
  // 원: 중심에서 상자까지 가장 가까운 거리 < r < 가장 먼 거리이면 원둘레가 상자를 지난다.
  const nx = Math.max(inner.left, Math.min(s.cx, inner.right));
  const ny = Math.max(inner.top, Math.min(s.cy, inner.bottom));
  const near = Math.hypot(nx - s.cx, ny - s.cy);
  const far = Math.max(
    ...[inner.left, inner.right].flatMap((x) =>
      [inner.top, inner.bottom].map((y) => Math.hypot(x - s.cx, y - s.cy)),
    ),
  );
  return near < s.r && far > s.r;
};

let problems = 0;
let unassignedTotal = 0;

for (const file of readdirSync(svgDir).filter((f) => f.endsWith('.svg')).sort()) {
  const svg = readFileSync(join(svgDir, file), 'utf8');
  const { texts, shapes } = parse(svg);
  const lines = [];
  const whereOf = (t) => (t.screen ? t.screen.name : file.replace('.svg', ''));

  const unassigned = texts.filter((t) => !t.screen).length;
  unassignedTotal += unassigned;

  // 1. 프레임 이탈 — 화면 프레임 안 글자만 뜻이 있다.
  for (const t of texts) {
    if (!t.screen) continue;
    // 프레임 위 캡션은 일부러 밖에 둔다.
    if (t.top < t.screen.dy - 8) continue;
    const over = Math.max(
      t.screen.dx - t.left,
      t.right - (t.screen.dx + PHONE_W),
      t.bottom - (t.screen.dy + PHONE_H),
    );
    if (over > 2) {
      lines.push(`  이탈 ${Math.round(over)}px · ${t.screen.name} · "${t.value.slice(0, 32)}"`);
    }
  }

  // 5. 도형 이탈 — 프레임이 잘라 내므로 글자가 없어도 버튼·카드가 잘려 보인다(09 가입하기 버튼, 5차 수정 중 발견).
  for (const s of shapes) {
    if (!s.screen || !s.filled || s.kind !== 'rect') continue;
    const over = Math.max(
      s.screen.dx - s.left,
      s.right - (s.screen.dx + PHONE_W),
      s.bottom - (s.screen.dy + PHONE_H),
    );
    if (over > 0.5) lines.push(`  도형 이탈 ${Math.round(over * 10) / 10}px · ${s.screen.name} · 사각형 바닥 ${Math.round(s.bottom - s.screen.dy)}`);
  }

  // 2. 글자 겹침 — 같은 묶음끼리. 프레임이 없는 보드(01~04)는 보드 전체가 한 묶음이다.
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i];
      const b = texts[j];
      if (a.screen !== b.screen) continue;
      // 대화상자 글자는 모두 불투명 카드 안에 있고, 그 카드가 아래 배경 글자를 덮는다.
      // 그래서 대화상자 글자와 배경 글자는 서로 겹침을 따지지 않는다.
      if (a.dialog !== b.dialog) continue;
      const hit = box(a, b);
      if (hit) {
        lines.push(
          `  겹침 ${hit.x}×${hit.y}px · ${whereOf(a)} · "${a.value.slice(0, 20)}" × "${b.value.slice(0, 20)}"`,
        );
      }
    }
  }

  // 3. 가림 — 나중에 그린 불투명 도형이 글자를 덮는가.
  for (const t of texts) {
    for (const s of shapes) {
      if (!s.filled || s.order <= t.order) continue;
      if (t.screen !== s.screen) continue;
      if (s.dialog && !t.dialog) continue; // 대화상자 카드가 배경을 가리는 것은 정상
      if (covers(t, s)) {
        lines.push(
          `  가림 ${Math.round(coveredArea(t, s))}px² · ${whereOf(t)} · "${t.value.slice(0, 32)}" 이 뒤에 그린 도형에 덮인다`,
        );
        break;
      }
    }
  }

  // 4. 테두리 관통 — 그린 순서와 무관하다. 선이 글자를 긋는 것은 앞이든 뒤든 읽기를 해친다.
  for (const t of texts) {
    for (const s of shapes) {
      if (!s.stroked || t.screen !== s.screen) continue;
      if (s.dialog !== t.dialog) continue;
      if (crosses(t, s)) {
        lines.push(
          `  관통 · ${whereOf(t)} · "${t.value.slice(0, 32)}" 을 ${s.kind === 'circle' ? '원' : '사각형'} 테두리가 가로지른다`,
        );
        break;
      }
    }
  }

  if (lines.length || unassigned) {
    if (lines.length) problems += lines.length;
    console.log(file + (unassigned ? ` (화면 프레임 밖 글자 ${unassigned}개)` : ''));
    if (lines.length) console.log(lines.join('\n'));
  }
}

console.log('');
if (problems) {
  console.log(`문제 ${problems}건.`);
  process.exitCode = 1;
} else {
  console.log('보드 검사: 이탈·겹침·가림·관통·도형 이탈 없음');
}
if (unassignedTotal) {
  console.log(
    `화면 프레임 밖 글자 ${unassignedTotal}개는 프레임 이탈 검사만 받지 않았다(보드 제목·설명·컴포넌트 견본). 겹침·가림·관통은 보드 단위로 받았다.`,
  );
}
