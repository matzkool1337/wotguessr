/*
 * WoTGuessr — ambient ember/spark background
 * ------------------------------------------
 * Lightweight canvas particle field of warm sparks drifting upward, echoing
 * the official World of Tanks site. Sits behind all content (pointer-events
 * none). Pre-rendered sprites keep it cheap; pauses when the tab is hidden.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('embers');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, particles = [], running = true, t = 0;
  var COUNT = 64;

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* Pre-render a soft radial ember sprite for a given warm hue. */
  function makeSprite(hue) {
    var s = document.createElement('canvas');
    s.width = s.height = 64;
    var c = s.getContext('2d');
    var g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0.0, 'hsla(' + hue + ',100%,72%,1)');
    g.addColorStop(0.3, 'hsla(' + hue + ',100%,56%,0.55)');
    g.addColorStop(1.0, 'hsla(' + hue + ',100%,50%,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
    return s;
  }
  var sprites = [makeSprite(6), makeSprite(20), makeSprite(34)]; // red → orange → amber

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(seeded) {
    return {
      x: rand(0, W),
      y: seeded ? rand(0, H) : H + rand(0, 60),
      r: rand(0.6, 2.6),          // base radius
      vy: rand(0.15, 0.7),        // upward speed
      drift: rand(0.1, 0.5),      // horizontal sway amount
      sway: rand(0.006, 0.02),    // sway frequency
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.35, 0.85),
      flick: rand(0.02, 0.06),    // twinkle speed
      si: (Math.random() * sprites.length) | 0,
    };
  }

  function init() {
    resize();
    particles = [];
    var n = reduce ? (COUNT / 2) | 0 : COUNT;
    for (var i = 0; i < n; i++) particles.push(spawn(true));
  }

  function frame() {
    if (!running) return;
    t += 1;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter'; // additive glow where sparks overlap
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.y -= p.vy;
      p.x += Math.sin(t * p.sway + p.phase) * p.drift;
      var a = p.alpha * (0.6 + 0.4 * Math.sin(t * p.flick + p.phase));
      if (a < 0) a = 0;
      var size = p.r * 9;
      ctx.globalAlpha = a;
      ctx.drawImage(sprites[p.si], p.x - size / 2, p.y - size / 2, size, size);
      if (p.y < -30) particles[i] = spawn(false); // recycle off the top
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });

  init();
  requestAnimationFrame(frame);
})();
