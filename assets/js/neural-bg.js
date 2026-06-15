/* Chaos Vision — NeuralScrollBackground (Three.js)
   Scroll-driven journey through a living AI network. Falls back gracefully:
   window.initNeuralGL(canvas, reduce) returns true on success, false otherwise
   (main.js then runs the canvas-2D engine instead). */
(function () {
  'use strict';

  window.initNeuralGL = function (canvas, reduce) {
    if (typeof THREE === 'undefined') return false;
    // WebGL availability check
    try {
      var test = document.createElement('canvas');
      if (!(test.getContext('webgl') || test.getContext('experimental-webgl'))) return false;
    } catch (e) { return false; }

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
    } catch (e) { return false; }

    var mobile = window.innerWidth < 760;
    var DPRCAP = mobile ? 1.2 : 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPRCAP));
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    // ---------- build the field ----------
    var STAGES = ['birth', 'products', 'engineering', 'cases', 'process', 'collapse', 'rebirth'];
    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    var smooth = function (x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };

    // network nodes (funnel) + strung edge points
    var counts = mobile ? [26, 20, 13, 8, 4, 1] : [54, 42, 30, 20, 11, 4];
    var nodes = [], edges = [], golden = Math.PI * (3 - Math.sqrt(5)), layerStart = [], li, k;
    var L = counts.length;
    for (li = 0; li < L; li++) {
      layerStart[li] = nodes.length;
      var z = -1.2 + 2.4 * li / (L - 1), rad = 1.15 - 1.03 * (li / (L - 1)), nc = counts[li];
      for (k = 0; k < nc; k++) { var ang = golden * k + li * 0.7, rr = rad * Math.sqrt((k + 0.5) / nc); nodes.push([Math.cos(ang) * rr, Math.sin(ang) * rr, z, li]); }
    }
    for (li = 0; li < L - 1; li++) {
      var a0 = layerStart[li], a1 = layerStart[li + 1], b1 = (li + 2 < L ? layerStart[li + 2] : nodes.length);
      for (var ai = a0; ai < a1; ai++) {
        var best = [];
        for (var bi = a1; bi < b1; bi++) { var dx = nodes[ai][0] - nodes[bi][0], dy = nodes[ai][1] - nodes[bi][1]; best.push([dx * dx + dy * dy, bi]); }
        best.sort(function (p, q) { return p[0] - q[0]; });
        for (var e = 0; e < Math.min(3, best.length); e++) edges.push([ai, best[e][1]]);
      }
    }
    // particle homes: nodes + points along edges + a little free dust
    var home = [], isNode = [], layerOf = [];
    for (var n = 0; n < nodes.length; n++) { home.push([nodes[n][0], nodes[n][1], nodes[n][2]]); isNode.push(1); layerOf.push(nodes[n][3]); }
    var SEG = mobile ? 3 : 4;
    for (var ed = 0; ed < edges.length; ed++) {
      var A = nodes[edges[ed][0]], B = nodes[edges[ed][1]];
      for (var sg = 1; sg <= SEG; sg++) { var tt = sg / (SEG + 1); home.push([A[0] + (B[0] - A[0]) * tt, A[1] + (B[1] - A[1]) * tt, A[2] + (B[2] - A[2]) * tt]); isNode.push(0); layerOf.push(A[3]); }
    }
    var dustN = mobile ? 180 : 520;
    for (var dd = 0; dd < dustN; dd++) { var th = Math.random() * 6.2832, ph = Math.acos(2 * Math.random() - 1), rr3 = 1.5 + Math.random() * 1.4; home.push([Math.sin(ph) * Math.cos(th) * rr3, Math.cos(ph) * rr3, Math.sin(ph) * Math.sin(th) * rr3]); isNode.push(0); layerOf.push(-1); }

    var N = home.length;
    // 3 product centers · 4 case centers · rebirth seed
    var prodC = [[-1.5, 0.5, 0.2], [0.1, -1.1, 0.5], [1.6, 0.6, -0.3]];
    var caseC = [[-1.7, 0.7, 0.2], [-0.6, -1.2, 0.5], [0.9, 0.9, -0.2], [1.8, -0.5, 0.4]];
    var seed = [home[Math.floor(N * 0.5)][0], home[Math.floor(N * 0.5)][1], home[Math.floor(N * 0.5)][2]];

    // per-stage targets (Float32 per stage)
    var ST = {}; STAGES.forEach(function (s) { ST[s] = new Float32Array(N * 3); });
    var colors = new Float32Array(N * 3), seeds = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      var hx = home[i][0], hy = home[i][1], hz = home[i][2], lay = layerOf[i], j = i * 3;
      // birth = home
      ST.birth[j] = hx; ST.birth[j + 1] = hy; ST.birth[j + 2] = hz;
      // products = 3 clusters
      var pc = prodC[i % 3]; ST.products[j] = hx * 0.42 + pc[0]; ST.products[j + 1] = hy * 0.42 + pc[1]; ST.products[j + 2] = hz * 0.42 + pc[2];
      // engineering = horizontal strata (layers stacked in Y)
      var ly = lay < 0 ? (i % 5) : lay; ST.engineering[j] = hx * 1.15; ST.engineering[j + 1] = (ly - 2) * 0.62 + hy * 0.12; ST.engineering[j + 2] = hz * 1.15;
      // cases = 4 clusters
      var cc = caseC[i % 4]; ST.cases[j] = hx * 0.36 + cc[0]; ST.cases[j + 1] = hy * 0.36 + cc[1]; ST.cases[j + 2] = hz * 0.36 + cc[2];
      // process = tight ordered home
      ST.process[j] = hx * 0.82; ST.process[j + 1] = hy * 0.82; ST.process[j + 2] = hz * 0.82;
      // collapse = explode outward
      var dl = Math.sqrt(hx * hx + hy * hy + hz * hz) || 1, ex = 2.0 + (seeds[i] = Math.random()) * 1.6;
      ST.collapse[j] = hx / dl * ex + (Math.random() - 0.5) * 0.6; ST.collapse[j + 1] = hy / dl * ex + (Math.random() - 0.5) * 0.6; ST.collapse[j + 2] = hz / dl * ex + (Math.random() - 0.5) * 0.6;
      // rebirth = tiny new network at the seed point
      ST.rebirth[j] = hx * 0.13 + seed[0]; ST.rebirth[j + 1] = hy * 0.13 + seed[1]; ST.rebirth[j + 2] = hz * 0.13 + seed[2];
      // colour: cool white-blue base; ~14% cyan; ~5% violet; node-cores warm white
      var r, g, b;
      if (isNode[i] && nodes[i] && nodes[i][3] === L - 1) { r = 1.0; g = 0.86; b = 0.66; }   // converged core — warm
      else { var rr5 = Math.random(); if (rr5 < 0.05) { r = 0.72; g = 0.52; b = 1.0; } else if (rr5 < 0.19) { r = 0.42; g = 0.78; b = 1.0; } else { r = 0.82; g = 0.88; b = 1.0; } }
      colors[j] = r; colors[j + 1] = g; colors[j + 2] = b;
    }

    var geom = new THREE.BufferGeometry();
    var posArr = new Float32Array(ST.birth);                 // start assembled
    geom.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geom.setAttribute('acolor', new THREE.BufferAttribute(colors, 3));
    var sizeArr = new Float32Array(N);
    for (i = 0; i < N; i++) sizeArr[i] = isNode[i] ? (nodes[i] && nodes[i][3] === L - 1 ? 0.075 : 0.05) : 0.022;
    geom.setAttribute('asize', new THREE.BufferAttribute(sizeArr, 1));

    var FOV = 55;
    var mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      uniforms: { uOp: { value: 1.0 }, uSize: { value: 600.0 } },
      vertexShader:
        'attribute vec3 acolor; attribute float asize; varying vec3 vC; uniform float uSize;' +
        ' void main(){ vC=acolor; vec4 mv=modelViewMatrix*vec4(position,1.0);' +
        ' float ps=asize*uSize/max(0.15,-mv.z); gl_PointSize=clamp(ps,1.0,70.0); gl_Position=projectionMatrix*mv; }',
      fragmentShader:
        'varying vec3 vC; uniform float uOp; void main(){ vec2 d=gl_PointCoord-vec2(0.5); float r=dot(d,d);' +
        ' if(r>0.25) discard; float a=smoothstep(0.25,0.0,r); gl_FragColor=vec4(vC, a*0.85*uOp); }'
    });
    var points = new THREE.Points(geom, mat);
    scene.add(points);

    // ---------- scroll → stage blend ----------
    var stageIdx = 0;                 // active stage from section observer
    var stageF = 0, stageFT = 0;      // smoothed stage float
    var scrollFrac = 0;
    function readScroll() { var de = document.documentElement, m = (de.scrollHeight - de.clientHeight) || 1; scrollFrac = Math.min(1, Math.max(0, (window.pageYOffset || 0) / m)); }

    // sections drive the target stage; scroll fraction gives the in-between
    var secEls = [].slice.call(document.querySelectorAll('[data-neural-stage]'));
    var secOrder = secEls.map(function (el) { return STAGES.indexOf(el.getAttribute('data-neural-stage')); });
    if (secEls.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { var ix = secEls.indexOf(en.target); if (ix >= 0 && secOrder[ix] >= 0) stageIdx = secOrder[ix]; } });
      }, { threshold: 0.4 });
      secEls.forEach(function (el) { io.observe(el); });
    }

    // mouse (desktop only)
    var mx = 0, my = 0, mAct = 0;
    if (!mobile && !reduce) {
      window.addEventListener('pointermove', function (e) { mx = (e.clientX / window.innerWidth) * 2 - 1; my = -((e.clientY / window.innerHeight) * 2 - 1); mAct = 1; }, { passive: true });
      window.addEventListener('pointerleave', function () { mAct = 0; }, { passive: true });
    }

    var tmp = new THREE.Vector3();
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      mat.uniforms.uSize.value = renderer.domElement.height / (2 * Math.tan(FOV * Math.PI / 360));
      // shift the whole field to the right on desktop so it clears the hero text
      points.position.x = w >= 760 ? 1.7 : 0.0;
      points.position.y = 0.2;
    }
    resize();

    var raf = null, visible = true, t0 = performance.now ? performance.now() : 0, rotY = 0;
    function frame() {
      raf = null; if (!visible) return;
      var t = (performance.now ? performance.now() : Date.now());
      // smooth stage float toward (section index, nudged by scroll within page)
      stageFT = stageIdx + (scrollFrac * (STAGES.length - 1) - stageIdx) * 0.0; // section-led
      // blend: ease stageF toward the section target, plus micro-progress from scroll
      var target = stageIdx;
      stageF += (target - stageF) * 0.05;
      var kk = Math.max(0, Math.min(STAGES.length - 2, Math.floor(stageF)));
      var u = smooth(stageF - kk);
      var A = ST[STAGES[kk]], B = ST[STAGES[kk + 1]];
      var p = geom.attributes.position.array;
      var mwx = mx * 3.4 - points.position.x, mwy = my * 2.2 - points.position.y;
      for (var i2 = 0, j2 = 0; i2 < N; i2++, j2 += 3) {
        var tx = A[j2] + (B[j2] - A[j2]) * u, ty = A[j2 + 1] + (B[j2 + 1] - A[j2 + 1]) * u, tz = A[j2 + 2] + (B[j2 + 2] - A[j2 + 2]) * u;
        // gentle mouse attraction
        if (mAct) { var ddx = mwx - p[j2], ddy = mwy - p[j2 + 1], dm = ddx * ddx + ddy * ddy; if (dm < 1.4) { var f = (1.4 - dm) * 0.10; tx += ddx * f; ty += ddy * f; } }
        p[j2] += (tx - p[j2]) * 0.10; p[j2 + 1] += (ty - p[j2 + 1]) * 0.10; p[j2 + 2] += (tz - p[j2 + 2]) * 0.10;
      }
      geom.attributes.position.needsUpdate = true;
      // camera flies forward with overall scroll; gentle constant rotation
      rotY += 0.0009;
      points.rotation.y = rotY + (mAct ? mx * 0.12 : 0);
      camera.position.z = 6.0 - scrollFrac * 2.6;
      camera.position.x = (mAct ? mx * 0.18 : 0);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) raf = requestAnimationFrame(frame); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    readScroll();
    if (reduce) { renderer.render(scene, camera); }      // static one frame
    else {
      window.addEventListener('scroll', function () { readScroll(); if (!raf && visible) start(); }, { passive: true });
      start();
    }
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    if ('IntersectionObserver' in window) { new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && !reduce) start(); else stop(); }, { threshold: 0 }).observe(canvas); }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (visible && !reduce) start(); });
    return true;
  };
})();
