# -*- coding: utf-8 -*-
"""
PULSE 중간발표 시안 → Figma Slides용 SVG 생성기.

Figma Slides 기본 캔버스 1920x1080 에 맞춘다.
HTML 시안이 쓰던 cqw 단위는 1cqw = 19.2px 로 그대로 환산된다(1920의 1%).
차트는 원래 viewBox 좌표계를 유지한 채 <g transform> 으로 배치해
이미 검증한 기하를 다시 계산하지 않는다.
"""
import os, math

W, H = 1920, 1080
U = W / 100.0          # 1cqw = 19.2px

# ── PULSE 덱 팔레트 ────────────────────────────────────
NAVY9, NAVY7, NAVY5 = "#0F2557", "#1B3A8F", "#2A54C6"
ORANGE = "#F0501E"
SLATE5, SLATE4, SLATE2, SLATE1 = "#5C6675", "#7E8899", "#D9DEE7", "#EDF0F5"
BOARD, CARD, INK = "#F4F6FA", "#FFFFFF", "#14171D"
GRIDL = "#D9DEE7"
FONT = "Noto Sans KR, Malgun Gothic, sans-serif"

def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))

def T(x, y, s, size=16, weight=400, fill=INK, anchor="start", spacing=None):
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    ls = f' letter-spacing="{spacing}"' if spacing else ""
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{FONT}" font-size="{size:.1f}" '
            f'font-weight="{weight}" fill="{fill}"{a}{ls}>{esc(s)}</text>')

def Tspan(x, y, parts, size=16, weight=400, anchor="start"):
    """parts: [(text, fill), ...] — 한 텍스트 안에서 색이 바뀌는 제목용"""
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    inner = "".join(f'<tspan fill="{c}">{esc(t)}</tspan>' for t, c in parts)
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{FONT}" font-size="{size:.1f}" '
            f'font-weight="{weight}"{a}>{inner}</text>')

def tw(s, size):
    """한글은 1.0em, 그 외는 0.55em 로 폭을 근사한다 (레이아웃 충돌 방지용)"""
    w = 0.0
    for ch in s:
        w += size * (1.0 if ord(ch) > 0x1100 else 0.55)
    return w

def R(x, y, w, h, fill, rx=0, stroke=None, sw=1):
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return (f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" '
            f'rx="{rx}" fill="{fill}"{st}/>')

def L(x1, y1, x2, y2, stroke, sw=1, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
            f'stroke="{stroke}" stroke-width="{sw}"{d}/>')

def P(d, fill="none", stroke=None, sw=1, cap="round", join="round", dash=None):
    st = f' stroke="{stroke}" stroke-width="{sw}" stroke-linecap="{cap}" stroke-linejoin="{join}"' if stroke else ""
    da = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<path d="{d}" fill="{fill}"{st}{da}/>'

def C(cx, cy, r, fill, stroke=None, sw=2):
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{fill}"{st}/>'

def G(content, x=0, y=0, scale=1.0, name=None):
    n = f' id="{name}"' if name else ""
    return (f'<g{n} transform="translate({x:.1f},{y:.1f}) scale({scale:.4f})">'
            + "".join(content) + "</g>")

def col_path(x, y, w, h, r=3):
    r = min(r, w / 2, h)
    return (f"M{x:.1f},{y+h:.1f}L{x:.1f},{y+r:.1f}Q{x:.1f},{y:.1f} {x+r:.1f},{y:.1f}"
            f"L{x+w-r:.1f},{y:.1f}Q{x+w:.1f},{y:.1f} {x+w:.1f},{y+r:.1f}"
            f"L{x+w:.1f},{y+h:.1f}Z")

def row_path(x, y, w, h, r=4):
    r = min(r, h / 2, w)
    return (f"M{x:.1f},{y:.1f}L{x+w-r:.1f},{y:.1f}Q{x+w:.1f},{y:.1f} {x+w:.1f},{y+r:.1f}"
            f"L{x+w:.1f},{y+h-r:.1f}Q{x+w:.1f},{y+h:.1f} {x+w-r:.1f},{y+h:.1f}"
            f"L{x:.1f},{y+h:.1f}Z")

# ══════════ 차트 (원래 viewBox 좌표계 유지) ══════════

def bars_h(data, w=600, row_h=28, gap=8, lab_w=112):
    out, mx = [], max(d["v"] for d in data)
    plot = w - lab_w - 42 - 10
    for i, d in enumerate(data):
        y = i * (row_h + gap)
        bw = max(2, d["v"] / mx * plot)
        hi = d.get("hi")
        out.append(T(lab_w - 10, y + row_h / 2 + 4, d["k"], 11, 700 if hi else 500,
                     ORANGE if hi else SLATE5, "end"))
        out.append(P(row_path(lab_w, y, bw, row_h, 4), fill=ORANGE if hi else "#C3CAD6"))
        out.append(T(lab_w + bw + 8, y + row_h / 2 + 4, f"{d['v']:.1f}", 11, 700,
                     ORANGE if hi else SLATE5))
    return out, w, len(data) * row_h + (len(data) - 1) * gap

def stack_bar(segs, w=520, h=34, gap=2):
    out, total, x = [], sum(s["v"] for s in segs), 0.0
    n = len(segs)
    for i, s in enumerate(segs):
        bw = s["v"] / total * (w - (n - 1) * gap)
        out.append(R(x, 0, max(1, bw), h, s["c"], rx=4 if i in (0, n - 1) else 0))
        if bw > 44:
            out.append(T(x + bw / 2, h + 18, str(s["v"]), 11, 700,
                         ORANGE if s.get("hi") else SLATE5, "middle"))
        x += bw + gap
    return out, w, h + 26

