// 생성한 보드 SVG를 검사한다. 사람이 눈으로 보는 것만으로는 놓친다 —
// 2026-09-27 독립 리뷰가 좌표를 직접 재서 프레임 이탈 6건과 글자 겹침 17건을 찾았고,
// 그 뒤 리뷰는 이 검사기가 보지 않던 축(세로·가림·프레임 없는 보드)에서 또 4건을 찾았다.
// 그래서 네 가지를 모두 검사한다.
//
// 1. 프레임 이탈 — 글자가 휴대폰 화면의 좌우·아래로 나가는가
// 2. 글자 겹침 — 같은 화면 안에서 글자끼리 포개지는가
// 3. 가림 — 나중에 그린 불투명 도형이 글자를 덮는가 (하단 내비가 본문을 먹는 사고)
// 4. 미배정 — 어떤 화면에도 속하지 않아 검사받지 못한 글자가 몇 개인가
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

    // 도형은 가림 검사에만 쓴다. 불투명하게 채운 사각형·원만 본다.
    const fill = /fill="([^"]+)"/.exec(tag)?.[1];
    if (!fill || fill === 'none' || fill.startsWith('url(')) continue;
    const opacity = Number(/\bopacity="([\d.]+)"/.exec(tag)?.[1] ?? 1);
    if (opacity < 0.95) continue;

    if (tag.startsWith('<rect')) {
      const x = Number(/\bx="(-?[\d.]+)"/.exec(tag)?.[1] ?? 0);
      const y = Number(/\by="(-?[\d.]+)"/.exec(tag)?.[1] ?? 0);
      const w = Number(/width="([\d.]+)"/.exec(tag)?.[1] ?? 0);
      const h = Number(/height="([\d.]+)"/.exec(tag)?.[1] ?? 0);
      shapes.push({
        order,
        left: x * top.k + top.dx,
        top: y * top.k + top.dy,
        right: (x + w) * top.k + top.dx,
        bottom: (y + h) * top.k + top.dy,
        screen: top.screen,
        dialog: top.dialog,
      });
    } else if (tag.startsWith('<circle')) {
      const cx = Number(/\bcx="(-?[\d.]+)"/.exec(tag)?.[1] ?? 0);
      const cy = Number(/\bcy="(-?[\d.]+)"/.exec(tag)?.[1] ?? 0);
      const r = Number(/\br="([\d.]+)"/.exec(tag)?.[1] ?? 0);
      shapes.push({
        order,
        // 원은 안쪽 정사각형만 가린다고 본다. 모서리까지 덮는다고 하면 과잉 경고가 난다.
        left: (cx - r * 0.7) * top.k + top.dx,
        top: (cy - r * 0.7) * top.k + top.dy,
        right: (cx + r * 0.7) * top.k + top.dx,
        bottom: (cy + r * 0.7) * top.k + top.dy,
        screen: top.screen,
        dialog: top.dialog,
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

/** b가 a를 거의 다 덮는가. 덮는 넓이가 a의 70%를 넘으면 안 보인다고 본다. */
const covers = (a, b) => {
  const hit = box(a, b);
  if (!hit) return false;
  const area = (a.right - a.left) * (a.bottom - a.top);
  return area > 0 && (hit.x * hit.y) / area > 0.7;
};

let problems = 0;
let unassignedTotal = 0;

for (const file of readdirSync(svgDir).filter((f) => f.endsWith('.svg')).sort()) {
  const svg = readFileSync(join(svgDir, file), 'utf8');
  const { texts, shapes } = parse(svg);
  const lines = [];

  const hasScreens = texts.some((t) => t.screen);
  const unassigned = texts.filter((t) => !t.screen).length;
  unassignedTotal += unassigned;

  // 1. 프레임 이탈 — 화면 프레임이 있는 보드에서만 뜻이 있다.
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

  // 2. 글자 겹침 — 프레임이 없는 보드(01~04)는 보드 전체를 한 화면으로 보고 검사한다.
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i];
      const b = texts[j];
      if (hasScreens && a.screen !== b.screen) continue;
      if (hasScreens && !a.screen) continue;
      // 대화상자 카드가 덮는 배경 글자는 문제가 아니다.
      if (a.dialog !== b.dialog) continue;
      const hit = box(a, b);
      if (hit) {
        const where = a.screen ? a.screen.name : file.replace('.svg', '');
        lines.push(
          `  겹침 ${hit.x}×${hit.y}px · ${where} · "${a.value.slice(0, 20)}" × "${b.value.slice(0, 20)}"`,
        );
      }
    }
  }

  // 3. 가림 — 나중에 그린 불투명 도형이 글자를 덮는가.
  for (const t of texts) {
    for (const s of shapes) {
      if (s.order <= t.order) continue;
      if (t.screen !== s.screen) continue;
      if (s.dialog && !t.dialog) continue; // 대화상자가 배경을 가리는 것은 정상
      if (covers(t, s)) {
        const where = t.screen ? t.screen.name : file.replace('.svg', '');
        lines.push(`  가림 · ${where} · "${t.value.slice(0, 32)}" 이 뒤에 그린 도형에 덮인다`);
        break;
      }
    }
  }

  if (lines.length || unassigned) {
    if (lines.length) problems += lines.length;
    console.log(file + (unassigned ? ` (화면에 배정되지 않은 글자 ${unassigned}개)` : ''));
    if (lines.length) console.log(lines.join('\n'));
  }
}

console.log('');
if (problems) {
  console.log(`문제 ${problems}건.`);
  process.exitCode = 1;
} else {
  console.log('보드 검사: 이탈·겹침·가림 없음');
}
if (unassignedTotal) {
  console.log(
    `화면 프레임 밖 글자 ${unassignedTotal}개는 이탈·가림 검사를 받지 않았다(보드 제목·설명·컴포넌트 견본).`,
  );
}
