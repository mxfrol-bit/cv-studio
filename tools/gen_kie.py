#!/usr/bin/env python3
"""
Генерация картинок кейсов через kie.ai GPT-4o Image API.
Ключ читается из ~/cv-studio/.env (строка KIE=...). В чат ключ не печатается.

Запуск:
  python3 tools/gen_kie.py test            # один тест → assets/img/_test_kie.jpg
  python3 tools/gen_kie.py all             # все 6 → assets/img/case-*.jpg (перезапись!)
  python3 tools/gen_kie.py case-voice      # конкретный кейс
"""
import os, sys, json, time, pathlib, urllib.request, urllib.error

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img"

def load_key():
    envf = ROOT / ".env"
    if envf.exists():
        for line in envf.read_text().splitlines():
            if line.strip().startswith("KIE="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return os.environ.get("KIE")

KEY = load_key()
if not KEY:
    sys.exit("Нет ключа KIE (ожидаю ~/cv-studio/.env строкой KIE=...)")

BASE = "https://api.kie.ai/api/v1/gpt4o-image"
HDR = {"Authorization": "Bearer " + KEY, "Content-Type": "application/json"}

def post(url, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=HDR, method="POST")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def get(url):
    req = urllib.request.Request(url, headers=HDR, method="GET")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

STYLE = (" Premium abstract tech art, near-black background #000209, deep indigo-to-cyan "
         "(#6366f1 to #22d3ee) palette, faceted crystal / low-poly geometry, glowing thin "
         "neural lines and particles, cinematic volumetric light, subtle grain, high detail, "
         "minimal, expensive, NO text, no words, no logos, no human faces.")

CASES = {
    "case-voice":     "A glowing crystalline soundwave forming from particles — a voice signal turning into geometric facets." + STYLE,
    "case-content":   "A faceted content engine: floating geometric article panels and image tiles emerging from a glowing crystal core." + STYLE,
    "case-rag":       "An abstract knowledge-retrieval network: documents and data nodes linked by glowing lines into a faceted crystal brain." + STYLE,
    "case-assistant": "A private local-AI core: a contained glowing crystal inside a faceted protective shell, secure data orbiting in a closed loop." + STYLE,
    "case-web":       "A premium abstract web architecture: clean geometric wireframe panels assembling into a faceted crystal structure." + STYLE,
    "case-agents":    "Multiple glowing crystal agents arranged as a coordinated swarm, connected by energy lines, orchestrated nodes working as a team." + STYLE,
}

def generate(prompt, out_path, size="3:2"):
    print(f"  → createTask ({out_path.name}) …", flush=True)
    r = post(BASE + "/generate", {"prompt": prompt, "size": size, "isEnhance": False})
    if r.get("code") != 200:
        raise RuntimeError("generate failed: " + json.dumps(r)[:200])
    task = r["data"]["taskId"]
    print(f"    taskId={task}, polling…", flush=True)
    for i in range(60):
        time.sleep(5)
        d = get(BASE + "/record-info?taskId=" + task).get("data", {})
        st = d.get("status")
        if st == "SUCCESS":
            urls = (d.get("response") or {}).get("resultUrls") or []
            if not urls:
                raise RuntimeError("no resultUrls")
            dl = urllib.request.Request(urls[0], headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"})
            with urllib.request.urlopen(dl, timeout=60) as resp, open(out_path, "wb") as f:
                f.write(resp.read())
            print(f"    ✓ saved {out_path}", flush=True)
            return
        if st in ("FAIL", "FAILED", "ERROR") or d.get("successFlag") == 0 and d.get("errorMessage"):
            raise RuntimeError("task failed: " + str(d.get("errorMessage")))
        print(f"    … {st} {d.get('progress','')}", flush=True)
    raise RuntimeError("timeout waiting for task")

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    arg = sys.argv[1] if len(sys.argv) > 1 else "test"
    if arg == "test":
        generate(CASES["case-voice"], OUT / "_test_kie.jpg")
    elif arg == "all":
        for name, prompt in CASES.items():
            generate(prompt, OUT / (name + ".jpg"))
    elif arg in CASES:
        generate(CASES[arg], OUT / (arg + ".jpg"))
    else:
        sys.exit("usage: gen_kie.py [test|all|<case-name>]")
    print("done")

if __name__ == "__main__":
    main()