def rank_cols(data, w=1000, h=190):
    out, base = [], h - 26
    step, mx = w / len(data), max(d["v"] for d in data)
    bw = step * 0.66
    out.append(L(0, base, w, base, SLATE2, 1))
    for i, d in enumerate(data):
        bh = max(2, d["v"] / mx * (base - 18))
        x, y = i * step + (step - bw) / 2, base - bh
        m = d.get("mark")
        fill = ORANGE if m == "acc" else NAVY5 if m == "hi" else "#C3CAD6"
        out.append(P(col_path(x, y, bw, bh, 3), fill=fill))
        if m or d["r"] == 1:
            c = ORANGE if m == "acc" else (NAVY7 if m else SLATE5)
            out.append(T(x + bw / 2, y - 7, f"{d['v']:,}", 11, 700, c, "middle"))
            out.append(T(x + bw / 2, base + 15, d["k"], 11, 700 if m else 500, c, "middle"))
    return out, w, h

def funnel(steps, w=760, row_h=52, gap=13):
    out, mx = [], steps[0]["v"]
    for i, d in enumerate(steps):
        y = i * (row_h + gap)
        bw = max(120, (d["v"] / mx) ** 0.34 * w)
        out.append(P(row_path(0, y, bw, row_h, 5), fill=d["c"]))
        out.append(T(16, y + row_h / 2 - 2, d["k"], 13, 700, "#FFFFFF"))
        out.append(T(16, y + row_h / 2 + 15, d["sub"], 11, 500, "#FFFFFFD9"))
        out.append(T(bw + 12, y + row_h / 2 + 5, f"{d['v']:,}개", 16, 900,
                     ORANGE if i == len(steps) - 1 else NAVY7))
    return out, w, len(steps) * (row_h + gap)

def dots(data, note=None, w=1000, row_h=38, lab_w=190, pad_r=76):
    out = []
    h = len(data) * row_h + 22
    mn, mx = 2.0, 5.2
    plot = w - lab_w - pad_r
    X = lambda v: lab_w + (v - mn) / (mx - mn) * plot
    for t in [2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]:
        out.append(L(X(t), 6, X(t), h - 22, GRIDL, 1, "2 4"))
        out.append(T(X(t), h - 6, f"{t:.1f}", 10, 400, "#9AA3B2", "middle"))
    for i, d in enumerate(data):
        y, cx, m = 14 + i * row_h, X(d["v"]), d.get("mark")
        c = ORANGE if m == "acc" else NAVY5 if m == "hi" else SLATE4
        out.append(f'<line x1="{lab_w}" y1="{y}" x2="{cx:.1f}" y2="{y}" stroke="{c if m else "#C3CAD6"}" '
                   f'stroke-width="{2.5 if m else 2}" opacity="{1 if m else 0.55}"/>')
        out.append(C(cx, y, 9 if m else 6.5, c, BOARD, 2))
        out.append(T(lab_w - 14, y + 5, d["k"], 13, 700 if m else 500,
                     ORANGE if m == "acc" else NAVY7 if m == "hi" else SLATE5, "end"))
        out.append(T(cx + 18, y + 5, f"{d['v']:.2f}명", 14, 900,
                     ORANGE if m == "acc" else NAVY7 if m == "hi" else SLATE5))
    if note:
        y0, y1, bx = 14 + note["rows"][0] * row_h, 14 + note["rows"][1] * row_h, note["x"]
        out.append(P(f"M{bx-8},{y0} L{bx},{y0} L{bx},{y1} L{bx-8},{y1}", stroke=NAVY7, sw=2))
        out.append(T(bx + 12, (y0 + y1) / 2 - 3, note["head"], 15, 900, NAVY7))
        out.append(T(bx + 12, (y0 + y1) / 2 + 16, note["body"], 12.5, 600, SLATE5))
    return out, w, h

def scope_list(items, mode, w=640):
    out, row_h = [], 34 if mode == "in" else 38
    for i, d in enumerate(items):
        y = i * row_h + (12 if mode == "in" else 14)
        if mode == "in":
            out.append(P(f"M4,{y-4}l4.5,4.5L17,{y-13}", stroke=NAVY7, sw=2.6))
            out.append(T(28, y + 1, d, 15, 600, INK))
        else:
            out.append(L(4, y - 4, 16, y - 4, "#C3CAD6", 2.6))
            out.append(T(28, y, d["k"], 14, 600, SLATE5))
            out.append(T(28, y + 15, d["why"], 11.5, 400, "#9AA3B2"))
    return out, w, len(items) * row_h

def roadmap(stages, w=1000, h=190):
    out, y, r, pad = [], 52, 13, 64
    step = (w - pad * 2) / (len(stages) - 1)
    out.append(L(pad, y, w - pad, y, SLATE2, 3))
    for i, d in enumerate(stages):
        x, now = pad + i * step, d.get("now")
        if now:
            out.append(f'<circle cx="{x:.1f}" cy="{y}" r="{r+7}" fill="{NAVY7}" opacity="0.12"/>')
        out.append(C(x, y, r, NAVY7 if now else "#FFFFFF", NAVY7 if now else "#CFD6E0", 2.5))
        out.append(T(x, y + 5, d["n"], 13, 900, "#FFFFFF" if now else "#9AA3B2", "middle"))
        if now:
            out.append(T(x, y - 27, "지금 여기", 12, 900, ORANGE, "middle"))
        anchor = "start" if i == 0 else "end" if i == len(stages) - 1 else "middle"
        tx = x - r - 4 if i == 0 else x + r + 4 if i == len(stages) - 1 else x
        out.append(T(tx, y + 40, d["k"], 14, 900, NAVY7 if now else SLATE5, anchor))
        for j, line in enumerate(d["s"]):
            out.append(T(tx, y + 60 + j * 17, line, 11.5, 400, "#8E97A6", anchor))
    return out, w, h

