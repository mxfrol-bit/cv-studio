/* Chaos Vision — interactions */
(function () {
  'use strict';

  /* ---------- burger / mobile nav ---------- */
  function initNav() {
    var burger = document.querySelector('.burger');
    var nav = document.querySelector('.nav');
    if (!burger || !nav) return;

    var overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    function open() {
      nav.classList.add('is-open');
      burger.classList.add('is-open');
      document.body.classList.add('nav-open');
      burger.setAttribute('aria-expanded', 'true');
    }
    function close() {
      nav.classList.remove('is-open');
      burger.classList.remove('is-open');
      document.body.classList.remove('nav-open');
      burger.setAttribute('aria-expanded', 'false');
    }
    function toggle() {
      if (nav.classList.contains('is-open')) close(); else open();
    }

    burger.addEventListener('click', toggle);
    overlay.addEventListener('click', close);
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ---------- reveal on scroll (blocks materialise; headings assemble word-by-word) ---------- */
  function splitWords(el) {
    // only split plain-text headings (no nested markup) so gradient spans stay intact
    if (el.getAttribute('data-split') === 'done') return;
    for (var n = 0; n < el.childNodes.length; n++) {
      if (el.childNodes[n].nodeType !== 3) return; // has element children → skip
    }
    var words = el.textContent.split(/(\s+)/);
    var frag = document.createDocumentFragment();
    var idx = 0;
    words.forEach(function (word) {
      if (word.trim() === '') { frag.appendChild(document.createTextNode(word)); return; }
      var wrap = document.createElement('span');
      wrap.className = 'rw';
      var inner = document.createElement('i');
      inner.textContent = word;
      inner.style.setProperty('--rwd', (idx * 55) + 'ms');
      wrap.appendChild(inner);
      frag.appendChild(wrap);
      idx++;
    });
    el.textContent = '';
    el.appendChild(frag);
    el.setAttribute('data-split', 'done');
  }

  function initReveal() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // pre-split eligible headings (the block itself, or a heading inside it)
    if (!reduce) {
      els.forEach(function (el) {
        if (el.tagName === 'H1' || el.tagName === 'H2') {
          splitWords(el);
        } else {
          var head = el.querySelector('h1, h2');
          if (head) splitWords(head);
        }
      });
    }

    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var delay = el.getAttribute('data-delay') || 0;
          setTimeout(function () { el.classList.add('in'); }, delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- header shadow on scroll ---------- */
  function initHeader() {
    var header = document.querySelector('.header');
    if (!header) return;
    function onScroll() {
      if (window.scrollY > 8) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- contact form (no backend — открывает Telegram) ---------- */
  function initForm() {
    var form = document.querySelector('[data-tg-form]');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.querySelector('[name="name"]') || {}).value || '';
      var task = (form.querySelector('[name="task"]') || {}).value || '';
      var tg = form.getAttribute('data-tg') || 'https://t.me/chaosvision_ai';
      var text = encodeURIComponent('Здравствуйте! Меня зовут ' + name + '. Задача: ' + task);
      window.open(tg + '?text=' + text, '_blank');
    });
  }

  /* ===========================================================
     NEURAL MONOLITH — many inputs branching and converging into
     one structure (a progressive neural network). Particles
     assemble onto its nodes + connections, hold, scatter into a
     halo cloud, reassemble. Time-driven (never scroll-coupled),
     gentle cursor repulsion. On-theme for an AI studio.
     =========================================================== */
  function setupNeural(canvas, reduce) {
    var ctx = canvas.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, cx = 0, cy = 0, R = 0, raf = null, visible = true, last = 0, built = false;
    var rotY = 0, TC = 0.9131, TS = 0.4078;          // fixed ~24° tilt
    var mxp = -1e5, myp = -1e5;
    var targets = [], parts = [], BASE = 0, nodes = [], edges = [];
    var CORE = '#ff7a3d';                            // brand-orange converged core

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function smooth(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }
    var asm = 1, ASM_PERIOD = 11000;
    function asmAt(tm) {
      var p = tm % ASM_PERIOD;
      if (p < 4200) return 1;
      p -= 4200; if (p < 2600) return 1 - smooth(p / 2600);
      p -= 2600; if (p < 1600) return 0;
      p -= 1600; return smooth(p / 2600);
    }

    function buildTargets() {
      nodes = []; edges = []; targets = [];
      var mobile = w < 760, i, k;
      var counts = mobile ? [22, 15, 9, 5, 2, 1] : [34, 24, 16, 10, 5, 1];
      var L = counts.length, golden = Math.PI * (3 - Math.sqrt(5)), layerStart = [];
      for (var li = 0; li < L; li++) {
        layerStart[li] = nodes.length;
        var z = -1.15 + 2.3 * li / (L - 1);
        var rad = 1.12 - 1.0 * (li / (L - 1));        // funnel: wide inputs → tight core
        var nc = counts[li];
        for (k = 0; k < nc; k++) {
          var ang = golden * k + li * 0.7, rr = rad * Math.sqrt((k + 0.5) / nc);
          nodes.push({ x: Math.cos(ang) * rr, y: Math.sin(ang) * rr, z: z, last: li === L - 1 });
        }
      }
      // edges: each node branches to its 2 nearest in the next layer
      for (li = 0; li < L - 1; li++) {
        var a0 = layerStart[li], a1 = layerStart[li + 1], b1 = (li + 2 < L ? layerStart[li + 2] : nodes.length);
        for (var ai = a0; ai < a1; ai++) {
          var best = [];
          for (var bi = a1; bi < b1; bi++) {
            var dx = nodes[ai].x - nodes[bi].x, dy = nodes[ai].y - nodes[bi].y;
            best.push([dx * dx + dy * dy, bi]);
          }
          best.sort(function (p, q) { return p[0] - q[0]; });
          for (var e = 0; e < Math.min(2, best.length); e++) edges.push([ai, best[e][1]]);
        }
      }
      // particle targets: the nodes themselves + points strung along every edge
      for (i = 0; i < nodes.length; i++) {
        var nn = nodes[i];
        targets.push({ x: nn.x, y: nn.y, z: nn.z, a0: 0.28, a1: 0.55, node: 1, col: nn.last ? CORE : null });
      }
      var SEG = mobile ? 3 : 4;
      for (i = 0; i < edges.length; i++) {
        var A = nodes[edges[i][0]], B = nodes[edges[i][1]];
        for (var sg = 1; sg <= SEG; sg++) {
          var tt = sg / (SEG + 1);
          targets.push({ x: A.x + (B.x - A.x) * tt, y: A.y + (B.y - A.y) * tt, z: A.z + (B.z - A.z) * tt, a0: 0.05, a1: 0.22, node: 0, col: null });
        }
      }
      BASE = targets.length;
    }
    function build() {
      var rect = canvas.getBoundingClientRect(); w = rect.width; h = rect.height;
      if (!w || !h) return;
      canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = w * 0.5; cy = h * 0.46; R = 0.20 * Math.min(w * 0.9, h);
      buildTargets();
      var dust = Math.round(w * h / 17000), total = BASE + dust, prev = parts, i;
      parts = [];
      for (i = 0; i < total; i++) {
        var p = prev[i];
        var ang = Math.random() * 6.2832, rad = R * (1.7 + Math.random() * 2.3);
        parts.push({ x: p ? p.x : rnd(0, w), y: p ? p.y : rnd(0, h), vx: 0, vy: 0,
                     ph: Math.random() * 6.2832, bx: rnd(0, w), by: rnd(0, h),
                     sax: cx + Math.cos(ang) * rad, say: cy + Math.sin(ang) * rad * 0.85,
                     o: Math.random() * 0.32 });
      }
      built = true;
    }
    function project(p) {
      var c = Math.cos(rotY), s = Math.sin(rotY);
      var rx = p.x * c + p.z * s, rz = -p.x * s + p.z * c, ry = p.y;
      var sy = TC * ry - TS * rz, dz = TS * ry + TC * rz;
      return [cx + rx * R, cy - sy * R, dz];
    }
    var ci = 0;
    function place(sx, sy, alpha, size, col) {
      var a = parts[ci++]; if (!a) return;
      var gp = smooth(asm * 1.32 - a.o);
      var txx = a.sax + (sx - a.sax) * gp, txy = a.say + (sy - a.say) * gp;
      var ox = (txx - a.x) * 0.014, oy = (txy - a.y) * 0.014;
      var ux = a.x - mxp, uy = a.y - myp, d2 = ux * ux + uy * uy;
      if (d2 < 16900) { var d = Math.sqrt(d2) || 1, f = (130 - d) / 130 * 4.0; ox += ux / d * f; oy += uy / d * f; }
      a.vx = (a.vx + ox) * 0.91; a.vy = (a.vy + oy) * 0.91; a.x += a.vx; a.y += a.vy;
      if (col) { ctx.fillStyle = col; } else if (ctx.fillStyle !== '#ece7d8') ctx.fillStyle = '#ece7d8';
      ctx.globalAlpha = alpha * (0.45 + 0.55 * gp);
      ctx.fillRect(a.x, a.y, size, size);
    }
    function draw(t) {
      if (!built) return;
      ctx.clearRect(0, 0, w, h);
      if (!reduce) { rotY += 0.0038; asm = asmAt(t); }
      var gAll = smooth(asm), i, P, dep;
      // connections (branches) — faint, fade with the assembly
      if (gAll > 0.04) {
        ctx.lineWidth = 1;
        for (i = 0; i < edges.length; i++) {
          var PA = project(nodes[edges[i][0]]), PB = project(nodes[edges[i][1]]);
          dep = ((PA[2] + PB[2]) * 0.5 / 1.4 + 1) / 2;
          ctx.strokeStyle = 'rgba(236,231,216,' + ((0.05 + dep * 0.10) * gAll).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(PA[0], PA[1]); ctx.lineTo(PB[0], PB[1]); ctx.stroke();
        }
      }
      // particles assembling onto nodes + edge strands
      ctx.fillStyle = '#ece7d8'; ci = 0;
      for (i = 0; i < targets.length; i++) {
        var T = targets[i]; P = project(T); dep = (P[2] / 1.4 + 1) / 2;
        place(P[0], P[1], T.a0 + T.a1 * dep, T.node ? (T.col ? 3 : 2) : 1.2, T.col);
      }
      // ambient dust
      ctx.fillStyle = '#ece7d8';
      for (i = ci; i < parts.length; i++) {
        var r = parts[i];
        var lx = r.bx + 40 * Math.cos(0.00026 * t + r.ph), ly = r.by + 40 * Math.sin(0.00032 * t + r.ph);
        var ox = (lx - r.x) * 0.01, oy = (ly - r.y) * 0.01;
        var ux = r.x - mxp, uy = r.y - myp, d2 = ux * ux + uy * uy;
        if (d2 < 16900) { var d = Math.sqrt(d2) || 1, f = (130 - d) / 130 * 3.2; ox += ux / d * f; oy += uy / d * f; }
        r.vx = (r.vx + ox) * 0.91; r.vy = (r.vy + oy) * 0.91; r.x += r.vx; r.y += r.vy;
        ctx.globalAlpha = 0.1; ctx.fillRect(r.x, r.y, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
    function loop(t) { raf = null; if (!visible) return; if (t - last > 16) { draw(t); last = t; } if (!reduce) raf = requestAnimationFrame(loop); }
    function start() { if (!raf) raf = requestAnimationFrame(loop); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    build(); draw(0); if (!reduce) start();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); draw(0); }, 200); });
    if (!reduce && window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      window.addEventListener('pointermove', function (e) { mxp = e.clientX; myp = e.clientY; }, { passive: true });
      window.addEventListener('pointerleave', function () { mxp = -1e5; myp = -1e5; }, { passive: true });
      window.addEventListener('blur', function () { mxp = -1e5; myp = -1e5; });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && !reduce) start(); else stop(); }, { threshold: 0 }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (visible && !reduce) start(); });
  }

  function initNeural() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canvases = document.querySelectorAll('.neural-bg');
    var canvas = canvases[0];
    for (var i = 1; i < canvases.length; i++) { canvases[i].parentNode.removeChild(canvases[i]); }
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'neural-bg';
      canvas.setAttribute('aria-hidden', 'true');
    }
    canvas.classList.add('neural-bg--fixed');
    document.body.insertBefore(canvas, document.body.firstChild);
    if (!document.querySelector('.site-vignette')) {
      var vg = document.createElement('div');
      vg.className = 'site-vignette';
      vg.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(vg, canvas.nextSibling);
    }
    setupNeural(canvas, reduce);
  }

  /* ---------- scroll-driven parallax for the grid layer ---------- */
  function initScrollFX() {
    var grids = document.querySelectorAll('.grid-fx');
    if (!grids.length) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ticking = false;
    function update() {
      var y = window.pageYOffset || 0;
      for (var i = 0; i < grids.length; i++) {
        grids[i].style.transformOrigin = '50% 0';
        grids[i].style.transform = 'rotate(' + (y * 0.01) + 'deg) scale(' + (1.1 + Math.min(y, 600) * 0.0006) + ')';
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- WOW batch ---------- */
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = !window.matchMedia || window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* thin gradient scroll-progress bar */
  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    var ticking = false;
    function upd() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? (h.scrollTop / max) : 0) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(upd); ticking = true; }
    }, { passive: true });
    upd();
  }

  /* 3D tilt + glare on the product mockups */
  function initTilt() {
    if (REDUCED || !FINE) return;
    var els = document.querySelectorAll('.case__media, .svc-hero__media');
    for (var i = 0; i < els.length; i++) (function (el) {
      var glare = document.createElement('span');
      glare.className = 'tilt-glare';
      el.appendChild(glare);
      el.addEventListener('pointerenter', function () { el.style.transition = 'transform .08s linear'; });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        var rx = (0.5 - py) * 6.5, ry = (px - 0.5) * 8.5;
        el.style.transform = 'perspective(1100px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale(1.014)';
        glare.style.opacity = '1';
        glare.style.background = 'radial-gradient(440px circle at ' + (px * 100) + '% ' + (py * 100) + '%, rgba(180,222,255,.20), transparent 58%)';
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform .6s var(--ease, ease)';
        el.style.transform = '';
        glare.style.opacity = '0';
      });
    })(els[i]);
  }

  /* magnetic CTA buttons with a cursor-following sheen */
  function initMagnetic() {
    if (REDUCED || !FINE) return;
    var btns = document.querySelectorAll('.btn--primary');
    for (var i = 0; i < btns.length; i++) (function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + (mx * 0.16) + 'px,' + (my * 0.28) + 'px)';
        b.style.setProperty('--bx', (e.clientX - r.left) + 'px');
        b.style.setProperty('--by', (e.clientY - r.top) + 'px');
      }, { passive: true });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    })(btns[i]);
  }

  /* soft cursor spotlight over dark hero sections */
  function initSpotlight() {
    if (REDUCED || !FINE) return;
    var heroes = document.querySelectorAll('.hero, .page-hero');
    for (var i = 0; i < heroes.length; i++) (function (h) {
      var s = document.createElement('span');
      s.className = 'hero-spot';
      h.insertBefore(s, h.firstChild);
      h.addEventListener('pointermove', function (e) {
        var r = h.getBoundingClientRect();
        s.style.transform = 'translate(' + (e.clientX - r.left) + 'px,' + (e.clientY - r.top) + 'px)';
        s.style.opacity = '1';
      }, { passive: true });
      h.addEventListener('pointerleave', function () { s.style.opacity = '0'; });
    })(heroes[i]);
  }

  /* self-typing terminal — agent comes alive */
  function initTerminal() {
    var box = document.querySelector('[data-terminal] .terminal__body');
    if (!box) return;
    var lines = [
      { t: '$ chaos deploy --agent sales', c: 'cmd' },
      { t: '✓ голосовой агент поднят · Retell + Claude', c: 'ok' },
      { t: '✓ интеграция с amoCRM … подключено', c: 'ok' },
      { t: '→ агент на связи 24/7, лиды квалифицируются', c: 'mut' }
    ];
    if (REDUCED) {
      box.innerHTML = lines.map(function (l) { return '<span class="tl tl--' + l.c + '">' + l.t + '</span>'; }).join('\n');
      return;
    }
    var li = 0;
    function typeLine() {
      if (li >= lines.length) {
        setTimeout(function () { box.innerHTML = ''; li = 0; typeLine(); }, 4200);
        return;
      }
      var l = lines[li], span = document.createElement('span');
      span.className = 'tl tl--' + l.c;
      box.appendChild(span);
      if (li > 0) box.insertBefore(document.createTextNode('\n'), span);
      var ci = 0;
      (function typeChar() {
        span.textContent = l.t.slice(0, ci);
        ci++;
        if (ci <= l.t.length) { setTimeout(typeChar, l.c === 'cmd' ? 38 : 14); }
        else { li++; setTimeout(typeLine, 360); }
      })();
    }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); typeLine(); }
    }, { threshold: .3 });
    io.observe(box.closest('[data-terminal]'));
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initReveal();
    initHeader();
    initForm();
    initNeural();
    initScrollFX();
    initScrollProgress();
    initTilt();
    initMagnetic();
    initSpotlight();
    initTerminal();
  });
})();
