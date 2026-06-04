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

  /* ---------- 3D rotating mesh background (single mechanism) ---------- */
  function setupNeural(canvas, reduce) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, cx = 0, cy = 0, R = 0, raf = null, visible = true, last = 0;

    // rigid 3D structure: points on a sphere (built once), connected to nearest neighbours
    var base = [], edges = [], proj = [], built = false;
    // rotation state — one transform applied to the whole body => it turns as a single mechanism
    var angleY = 0, spinVel = 0, lastScrollY = window.pageYOffset || 0;
    var tiltX = 0, tiltY = 0, tiltTX = 0, tiltTY = 0; // eased cursor parallax

    function buildGeometry() {
      var N = w < 720 ? 84 : 132;
      base = [];
      var gold = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < N; i++) {
        var y = 1 - (i + 0.5) / N * 2;          // -1 .. 1
        var rr = Math.sqrt(1 - y * y);
        var th = gold * i;
        base.push({ x: Math.cos(th) * rr, y: y, z: Math.sin(th) * rr, ph: Math.random() * 6.28 });
      }
      // connect each node to its k nearest neighbours (fixed wireframe topology)
      edges = [];
      var seen = {};
      for (var a = 0; a < N; a++) {
        var dists = [];
        for (var b = 0; b < N; b++) {
          if (a === b) continue;
          var dx = base[a].x - base[b].x, dy = base[a].y - base[b].y, dz = base[a].z - base[b].z;
          dists.push({ b: b, d: dx * dx + dy * dy + dz * dz });
        }
        dists.sort(function (p, q) { return p.d - q.d; });
        for (var k = 0; k < 3; k++) {
          var bb = dists[k].b;
          var key = a < bb ? a + '_' + bb : bb + '_' + a;
          if (!seen[key]) { seen[key] = 1; edges.push([a, bb]); }
        }
      }
      proj = new Array(N);
      built = true;
    }

    function build() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2; cy = h * 0.46;
      R = Math.min(w, h) * (w < 720 ? 0.62 : 0.5);
      if (!built || (w < 720) !== (base.length < 100)) buildGeometry();
    }

    function onMove(e) {
      // cursor tilts the whole mechanism a little (parallax), eased toward target
      tiltTY = ((e.clientX - cx) / Math.max(cx, 1)) * 0.5;
      tiltTX = ((e.clientY - cy) / Math.max(cy, 1)) * 0.35;
    }
    function offMouse() { tiltTX = 0; tiltTY = 0; }

    var CAM = 2.6; // camera distance for perspective

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      if (!built) return;
      if (!reduce) {
        spinVel *= 0.94;
        angleY += 0.0032 + spinVel;           // ambient spin + scroll velocity
        tiltX += (tiltTX - tiltX) * 0.05;
        tiltY += (tiltTY - tiltY) * 0.05;
      }
      var aY = angleY + tiltY;
      var aX = 0.42 + (reduce ? 0 : Math.sin(t * 0.00017) * 0.16) + tiltX;
      var cosY = Math.cos(aY), sinY = Math.sin(aY), cosX = Math.cos(aX), sinX = Math.sin(aX);

      var i, p, b;
      for (i = 0; i < base.length; i++) {
        b = base[i];
        // rotate Y then X
        var x1 = b.x * cosY + b.z * sinY;
        var z1 = -b.x * sinY + b.z * cosY;
        var y2 = b.y * cosX - z1 * sinX;
        var z2 = b.y * sinX + z1 * cosX;
        var persp = CAM / (CAM - z2);
        proj[i] = {
          sx: cx + x1 * R * persp,
          sy: cy + y2 * R * persp,
          dep: (z2 + 1) / 2,                  // 0 far .. 1 near
          ph: b.ph
        };
      }

      // edges — depth shaded, so the rotating body reads as solid 3D
      for (i = 0; i < edges.length; i++) {
        var pa = proj[edges[i][0]], pb = proj[edges[i][1]];
        var dep = (pa.dep + pb.dep) / 2;
        var al = 0.05 + dep * dep * 0.5;
        var cR = Math.round(70 + dep * 80);
        var cG = Math.round(110 + dep * 100);
        var cB = Math.round(190 + dep * 60);
        ctx.strokeStyle = 'rgba(' + cR + ',' + cG + ',' + cB + ',' + al.toFixed(3) + ')';
        ctx.lineWidth = 0.6 + dep * 0.9;
        ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
      }
      // nodes — nearer = bigger & brighter, with a faint twinkle
      for (i = 0; i < proj.length; i++) {
        p = proj[i];
        var tw = reduce ? 1 : (0.7 + 0.3 * Math.sin(t * 0.001 + p.ph));
        var na = (0.15 + p.dep * p.dep * 0.85) * tw;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + Math.round(160 + p.dep * 70) + ',' + Math.round(200 + p.dep * 40) + ',255,' + na.toFixed(3) + ')';
        ctx.arc(p.sx, p.sy, 0.6 + p.dep * 2.0, 0, 6.2832); ctx.fill();
      }
    }

    function loop(t) {
      raf = null;
      if (!visible) return;
      if (t - last > 16) { draw(t); last = t; }
      if (!reduce) raf = requestAnimationFrame(loop);
    }
    function start() { if (!raf) raf = requestAnimationFrame(loop); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    build();
    draw(0);
    if (!reduce) start();

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { build(); draw(0); }, 200);
    });
    if (!reduce && window.matchMedia && window.matchMedia('(pointer:fine)').matches) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerleave', offMouse, { passive: true });
      window.addEventListener('blur', offMouse);
    }
    if (!reduce) {
      window.addEventListener('scroll', function () {
        var y = window.pageYOffset || 0;
        spinVel += (y - lastScrollY) * 0.00002;
        lastScrollY = y;
        if (spinVel > 0.05) spinVel = 0.05; else if (spinVel < -0.05) spinVel = -0.05;
        if (!raf && visible) start();
      }, { passive: true });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        visible = e[0].isIntersecting;
        if (visible && !reduce) start(); else stop();
      }, { threshold: 0 }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else if (visible && !reduce) start();
    });
  }

  function initNeural() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // collapse any per-section canvases into ONE fixed site-wide background
    var canvases = document.querySelectorAll('.neural-bg');
    var canvas = canvases[0];
    for (var i = 1; i < canvases.length; i++) { canvases[i].parentNode.removeChild(canvases[i]); }
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'neural-bg';
      canvas.setAttribute('aria-hidden', 'true');
    }
    canvas.classList.add('neural-bg--fixed');
    // move it to be the first child of <body> so it sits behind all content
    document.body.insertBefore(canvas, document.body.firstChild);
    // soft colour vignette over the network
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

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initReveal();
    initHeader();
    initForm();
    initNeural();
    initScrollFX();
  });
})();
