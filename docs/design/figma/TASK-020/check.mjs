// 생성한 보드 SVG를 검사한다. 글자가 휴대폰 프레임 밖으로 나가거나 서로 겹치면 알린다.
// 사람이 눈으로 보는 것만으로는 놓친다 — 2026-09-27 독립 리뷰가 좌표를 직접 재서
// 프레임 이탈 6건과 글자 겹침 17건을 찾았다. 그래서 검사를 스크립트로 고정한다.
//
// 실행: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON docs/design/figma/TASK-020/check.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const svgDir = join(here, 'svg');

const PHONE_W = 360;
const PHONE_H = 800;

// generate.mjs의 measure()와 같은 근사식을 쓴다. 둘이 어긋나면 검사가 무의미해진다.
const measure = (value, size) =>
  [...String(value)].reduce(
    (sum, ch) => sum + (/[ᄀ-ᇿ㄰-㆏가-힯　-〿·—…]/.test(ch) ? size : size * 0.56),
    0,
  );

/** `<g transform="translate(a b) scale(k)">`를 누적해 절대 좌표를 만든다. */
function walk(svg) {
  const items = [];
  const stack = [{ dx: 0, dy: 0, k: 1 }];
  // 대화상자 그룹의 깊이. 대화상자는 뒤 화면을 덮으므로 그 안팎이 겹치는 것은 문제가 아니다.
  const dialogDepth = new Set();
  const token = /<g\b[^>]*>|<\/g>|<text\b[^>]*>([^<]*)<\/text>/g;
  let m;
  while ((m = token.exec(svg))) {
    const tag = m[0];
    if (tag === '</g>') {
      if (stack.length > 1) {
        dialogDepth.delete(stack.length - 1);
        stack.pop();
      }
      continue;
    }
    if (tag.startsWith('<g')) {
      const top = stack[stack.length - 1];
      const t = /translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/.exec(tag);
      const s = /scale\(\s*(-?[\d.]+)/.exec(tag);
      const k = s ? Number(s[1]) : 1;
      stack.push({
        dx: top.dx + (t ? Number(t[1]) * top.k : 0),
        dy: top.dy + (t ? Number(t[2]) * top.k : 0),
        k: top.k * k,
      });
      if (/id="(Dialog\/|Scrim)/.test(tag)) dialogDepth.add(stack.length - 1);
      continue;
    }
    const top = stack[stack.length - 1];
    const x = Number(/\bx="(-?[\d.]+)"/.exec(tag)?.[1] ?? 0);
    const y = Number(/\by="(-?[\d.]+)"/.exec(tag)?.[1] ?? 0);
    const size = Number(/font-size="([\d.]+)"/.exec(tag)?.[1] ?? 16);
    const anchor = /text-anchor="(\w+)"/.exec(tag)?.[1] ?? 'start';
    const value = m[1] ?? '';
    if (!value.trim()) continue;
    const w = measure(value, size) * top.k;
    const ax = x * top.k + top.dx;
    const ay = y * top.k + top.dy;
    const left = anchor === 'middle' ? ax - w / 2 : anchor === 'end' ? ax - w : ax;
    items.push({
      value,
      left,
      right: left + w,
      // baseline 기준 잉크 상자를 대략 잡는다. 위로 0.72em, 아래로 0.22em.
      top: ay - size * 0.72 * top.k,
      bottom: ay + size * 0.22 * top.k,
      frame: null,
      inDialog: dialogDepth.size > 0,
    });
  }
  return items;
}

/** 화면 프레임(`Screen/...` 그룹)의 절대 원점을 찾는다. */
function frames(svg) {
  const found = [];
  const stack = [{ dx: 0, dy: 0, k: 1 }];
  const token = /<g\b[^>]*>|<\/g>/g;
  let m;
  while ((m = token.exec(svg))) {
    if (m[0] === '</g>') {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const top = stack[stack.length - 1];
    const t = /translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/.exec(m[0]);
    const s = /scale\(\s*(-?[\d.]+)/.exec(m[0]);
    const next = {
      dx: top.dx + (t ? Number(t[1]) * top.k : 0),
      dy: top.dy + (t ? Number(t[2]) * top.k : 0),
      k: top.k * (s ? Number(s[1]) : 1),
    };
    stack.push(next);
    const id = /id="(Screen\/[^"]+)"/.exec(m[0]);
    if (id) found.push({ name: id[1], ...next });
  }
  return found;
}

const overlap = (a, b) => {
  const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return x > 1 && y > 1 ? { x: Math.round(x), y: Math.round(y) } : null;
};

let problems = 0;
for (const file of readdirSync(svgDir).filter((f) => f.endsWith('.svg')).sort()) {
  const svg = readFileSync(join(svgDir, file), 'utf8');
  const texts = walk(svg);
  const screens = frames(svg);

  // 각 글자를 담고 있는 화면 프레임에 붙인다.
  for (const t of texts) {
    for (const s of screens) {
      if (t.left >= s.dx - 80 && t.left < s.dx + PHONE_W + 80 && t.top >= s.dy - 60 && t.top < s.dy + PHONE_H) {
        t.frame = s;
      }
    }
  }

  const lines = [];

  for (const t of texts) {
    if (!t.frame) continue;
    // 프레임 위 캡션은 일부러 밖에 둔다.
    if (t.top < t.frame.dy - 8) continue;
    const overflowLeft = t.frame.dx - t.left;
    const overflowRight = t.right - (t.frame.dx + PHONE_W);
    if (overflowLeft > 2 || overflowRight > 2) {
      lines.push(
        `  넘침 ${Math.round(Math.max(overflowLeft, overflowRight))}px · ${t.frame.name} · "${t.value.slice(0, 32)}"`,
      );
    }
  }

  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i];
      const b = texts[j];
      if (!a.frame || a.frame !== b.frame) continue;
      if (a.inDialog !== b.inDialog) continue;
      const hit = overlap(a, b);
      if (hit) {
        lines.push(
          `  겹침 ${hit.x}×${hit.y}px · ${a.frame.name} · "${a.value.slice(0, 20)}" × "${b.value.slice(0, 20)}"`,
        );
      }
    }
  }

  if (lines.length) {
    problems += lines.length;
    console.log(`${file}`);
    console.log(lines.join('\n'));
  }
}

if (problems) {
  console.log(`\n문제 ${problems}건.`);
  process.exitCode = 1;
} else {
  console.log('보드 검사: 프레임 이탈·글자 겹침 없음');
}