# ══════════ 슬라이드 공통 ══════════

def chrome(eyebrow, title_parts, sub):
    o = [R(0, 0, W, H, BOARD)]
    o.append(T(5 * U, 5.4 * U, eyebrow, 1.15 * U, 700, SLATE5))
    lw = tw("ULSE", 1.9 * U)
    o.append(T(W - 5 * U, 5.6 * U, "ULSE", 1.9 * U, 900, NAVY7, "end"))
    o.append(T(W - 5 * U - lw - 0.25 * U, 5.6 * U, "▶", 1.9 * U, 900, NAVY5, "end"))
    o.append(Tspan(5 * U, 9.6 * U, title_parts, 3.05 * U, 900))
    o.append(T(5 * U, 12.6 * U, sub, 1.42 * U, 500, SLATE5))
    return o

def source(lines):
    y0 = H - 2.3 * U - len(lines) * 1.45 * U
    o = [L(5 * U, y0, W - 5 * U, y0, SLATE2, 1)]
    for i, ln in enumerate(lines):
        o.append(T(5 * U, y0 + 1.35 * U + i * 1.45 * U, ln, 0.92 * U, 400, SLATE4))
    return o

def panel(x, y, w, h, title, body_lines, accent=False):
    o = [R(x, y, w, h, "#FEF7F4" if accent else CARD, rx=0.7 * U,
           stroke="#F4C3AF" if accent else SLATE2)]
    o.append(T(x + 1.7 * U, y + 3.0 * U, title, 1.15 * U, 700, ORANGE if accent else INK))
    for i, ln in enumerate(body_lines):
        o.append(T(x + 1.7 * U, y + 5.4 * U + i * 1.9 * U, ln, 1.12 * U, 400, SLATE5))
    return o

def tag(x, y, text, kind):
    fill, col = ("#E4EAFA", NAVY7) if kind == "local" else (SLATE1, SLATE5)
    w = len(text) * 0.95 * U + 1.4 * U
    return [R(x, y - 1.1 * U, w, 1.7 * U, fill, rx=0.35 * U),
            T(x + 0.7 * U, y + 0.15 * U, text, 0.92 * U, 700, col)]

def wrap(inner):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}">' + "".join(inner) + "</svg>")

# ══════════ 데이터 ══════════

RANK_RAW = [("인덕원동",762),("범계동",483),("관양동",475),("부림동",466),("안양1동",455),
 ("안양4동",377),("안양6동",361),("안양3동",280),("안양7동",274),("안양2동",273),
 ("귀인동",256),("박달1동",255),("호계1동",255),("비산3동",220),("호계3동",209),
 ("석수2동",200),("석수1동",189),("안양5동",177),("평촌동",161),("호계2동",153),
 ("신촌동",143),("박달2동",95),("비산1동",85),("안양9동",82),("충훈동",81),
 ("비산2동",77),("명학동",76),("부흥동",76),("갈산동",69),("달안동",64),("평안동",44)]
RANKS = [1,2,3,4,5,6,7,8,9,10,11,12,12,14,15,16,17,18,19,20,21,22,23,24,25,26,27,27,29,30,31]
RANK = [{"k":k,"v":v,"r":RANKS[i],
         "mark":"acc" if k=="명학동" else ("hi" if k in ("안양6동","안양7동") else None)}
        for i,(k,v) in enumerate(RANK_RAW)]

PAIN = [{"k":"원재료비","v":73.9},{"k":"경쟁심화","v":62.4},{"k":"임차료","v":32.8},
        {"k":"상권쇠퇴","v":28.6},{"k":"최저임금","v":26.3},{"k":"판로개척 및 운영","v":3.4,"hi":True}]
COST = [{"k":"식재료비","v":40.7,"c":"#4A5568"},{"k":"고용인 인건비","v":14.3,"c":"#6B7686"},
        {"k":"대표자 인건비","v":13.3,"c":"#8C96A5"},{"k":"기타","v":15.3,"c":"#AAB2BE"},
        {"k":"임차료","v":7.7,"c":"#C8CED8"},{"k":"영업이익","v":8.7,"c":NAVY5,"hi":True}]

# ══════════ 슬라이드 조립 ══════════
SLIDES = {}

def place(chart, x, y, box_w):
    """차트를 원래 viewBox 비율 그대로 box_w 폭에 맞춰 배치"""
    body, vw, vh = chart
    s = box_w / vw
    return G(body, x, y, s), vh * s

