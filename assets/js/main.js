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

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
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

  /* ---------- neural network background ---------- */
  function setupNeural(canvas, reduce) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, nodes = [], pulses = [], raf = null, visible = true, last = 0;
    // scroll-driven swirl: the network rotates as the page is scrolled, with a faint ambient spin
    var swirlVel = 0, lastScrollY = window.pageYOffset || 0;

    function build() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(22, Math.min(80, Math.round(w * h * 0.00008)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.5 + 0.8, ph: Math.random() * Math.PI * 2
        });
      }
    }

    var MAXD = 150, MAXD2 = MAXD * MAXD;
    var mx = -9999, my = -9999, MR = 190, MR2 = MR * MR, hasMouse = false;

    function onMove(e) {
      var r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
      hasMouse = (mx >= -MR && mx <= w + MR && my >= -MR && my <= h + MR);
    }
    function offMouse() { hasMouse = false; mx = my = -9999; }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      var i, j, n;
      var cx = w / 2, cy = h / 2;
      // decay scroll swirl + faint ambient rotation so the field always feels alive
      swirlVel *= 0.93;
      var rot = (Math.abs(swirlVel) < 0.00002 ? 0 : swirlVel) + 0.00005;
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        if (!reduce) {
          // swirl the whole network around its centre (scroll velocity + ambient)
          var rx = n.x - cx, ry = n.y - cy;
          n.vx += -ry * rot;
          n.vy += rx * rot;
          // gentle attraction toward cursor when nearby
          if (hasMouse) {
            var mdx = mx - n.x, mdy = my - n.y, md2 = mdx * mdx + mdy * mdy;
            if (md2 < MR2 && md2 > 1) {
              var f = (1 - Math.sqrt(md2) / MR) * 0.06;
              n.vx += (mdx / Math.sqrt(md2)) * f;
              n.vy += (mdy / Math.sqrt(md2)) * f;
            }
          }
          // friction keeps motion calm and prevents clumping
          n.vx *= 0.985; n.vy *= 0.985;
          var sp = n.vx * n.vx + n.vy * n.vy;
          if (sp < 0.012) { n.vx += (Math.random() - 0.5) * 0.05; n.vy += (Math.random() - 0.5) * 0.05; }
          n.x += n.vx; n.y += n.vy;
          if (n.x < -30) n.x = w + 30; else if (n.x > w + 30) n.x = -30;
          if (n.y < -30) n.y = h + 30; else if (n.y > h + 30) n.y = -30;
        }
      }
      // edges
      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < MAXD2) {
            var al = (1 - Math.sqrt(d2) / MAXD) * 0.45;
            ctx.strokeStyle = 'rgba(110,150,240,' + al.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // pulses travelling along edges (sparse "forming" signal)
      if (!reduce) {
        if (pulses.length < 5 && Math.random() < 0.03 && nodes.length > 2) {
          var ai = (Math.random() * nodes.length) | 0;
          var bi = (Math.random() * nodes.length) | 0;
          if (ai !== bi) {
            var na = nodes[ai], nb = nodes[bi];
            var pdx = na.x - nb.x, pdy = na.y - nb.y;
            if (pdx * pdx + pdy * pdy < MAXD2 * 2.2) pulses.push({ a: ai, b: bi, p: 0 });
          }
        }
        for (i = pulses.length - 1; i >= 0; i--) {
          var pu = pulses[i];
          pu.p += 0.012;
          if (pu.p >= 1) { pulses.splice(i, 1); continue; }
          var pa = nodes[pu.a], pb = nodes[pu.b];
          if (!pa || !pb) { pulses.splice(i, 1); continue; }
          var px = pa.x + (pb.x - pa.x) * pu.p, py = pa.y + (pb.y - pa.y) * pu.p;
          var fade = Math.sin(pu.p * Math.PI);
          ctx.beginPath();
          ctx.fillStyle = 'rgba(34,211,238,' + (0.9 * fade).toFixed(3) + ')';
          ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
        }
      }
      // nodes
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        var tw = reduce ? 0.7 : (0.55 + 0.45 * Math.sin(t * 0.0011 + n.ph));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(150,205,250,' + (0.6 * tw).toFixed(3) + ')';
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
      // cursor links + glowing focus node
      if (!reduce && hasMouse) {
        for (i = 0; i < nodes.length; i++) {
          n = nodes[i];
          var cdx = n.x - mx, cdy = n.y - my, cd2 = cdx * cdx + cdy * cdy;
          if (cd2 < MR2) {
            var cal = (1 - Math.sqrt(cd2) / MR) * 0.8;
            ctx.strokeStyle = 'rgba(34,211,238,' + cal.toFixed(3) + ')';
            ctx.lineWidth = 1.1;
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(mx, my); ctx.stroke();
          }
        }
        var g = ctx.createRadialGradient(mx, my, 0, mx, my, 26);
        g.addColorStop(0, 'rgba(34,211,238,.5)');
        g.addColorStop(1, 'rgba(34,211,238,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(mx, my, 26, 0, Math.PI * 2); ctx.fill();
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
        swirlVel += (y - lastScrollY) * 0.0000016;
        lastScrollY = y;
        if (swirlVel > 0.0004) swirlVel = 0.0004; else if (swirlVel < -0.0004) swirlVel = -0.0004;
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
