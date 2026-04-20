# CHAOS VISION — AI Studio Website

**chaosvision.ai** · 34 HTML-страницы · GitHub Pages · Автодеплой

---

## ⚡ Быстрый старт — 5 команд

```bash
# ВАЖНО: выполняй ВНУТРИ папки chaos-vision/ (там где лежит index.html)
cd /путь/до/chaos-vision

git init
git add .
git commit -m "feat: chaos vision website"
git branch -M main
git remote add origin https://github.com/USERNAME/chaos-vision.git
git push -u origin main
```

---

## 🌐 GitHub Pages

После пуша → **Settings → Pages → Source: GitHub Actions** → Save  
Сайт: `https://USERNAME.github.io/chaos-vision/`

---

## 🔗 Домен chaosvision.ai

DNS у регистратора:
```
A    @    185.199.108.153
A    @    185.199.109.153
A    @    185.199.110.153
A    @    185.199.111.153
CNAME www USERNAME.github.io
```

Settings → Pages → Custom domain → `chaosvision.ai` → Save  
Файл CNAME уже в репозитории.

---

## 📁 Структура

```
chaos-vision/              ← КОРЕНЬ РЕПОЗИТОРИЯ
├── .github/workflows/     ← автодеплой
├── assets/css/main.css    ← единый CSS
├── assets/js/main.js      ← анимации, логика
├── assets/js/components.js← Nav + Footer
├── solutions/             ← 8 страниц
├── cases/                 ← 9 страниц
├── blog/posts/            ← 6 статей
├── products/
├── pricing/
├── audit/
├── custom/
├── investors/             ← 3 страницы
├── faq/
├── contact/
├── index.html             ← ГЛАВНАЯ
├── sitemap.xml
├── robots.txt
└── CNAME
```

## 🔄 Обновить сайт

```bash
git add . && git commit -m "update" && git push
# Деплой за 30-60 секунд автоматически
```
