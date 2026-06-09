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

    // rigid 3D crystal: a faceted geodesic icosphere (built once) + floating debris shards
    var verts = [], faces = [], shards = [], proj = [], built = false, lastNarrow = null;
    // rotation state — one transform applied to the whole body => it turns as a single mechanism
    var angleY = 0, spinVel = 0, lastScrollY = window.pageYOffset || 0;
    var tiltX = 0, tiltY = 0, tiltTX = 0, tiltTY = 0; // eased cursor parallax

    // build a geodesic icosphere by subdividing an icosahedron `sub` times
    function makeIcosphere(sub) {
      var t = (1 + Math.sqrt(5)) / 2;
      var V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t],
               [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
      for (var i = 0; i < V.length; i++) {
        var L = Math.sqrt(V[i][0] * V[i][0] + V[i][1] * V[i][1] + V[i][2] * V[i][2]);
        V[i] = [V[i][0] / L, V[i][1] / L, V[i][2] / L];
      }
      var F = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],
               [10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],
               [2,4,11],[6,2,10],[8,6,7],[9,8,1]];
      var cache = {};
      function mid(a, b) {
        var key = a < b ? a + '_' + b : b + '_' + a;
        if (cache[key] != null) return cache[key];
        var m = [(V[a][0] + V[b][0]) / 2, (V[a][1] + V[b][1]) / 2, (V[a][2] + V[b][2]) / 2];
        var L = Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]);
        V.push([m[0] / L, m[1] / L, m[2] / L]);
        return (cache[key] = V.length - 1);
      }
      for (var s = 0; s < sub; s++) {
        var F2 = [];
        for (var f = 0; f < F.length; f++) {
          var a = F[f][0], b = F[f][1], c = F[f][2];
          var ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
          F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
        }
        F = F2;
      }
      return { V: V, F: F };
    }

    function buildGeometry() {
      var sub = w < 860 ? 1 : 2;            // 80 vs 320 facets
      var ico = makeIcosphere(sub);
      var V = ico.V;
      // displace each vertex irregularly so the body reads as a rough, faceted crystal
      verts = [];
      for (var i = 0; i < V.length; i++) {
        var x = V[i][0], y = V[i][1], z = V[i][2];
        var n = 1
          + 0.22 * Math.sin(x * 3.1 + 1.7) * Math.cos(y * 2.7)
          + 0.15 * Math.sin(z * 3.9 + 0.4)
          + 0.10 * Math.cos((x + y) * 4.3);
        verts.push({ x: x * n, y: y * n * 1.18, z: z * n, ph: Math.random() * 6.28 });
      }
      faces = ico.F;
      // floating shards orbiting the crystal (the debris field from the reference)
      shards = [];
      var SN = w < 860 ? 14 : 42;
      for (var s = 0; s < SN; s++) {
        var th = Math.random() * 6.2832, ph2 = Math.acos(2 * Math.random() - 1);
        var rad = 1.45 + Math.random() * 1.15;
        var sz = 0.04 + Math.random() * 0.06;
        function rv() { return (Math.random() * 2 - 1) * sz; }
        shards.push({
          x: Math.sin(ph2) * Math.cos(th) * rad,
          y: Math.cos(ph2) * rad * 1.15,
          z: Math.sin(ph2) * Math.sin(th) * rad,
          a: [rv(), rv(), rv()], b: [rv(), rv(), rv()], c: [rv(), rv(), rv()],
          ph: Math.random() * 6.28
        });
      }
      proj = new Array(verts.length);
      built = true;
    }

    function build() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var narrow = w < 860;
      // anchor the crystal right-of-centre on wide screens so text reads as a side column
      cx = narrow ? w * 0.5 : w * 0.64;
      cy = h * 0.46;
      R = Math.min(w, h) * (narrow ? 0.34 : 0.30);
      if (!built || narrow !== lastNarrow) { lastNarrow = narrow; buildGeometry(); }
    }

    function onMove(e) {
      // cursor tilts the whole mechanism a little (parallax), eased toward target
      tiltTY = ((e.clientX - cx) / Math.max(cx, 1)) * 0.5;
      tiltTX = ((e.clientY - cy) / Math.max(cy, 1)) * 0.35;
    }
    function offMouse() { tiltTX = 0; tiltTY = 0; }

    var CAM = 2.85; // camera distance for perspective

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      if (!built) return;
      if (!reduce) {
        spinVel *= 0.94;
        angleY += 0.0026 + spinVel;           // ambient spin + scroll velocity
        tiltX += (tiltTX - tiltX) * 0.05;
        tiltY += (tiltTY - tiltY) * 0.05;
      }
      var aY = angleY + tiltY;
      var aX = 0.34 + (reduce ? 0 : Math.sin(t * 0.00015) * 0.14) + tiltX;
      var cosY = Math.cos(aY), sinY = Math.sin(aY), cosX = Math.cos(aX), sinX = Math.sin(aX);

      function rot(x, y, z) {
        var x1 = x * cosY + z * sinY;
        var z1 = -x * sinY + z * cosY;
        var y2 = y * cosX - z1 * sinX;
        var z2 = y * sinX + z1 * cosX;
        return [x1, y2, z2];
      }

      var i, p, r;

      // glowing core behind the crystal — light leaking through the cracks
      var coreR = R * 1.35;
      var pulse = reduce ? 0.5 : (0.46 + 0.07 * Math.sin(t * 0.0009));
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      g.addColorStop(0, 'rgba(198,233,255,' + pulse.toFixed(3) + ')');
      g.addColorStop(0.3, 'rgba(110,170,242,0.2)');
      g.addColorStop(1, 'rgba(20,40,90,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, 6.2832); ctx.fill();

      // project crystal vertices (keep rotated 3D coords for face normals)
      for (i = 0; i < verts.length; i++) {
        var b = verts[i];
        r = rot(b.x, b.y, b.z);
        var persp = CAM / (CAM - r[2]);
        proj[i] = { rx: r[0], ry: r[1], rz: r[2], sx: cx + r[0] * R * persp, sy: cy + r[1] * R * persp, dep: (r[2] + 1) / 2, ph: b.ph };
      }

      var Lx = 0.36, Ly = -0.5, Lz = 0.78; // light direction (view space)

      // assemble faces with depth + lighting, paint back-to-front for translucent glass
      var flist = [];
      for (i = 0; i < faces.length; i++) {
        var f = faces[i], A = proj[f[0]], B = proj[f[1]], C = proj[f[2]];
        var ux = B.rx - A.rx, uy = B.ry - A.ry, uz = B.rz - A.rz;
        var vx = C.rx - A.rx, vy = C.ry - A.ry, vz = C.rz - A.rz;
        var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        var nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;
        flist.push({ A: A, B: B, C: C, facing: nx * Lx + ny * Ly + nz * Lz, front: nz, z: (A.rz + B.rz + C.rz) / 3 });
      }
      flist.sort(function (p, q) { return p.z - q.z; });

      for (i = 0; i < flist.length; i++) {
        var fc = flist[i], dep = (fc.z + 1) / 2, lit = fc.facing > 0 ? fc.facing : 0, front = fc.front > 0 ? fc.front : 0;
        // translucent facet — brighter where it faces the light
        ctx.beginPath();
        ctx.moveTo(fc.A.sx, fc.A.sy); ctx.lineTo(fc.B.sx, fc.B.sy); ctx.lineTo(fc.C.sx, fc.C.sy); ctx.closePath();
        ctx.fillStyle = 'rgba(' + Math.round(40 + lit * 160 + dep * 35) + ',' + Math.round(85 + lit * 155 + dep * 50) + ',' + Math.round(155 + lit * 90 + dep * 60) + ',' + (0.05 + dep * 0.07 + lit * 0.16).toFixed(3) + ')';
        ctx.fill();
        // glowing veins along the cracks — strongest on lit, front-facing edges
        var fl = reduce ? 1 : (0.82 + 0.18 * Math.sin(t * 0.0018 + i));
        ctx.strokeStyle = 'rgba(' + Math.round(175 + lit * 80) + ',' + Math.round(218 + lit * 37) + ',255,' + ((0.07 + front * 0.66 * (0.5 + lit)) * fl).toFixed(3) + ')';
        ctx.lineWidth = 0.6 + front * 1.2;
        ctx.stroke();
      }

      // bright sparkle on the near-front vertices
      for (i = 0; i < proj.length; i++) {
        p = proj[i];
        if (p.rz < 0.25) continue;
        var tw = reduce ? 1 : (0.6 + 0.4 * Math.sin(t * 0.0014 + p.ph));
        var na = (p.dep - 0.62) * 1.7 * tw;
        if (na <= 0) continue;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(222,240,255,' + Math.min(0.7, na).toFixed(3) + ')';
        ctx.arc(p.sx, p.sy, 0.6 + p.dep * 1.7, 0, 6.2832); ctx.fill();
      }

      // floating debris shards
      for (i = 0; i < shards.length; i++) {
        var sh = shards[i];
        var rc = rot(sh.x, sh.y, sh.z);
        if (rc[2] >= CAM - 0.2) continue;
        var ra = rot(sh.x + sh.a[0], sh.y + sh.a[1], sh.z + sh.a[2]);
        var rb = rot(sh.x + sh.b[0], sh.y + sh.b[1], sh.z + sh.b[2]);
        var rcc = rot(sh.x + sh.c[0], sh.y + sh.c[1], sh.z + sh.c[2]);
        var pa2 = CAM / (CAM - ra[2]), pb2 = CAM / (CAM - rb[2]), pc2 = CAM / (CAM - rcc[2]);
        var sdep = (rc[2] + 1) / 2, sal = 0.12 + sdep * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + ra[0] * R * pa2, cy + ra[1] * R * pa2);
        ctx.lineTo(cx + rb[0] * R * pb2, cy + rb[1] * R * pb2);
        ctx.lineTo(cx + rcc[0] * R * pc2, cy + rcc[1] * R * pc2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(' + Math.round(30 + sdep * 60) + ',' + Math.round(50 + sdep * 90) + ',' + Math.round(95 + sdep * 120) + ',' + (sal * 0.5).toFixed(3) + ')';
        ctx.fill();
        ctx.strokeStyle = 'rgba(' + Math.round(150 + sdep * 90) + ',' + Math.round(200 + sdep * 55) + ',255,' + sal.toFixed(3) + ')';
        ctx.lineWidth = 0.6; ctx.stroke();
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
