#!/usr/bin/env python3
"""
Фирменные UI-макеты кейсов Chaos Vision (SVG, без внешних моделей).
Каждый кейс = чистый интерфейс «продукта» в стиле сайта: тёмная панель,
акценты indigo(#6366f1)->cyan(#22d3ee), моно-подписи. 16:10, 1600x1000.
Запуск: python3 tools/build_case_svgs.py -> assets/img/case-*.svg
"""
import math, random, pathlib, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1600, 1000
BG_A, BG_B = "#070b18", "#04060d"
PANEL, PANEL2, CARD = "#0b1224", "#0e1730", "#0d1428"
LINE, LINE2 = "rgba(255,255,255,0.10)", "rgba(255,255,255,0.055)"
INK, SUB, MUT = "#e9eefb", "#9aa6c2", "#586280"
CY, IN = "#22d3ee", "#6366f1"

def esc(s): return html.escape(str(s), quote=True)

def rrect(x, y, w, h, r=12, fill="none", stroke=None, sw=1.2, op=1.0, extra=""):
    s = f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r:.1f}" fill="{fill}"'
    if stroke: s += f' stroke="{stroke}" stroke-width="{sw:.2f}"'
    if op != 1.0: s += f' opacity="{op:.3f}"'
    if extra: s += " " + extra
    return s + "/>"

def bar(x, y, w, h=10, fill=SUB, op=1.0, r=None):
    if r is None: r = h/2
    return rrect(x, y, w, h, r, fill, op=op)

def txt(x, y, s, size=22, fill=INK, mono=True, weight=500, anchor="start", ls=0.0, op=1.0):
    fam = "'JetBrains Mono',ui-monospace,monospace" if mono else "'Space Grotesk','Inter',system-ui,sans-serif"
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    l = f' letter-spacing="{ls}"' if ls else ""
    o = f' opacity="{op:.3f}"' if op != 1.0 else ""
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{fam}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}"{a}{l}{o}>{esc(s)}</text>')

def dot(x, y, r, fill, op=1.0):
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{fill}" opacity="{op:.3f}"/>'

def line(x1, y1, x2, y2, stroke=LINE, sw=1.2, op=1.0, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
            f'stroke="{stroke}" stroke-width="{sw:.2f}" opacity="{op:.3f}"{d}/>')

def chip(x, y, label, color=CY, fill_op=0.10):
    w = 26 + len(label) * 11.5
    s = rrect(x, y, w, 34, 17, f"rgba(34,211,238,{fill_op})", stroke=color, sw=1.2, op=0.9)
    s += txt(x + w/2, y + 23, label, 15, color, anchor="middle", ls=1.5)
    return s, w

def defs():
    return f'''<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%" stop-color="{BG_A}"/><stop offset="100%" stop-color="{BG_B}"/>
</linearGradient>
<linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0%" stop-color="{IN}"/><stop offset="100%" stop-color="{CY}"/>
</linearGradient>
<radialGradient id="glow" cx="50%" cy="0%" r="90%">
  <stop offset="0%" stop-color="rgba(99,102,241,0.20)"/>
  <stop offset="55%" stop-color="rgba(34,211,238,0.05)"/>
  <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
</radialGradient>
<filter id="soft"><feGaussianBlur stdDeviation="9"/></filter>
<marker id="arw" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
  <path d="M0 0 L6 3 L0 6 Z" fill="{CY}"/>
</marker>
</defs>'''

def frame(inner):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
            f'preserveAspectRatio="xMidYMid slice" role="img">{defs()}'
            f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'
            f'<rect width="{W}" height="{H}" fill="url(#glow)"/>{inner}</svg>')

