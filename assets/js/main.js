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

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      var i, j, n;
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        if (!reduce) {
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
    var canvases = document.querySelectorAll('.neural-bg');
    if (!canvases.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    canvases.forEach(function (c) { setupNeural(c, reduce); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initReveal();
    initHeader();
    initForm();
    initNeural();
  });
})();