# ── A-1 ────────────────────────────────────────────────
def a1():
    o = chrome("문제정의",
        [("규모는 크지만, 수익은 얇고 ", INK), ("원가·경쟁 부담", NAVY7), ("은 큰 외식업", INK)],
        "만안구 음식점·주점업 3,175개 · 매출 100원 중 남는 이익은 8.7원")
    x, y = 5*U, 20.5*U
    o.append(T(x, y+5.0*U, "3,175개", 6.6*U, 900, NAVY7))
    o.append(T(x, y+7.6*U, "만안구 음식점 및 주점업", 1.5*U, 700, INK))
    o += tag(x + 19.5*U, y+7.6*U, "안양", "local")
    o.append(T(x, y+9.6*U, "종사자 8,345명 · 안양시 전체 7,173개 / 21,234명의 44%", 1.18*U, 400, SLATE5))
    o.append(T(x, y+13.4*U, "매출 100원의 행방", 1.15*U, 700, INK))
    o += tag(x + 10.5*U, y+13.4*U, "전국", "natl")
    g, _ = place(stack_bar(COST, w=520), x, y+14.6*U, 37*U)
    o.append(g)
    lx, ly, fs = x, y+21.0*U, 1.02*U
    for i, seg in enumerate(COST):
        lab = f'{seg["k"]} {seg["v"]}'
        o.append(R(lx, ly, 0.85*U, 0.85*U, seg["c"], rx=0.18*U))
        o.append(T(lx+1.25*U, ly+0.75*U, lab, fs, 500, SLATE5))
        lx += 1.25*U + tw(lab, fs) + 1.5*U
        if i == 2:
            lx, ly = x, ly + 1.9*U
    px, pw = W-5*U-46*U, 46*U
    ph = 3.0*U + 2.0*U + (46*U-3.4*U)*(6*28+5*8)/600
    o.append(R(px, 20.5*U, pw, ph, CARD, rx=0.7*U, stroke=SLATE2))
    o.append(T(px+1.7*U, 23.5*U, "경영애로", 1.15*U, 700, INK))
    o += tag(px+8.5*U, 23.5*U, "전국 숙박·음식점업", "natl")
    g, _ = place(bars_h(PAIN, w=600, lab_w=112), px+1.7*U, 25.0*U, pw-3.4*U)
    o.append(g)
    o += source([
        "사업체수·종사자수: 통계청 전국사업체조사 안양시 집계분(국가승인통계 제210003호) KSIC 56 · 2024년 기준",
        "비용구조: 농림축산식품부 「2025년 외식업체 경영실태 조사」(2024년 재무기준, 표본 3,138개)  |  경영애로: 중소벤처기업부 「2024년 기준 소상공인실태조사」 숙박·음식점업, 복수응답"])
    return o
SLIDES["A-1_문제정의_만안구통일"] = a1

# ── A-2 ────────────────────────────────────────────────
def a2():
    o = chrome("문제정의",
        [("전국 79만 개의 문제, ", INK), ("우리가 실제로 만날 수 있는 범위", NAVY7)],
        "같은 기준(KSIC 56)으로 전국에서 명학역 일대까지 좁혀 들어간다")
    g, _ = place(funnel([
        {"k":"전국 음식점 및 주점업","sub":"농식품부 경영실태조사 모집단","v":793082,"c":"#94A0B2"},
        {"k":"안양시","sub":"음식점 및 주점업 · 종사자 21,234명","v":7173,"c":"#5A72A8"},
        {"k":"만안구","sub":"종사자 8,345명 · 동안구는 3,998개","v":3175,"c":NAVY7},
        {"k":"명학동 · 안양6동 · 안양7동","sub":"MVP 테스트 대상을 고를 모집단 · 종사자 1,832명","v":711,"c":NAVY9}]),
        5*U, 20*U, 53*U)
    o.append(g)
    px, pw = W-5*U-32*U, 32*U
    o.append(R(px, 20*U, pw, 10.6*U, CARD, rx=0.7*U, stroke=SLATE2))
    o.append(T(px+1.7*U, 23.0*U, "매출 100원 중 남는 이익", 1.15*U, 700, INK))
    o += tag(px+13.5*U, 23.0*U, "전국", "natl")
    o.append(T(px+1.7*U, 28.0*U, "8.7%", 4.6*U, 900, NAVY7))
    o.append(T(px+9.5*U, 26.6*U, "식재료비 40.7 · 인건비 27.6", 1.05*U, 400, SLATE5))
    o.append(T(px+9.5*U, 28.1*U, "임차료 7.7 · 기타 15.3", 1.05*U, 400, SLATE5))
    ph2 = 3.0*U + 0.9*U + (pw-3.4*U)*(4*26+3*7)/420 + 1.6*U
    o.append(R(px, 32.4*U, pw, ph2, CARD, rx=0.7*U, stroke=SLATE2))
    o.append(T(px+1.7*U, 35.4*U, "경영애로 상위", 1.15*U, 700, INK))
    o += tag(px+9.0*U, 35.4*U, "전국", "natl")
    g, _ = place(bars_h(PAIN[:3]+[PAIN[5]], w=420, row_h=26, gap=7, lab_w=104),
                 px+1.7*U, 36.6*U, pw-3.4*U)
    o.append(g)
    o += source([
        "전국 사업체수: 농림축산식품부 「2025년 외식업체 경영실태 조사」 모집단 793,082개",
        "안양시·만안구·행정동: 통계청 전국사업체조사 안양시 집계분(제210003호) KSIC 56 · 2024년 기준  |  경영애로: 중기부 「2024년 기준 소상공인실태조사」 숙박·음식점업, 복수응답"])
    return o
SLIDES["A-2_문제정의_좁혀들어가기"] = a2

