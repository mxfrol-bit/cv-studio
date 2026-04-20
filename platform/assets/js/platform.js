/* ── NAV ── */
window.addEventListener('scroll', () => {
  document.querySelector('nav')?.classList.toggle('scrolled', window.scrollY > 40);
});

/* ── PARTICLES ── */
function initParticles(id) {
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext('2d');
  let W, H, pts = [];
  const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
  resize(); window.addEventListener('resize', resize);
  for (let i = 0; i < 90; i++) pts.push({
    x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
    r: Math.random() * 1.2 + .3, dx: (Math.random() - .5) * .2, dy: (Math.random() - .5) * .2, a: Math.random() * .55 + .08
  });
  (function draw() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124,111,255,${p.a})`; ctx.fill();
    });
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < 90) { ctx.beginPath(); ctx.strokeStyle = `rgba(124,111,255,${.09 * (1 - d / 90)})`; ctx.lineWidth = .5; ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
    }
    requestAnimationFrame(draw);
  })();
}
initParticles('particles');

/* ── SCROLL REVEAL ── */
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

/* ── DEMO ENGINE ── */
// API endpoint — точка проксирования. В dev можно использовать прямой Anthropic API.
// В проде: Railway FastAPI proxy по адресу API_BASE
const API_BASE = window.CV_API_BASE || 'https://cv-platform-api.up.railway.app';

async function runDemo({ prompt, onStart, onResult, onError }) {
  onStart?.();
  try {
    // Попытка через proxy
    let text = '';
    try {
      const r = await fetch(`${API_BASE}/api/demo`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: AbortSignal.timeout(30000)
      });
      const d = await r.json();
      text = d.result || d.content || '';
      if (!text && d.detail) throw new Error(d.detail);
    } catch (proxyErr) {
      // Fallback: прямой вызов (работает в dev/localhost)
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
        signal: AbortSignal.timeout(30000)
      });
      const d = await r.json();
      text = d.content?.map(b => b.text || '').join('') || '';
      if (!text) throw new Error(d.error?.message || 'Пустой ответ');
    }
    onResult?.(text);
  } catch (e) {
    onError?.(e.message || 'Ошибка запроса');
  }
}

// Render markdown-like bold
function renderResult(text, container) {
  container.innerHTML = '';
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  parts.forEach(seg => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      const s = document.createElement('strong');
      s.textContent = seg.slice(2, -2);
      s.style.color = container.dataset.color || '#7C6FFF';
      container.appendChild(s);
    } else {
      container.appendChild(document.createTextNode(seg));
    }
  });
}

/* ── DEMO INIT (called from each demo page) ── */
function initDemoPage({ color, inputId, btnId, outputId, placeholderId, spinId, actionsId, promptFn }) {
  const inputEl = document.getElementById(inputId);
  const btnEl = document.getElementById(btnId);
  const outputEl = document.getElementById(outputId);
  const placeholderEl = document.getElementById(placeholderId);
  const spinEl = document.getElementById(spinId);
  const actionsEl = document.getElementById(actionsId);

  if (!btnEl || !inputEl) return;

  // Set focus border color
  inputEl.addEventListener('focus', () => inputEl.style.borderColor = color);
  inputEl.addEventListener('blur', () => inputEl.style.borderColor = '');

  // Set spinner border color
  if (spinEl) spinEl.style.borderTopColor = color;

  // Set result container data attribute
  if (outputEl) outputEl.dataset.color = color;

  let lastResult = '';

  btnEl.addEventListener('click', async () => {
    const val = inputEl.value.trim();
    if (!val) return;

    await runDemo({
      prompt: promptFn(val),
      onStart: () => {
        btnEl.disabled = true;
        btnEl.textContent = 'Анализирую...';
        if (placeholderEl) placeholderEl.style.display = 'none';
        if (spinEl) spinEl.style.display = 'block';
        if (outputEl) outputEl.style.display = 'none';
        if (actionsEl) actionsEl.style.display = 'none';
      },
      onResult: (text) => {
        lastResult = text;
        btnEl.disabled = false;
        btnEl.textContent = 'Запустить снова →';
        if (spinEl) spinEl.style.display = 'none';
        if (outputEl) { outputEl.style.display = 'block'; renderResult(text, outputEl); }
        if (actionsEl) actionsEl.style.display = 'flex';
        // scroll to result on mobile
        outputEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      },
      onError: (msg) => {
        btnEl.disabled = false;
        btnEl.textContent = 'Попробовать снова →';
        if (spinEl) spinEl.style.display = 'none';
        if (outputEl) {
          outputEl.style.display = 'block';
          outputEl.innerHTML = `<div class="error-box">Ошибка: ${msg}</div>`;
        }
      }
    });
  });

  // Copy button
  document.getElementById('btn-copy')?.addEventListener('click', function () {
    navigator.clipboard?.writeText(lastResult);
    this.textContent = 'Скопировано ✓';
    this.classList.add('copy-ok');
    setTimeout(() => { this.textContent = 'Скопировать'; this.classList.remove('copy-ok'); }, 2000);
  });

  // Reset button
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    if (outputEl) { outputEl.style.display = 'none'; outputEl.innerHTML = ''; }
    if (placeholderEl) placeholderEl.style.display = 'flex';
    if (actionsEl) actionsEl.style.display = 'none';
    btnEl.textContent = 'Запустить AI-анализ →';
    lastResult = '';
  });
}

/* ── LEAD FORM ── */
document.querySelectorAll('.lead-form').forEach(form => {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('.lead-btn');
    const data = Object.fromEntries(new FormData(form));
    btn.textContent = 'Отправляем...';
    btn.disabled = true;
    // Send to backend
    try {
      await fetch(`${API_BASE}/api/lead`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, source: window.location.pathname, timestamp: new Date().toISOString() })
      });
    } catch (_) {}
    // Show success regardless
    form.innerHTML = '<div class="lead-success">✓ Заявка отправлена. Свяжемся в течение 4 часов.</div>';
  });
});
