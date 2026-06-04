#!/usr/bin/env python3
"""
Генерация фирменных SVG-артов для кейсов Chaos Vision — без внешних моделей.
Гранёный кристалл + нейро-линии + частицы, палитра indigo(#6366f1)->cyan(#22d3ee)
на near-black фоне (#000209). У каждого кейса свой акцентный слой.
Запуск: python3 tools/build_case_svgs.py  -> assets/img/case-*.svg
"""
import math, random, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1600, 1000
INDIGO = (99, 102, 241)
CYAN = (34, 211, 238)

def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

def rgb(c, a=1.0):
    return f"rgba({c[0]},{c[1]},{c[2]},{a:.3f})"

def hex_(c):
    return "#%02x%02x%02x" % c

def poly(points, fill, stroke=None, sw=1.0, opacity=1.0):
    pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in points)
    s = f'<polygon points="{pts}" fill="{fill}"'
    if stroke:
        s += f' stroke="{stroke}" stroke-width="{sw:.2f}"'
    if opacity != 1.0:
        s += f' opacity="{opacity:.3f}"'
    s += '/>'
    return s

def line(x1, y1, x2, y2, stroke, sw=1.0, opacity=1.0):
    return (f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
            f'stroke="{stroke}" stroke-width="{sw:.2f}" opacity="{opacity:.3f}"/>')

def circle(x, y, r, fill, opacity=1.0):
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{fill}" opacity="{opacity:.3f}"/>'

def crystal(cx, cy, R, rng, npts=11, rot=0.0):
    """Гранёный гем: внешнее кольцо, внутреннее кольцо, центр -> много фасетов."""
    out, inn = [], []
    for i in range(npts):
        ang = rot + i / npts * math.tau
        ro = R * (0.86 + rng.random() * 0.26)
        ri = R * (0.40 + rng.random() * 0.16)
        out.append((cx + math.cos(ang) * ro, cy + math.sin(ang) * ro * 1.05))
        inn.append((cx + math.cos(ang) * ri, cy + math.sin(ang) * ri * 1.05))
    facets = []
    for i in range(npts):
        j = (i + 1) % npts
        facets.append((out[i], out[j], inn[i]))
        facets.append((inn[i], out[j], inn[j]))
        facets.append((inn[i], inn[j], (cx, cy)))
    svg = []
    for tri in facets:
        mx = sum(p[0] for p in tri) / 3
        my = sum(p[1] for p in tri) / 3
        # цвет по горизонтали (indigo слева -> cyan справа)
        t = max(0.0, min(1.0, (mx - (cx - R)) / (2 * R)))
        col = lerp(INDIGO, CYAN, t)
        # глубже к центру -> ярче
        d = math.hypot(mx - cx, my - cy) / R
        op = 0.50 - 0.30 * d + rng.uniform(-0.05, 0.05)
        op = max(0.08, min(0.62, op))
        svg.append(poly(tri, rgb(col, op), stroke=rgb((125, 211, 252), 0.28), sw=1.1))
    # яркие рёбра внешнего контура
    for i in range(npts):
        j = (i + 1) % npts
        svg.append(line(out[i][0], out[i][1], out[j][0], out[j][1], rgb((150, 220, 255), 0.45), 1.2, 1.0))
    return "\n".join(svg), out

def particles(rng, n=46):
    s = []
    for _ in range(n):
        x = rng.uniform(0, W); y = rng.uniform(0, H)
        r = rng.uniform(0.6, 2.6)
        col = lerp(INDIGO, CYAN, rng.random())
        s.append(circle(x, y, r, rgb(col, rng.uniform(0.15, 0.6))))
    return "\n".join(s)

def neural(cx, cy, out_pts, rng, nodes=14):
    s = []
    pts = []
    for _ in range(nodes):
        ang = rng.uniform(0, math.tau)
        rad = rng.uniform(R0 * 1.3, R0 * 2.4)
        x = cx + math.cos(ang) * rad
        y = cy + math.sin(ang) * rad * 0.9
        pts.append((x, y))
    for (x, y) in pts:
        a = rng.choice(out_pts)
        s.append(line(a[0], a[1], x, y, rgb((125, 211, 252), 0.18), 0.8, 1.0))
        s.append(circle(x, y, rng.uniform(1.4, 3.0), rgb(lerp(INDIGO, CYAN, rng.random()), 0.7)))
    return "\n".join(s)

def shards(rng, n=10):
    s = []
    for _ in range(n):
        cx = rng.uniform(0, W); cy = rng.uniform(0, H); sz = rng.uniform(8, 26)
        a = rng.uniform(0, math.tau)
        tri = [(cx + math.cos(a + k) * sz, cy + math.sin(a + k) * sz)
               for k in (0, 2.2, 4.3)]
        col = lerp(INDIGO, CYAN, rng.random())
        s.append(poly(tri, rgb(col, rng.uniform(0.05, 0.18)),
                      stroke=rgb((125, 211, 252), 0.2), sw=0.8))
    return "\n".join(s)

R0 = 250