# ── A-3 ────────────────────────────────────────────────
def a3():
    o = chrome("문제정의",
        [("현장은 ", INK), ("충분히 크고", NAVY7), (", 업종 전체는 ", INK), ("충분히 어렵다", ORANGE)],
        "왼쪽은 안양에서 실제로 센 숫자, 오른쪽은 업종 전체의 전국 통계다")
    o.append(T(5*U, 21.2*U, "안양에서 센 숫자 · 전수조사", 1.2*U, 900, NAVY7, spacing="1"))
    rows = [("만안구",3175,8345,2.63,True),("동안구",3998,12889,3.22,False),
            ("안양시 전체",7173,21234,2.96,False)]
    body, vw, vh = [], 600, len(rows)*58
    for i,(k,e,n,per,hi) in enumerate(rows):
        y = i*58+8; bw = e/7173*(600-118-150)
        body.append(T(0, y+20, k, 14, 900 if hi else 600, NAVY7 if hi else SLATE5))
        body.append(P(row_path(118, y+4, max(3,bw), 22, 4), fill=NAVY7 if hi else "#C3CAD6"))
        body.append(T(118+bw+10, y+21, f"{e:,}개", 15, 900, NAVY7 if hi else SLATE5))
        body.append(T(118, y+42, f"종사자 {n:,}명 · 업체당 {per}명(계산값)", 11.5, 400, SLATE5))
    g, _ = place((body, vw, vh), 5*U, 22.3*U, 41*U)
    o.append(g)
    o.append(R(5*U, 35.5*U, 30*U, 2.6*U, SLATE1, rx=0.4*U))
    o.append(T(5.8*U, 37.3*U, "같은 기준 KSIC 56 · 2024.12.31 · 사업체수(개) / 종사자수(명)", 1.0*U, 500, SLATE5))
    o.append(L(50*U, 19.5*U, 50*U, H-6.5*U, SLATE2, 1))
    rx = W-5*U-39*U
    o.append(T(rx, 21.2*U, "업종 전체 · 전국 표본조사", 1.2*U, 900, SLATE5, spacing="1"))
    o.append(R(rx, 22.3*U, 39*U, 11.3*U, CARD, rx=0.7*U, stroke=SLATE2))
    o.append(T(rx+1.7*U, 25.3*U, "매출 100원 중 남는 이익", 1.15*U, 700, INK))
    o.append(T(rx+1.7*U, 30.2*U, "8.7%", 3.8*U, 900, NAVY7))
    o.append(T(rx+1.7*U, 32.3*U, "직전 조사 11.6%에서 하락 · 표본 3,138개", 1.0*U, 400, SLATE5))
    ph = 3.0*U + 0.9*U + (39*U-3.4*U)*(6*19+5*4)/520 + 1.6*U
    o.append(R(rx, 34.7*U, 39*U, ph, CARD, rx=0.7*U, stroke=SLATE2))
    o.append(T(rx+1.7*U, 37.7*U, "경영애로 · 복수응답", 1.15*U, 700, INK))
    g, _ = place(bars_h(PAIN, w=520, row_h=19, gap=4, lab_w=108), rx+1.7*U, 38.9*U, 39*U-3.4*U)
    o.append(g)
    o += source([
        "왼쪽: 통계청 전국사업체조사 안양시 집계분(국가승인통계 제210003호) KSIC 56 · 2024년 기준 · 전수",
        "오른쪽: 농식품부 「2025년 외식업체 경영실태 조사」(표본 3,138개) · 중기부 「2024년 기준 소상공인실태조사」 숙박·음식점업(복수응답)"])
    return o
SLIDES["A-3_문제정의_좌우분리"] = a3

# ── B-1 ────────────────────────────────────────────────
def b1():
    o = chrome("문제정의",
        [("안양시 31개 행정동 중 ", INK), ("우리가 선 자리", NAVY7)],
        "신도시 상권이 상위를 채우고, 성결대가 있는 명학동은 하위권이다")
    g, _ = place(rank_cols(RANK), 5*U, 19.5*U, 90*U)
    o.append(g)
    LEG = [("안양6동·안양7동", NAVY5), ("명학동(성결대 소재)", ORANGE), ("그 외 28개 동", "#C3CAD6")]
    fs = 1.02*U
    total = sum(1.25*U + tw(l, fs) for l, _ in LEG) + 1.8*U*(len(LEG)-1)
    lx = W - 5*U - total
    for lab, col in LEG:
        o.append(R(lx, 39.3*U, 0.85*U, 0.85*U, col, rx=0.18*U))
        o.append(T(lx+1.25*U, 40.05*U, lab, fs, 500, SLATE5))
        lx += 1.25*U + tw(lab, fs) + 1.8*U
    cards = [("안양6동 · 7위","361개",NAVY7,False),("안양7동 · 9위","274개",NAVY7,False),
             ("명학동 · 공동 27위","76개",ORANGE,True),("세 동 합계","711개",INK,False)]
    cw, gap = (90*U - 3*1.4*U)/4.5, 1.4*U
    x = 5*U
    for i,(t,v,c,acc) in enumerate(cards):
        w = cw*1.5 if i==3 else cw
        o.append(R(x, 41.0*U, w, 8.0*U, "#FEF7F4" if acc else CARD, rx=0.7*U,
                   stroke="#F4C3AF" if acc else SLATE2))
        o.append(T(x+1.5*U, 43.9*U, t, 1.15*U, 700, c))
        o.append(T(x+1.5*U, 47.0*U, v, 2.0*U, 900, c))
        if i==3:
            o.append(T(x+1.5*U+tw(v, 2.0*U)+0.7*U, 47.0*U, "/ 만안구의 22.4%", 1.1*U, 700, SLATE5))
        x += w + gap
    o += source([
        "통계청 전국사업체조사 안양시 집계분(국가승인통계 제210003호) KSIC 56 음식점 및 주점업 · 2024.12.31 기준 · 전수  |  동점은 공동 순위",
        "명학동은 2026.7.1부로 개칭된 이름이며 통계표상 명칭은 안양8동  |  명학역 지번의 행정동은 미확정 — 여기서는 성결대가 있는 명학동을 기준으로 한다"])
    return o
SLIDES["B-1_안양_31개동순위"] = b1

