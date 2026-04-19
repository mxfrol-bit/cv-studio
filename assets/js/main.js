// NAV SCROLL
window.addEventListener('scroll', () => {
  document.querySelector('nav')?.classList.toggle('scrolled', window.scrollY > 40);
});

// MOBILE NAV
const burger = document.getElementById('burger');
const mobileNav = document.getElementById('mobile-nav');
const mobileClose = document.getElementById('mobile-close');
if (burger && mobileNav) {
  burger.addEventListener('click', () => mobileNav.classList.add('open'));
  mobileClose?.addEventListener('click', () => mobileNav.classList.remove('open'));
}

// GLOBAL MICRO-PARTICLES on section backgrounds
function spawnSectionParticles() {
  document.querySelectorAll('.sec[data-particles], section[data-particles]').forEach(sec => {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;opacity:0.35';
    sec.style.position = 'relative';
    sec.style.overflow = 'hidden';
    sec.insertBefore(canvas, sec.firstChild);
    // wrap children
    Array.from(sec.children).slice(1).forEach(el => el.style.position = 'relative');
    const ctx = canvas.getContext('2d');
    let pts = [];
    function resize() { canvas.width = sec.offsetWidth; canvas.height = sec.offsetHeight; }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(sec);
    for (let i = 0; i < 40; i++) pts.push({
      x: Math.random() * sec.offsetWidth, y: Math.random() * sec.offsetHeight,
      r: Math.random() * .8 + .2, dx: (Math.random()-.5)*.15, dy: (Math.random()-.5)*.15, a: Math.random()*.4+.08
    });
    function draw() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if(p.x<0)p.x=canvas.width; if(p.x>canvas.width)p.x=0;
        if(p.y<0)p.y=canvas.height; if(p.y>canvas.height)p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(124,111,255,${p.a})`; ctx.fill();
      });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const d=Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y);
        if(d<70){ctx.beginPath();ctx.strokeStyle=`rgba(124,111,255,${.08*(1-d/70)})`;ctx.lineWidth=.4;ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.stroke();}
      }
      requestAnimationFrame(draw);
    }
    draw();
  });
}
spawnSectionParticles();

// PARTICLES (only on hero pages)
function initParticles(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, pts = [];
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  for (let i = 0; i < 90; i++) {
    pts.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.3,
      dx: (Math.random() - .5) * .22,
      dy: (Math.random() - .5) * .22,
      a: Math.random() * .6 + .1
    });
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124,111,255,${p.a})`; ctx.fill();
    });
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < 90) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(124,111,255,${.1 * (1 - d / 90)})`;
          ctx.lineWidth = .5; ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}
initParticles('particles');

// SCROLL REVEAL
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => obs.observe(el));
}

// FAQ
document.querySelectorAll('.faq-q').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.parentElement;
    const was = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!was) item.classList.add('open');
  });
});

// ROADMAP ACCORDION
window.toggleRph = function(header) {
  const body = header.nextElementSibling;
  const icon = header.querySelector('.rph-icon');
  const isOpen = body.classList.contains('open');
  document.querySelectorAll('.rph-body').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.rph-icon').forEach(i => i.classList.remove('open'));
  if (!isOpen) { body.classList.add('open'); if (icon) icon.classList.add('open'); }
};

// CASE FILTERS
window.filterCases = function(cat, btn) {
  document.querySelectorAll('.case-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.case-card[data-cat]').forEach(c => {
    c.style.display = (cat === 'all' || c.dataset.cat === cat) ? 'block' : 'none';
  });
};

// FORM SUBMIT
document.querySelectorAll('.submit-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    const orig = this.textContent;
    this.textContent = 'Отправлено ✓';
    this.style.background = '#1D9E75';
    setTimeout(() => { this.textContent = orig; this.style.background = ''; }, 3000);
  });
});

// ACTIVE NAV
const path = window.location.pathname;
document.querySelectorAll('.nav-link').forEach(link => {
  const href = link.getAttribute('href');
  if (href && path.includes(href.replace('../', '').replace('index.html', ''))) {
    link.classList.add('active');
  }
});