def accent(kind, cx, cy, rng):
    s = []
    if kind == "voice":           # звуковые дуги слева
        for i in range(6):
            r = 70 + i * 46
            op = 0.42 - i * 0.05
            s.append(f'<path d="M {cx-120-i*30:.0f} {cy-130:.0f} '
                     f'A {r} {r} 0 0 0 {cx-120-i*30:.0f} {cy+130:.0f}" '
                     f'fill="none" stroke="{rgb(CYAN, op)}" stroke-width="2.2"/>')
    elif kind == "content":       # парящие плитки-документы
        for _ in range(9):
            x = cx + rng.uniform(-380, 380); y = cy + rng.uniform(-260, 260)
            w = rng.uniform(54, 96); h = w * 1.3
            col = lerp(INDIGO, CYAN, rng.random())
            s.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" rx="6" '
                     f'fill="{rgb(col,0.10)}" stroke="{rgb((125,211,252),0.35)}" stroke-width="1.2"/>')
    elif kind == "rag":           # плотная сеть узлов
        nodes = [(cx + rng.uniform(-420, 420), cy + rng.uniform(-300, 300)) for _ in range(16)]
        for i, a in enumerate(nodes):
            for b in nodes[i+1:]:
                if math.hypot(a[0]-b[0], a[1]-b[1]) < 230:
                    s.append(line(a[0], a[1], b[0], b[1], rgb((125,211,252),0.14), 0.7))
        for a in nodes:
            s.append(circle(a[0], a[1], rng.uniform(2, 4), rgb(lerp(INDIGO,CYAN,rng.random()),0.7)))
    elif kind == "assistant":     # защитное кольцо-контур
        for k, r in enumerate((R0*1.5, R0*1.72)):
            dash = "10 14" if k == 0 else "4 18"
            s.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{r:.0f}" ry="{r*0.92:.0f}" '
                     f'fill="none" stroke="{rgb(CYAN,0.30)}" stroke-width="1.6" stroke-dasharray="{dash}"/>')
    elif kind == "web":           # перспективная сетка-плоскость
        for i in range(-5, 6):
            x = cx + i * 70
            s.append(line(x, cy-300, cx + i*150, cy+340, rgb((99,102,241),0.10), 0.8))
        for j in range(7):
            y = cy - 220 + j * 75
            s.append(line(cx-460, y, cx+460, y, rgb((34,211,238),0.08), 0.8))
    elif kind == "agents":        # малые гемы-спутники
        for k in range(3):
            ang = k / 3 * math.tau + 0.5
            sx = cx + math.cos(ang) * 360; sy = cy + math.sin(ang) * 240
            g, gout = crystal(sx, sy, 78, rng, npts=7, rot=rng.random()*6)
            s.append(g)
            s.append(line(cx, cy, sx, sy, rgb((125,211,252),0.22), 1.0))
    return "\n".join(s)

CASES = {
    "case-voice": ("voice", 7),
    "case-content": ("content", 21),
    "case-rag": ("rag", 42),
    "case-assistant": ("assistant", 77),
    "case-web": ("web", 108),
    "case-agents": ("agents", 256),
}

def build(name, kind, seed):
    rng = random.Random(seed)
    cx, cy = W * 0.60, H * 0.50
    rot = rng.random() * math.tau
    cr, out_pts = crystal(cx, cy, R0, rng, npts=rng.choice([10, 11, 13]), rot=rot)
    defs = f'''<defs>
<radialGradient id="bg" cx="60%" cy="46%" r="80%">
  <stop offset="0%" stop-color="#0a1030"/>
  <stop offset="48%" stop-color="#04060f"/>
  <stop offset="100%" stop-color="#000209"/>
</radialGradient>
<radialGradient id="core" cx="50%" cy="50%" r="50%">
  <stop offset="0%" stop-color="{rgb((150,180,255),0.85)}"/>
  <stop offset="35%" stop-color="{rgb(CYAN,0.35)}"/>
  <stop offset="100%" stop-color="{rgb(INDIGO,0.0)}"/>
</radialGradient>
<filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
</defs>'''
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" role="img">
{defs}
<rect width="{W}" height="{H}" fill="url(#bg)"/>
{shards(rng, 12)}
{accent(kind, cx, cy, rng)}
{neural(cx, cy, out_pts, rng, nodes=12)}
<ellipse cx="{cx}" cy="{cy}" rx="{R0*1.25:.0f}" ry="{R0*1.15:.0f}" fill="url(#core)" filter="url(#soft)" opacity="0.7"/>
{cr}
<circle cx="{cx}" cy="{cy}" r="14" fill="{rgb((180,210,255),0.9)}" filter="url(#soft)"/>
{particles(rng, 44)}
</svg>'''
    (OUT / f"{name}.svg").write_text(svg, encoding="utf-8")
    print(f"  ✓ {name}.svg  ({len(svg)//1024} KB)")

if __name__ == "__main__":
    print("Генерю SVG-арты кейсов:")
    for name, (kind, seed) in CASES.items():
        build(name, kind, seed)
    print("Готово -> assets/img/")