# ── B-2 ────────────────────────────────────────────────
def b2():
    o = chrome("문제정의",
        [("명학동·안양6동·안양7동 — ", INK), ("검증할 가게는 충분하다", NAVY7)],
        "711개 매장 / 종사자 1,832명 · 만안구의 22.4% · 팀이 매일 지나는 생활권이다")
    x, y = 5*U, 21*U
    o.append(T(x, y+5.0*U, "711개", 6.6*U, 900, NAVY7))
    o.append(T(x, y+7.6*U, "명학동 · 안양6동 · 안양7동 합계", 1.5*U, 700, INK))
    o.append(T(x, y+9.6*U, "종사자 1,832명 · KSIC 56 · 2024년 기준", 1.18*U, 400, SLATE5))
    sw, sh = 34*U, 2.3*U
    sy = y+12.4*U
    o.append(R(x, sy, sw, sh, "#DDE2EA", rx=0.35*U))
    o.append(R(x, sy, sw*711/3175, sh, NAVY7, rx=0.35*U))
    o.append(T(x+sw*711/3175+0.8*U, sy+1.6*U, "22.4%", 1.4*U, 900, NAVY7))
    o.append(T(x, sy+4.0*U, "만안구 음식점·주점업 3,175개 중", 1.05*U, 400, SLATE5))
    rx = W-5*U-52*U
    o.append(T(rx, 22.5*U, "세 동의 구성", 1.15*U, 700, INK))
    rows=[("안양6동",361,823,"시 7위",NAVY7),("안양7동",274,808,"시 9위",NAVY7),
          ("명학동",76,201,"시 공동 27위",ORANGE)]
    body, vw = [], 760
    for i,(k,e,n,rk,c) in enumerate(rows):
        yy=i*62+10; bw=max(4, e/361*(760-110-190))
        body.append(T(0, yy+20, k, 15, 900, c))
        body.append(T(0, yy+38, rk, 11, 400, SLATE5))
        body.append(P(row_path(110, yy+4, bw, 24, 4), fill=c))
        body.append(T(110+bw+12, yy+22, f"{e:,}개", 16, 900, c))
        body.append(T(110+bw+12, yy+40, f"종사자 {n:,}명", 11.5, 400, SLATE5))
    g, _ = place((body, vw, 3*62), rx, 23.8*U, 52*U)
    o.append(g)
    o.append(R(rx, 38.0*U, 46*U, 2.6*U, SLATE1, rx=0.4*U))
    o.append(T(rx+0.85*U, 39.8*U, "561(음식점업 단독) 기준으로는 435개 — 나머지 276개는 주점·카페다. 인용 시 분류를 밝힌다", 1.0*U, 500, SLATE5))
    o += source([
        "통계청 전국사업체조사 안양시 집계분(국가승인통계 제210003호) · 2024.12.31 기준 · 전수  |  만안구 KSIC 56 3,175개 대비 22.4%",
        "명학동은 구 안양8동(2026.7.1 개칭)  |  명학역 지번의 행정동은 미확정이며, 성결대가 명학동 관할임은 만안구청 공식 페이지로 확인"])
    return o
SLIDES["B-2_안양_711개규모"] = b2

# ── B-3 ────────────────────────────────────────────────
def b3():
    o = chrome("문제정의",
        [("우리가 만나는 가게는 ", INK), ("평균 2.6명이 굴린다", NAVY7)],
        "업체당 종사자 수 — 명학역 일대도 만안구 전체도 2.6명. 범계동의 절반입니다")
    g, _ = place(dots([
        {"k":"명학역 일대 (3개 동)","v":2.58,"mark":"hi"},
        {"k":"만안구","v":2.63},{"k":"안양시 전체","v":2.96},{"k":"동안구","v":3.22},
        {"k":"범계동 (안양시 2위 상권)","v":4.88,"mark":"acc"}],
        note={"rows":[0,1],"x":452,"head":"사실상 같다",
              "body":"검증 범위를 넓혀도 만나는 매장 유형은 같다"}),
        5*U, 19.8*U, 90*U)
    o.append(g)
    pw = (90*U - 1.3*U)/2
    o += panel(5*U, 40.5*U, pw*1.35/1.175, 9.2*U, "이것이 뜻하는 것",
               ["사장님이 직접 주방에 서 있는 1~2인 매장이 대부분이다.",
                "마케팅에 쓸 사람도, 시간도 따로 없다."])
    px = 5*U + pw*1.35/1.175 + 1.3*U
    o += panel(px, 40.5*U, W-5*U-px, 9.2*U, "그래서 필요한 것",
               ["사장님이 새로 만들 자료가 없어야 한다.",
                "이미 쌓인 공개 리뷰만으로 손님 이해와 다음 행동까지."])
    o += source([
        "통계청 전국사업체조사 안양시 집계분(국가승인통계 제210003호) KSIC 56 · 2024.12.31 기준",
        "업체당 종사자 수는 종사자수 ÷ 사업체수로 계산한 값이며 원자료에 공표된 수치가 아니다  |  명학역 일대 = 명학동 + 안양6동 + 안양7동 (711개 / 1,832명)"])
    return o
SLIDES["B-3_안양_업체당종사자"] = b3