# ---------- сцены ----------
def scene_voice():
    rng = random.Random(7); s = []
    s.append(txt(70, 78, "CALL CONSOLE", 20, SUB, ls=3))
    s.append(dot(1430, 70, 6, CY)); s.append(txt(1448, 78, "LIVE", 18, CY, ls=2))
    s.append(rrect(70, 120, 1460, 540, 22, PANEL, LINE))
    # контакт
    s.append(dot(170, 230, 40, "url(#grad)"))
    s.append(bar(240, 200, 240, 18, INK)); s.append(bar(240, 236, 150, 11, MUT))
    c, cw = chip(1180, 196, "QUALIFIED", CY); s.append(c)
    s.append(txt(1460, 236, "02:14", 30, INK, anchor="end"))
    # волна
    n = 96; x0, x1 = 130, 1470; cy = 430
    for i in range(n):
        x = x0 + (x1 - x0) * i / (n - 1)
        env = math.sin(i / n * math.pi)
        hgt = (18 + 150 * env * (0.35 + 0.65 * rng.random()))
        col = CY if i % 3 else IN
        s.append(rrect(x, cy - hgt/2, 6, hgt, 3, col, op=0.30 + 0.55*env))
    # кнопки
    s.append(rrect(130, 560, 200, 60, 14, "url(#grad)")); s.append(txt(230, 598, "ОТВЕТ", 18, "#04060d", anchor="middle", weight=600))
    s.append(rrect(350, 560, 200, 60, 14, "rgba(255,255,255,0.04)", LINE)); s.append(txt(450, 598, "ЗАМЕТКА", 16, SUB, anchor="middle"))
    # транскрипт
    s.append(rrect(70, 700, 1460, 230, 22, PANEL2, LINE2))
    for i in range(3):
        y = 752 + i*54
        s.append(dot(110, y-6, 7, CY if i % 2 else IN))
        s.append(bar(140, y-14, 110, 12, SUB, op=.8))
        s.append(bar(270, y-14, 900 + (i*60 % 300), 12, "rgba(255,255,255,0.13)"))
    return frame("\n".join(s))

def scene_content():
    rng = random.Random(21); s = []
    s.append(txt(70, 78, "CONTENT STUDIO", 20, SUB, ls=3))
    c, cw = chip(1170, 52, "23 PUBLISHED", CY); s.append(c)
    s.append(rrect(1330, 50, 200, 40, 12, "url(#grad)")); s.append(txt(1430, 76, "+ GENERATE", 16, "#04060d", anchor="middle", weight=600))
    cols, rows = 3, 2; gx, gy = 70, 130; gw, gh = 1460, 800; gap = 34
    cw_ = (gw - gap*(cols-1))/cols; ch_ = (gh - gap*(rows-1))/rows
    for r in range(rows):
        for col in range(cols):
            idx = r*cols + col
            x = gx + col*(cw_+gap); y = gy + r*(ch_+gap)
            active = (idx == 1)
            s.append(rrect(x, y, cw_, ch_, 18, CARD, CY if active else LINE, sw=1.6 if active else 1.2))
            # превью-картинка
            s.append(rrect(x+22, y+22, cw_-44, ch_*0.5, 12, "rgba(99,102,241,0.16)", LINE2))
            s.append(dot(x+cw_/2, y+22+ch_*0.25, 22, "url(#grad)", 0.5))
            # заголовок-бары
            s.append(bar(x+22, y+ch_*0.5+40, cw_-80, 13, INK, op=.85))
            s.append(bar(x+22, y+ch_*0.5+66, cw_-150, 11, SUB, op=.6))
            # чип + дата
            cc, ccw = chip(x+22, y+ch_-58, "SEO", CY, 0.12); s.append(cc)
            s.append(bar(x+cw_-120, y+ch_-46, 90, 10, MUT, op=.7))
            if active:
                s.append(bar(x+22, y+ch_-92, cw_-44, 6, "rgba(255,255,255,0.06)"))
                s.append(bar(x+22, y+ch_-92, (cw_-44)*0.62, 6, "url(#grad)"))
    return frame("\n".join(s))

def scene_rag():
    s = []
    s.append(rrect(70, 70, 1460, 70, 16, PANEL, LINE))
    s.append(f'<circle cx="118" cy="105" r="13" fill="none" stroke="{CY}" stroke-width="2.4"/>')
    s.append(line(128, 115, 140, 127, CY, 2.4))
    s.append(txt(160, 113, "тендеры · строительство · 44-ФЗ", 19, SUB))
    c, cw = chip(1390, 88, "AI MATCH", CY); s.append(c)
    # заголовки
    s.append(txt(90, 200, "ЗАКУПКА", 16, MUT, ls=2))
    s.append(txt(980, 200, "РЕЛЕВАНТНОСТЬ", 16, MUT, ls=2))
    s.append(txt(1380, 200, "СТАТУС", 16, MUT, ls=2))
    s.append(line(70, 220, 1530, 220, LINE2, 1))
    rels = [94, 88, 71, 63, 41, 28]; match = [True, True, False, False, False, False]
    for i, rel in enumerate(rels):
        y = 250 + i*108
        if match[i]:
            s.append(rrect(70, y, 1460, 88, 14, "rgba(34,211,238,0.06)", "rgba(34,211,238,0.35)"))
            s.append(rrect(70, y, 6, 88, 3, CY))
        else:
            s.append(line(70, y+88, 1530, y+88, LINE2, 1))
        s.append(bar(100, y+34, 520, 14, INK, op=.85))
        s.append(bar(100, y+60, 360, 10, MUT, op=.6))
        # шкала
        s.append(rrect(980, y+38, 280, 10, 5, "rgba(255,255,255,0.07)"))
        s.append(rrect(980, y+38, 280*rel/100, 10, 5, "url(#grad)"))
        s.append(txt(1290, y+50, f"{rel}%", 20, CY if match[i] else SUB, anchor="start"))
        if match[i]:
            cc, ccw = chip(1380, y+26, "MATCH", CY); s.append(cc)
        else:
            s.append(txt(1380, y+50, "—", 20, MUT))
    return frame("\n".join(s))

