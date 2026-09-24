// ============================================================
// network-bg.js — animated 3D-style network background
// Canvas 2D with pseudo-3D projection: depth-scaled nodes,
// server racks, blinking link lights, travelling data packets.
// Respects prefers-reduced-motion. ~2 KB, no libraries.
// ============================================================
(function () {
  'use strict';

  var canvas = document.getElementById('network-bg');
  if (!canvas) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = canvas.getContext('2d');
  var W, H, DPR;

  // ---------- Config ----------
  var NODE_COUNT = 46;          // network nodes
  var SERVER_COUNT = 4;         // server racks
  var PACKET_COUNT = 7;         // data packets travelling on links
  var MAX_DEPTH = 1;            // z range 0..1 (0 = far, 1 = near)
  var LINK_DIST = 180;          // px max distance for a link

  var nodes = [];
  var servers = [];
  var packets = [];

  function rand(min, max) { return min + Math.random() * (max - min); }

  // ---------- Setup ----------
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function initNodes() {
    nodes = [];
    for (var i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random(),                      // depth 0..1
        vx: rand(-0.18, 0.18),
        vy: rand(-0.12, 0.12),
        r: rand(1.4, 3.2),
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: rand(0.008, 0.02)
      });
    }
  }

  function initServers() {
    servers = [];
    for (var i = 0; i < SERVER_COUNT; i++) {
      servers.push({
        x: rand(0.08, 0.92) * W,
        y: rand(0.15, 0.85) * H,
        z: rand(0.55, 1),                      // servers sit near front
        w: rand(34, 52),
        h: rand(46, 72),
        blinks: [
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ],
        blinkSpeed: rand(0.02, 0.05)
      });
    }
  }

  function initPackets() {
    packets = [];
    for (var i = 0; i < PACKET_COUNT; i++) {
      packets.push(newPacket(true));
    }
  }

  function newPacket(anywhere) {
    // pick a random node pair that is close enough to link
    for (var tries = 0; tries < 20; tries++) {
      var a = nodes[(Math.random() * nodes.length) | 0];
      var b = nodes[(Math.random() * nodes.length) | 0];
      var dx = a.x - b.x, dy = a.y - b.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 40 && dist < LINK_DIST) {
        return { a: a, b: b, t: anywhere ? Math.random() : 0, speed: rand(0.004, 0.012) };
      }
    }
    return null;
  }

  // ---------- Pseudo-3D helpers ----------
  function scaleFor(z) { return 0.45 + z * 0.55; }        // far things smaller
  function alphaFor(z) { return 0.25 + z * 0.6; }         // far things fainter

  // ---------- Draw ----------
  var mouse = { x: -9999, y: -9999 };

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    var i, j, n, s, p;

    // ---- move nodes ----
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      n.x += n.vx * scaleFor(n.z);
      n.y += n.vy * scaleFor(n.z);
      n.pulse += n.pulseSpeed;
      if (n.x < -20) n.x = W + 20; if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20; if (n.y > H + 20) n.y = -20;

      // gentle parallax away from cursor
      var mdx = n.x - mouse.x, mdy = n.y - mouse.y;
      var mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < 110 && mdist > 0.01) {
        var push = (110 - mdist) / 110 * 0.35 * scaleFor(n.z);
        n.x += (mdx / mdist) * push;
        n.y += (mdy / mdist) * push;
      }
    }

    // ---- links ----
    ctx.lineWidth = 1;
    for (i = 0; i < nodes.length; i++) {
      for (j = i + 1; j < nodes.length; j++) {
        var a = nodes[i], b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          var dist = Math.sqrt(d2);
          var depth = Math.min(a.z, b.z);
          var alpha = (1 - dist / LINK_DIST) * 0.28 * alphaFor(depth);
          ctx.strokeStyle = 'rgba(14, 124, 134, ' + alpha.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // ---- packets ----
    for (i = 0; i < packets.length; i++) {
      p = packets[i];
      if (!p || !p.a || !p.b) { packets[i] = newPacket(false); continue; }
      p.t += p.speed;
      if (p.t >= 1) { packets[i] = newPacket(false); continue; }

      var px = p.a.x + (p.b.x - p.a.x) * p.t;
      var py = p.a.y + (p.b.y - p.a.y) * p.t;
      var pz = Math.min(p.a.z, p.b.z);

      var grad = ctx.createLinearGradient(p.a.x, p.a.y, p.b.x, p.b.y);
      grad.addColorStop(Math.max(0, p.t - 0.25), 'rgba(14, 124, 134, 0)');
      grad.addColorStop(p.t, 'rgba(53, 196, 208, ' + (0.85 * alphaFor(pz)).toFixed(3) + ')');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.a.x, p.a.y);
      ctx.lineTo(px, py);
      ctx.stroke();

      // packet head
      ctx.fillStyle = 'rgba(10, 95, 104, ' + (0.9 * alphaFor(pz)).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(px, py, 2 * scaleFor(pz), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = 1;

    // ---- nodes ----
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      var sc = scaleFor(n.z);
      var glow = 0.55 + Math.sin(n.pulse) * 0.45;
      var r = n.r * sc;

      ctx.fillStyle = 'rgba(14, 124, 134, ' + (alphaFor(n.z) * (0.5 + glow * 0.5)).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();

      // halo ring on stronger pulse
      if (glow > 0.85 && n.z > 0.6) {
        ctx.strokeStyle = 'rgba(14, 124, 134, ' + (0.25 * alphaFor(n.z)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 3 + glow * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // ---- server racks (pseudo-3D boxes) ----
    for (i = 0; i < servers.length; i++) {
      s = servers[i];
      var sw = s.w * scaleFor(s.z);
      var sh = s.h * scaleFor(s.z);
      var sx = s.x, sy = s.y;
      var depth = Math.max(6, 10 * scaleFor(s.z));
      var salpha = alphaFor(s.z);

      // 3D: top face (parallelogram)
      ctx.fillStyle = 'rgba(14, 124, 134, ' + (0.10 * salpha).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + depth * 0.7, sy - depth * 0.5);
      ctx.lineTo(sx + sw + depth * 0.7, sy - depth * 0.5);
      ctx.lineTo(sx + sw, sy);
      ctx.closePath();
      ctx.fill();

      // 3D: right face
      ctx.fillStyle = 'rgba(14, 124, 134, ' + (0.16 * salpha).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(sx + sw, sy);
      ctx.lineTo(sx + sw + depth * 0.7, sy - depth * 0.5);
      ctx.lineTo(sx + sw + depth * 0.7, sy + sh - depth * 0.5);
      ctx.lineTo(sx + sw, sy + sh);
      ctx.closePath();
      ctx.fill();

      // front face
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.75 * salpha).toFixed(3) + ')';
      ctx.strokeStyle = 'rgba(14, 124, 134, ' + (0.55 * salpha).toFixed(3) + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.rect(sx, sy, sw, sh);
      ctx.fill();
      ctx.stroke();

      // rack slots + blinking activity LEDs
      var slots = 4;
      for (j = 0; j < slots; j++) {
        var syj = sy + (sh / slots) * j + 3 * scaleFor(s.z);
        ctx.strokeStyle = 'rgba(14, 124, 134, ' + (0.30 * salpha).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(sx + 3, syj + (sh / slots) - 5);
        ctx.lineTo(sx + sw - 3, syj + (sh / slots) - 5);
        ctx.stroke();

        // LED
        s.blinks[j % 3] += s.blinkSpeed;
        var on = Math.sin(s.blinks[j % 3]) > 0;
        ctx.fillStyle = on
          ? 'rgba(10, 95, 104, ' + (0.95 * salpha).toFixed(3) + ')'
          : 'rgba(14, 124, 134, ' + (0.25 * salpha).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(sx + sw - 7, syj + (sh / slots) / 2, 1.6 * scaleFor(s.z), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.lineWidth = 1;
    }

    if (!reduceMotion) requestAnimationFrame(draw);
  }

  // ---------- Boot ----------
  resize();
  initNodes();
  initServers();
  initPackets();

  window.addEventListener('resize', function () {
    resize();
    initNodes();
    initServers();
    initPackets();
  });

  window.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  window.addEventListener('mouseout', function () { mouse.x = -9999; mouse.y = -9999; });

  if (reduceMotion) {
    draw(0); // single static frame
  } else {
    requestAnimationFrame(draw);
  }
})();