# ── C-1 ────────────────────────────────────────────────
def c1():
    o = chrome("프로젝트",
        [("이번에 만드는 것은 ", INK), ("한 줄", NAVY7), ("입니다", INK)],
        "리뷰 → 손님 이해 → 실행 제안. 이 흐름이 실제로 유용한지 먼저 확인합니다")
    o.append(T(5*U, 20.7*U, "MVP에서 만드는 것", 1.2*U, 900, NAVY7, spacing="0.9"))
    g, _ = place(scope_list([
        "네이버 지도·카카오맵 공개 리뷰 수집",
        "반복 패턴 분석 — 좋아하는 것 / 불편한 것 / 어떤 가게로 기억되는지",
        "먼저 볼 것 우선순위 정리",
        "손님 유형(페르소나) 도출",
        "통일된 스타일의 페르소나 이미지",
        "마케팅 자료를 참고한 개선·홍보 제안",
        "설치 없이 쓰는 웹"], "in"), 5*U, 22.0*U, 43*U)
    o.append(g)
    o.append(L(51*U, 19*U, 51*U, H-7.5*U, SLATE2, 1))
    rx = W-5*U-41*U
    o.append(T(rx, 20.7*U, "이번에 하지 않는 것", 1.2*U, 900, SLATE5, spacing="0.9"))
    g, _ = place(scope_list([
        {"k":"홍보영상 생성","why":"손님 이해가 먼저 정확해야 시작되는 기능"},
        {"k":"인플루언서 매칭","why":"위와 같음"},
        {"k":"POS 연동 · 원가 · 재고","why":"연동이 무거워 검증이 늦어진다"},
        {"k":"매출 예측 · ERP","why":"경영관리 도구가 되는 방향"},
        {"k":"월별 변화 추적","why":"반복 사용 구조는 다음 단계"},
        {"k":"사장님의 추가 데이터 입력","why":"지금은 공개 리뷰만으로 확인한다"}], "out"),
        rx, 22.0*U, 41*U)
    o.append(g)
    o += source([
        "범위 정본: docs/product/PRD.md §5 Non-Goals · §9 MVP Scope (2026-08-23 확정)",
        "기능을 벌리기보다 리뷰만으로 사장님이 가치를 느끼는지 먼저 확인하는 것이 이번 목표입니다"])
    return o
SLIDES["C-1_범위_하는것안하는것"] = c1

# ── C-2 ────────────────────────────────────────────────
def c2():
    o = chrome("향후계획",
        [("세 개를 얕게 만들기보다 ", INK), ("순서를 정했습니다", NAVY7)],
        "각 단계는 앞 단계가 확인된 뒤에 시작합니다")
    g, _ = place(roadmap([
        {"n":"1","k":"MVP 검증","s":["공개 리뷰만으로","실제 사장님에게 확인","(안양시에서 수행)"],"now":True},
        {"n":"2","k":"선택 입력 추가","s":["메뉴·가격·매장 특징을","원하는 사장님만 입력"]},
        {"n":"3","k":"지식베이스 강화","s":["근거 있는 제안으로","조언 품질 향상"]},
        {"n":"4","k":"변화 추적","s":["지난달 대비 변화와","이번 달 추천 액션"]}]),
        5*U, 20*U, 90*U)
    o.append(g)
    lw = (90*U - 1.4*U) * 1.25/2.25
    o += panel(5*U, 40.0*U, lw, 9.3*U, "왜 이 순서인가",
               ["영상도 인플루언서도 손님이 어떤 사람인지를 알아야 시작되는 기능입니다.",
                "앞단이 부정확하면 뒤도 무너집니다. 그래서 앞단부터 확인받습니다."])
    px = 5*U + lw + 1.4*U
    o += panel(px, 40.0*U, W-5*U-px, 9.3*U, "이 로드맵에 없는 것",
               ["홍보영상 생성 · 인플루언서 매칭",
                "1단계 결과를 보고 다시 판단할 항목입니다."], accent=True)
    o += source([
        "단계 정본: docs/product/PRD.md §5 Non-Goals · §9 MVP Scope (2026-08-23 확정)",
        "각 단계의 착수 조건은 앞 단계의 확인이며, 일정을 약속하지 않습니다"])
    return o
SLIDES["C-2_범위_순서를정했습니다"] = c2

# ══════════ 출력 ══════════
if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "figma_svg")
    os.makedirs(out_dir, exist_ok=True)
    for i, (name, fn) in enumerate(SLIDES.items(), 1):
        svg = wrap(fn())
        p = os.path.join(out_dir, f"{i:02d}_{name}.svg")
        with open(p, "w", encoding="utf-8") as f:
            f.write(svg)
        print(f"  {os.path.basename(p):46} {len(svg):7,} bytes")
    print(f"\n{len(SLIDES)}장 생성 → {out_dir}")

# ══════════ D. 진행상황 ══════════

def pipeline(steps, w=1000, bw=170, bh=64, top=34):
    """MVP 파이프라인 5단계 + 완료 구간 브래킷"""
    out = []
    n = len(steps)
    gap = (w - n * bw) / (n - 1)
    done = [i for i, s in enumerate(steps) if s.get("done")]
    for i, s in enumerate(steps):
        x = i * (bw + gap)
        dn = s.get("done")
        out.append(R(x, top, bw, bh, NAVY7 if dn else "#FFFFFF", rx=8,
                     stroke=None if dn else "#CFD6E0", sw=2))
        # 번호 + 체크
        out.append(T(x + 16, top + 24, s["n"], 12, 900,
                     "#FFFFFF99" if dn else "#AEB6C2"))
        if dn:
            out.append(P(f"M{x+bw-34},{top+19} l6,6 l12,-13",
                         stroke="#FFFFFF", sw=3))
        out.append(T(x + 16, top + 48, s["k"], 15, 900 if dn else 600,
                     "#FFFFFF" if dn else "#9AA3B2"))
        if i < n - 1:
            ax = x + bw + gap / 2
            out.append(P(f"M{ax-7},{top+bh/2-7} l7,7 l-7,7", stroke="#C3CAD6", sw=2.5))
    # 완료 구간 브래킷
    if done:
        x0 = done[0] * (bw + gap)
        x1 = done[-1] * (bw + gap) + bw
        by = top - 14
        out.append(P(f"M{x0},{by} L{x0},{by-8} L{x1},{by-8} L{x1},{by}",
                     stroke=ORANGE, sw=2))
        out.append(T((x0 + x1) / 2, by - 16, "지금 동작합니다", 14, 900, ORANGE, "middle"))
    # 예정 구간 라벨
    pend = [i for i, s in enumerate(steps) if not s.get("done")]
    if pend:
        px0 = pend[0] * (bw + gap)
        px1 = pend[-1] * (bw + gap) + bw
        out.append(T((px0 + px1) / 2, top + bh + 26, "다음 단계", 13, 700, "#9AA3B2", "middle"))
    return out, w, top + bh + 40