def scene_assistant():
    rng = random.Random(77); s = []
    # дайджест
    s.append(rrect(70, 90, 690, 820, 22, PANEL, LINE))
    s.append(txt(110, 160, "DAILY DIGEST", 22, INK, ls=2, weight=600))
    c, cw = chip(560, 132, "LOCAL", CY); s.append(c)
    s.append(f'<path d="M650 138 v-8 a8 8 0 0 1 16 0 v8" fill="none" stroke="{CY}" stroke-width="2"/>')
    for i in range(5):
        y = 240 + i*84
        s.append(dot(120, y, 6, CY if i % 2 else IN))
        s.append(bar(150, y-9, 540 - (i*40 % 200), 13, INK, op=.8))
        s.append(bar(150, y+14, 420 - (i*55 % 180), 10, SUB, op=.5))
    s.append(line(110, 700, 720, 700, LINE2, 1))
    for i in range(2):
        y = 750 + i*64
        s.append(rrect(110, y-22, 26, 26, 6, "none", CY, 1.6))
        s.append(line(116, y-9, 123, y-2, CY, 2)); s.append(line(123, y-2, 132, y-16, CY, 2))
        s.append(bar(156, y-13, 460, 12, SUB, op=.7))
    # чат
    s.append(rrect(800, 90, 730, 820, 22, PANEL2, LINE2))
    s.append(dot(840, 138, 6, CY)); s.append(txt(858, 145, "ON-DEVICE", 16, CY, ls=2))
    msgs = [("a", 380), ("u", 300), ("a", 460), ("u", 240)]
    y = 220
    for who, w in msgs:
        h = 86
        if who == "u":
            x = 1490 - w
            s.append(rrect(x, y, w, h, 18, "url(#grad)"))
            s.append(bar(x+24, y+30, w-70, 11, "rgba(255,255,255,0.85)", r=5))
            s.append(bar(x+24, y+52, w-120, 10, "rgba(255,255,255,0.55)", r=5))
        else:
            x = 840
            s.append(rrect(x, y, w, h, 18, "rgba(255,255,255,0.05)", LINE2))
            s.append(bar(x+24, y+30, w-70, 11, INK, op=.8, r=5))
            s.append(bar(x+24, y+52, w-130, 10, SUB, op=.6, r=5))
        y += h + 34
    s.append(rrect(840, y+6, 650, 64, 18, "rgba(255,255,255,0.04)", LINE2))
    s.append(txt(870, y+44, "Спросить по внутренним данным…", 17, MUT))
    return frame("\n".join(s))

