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
     LIVING GEOMETRY v3 — calm and fluid.
     One monochrome body of particles. Scroll position directly
     drives a continuous morph: crystal → torus knot → neural
     sphere → orbit rings → DNA helix, flowing smoothly between
     neighbours as you scroll. Light scatter on fast scroll and
     gentle cursor tilt are kept from the original. Nothing else.
     =========================================================== */
  function setupNeural(canvas, reduce) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, cx = 0, cy = 0, R = 0, raf = null, visible = true, last = 0;

    var N = 0, parts = [], faces = [], proj = [], built = false, lastNarrow = null;
    var shapes = [];                       // [{pos, links, faces:bool}]
    var isIndex = !/uslugi|keysy|o-studii|kontakty/.test((location.pathname || '').toLowerCase());
    var progT = 0, prog = 0;               // scroll-driven morph position (smoothed)

    var angleY = 0, spinVel = 0, lastScrollY = window.pageYOffset || 0;
    var tiltX = 0, tiltY = 0, tiltTX = 0, tiltTY = 0;
    var disp = 0;
    var CAM = 2.85;

    function smooth(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }

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

    function pickShape() {
      var p = (location.pathname || '').toLowerCase();
      if (p.indexOf('uslugi') >= 0)   return { ex: 1.30, ey: 0.96, ez: 0.84, a: [0.30, 0.20, 0.15], f: [2.4, 4.7, 5.3], ph: 0.9 };
      if (p.indexOf('keysy') >= 0)    return { ex: 1.02, ey: 0.74, ez: 1.26, a: [0.18, 0.27, 0.11], f: [3.7, 2.9, 4.1], ph: 2.1 };
      if (p.indexOf('o-studii') >= 0) return { ex: 1.08, ey: 1.08, ez: 1.08, a: [0.09, 0.08, 0.06], f: [2.0, 3.1, 2.6], ph: 0.3 };
      if (p.indexOf('kontakty') >= 0) return { ex: 0.90, ey: 1.34, ez: 0.90, a: [0.24, 0.17, 0.21], f: [4.3, 3.3, 5.7], ph: 1.5 };
      return { ex: 1.0, ey: 1.18, ez: 1.0, a: [0.22, 0.15, 0.10], f: [3.1, 3.9, 4.3], ph: 1.7 };
    }
    var crystalCfg = pickShape();

    function buildShapes(ico) {
      var V = ico.V; N = V.length;
      shapes = [];

      // 0 · faceted crystal (the original)
      var pos0 = new Array(N * 3), sh = crystalCfg, i;
      for (i = 0; i < N; i++) {
        var x = V[i][0], y = V[i][1], z = V[i][2];
        var n = 1
          + sh.a[0] * Math.sin(x * sh.f[0] + sh.ph) * Math.cos(y * 2.7)
          + sh.a[1] * Math.sin(z * sh.f[1] + 0.4)
          + sh.a[2] * Math.cos((x + y) * sh.f[2]);
        pos0[i * 3] = x * n * sh.ex; pos0[i * 3 + 1] = y * n * sh.ey; pos0[i * 3 + 2] = z * n * sh.ez;
      }
      shapes.push({ pos: pos0, links: null, faces: true });
      if (!isIndex) { return; }            // subpages keep their single crystal

      // 1 · torus knot
      var pos1 = new Array(N * 3), links1 = [];
      for (i = 0; i < N; i++) {
        var t = i / N * Math.PI * 2;
        var r2 = Math.cos(3 * t) + 2;
        var j = i * 2.39996;
        pos1[i * 3]     = r2 * Math.cos(2 * t) * 0.42 + Math.cos(j) * 0.07;
        pos1[i * 3 + 1] = -Math.sin(3 * t) * 0.55 + Math.sin(j) * 0.07;
        pos1[i * 3 + 2] = r2 * Math.sin(2 * t) * 0.42 + Math.cos(j * 1.7) * 0.07;
        links1.push([i, (i + 1) % N]);
      }
      shapes.push({ pos: pos1, links: links1, faces: false });

      // 2 · neural sphere (fibonacci shell) with static near-neighbour web
      var pos2 = new Array(N * 3), GA = Math.PI * (3 - Math.sqrt(5));
      for (i = 0; i < N; i++) {
        var yy = 1 - (i / (N - 1)) * 2;
        var rr = Math.sqrt(1 - yy * yy), th = GA * i;
        pos2[i * 3] = Math.cos(th) * rr * 1.18;
        pos2[i * 3 + 1] = yy * 1.18;
        pos2[i * 3 + 2] = Math.sin(th) * rr * 1.18;
      }
      var links2 = [];
      for (i = 0; i < N; i++) {            // each node links to 2 nearest forward neighbours
        var best = [-1, -1], bd = [9, 9];
        for (var k = i + 1; k < Math.min(N, i + 24); k++) {
          var dx = pos2[i*3]-pos2[k*3], dy = pos2[i*3+1]-pos2[k*3+1], dz = pos2[i*3+2]-pos2[k*3+2];
          var d = dx*dx+dy*dy+dz*dz;
          if (d < bd[0]) { bd[1]=bd[0]; best[1]=best[0]; bd[0]=d; best[0]=k; }
          else if (d < bd[1]) { bd[1]=d; best[1]=k; }
        }
        if (best[0] > 0) links2.push([i, best[0]]);
        if (best[1] > 0) links2.push([i, best[1]]);
      }
      shapes.push({ pos: pos2, links: links2, faces: false });

      // 3 · three tilted orbit rings
      var pos3 = new Array(N * 3), links3 = [];
      var ringSize = Math.floor(N / 3);
      for (i = 0; i < N; i++) {
        var ring = Math.min(2, Math.floor(i / ringSize));
        var kk = (i - ring * ringSize) / ringSize * Math.PI * 2;
        var rad = 1.25 - ring * 0.12;
        var ox = Math.cos(kk) * rad, oy = Math.sin(kk) * rad, oz = 0;
        var ang = ring * 1.05 + 0.5;
        var oy2 = oy * Math.cos(ang) - oz * Math.sin(ang);
        var oz2 = oy * Math.sin(ang) + oz * Math.cos(ang);
        var ax = ring * 0.9;
        pos3[i * 3] = ox * Math.cos(ax) + oz2 * Math.sin(ax);
        pos3[i * 3 + 1] = oy2;
        pos3[i * 3 + 2] = -ox * Math.sin(ax) + oz2 * Math.cos(ax);
        var nb = i + 1;
        if (Math.floor(nb / ringSize) === ring && nb < N) links3.push([i, nb]);
        else links3.push([i, ring * ringSize]);
      }
      shapes.push({ pos: pos3, links: links3, faces: false });

      // 4 · DNA double helix
      var pos4 = new Array(N * 3), links4 = [];
      var half = Math.floor(N / 2);
      for (i = 0; i < N; i++) {
        var strand = i < half ? 0 : 1;
        var u = (strand ? i - half : i) / half;
        var a2 = u * Math.PI * 4 + strand * Math.PI;
        pos4[i * 3] = Math.cos(a2) * 0.52;
        pos4[i * 3 + 1] = (u - 0.5) * 2.7;
        pos4[i * 3 + 2] = Math.sin(a2) * 0.52;
        var nx2 = i + 1;
        if ((strand === 0 && nx2 < half) || (strand === 1 && nx2 < N)) links4.push([i, nx2]);
        if (strand === 0 && i % 6 === 0 && i + half < N) links4.push([i, i + half]);
      }
      shapes.push({ pos: pos4, links: links4, faces: false });
    }

    function buildGeometry() {
      var sub = w < 860 ? 1 : 2;
      var ico = makeIcosphere(sub);
      buildShapes(ico);
      faces = ico.F;
      parts = [];
      for (var i = 0; i < N; i++) {
        var dth = Math.random() * 6.2832, dph = Math.acos(2 * Math.random() - 1);
        var sr = 2.1 + Math.random() * 1.6;
        parts.push({
          sx: Math.sin(dph) * Math.cos(dth) * sr,
          sy: Math.cos(dph) * sr * 1.15,
          sz: Math.sin(dph) * Math.sin(dth) * sr,
          wob: 0.05 + Math.random() * 0.09,
          ph: Math.random() * 6.28
        });
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
      var narrow = w < 860;
      cx = narrow ? w * 0.5 : w * 0.64;
      cy = h * 0.46;
      R = Math.min(w, h) * (narrow ? 0.34 : 0.30);
      if (!built || narrow !== lastNarrow) { lastNarrow = narrow; buildGeometry(); }
    }

    function onMove(e) {
      tiltTY = ((e.clientX - cx) / Math.max(cx, 1)) * 0.5;
      tiltTX = ((e.clientY - cy) / Math.max(cy, 1)) * 0.35;
    }
    function offMouse() { tiltTX = 0; tiltTY = 0; }

    function readScroll() {
      if (!isIndex || shapes.length < 2) { progT = 0; return; }
      var d = document.documentElement;
      var max = Math.max(1, d.scrollHeight - d.clientHeight);
      // reach the final figure at ~92% of the page, hold it after
      progT = Math.min(1, (d.scrollTop || window.pageYOffset || 0) / (max * 0.92)) * (shapes.length - 1);
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      if (!built) return;
      if (!reduce) {
        spinVel *= 0.94;
        angleY += 0.0026 + spinVel;
        disp *= 0.93;
        tiltX += (tiltTX - tiltX) * 0.05;
        tiltY += (tiltTY - tiltY) * 0.05;
        prog += (progT - prog) * 0.045;            // the butter: eased morph position
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

      // which two shapes are we between, and how far
      var ia = Math.floor(prog); if (ia > shapes.length - 1) ia = shapes.length - 1;
      var ib = Math.min(shapes.length - 1, ia + 1);
      var lt = smooth(prog - ia);                   // eased local 0..1 between A and B
      var A = shapes[ia], B = shapes[ib];
      var mid = Math.sin(lt * Math.PI);             // gentle breathing apart mid-transition

      var i, p, r;
      var scat = smooth(disp);
      var asm = (1 - scat) * (1 - 0.35 * mid);

      // breathing ice-white core
      var coreR = R * 1.35;
      var pulse = (reduce ? 0.5 : (0.46 + 0.07 * Math.sin(t * 0.0009))) * (0.28 + 0.72 * asm);
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      g.addColorStop(0, 'rgba(205,228,255,' + pulse.toFixed(3) + ')');
      g.addColorStop(0.3, 'rgba(120,160,225,' + (0.18 * (0.3 + 0.7 * asm)).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(18,30,65,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, 6.2832); ctx.fill();

      // project: blend A→B, soft breath outward mid-morph, scroll scatter on top
      for (i = 0; i < N; i++) {
        var b = parts[i];
        var bx = A.pos[i * 3]     + (B.pos[i * 3]     - A.pos[i * 3])     * lt;
        var by = A.pos[i * 3 + 1] + (B.pos[i * 3 + 1] - A.pos[i * 3 + 1]) * lt;
        var bz = A.pos[i * 3 + 2] + (B.pos[i * 3 + 2] - A.pos[i * 3 + 2]) * lt;
        var breathe = mid * 0.16;                   // subtle, keeps the form readable
        bx += b.sx * breathe; by += b.sy * breathe; bz += b.sz * breathe;
        var wob = (0.012 + scat * b.wob + mid * 0.02);
        var px = bx + (b.sx - bx) * scat + Math.sin(t * 0.0006 + b.ph) * wob;
        var py = by + (b.sy - by) * scat + Math.cos(t * 0.0007 + b.ph) * wob;
        var pz = bz + (b.sz - bz) * scat + Math.sin(t * 0.0005 + b.ph * 1.3) * wob;
        r = rot(px, py, pz);
        var persp = CAM / (CAM - r[2]);
        proj[i] = { rx: r[0], ry: r[1], rz: r[2],
                    sx: cx + r[0] * R * persp, sy: cy + r[1] * R * persp,
                    dep: (r[2] + 1) / 2, ph: b.ph, sc: Math.max(scat, mid * 0.5) };
      }

      // crystal faces fade out/in as the crystal enters or leaves the blend
      var crysW = (ia === 0 ? 1 - lt : 0) + (ib === 0 ? lt : 0);
      var faceA = smooth((crysW - 0.5) / 0.5) * (1 - scat);
      if (faceA > 0.02) {
        var Lx = 0.36, Ly = -0.5, Lz = 0.78, flist = [];
        for (i = 0; i < faces.length; i++) {
          var f = faces[i], Ap = proj[f[0]], Bp = proj[f[1]], Cp = proj[f[2]];
          var ux = Bp.rx - Ap.rx, uy = Bp.ry - Ap.ry, uz = Bp.rz - Ap.rz;
          var vx = Cp.rx - Ap.rx, vy = Cp.ry - Ap.ry, vz = Cp.rz - Ap.rz;
          var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
          var nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
          nx /= nl; ny /= nl; nz /= nl;
          flist.push({ A: Ap, B: Bp, C: Cp, facing: nx * Lx + ny * Ly + nz * Lz, front: nz, z: (Ap.rz + Bp.rz + Cp.rz) / 3 });
        }
        flist.sort(function (a2, b2) { return a2.z - b2.z; });
        for (i = 0; i < flist.length; i++) {
          var fc = flist[i], dep = (fc.z + 1) / 2, lit = fc.facing > 0 ? fc.facing : 0, front = fc.front > 0 ? fc.front : 0;
          ctx.beginPath();
          ctx.moveTo(fc.A.sx, fc.A.sy); ctx.lineTo(fc.B.sx, fc.B.sy); ctx.lineTo(fc.C.sx, fc.C.sy); ctx.closePath();
          ctx.fillStyle = 'rgba(' + Math.round(40 + lit * 160 + dep * 35) + ',' + Math.round(85 + lit * 155 + dep * 50) + ',' + Math.round(155 + lit * 90 + dep * 60) + ',' + ((0.05 + dep * 0.07 + lit * 0.16) * faceA).toFixed(3) + ')';
          ctx.fill();
          var fl = reduce ? 1 : (0.82 + 0.18 * Math.sin(t * 0.0018 + i));
          ctx.strokeStyle = 'rgba(' + Math.round(175 + lit * 80) + ',' + Math.round(218 + lit * 37) + ',255,' + ((0.07 + front * 0.66 * (0.5 + lit)) * fl * faceA).toFixed(3) + ')';
          ctx.lineWidth = 0.6 + front * 1.2;
          ctx.stroke();
        }
      }

      // structural lines: crossfade A's web out, B's web in
      function drawLinks(S, alpha) {
        if (!S.links || alpha < 0.02) return;
        ctx.lineWidth = 1;
        for (var li = 0; li < S.links.length; li++) {
          var a3 = proj[S.links[li][0]], b3 = proj[S.links[li][1]];
          if (a3.rz >= CAM - 0.2 || b3.rz >= CAM - 0.2) continue;
          var dpz = (a3.dep + b3.dep) / 2;
          ctx.strokeStyle = 'rgba(178,212,255,' + ((0.06 + dpz * 0.28) * alpha).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a3.sx, a3.sy); ctx.lineTo(b3.sx, b3.sy); ctx.stroke();
        }
      }
      drawLinks(A, (1 - lt) * (1 - scat));
      if (ib !== ia) drawLinks(B, lt * (1 - scat));

      // ice particles
      ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < N; i++) {
        p = proj[i];
        if (p.rz >= CAM - 0.2) continue;
        var twk = reduce ? 1 : (0.7 + 0.3 * Math.sin(t * 0.0016 + p.ph));
        var dep2 = p.dep < 0 ? 0 : p.dep;
        var a4 = (0.16 + dep2 * 0.34 + p.sc * 0.22) * twk;
        var rad2 = 0.7 + dep2 * 1.6 + p.sc * 0.8;
        if (a4 <= 0) continue;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + Math.round(185 + p.sc * 40) + ',' + Math.round(218 + p.sc * 20) + ',255,' + a4.toFixed(3) + ')';
        ctx.arc(p.sx, p.sy, rad2, 0, 6.2832); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
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
    readScroll(); prog = progT;
    draw(0);
    if (!reduce) start();

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { build(); readScroll(); draw(0); }, 200);
    });
    if (!reduce && window.matchMedia && window.matchMedia('(pointer:fine)').matches) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerleave', offMouse, { passive: true });
      window.addEventListener('blur', offMouse);
    }
    if (!reduce) {
      window.addEventListener('scroll', function () {
        var y = window.pageYOffset || 0;
        var dY = y - lastScrollY;
        spinVel += dY * 0.00002;
        disp += Math.min(0.4, Math.abs(dY) * 0.006);   // lighter scatter than before
        if (disp > 0.85) disp = 0.85;
        lastScrollY = y;
        if (spinVel > 0.05) spinVel = 0.05; else if (spinVel < -0.05) spinVel = -0.05;
        readScroll();
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