def d1():
    o = chrome("진행과정",
        [("리뷰 수집부터 손님 유형 도출까지 ", INK), ("연결했습니다", NAVY7)],
        "MVP 파이프라인 5단계 중 3단계가 실제로 동작합니다")
    g, _ = place(pipeline([
        {"n":"01","k":"리뷰 수집","done":True},
        {"n":"02","k":"리뷰 분석","done":True},
        {"n":"03","k":"손님 유형 도출","done":True},
        {"n":"04","k":"페르소나 이미지"},
        {"n":"05","k":"마케팅 제안"}]), 5*U, 20*U, 90*U)
    o.append(g)
    unit = (90*U - 2*1.3*U) / 3.3
    pw = unit
    o += panel(5*U, 38.8*U, unit*1.3, 10.3*U, "만든 것",
               ["· 공개 리뷰 수집 파이프라인",
                "· 반복 패턴 분석 (BERTopic 군집화)",
                "· 손님 유형(페르소나) 도출"])
    o += panel(5*U + unit*1.3 + 1.3*U, 38.8*U, unit, 10.3*U, "결정한 것",
               ["· MVP 범위 확정 — 세 기능에서 하나로",
                "· 이후 4단계 로드맵",
                "· 리뷰 수집 경로 결정"])
    o += panel(5*U + unit*1.3 + unit + 2*1.3*U, 38.8*U, unit, 10.3*U, "아직 없는 것",
               ["· 페르소나 이미지 생성",
                "· 마케팅·운영 제안",
                "· 사장님이 보는 화면(웹뷰)"], accent=True)
    o += source([
        "파이프라인 정의: docs/product/PRD.md §7 Functional Requirements · §9 MVP Scope (2026-08-23 확정)",
        "04·05단계는 앞 단계의 결과가 있어야 시작되는 기능입니다. 화면은 파이프라인이 안정된 뒤에 붙입니다"])
    return o
SLIDES["D-1_진행상황_파이프라인진척"] = d1

def types_bars(data, w=880, row_h=58):
    """손님 유형별 비중 — 이름 + 비율"""
    out, mx = [], max(d["v"] for d in data)
    lab_w, pad_r = 250, 90
    plot = w - lab_w - pad_r
    for i, d in enumerate(data):
        y = i * row_h
        bw = d["v"] / mx * plot
        c = NAVY7
        out.append(T(lab_w - 16, y + 26, d["k"], 17, 700, INK, "end"))
        out.append(P(row_path(lab_w, y + 8, max(4, bw), 26, 4), fill=c))
        out.append(T(lab_w + bw + 12, y + 27, f"{d['v']}%", 17, 900, c))
    return out, w, len(data) * row_h

def d2():
    o = chrome("진행과정",
        [("리뷰 59건이 ", INK), ("손님 유형으로 묶였습니다", NAVY7)],
        "파이프라인을 실제로 실행한 결과입니다 · 아래는 비중이 큰 상위 4개 유형")
    x = 5*U
    o.append(T(x, 26.0*U, "59건", 6.6*U, 900, NAVY7))
    o.append(T(x, 28.6*U, "토픽이 부여된 리뷰", 1.5*U, 700, INK))
    o.append(T(x, 30.6*U, "run_pipeline.py 실행 결과", 1.18*U, 400, SLATE5))
    o.append(L(x, 32.1*U, x+30*U, 32.1*U, SLATE2, 1))
    o.append(T(x, 34.4*U, "페르소나 생성", 1.15*U, 700, INK))
    o.append(T(x, 36.3*U, "Solar Pro2", 1.6*U, 900, NAVY5))
    rx = W - 5*U - 58*U
    o.append(T(rx, 21.0*U, "도출된 손님 유형 · 상위 4개", 1.2*U, 900, NAVY7, spacing="0.9"))
    g, _ = place(types_bars([
        {"k":"추억 재방객","v":30.6},
        {"k":"맵찔이 매니아","v":25.0},
        {"k":"혼밥 얼큰족","v":22.2},
        {"k":"중간맵기 탐색자","v":13.9}]), rx, 22.3*U, 58*U)
    o.append(g)
    o += panel(5*U, 38.2*U, 90*U, 12.2*U, "이 결과를 읽을 때",
               ["· 리뷰 59건 기준입니다. 표본이 작아 일반화하지 않습니다.",
                "· 위 4개는 비중이 큰 순서이며, 전체 유형의 일부입니다.",
                "· 유형 이름은 리뷰에 반복된 표현에서 나온 것이며, 연령·성별·직업은 추정하지 않았습니다.",
                "· 리뷰 작성자는 전체 손님이 아닙니다. 리뷰에서 관찰되는 범위까지만 말합니다."],
               accent=True)
    o += source([
        "실행 환경: FastAPI 백엔드 · run_pipeline.py · 페르소나 생성 Solar Pro2",
        "페르소나 취급 규칙: docs/product/PRD.md §7 — 리뷰가 말하지 않은 것을 단정하지 않는다"])
    return o
SLIDES["D-2_진행상황_산출물"] = d2
