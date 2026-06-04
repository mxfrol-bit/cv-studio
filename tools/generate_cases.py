#!/usr/bin/env python3
"""
Генерация картинок кейсов для Chaos Vision в едином фирменном стиле.

Модель: OpenAI gpt-image-1 (самая мощная актуальная image-модель).
Размер: 1536x1024 (landscape, близко к 16:10 у карточек кейса).
Стиль: тёмный near-black фон, фирменный градиент indigo→cyan,
гранёный кристалл / low-poly / нейросетевая графика, без текста и логотипов.

ЗАПУСК:
  1) положи ключ:  export OPENAI_API_KEY="sk-..."
     (или в файл .env в корне проекта строкой OPENAI_API_KEY=sk-...)
  2) pip install --quiet openai
  3) python3 tools/generate_cases.py
Картинки перезапишут assets/img/case-*.jpg
"""
import os, base64, sys, pathlib

# --- ключ: из окружения или из .env в корне ---
ROOT = pathlib.Path(__file__).resolve().parent.parent
def load_key():
    k = os.environ.get("OPENAI_API_KEY")
    if k:
        return k
    envf = ROOT / ".env"
    if envf.exists():
        for line in envf.read_text().splitlines():
            if line.strip().startswith("OPENAI_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None

API_KEY = load_key()
if not API_KEY:
    sys.exit("Нет OPENAI_API_KEY. Сделай: export OPENAI_API_KEY=... или добавь в .env")

try:
    from openai import OpenAI
except ImportError:
    sys.exit("Нет пакета openai. Установи: pip install openai")

client = OpenAI(api_key=API_KEY)

OUT = ROOT / "assets" / "img"
OUT.mkdir(parents=True, exist_ok=True)

# Единый стилевой каркас — приклеивается к каждому промпту, чтобы кадры
# смотрелись как одна серия.
STYLE = (
    "Abstract premium tech illustration, dark near-black background (#000209), "
    "deep indigo to cyan brand gradient (#6366f1 to #22d3ee), faceted crystal and "
    "low-poly geometry, glowing thin neural lines and particles, volumetric depth, "
    "cinematic studio lighting, subtle film grain, high detail, no text, no words, "
    "no logos, no people faces, editorial, minimal, expensive feeling. "
    "Landscape composition with negative space."
)

CASES = {
    "case-voice":     "A glowing crystalline soundwave forming from particles, voice signal turning into "
                      "geometric facets, abstract telephony and conversation energy.",
    "case-content":   "A faceted content engine: floating geometric document panels and image tiles "
                      "emerging from a glowing crystal core, generative publishing flow.",
    "case-rag":       "An abstract knowledge retrieval network: documents and data nodes connected by "
                      "glowing lines into a faceted crystal brain, search beams highlighting relevant shards.",
    "case-assistant": "A private local-AI core: a contained glowing crystal inside a faceted protective "
                      "shell, secure data orbiting inside a closed loop, calm and confidential.",
    "case-web":       "A premium abstract web architecture: clean geometric grid panels and wireframe planes "
                      "assembling into a faceted crystal structure, fast and minimal.",
    "case-agents":    "Multiple glowing crystal agents arranged as a coordinated swarm, connected by "
                      "energy lines, orchestrated geometric nodes working as a team.",
}

def main():
    total = len(CASES)
    for i, (name, concept) in enumerate(CASES.items(), 1):
        prompt = f"{concept} {STYLE}"
        print(f"[{i}/{total}] генерю {name} ...", flush=True)
        try:
            resp = client.images.generate(
                model="gpt-image-1",
                prompt=prompt,
                size="1536x1024",
                quality="high",
                n=1,
            )
            b64 = resp.data[0].b64_json
            (OUT / f"{name}.jpg").write_bytes(base64.b64decode(b64))
            print(f"      ✓ {name}.jpg сохранён", flush=True)
        except Exception as e:
            print(f"      ✗ {name}: {e}", flush=True)
    print("Готово. Файлы в assets/img/")

if __name__ == "__main__":
    main()