def scene_web():
    s = []
    s.append(rrect(70, 90, 1460, 820, 22, PANEL, LINE))
    s.append(rrect(70, 90, 1460, 64, 22, "rgba(255,255,255,0.03)"))
    for i in range(3):
        s.append(dot(118 + i*34, 122, 8, "rgba(255,255,255,0.18)"))
    s.append(rrect(520, 104, 560, 36, 18, "rgba(255,255,255,0.05)", LINE2))
    s.append(f'<circle cx="552" cy="122" r="7" fill="none" stroke="{CY}" stroke-width="1.6"/>')
    s.append(txt(800, 130, "chaosvision.ai", 17, SUB, anchor="middle"))
    # вьюпорт
    vx, vy = 110, 190
    s.append(dot(vx+22, vy+22, 14, "url(#grad)"))
    s.append(bar(vx+48, vy+15, 120, 14, INK, op=.85))
    for i in range(4):
        s.append(bar(vx+760 + i*110, vy+17, 70, 10, SUB, op=.6))
    s.append(rrect(vx+1180, vy+2, 150, 40, 20, "url(#grad)"))
    # герой
    s.append(bar(vx, vy+130, 620, 34, INK, op=.92, r=10))
    s.append(bar(vx, vy+180, 500, 34, INK, op=.92, r=10))
    s.append(bar(vx, vy+250, 460, 14, SUB, op=.6))
    s.append(bar(vx, vy+278, 380, 14, SUB, op=.6))
    s.append(rrect(vx, vy+330, 210, 58, 14, "url(#grad)")); s.append(txt(vx+105, vy+368, "ОБСУДИТЬ", 17, "#04060d", anchor="middle", weight=600))
    s.append(rrect(vx+230, vy+330, 190, 58, 14, "none", LINE))
    # герой-графика
    s.append(rrect(vx+760, vy+120, 560, 290, 18, "rgba(99,102,241,0.12)", LINE2))
    s.append(dot(vx+1040, vy+265, 70, "url(#grad)", 0.55))
    s.append(dot(vx+1040, vy+265, 70, "none"))
    # фичи
    fy = vy+470
    for i in range(3):
        fx = vx + i*460
        s.append(rrect(fx, fy, 420, 150, 16, "rgba(255,255,255,0.03)", LINE2))
        s.append(rrect(fx+28, fy+30, 40, 40, 10, "none", CY, 1.8))
        s.append(bar(fx+28, fy+92, 250, 13, INK, op=.8))
        s.append(bar(fx+28, fy+116, 180, 10, SUB, op=.55))
    return frame("\n".join(s))

def scene_agents():
    s = []
    s.append(txt(70, 78, "AGENT ORCHESTRATION · MCP", 20, SUB, ls=3))
    nodes = {
        "trigger": (150, 430, "ТРИГГЕР", IN, False),
        "agent":   (560, 430, "AGENT", CY, True),
        "tool":    (1000, 250, "TOOL", IN, False),
        "db":      (1000, 610, "DATA", IN, False),
        "out":     (1390, 430, "ВЫХОД", CY, False),
    }
    NW, NH = 230, 104
    def center(n): x, y, *_ = nodes[n]; return (x+NW/2, y+NH/2)
    def wire(a, b):
        ax, ay = center(a); bx, by = center(b)
        ax += NW/2; bx -= NW/2
        mx = (ax+bx)/2
        return (f'<path d="M{ax:.0f} {ay:.0f} C {mx:.0f} {ay:.0f}, {mx:.0f} {by:.0f}, {bx-8:.0f} {by:.0f}" '
                f'fill="none" stroke="{CY}" stroke-width="2.2" opacity="0.7" marker-end="url(#arw)"/>')
    for a, b in [("trigger","agent"),("agent","tool"),("agent","db"),("tool","out"),("db","out")]:
        s.append(wire(a, b))
    for key, (x, y, label, col, active) in nodes.items():
        if active:
            s.append(rrect(x-6, y-6, NW+12, NH+12, 20, "none", "rgba(34,211,238,0.25)", 2))
        s.append(rrect(x, y, NW, NH, 16, PANEL, col if active else LINE, 1.8 if active else 1.2))
        s.append(rrect(x+22, y+30, 44, 44, 11, "none", col, 1.8))
        s.append(dot(x+44, y+52, 7, col, .9))
        s.append(txt(x+86, y+48, label, 18, INK, ls=1.5, weight=600))
        s.append(bar(x+86, y+64, 96, 9, SUB, op=.55))
        if active:
            s.append(dot(x+NW-22, y+24, 6, CY))
    # частицы
    rng = random.Random(256)
    for _ in range(26):
        s.append(dot(rng.uniform(0,W), rng.uniform(0,H), rng.uniform(1,2.4),
                     CY if rng.random()>.5 else IN, rng.uniform(.12,.4)))
    return frame("\n".join(s))

SCENES = {
    "case-voice": scene_voice,
    "case-content": scene_content,
    "case-rag": scene_rag,
    "case-assistant": scene_assistant,
    "case-web": scene_web,
    "case-agents": scene_agents,
}

if __name__ == "__main__":
    print("Генерю UI-макеты кейсов:")
    for name, fn in SCENES.items():
        (OUT / f"{name}.svg").write_text(fn(), encoding="utf-8")
        print(f"  ✓ {name}.svg")
    print("Готово -> assets/img/")
