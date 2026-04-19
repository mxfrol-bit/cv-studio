# CHAOS VISION — AI Studio Website

Многостраничный сайт на чистом HTML/CSS/JS. Готов к деплою на GitHub Pages за 5 минут.

## Структура сайта (28 страниц)

```
chaos-vision/
├── index.html                    ← Главная
├── assets/
│   ├── css/main.css              ← Весь CSS (общий)
│   └── js/
│       ├── main.js               ← Частицы, FAQ, фильтры, анимации
│       └── components.js         ← Nav + Footer (DRY)
├── solutions/
│   ├── index.html                ← Все 9 решений
│   ├── voice-bot.html
│   ├── chatbot.html
│   ├── sales.html
│   ├── analytics.html
│   ├── hr.html
│   ├── docs.html
│   └── ecom.html
├── cases/
│   ├── index.html                ← Маркетплейс с фильтрами
│   ├── retail.html               ← +25% конверсия
│   ├── telephony.html            ← 70% звонков авто
│   ├── b2b.html                  ← +18% сделок
│   ├── logistics.html            ← -90% ручного труда
│   ├── hr.html                   ← ×5 скорость найма
│   ├── ecom.html                 ← +20% маржа
│   ├── fintech.html              ← -30% NPL
│   └── manufacturing.html       ← -40% простоев
├── products/index.html           ← 3 продукта (Автопродажи, TenderHunter, NeuroStaff)
├── pricing/index.html            ← Полный прайс (BASE/PRO/ENTERPRISE + SaaS + поддержка)
├── audit/index.html              ← AI-аудит
├── custom/index.html             ← Форма «Решение под ключ»
├── investors/
│   ├── index.html                ← Инвестпредложение 51.5M
│   ├── roadmap.html              ← 4 фазы / 24 месяца
│   └── market.html               ← Анализ рынка
├── blog/index.html               ← 6 статей
├── faq/index.html                ← 8 вопросов
└── contact/index.html            ← Форма + инвестиционный блок
```

---

## 🚀 Деплой на GitHub Pages — пошаговая инструкция

### Шаг 1. Создать репозиторий на GitHub

1. Зайди на [github.com](https://github.com) → New repository
2. Название: `chaos-vision` (или любое — например `chaosvision-site`)
3. Видимость: **Public** (обязательно для бесплатного Pages)
4. `README` — **не добавлять** (уже есть)
5. Нажми **Create repository**

### Шаг 2. Залить файлы

Открой терминал в папке `chaos-vision/` и выполни:

```bash
git init
git add .
git commit -m "initial: chaos vision website 28 pages"
git branch -M main
git remote add origin https://github.com/ВАШ_ЮЗЕРНЕЙМ/chaos-vision.git
git push -u origin main
```

> Замени `ВАШ_ЮЗЕРНЕЙМ` на свой GitHub username

### Шаг 3. Включить GitHub Pages

1. В репозитории → **Settings** → **Pages** (боковое меню)
2. Source: **Deploy from a branch**
3. Branch: **main** / `/ (root)`
4. Нажми **Save**

### Шаг 4. Готово! 🎉

Сайт будет доступен по адресу:
```
https://ВАШ_ЮЗЕРНЕЙМ.github.io/chaos-vision/
```

Первый деплой занимает 1–3 минуты. Статус можно смотреть в Actions.

---

## 🌐 Подключить свой домен (chaosvision.ai)

### Вариант А — у регистратора DNS

Добавь записи у своего DNS-провайдера:

```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   ВАШ_ЮЗЕРНЕЙМ.github.io
```

### Вариант Б — файл CNAME

Создай файл `CNAME` в корне проекта:

```
chaosvision.ai
```

Затем в Settings → Pages → Custom domain → введи `chaosvision.ai` → Save.

> Распространение DNS: 10 минут — 48 часов

---

## ✏️ Как обновить сайт

```bash
# Отредактировал файл → сохранил → залил:
git add .
git commit -m "update: pricing page"
git push

# GitHub Pages обновится автоматически через 30–60 секунд
```

---

## 🔧 Замена контактов

Найди и замени по всем файлам:

| Что                       | Где менять                    |
|---------------------------|-------------------------------|
| `hello@chaosvision.ai`    | `contact/index.html`, footer  |
| `@chaosvision_ai`         | `contact/index.html`, footer  |
| `invest@chaosvision.ai`   | `contact/index.html`          |
| Нижний Новгород           | footer в `assets/js/components.js` |

Быстрая замена через VS Code: `Ctrl+Shift+H` → Replace in Files

---

## 📊 Google Analytics / Яндекс.Метрика

Добавь в `<head>` файла `assets/js/components.js` после `renderNav`:

```html
<!-- Яндекс.Метрика -->
<script type="text/javascript">
   (function(m,e,t,r,i,k,a){...}) (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "XXXXXX");
</script>
```

Или подключи через Google Tag Manager.

---

## 📬 Подключить реальную форму

Сейчас форма — фронтенд-only (кнопка меняет цвет). Для реальных заявок подключи:

**Вариант 1 — Formspree (бесплатно):**
```html
<form action="https://formspree.io/f/ТВОЙ_ID" method="POST">
```

**Вариант 2 — EmailJS (без бэкенда):**
```javascript
emailjs.send('service_id', 'template_id', formData);
```

**Вариант 3 — Telegram Bot (webhook):**
Добавь `fetch` к своему боту в обработчик `submit-btn`.

---

## 🗂️ Технический стек

- Чистый HTML5 + CSS3 + Vanilla JS
- Никаких зависимостей (кроме Google Fonts)
- Canvas particles на главной
- Scroll reveal через IntersectionObserver
- SPA-like nav через `components.js`
- GitHub Pages совместим из коробки

---

**Chaos Vision Global · Нижний Новгород · 2026**
