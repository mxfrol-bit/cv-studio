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
     NEURAL JOURNEY — a single non-looping cinematic the user
     scrubs with the page scroll. Phases, in order:
       approach → split into particles → signals flow along the
       neurons → a new network is born from one neuron → it
       branches into several logics → settle.
     Scroll is eased into a smoothed progress so it never glitches.
     =========================================================== */
  function setupNeural(canvas, reduce) {
    var ctx = canvas.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, fx = 0, fy = 0, R = 0, raf = null, visible = true, last = 0, built = false;
    var rotY = 0, TC = 0.9131, TS = 0.4078, tiltT = 0, tilt = 0;
    var nodes = [], edges = [], pts = [], parts = [], dust = [], NN = 0;
    var CORE = '#ff7a3d';
    var scrollT = 0, prog = 0;

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function smooth(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }
    function bl(a, b, u) { return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u }; }
    function sh(o, s, off) { return { x: o.x * s + (off ? off.x : 0), y: o.y * s + (off ? off.y : 0), z: o.z * s + (off ? off.z : 0) }; }

    function buildGeo() {
      nodes = []; edges = []; pts = [];
      var mobile = w < 760, i, k;
      var counts = mobile ? [30, 22, 15, 9, 5, 2] : [58, 44, 32, 21, 12, 4];
      var L = counts.length, golden = Math.PI * (3 - Math.sqrt(5)), layerStart = [];
      for (var li = 0; li < L; li++) {
        layerStart[li] = nodes.length;
        var z = -1.15 + 2.3 * li / (L - 1), rad = 1.12 - 1.0 * (li / (L - 1)), nc = counts[li];
        for (k = 0; k < nc; k++) { var ang = golden * k + li * 0.7, rr = rad * Math.sqrt((k + 0.5) / nc); nodes.push({ x: Math.cos(ang) * rr, y: Math.sin(ang) * rr, z: z, last: li === L - 1 }); }
      }
      for (li = 0; li < L - 1; li++) {
        var a0 = layerStart[li], a1 = layerStart[li + 1], b1 = (li + 2 < L ? layerStart[li + 2] : nodes.length);
        for (var ai = a0; ai < a1; ai++) {
          var best = [];
          for (var bi = a1; bi < b1; bi++) { var dx = nodes[ai].x - nodes[bi].x, dy = nodes[ai].y - nodes[bi].y; best.push([dx * dx + dy * dy, bi]); }
          best.sort(function (p, q) { return p[0] - q[0]; });
          for (var e = 0; e < Math.min(3, best.length); e++) edges.push([ai, best[e][1]]);
        }
      }
      // particle list: nodes first, then points strung along every edge
      for (i = 0; i < nodes.length; i++) { var nn = nodes[i]; pts.push({ x: nn.x, y: nn.y, z: nn.z, a0: 0.36, a1: 0.6, node: 1, col: nn.last ? CORE : null, eA: i, eB: i, fo: 0 }); }
      var SEG = mobile ? 3 : 4;
      for (i = 0; i < edges.length; i++) {
        var A = nodes[edges[i][0]], B = nodes[edges[i][1]];
        for (var sg = 1; sg <= SEG; sg++) { var tt = sg / (SEG + 1); pts.push({ x: A.x + (B.x - A.x) * tt, y: A.y + (B.y - A.y) * tt, z: A.z + (B.z - A.z) * tt, a0: 0.07, a1: 0.27, node: 0, col: null, eA: edges[i][0], eB: edges[i][1], fo: tt }); }
      }
      // per-particle phase targets: scatter halo, birth (mini-net from one neuron), branch (3 logics)
      var neuron = nodes[Math.floor(nodes.length * 0.5)];
      var clusters = [{ x: -0.78, y: 0.18, z: 0.1 }, { x: 0.06, y: -0.52, z: 0.35 }, { x: 0.74, y: 0.30, z: -0.2 }];
      for (i = 0; i < pts.length; i++) {
        var q = pts[i], ang = Math.random() * 6.2832, rr2 = 1.6 + Math.random() * 1.6;
        q.sc = { x: q.x + Math.cos(ang) * rr2, y: q.y + Math.sin(ang) * rr2 * 0.9, z: q.z + rnd(-0.5, 0.5) };
        q.bi = sh(q, 0.26, neuron);
        q.br = sh(q, 0.22, clusters[i % 3]);
      }
      NN = nodes.length;
    }
    function build() {
      var rect = canvas.getBoundingClientRect(); w = rect.width; h = rect.height;
      if (!w || !h) return;
      canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      fx = w * (w < 760 ? 0.5 : 0.72); fy = h * (w < 760 ? 0.4 : 0.44); R = 0.27 * Math.min(w * 0.9, h);
      buildGeo();
      var prev = parts; parts = [];
      for (var i = 0; i < pts.length; i++) { var pp = prev[i]; parts.push({ x: pp ? pp.x : rnd(0, w), y: pp ? pp.y : rnd(0, h), dep: 0.5 }); }
      dust = []; var dn = Math.round(w * h / 17000);
      for (i = 0; i < dn; i++) dust.push({ x: rnd(0, w), y: rnd(0, h), bx: rnd(0, w), by: rnd(0, h), ph: Math.random() * 6.2832 });
      built = true;
    }
    function project(p) {
      var ry = rotY + tilt, c = Math.cos(ry), s = Math.sin(ry);
      var rx = p.x * c + p.z * s, rz = -p.x * s + p.z * c, py = p.y;
      var sy = TC * py - TS * rz, dz = TS * py + TC * rz;
      return [fx + rx * R, fy - sy * R, dz];
    }
    function flowEdge(q, t) {
      if (q.eA === q.eB) return { x: q.x, y: q.y, z: q.z };
      var A = nodes[q.eA], B = nodes[q.eB], tt = (q.fo + t * 0.0001) % 1;
      return { x: A.x + (B.x - A.x) * tt, y: A.y + (B.y - A.y) * tt, z: A.z + (B.z - A.z) * tt };
    }
    function pos3(q, p, t) {
      if (p < 0.15) return bl(sh(q, 0.5), q, smooth(p / 0.15));                 // approach
      if (p < 0.30) return bl(q, q.sc, smooth((p - 0.15) / 0.15));             // split into particles
      if (p < 0.52) return bl(q.sc, flowEdge(q, t), smooth((p - 0.30) / 0.22)); // signals flow along neurons
      if (p < 0.70) return bl(flowEdge(q, t), q.bi, smooth((p - 0.52) / 0.18)); // new net born from one neuron
      if (p < 0.88) return bl(q.bi, q.br, smooth((p - 0.70) / 0.18));          // branches into several logics
      return q.br;                                                            // settle
    }
    function edgeAlpha(p) {
      if (p < 0.15) return smooth(p / 0.15);
      if (p < 0.30) return 1 - smooth((p - 0.15) / 0.15) * 0.85;
      if (p < 0.55) return 0.12;
      if (p < 0.70) return 0.12 + smooth((p - 0.55) / 0.15) * 0.45;
      if (p < 0.88) return 0.55 - smooth((p - 0.70) / 0.18) * 0.32;
      return 0.23;
    }
    function draw(t) {
      if (!built) return;
      ctx.clearRect(0, 0, w, h);
      if (!reduce) { rotY += 0.0024; prog += (scrollT - prog) * 0.07; tilt += (tiltT - tilt) * 0.05; }
      var p = prog, i, P, q;
      // ambient dust
      ctx.fillStyle = '#ece7d8';
      for (i = 0; i < dust.length; i++) {
        var r = dust[i], lx = r.bx + 40 * Math.cos(0.00026 * t + r.ph), ly = r.by + 40 * Math.sin(0.00032 * t + r.ph);
        r.x += (lx - r.x) * 0.01; r.y += (ly - r.y) * 0.01;
        ctx.globalAlpha = 0.1; ctx.fillRect(r.x, r.y, 1, 1);
      }
      // particles run the timeline
      for (i = 0; i < pts.length; i++) {
        q = pts[i]; P = project(pos3(q, p, t));
        var a = parts[i]; a.x += (P[0] - a.x) * 0.14; a.y += (P[1] - a.y) * 0.14; a.dep = (P[2] / 1.4 + 1) / 2;
      }
      // connections follow the node particles
      var eA = edgeAlpha(p);
      if (eA > 0.02) {
        ctx.lineWidth = 1;
        for (i = 0; i < edges.length; i++) {
          var na = parts[edges[i][0]], nb = parts[edges[i][1]];
          var dd = (na.x - nb.x) * (na.x - nb.x) + (na.y - nb.y) * (na.y - nb.y);
          if (dd > 90000) continue;                       // hide over-stretched links (branch phase)
          ctx.strokeStyle = 'rgba(236,231,216,' + ((0.05 + (na.dep + nb.dep) * 0.06) * eA).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();
        }
      }
      // dots
      for (i = 0; i < pts.length; i++) {
        q = pts[i]; var a2 = parts[i];
        ctx.globalAlpha = q.a0 + q.a1 * a2.dep;
        ctx.fillStyle = q.col || '#ece7d8';
        var sz = q.node ? (q.col ? 3.4 : 2.2) : 1.3;
        ctx.fillRect(a2.x - sz / 2, a2.y - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;
    }
    function loop(t) { raf = null; if (!visible) return; if (t - last > 16) { draw(t); last = t; } if (!reduce) raf = requestAnimationFrame(loop); }
    function start() { if (!raf) raf = requestAnimationFrame(loop); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    function readScroll() { var de = document.documentElement, max = (de.scrollHeight - de.clientHeight) || 1; scrollT = Math.min(1, Math.max(0, (window.pageYOffset || 0) / max)); }
    build(); readScroll(); prog = scrollT; draw(0); if (!reduce) start();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); readScroll(); draw(0); }, 200); });
    if (!reduce) window.addEventListener('scroll', function () { readScroll(); if (!raf && visible) start(); }, { passive: true });
    if (!reduce && window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      window.addEventListener('pointermove', function (e) { tiltT = ((e.clientX / w) - 0.5) * 0.5; }, { passive: true });
      window.addEventListener('pointerleave', function () { tiltT = 0; }, { passive: true });
    }
    if ('IntersectionObserver' in window) { new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && !reduce) start(); else stop(); }, { threshold: 0 }).observe(canvas); }
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
    // Prefer the WebGL scroll-journey; fall back to the canvas-2D engine.
    var glOk = false;
    try { glOk = !!(window.initNeuralGL && window.initNeuralGL(canvas, reduce)); } catch (e) { glOk = false; }
    if (!glOk) setupNeural(canvas, reduce);
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
