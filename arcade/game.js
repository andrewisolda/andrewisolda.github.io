(() => {
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });

  const overlay = document.getElementById("overlay");
  const ovTitle = document.getElementById("ov-title");
  const ovBody = document.getElementById("ov-body");
  const btnStart = document.getElementById("btn-start");

  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");

  // ---------- Utilities ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const dist2 = (ax, ay, bx, by) => {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  // ---------- Input ----------
  const keys = new Set();
  window.addEventListener("keydown", (e) => {
    keys.add(e.key.toLowerCase());
    if (e.key === "Escape") window.location.href = "/";
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

  const mouse = { x: innerWidth / 2, y: innerHeight / 2, down: false };
  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener("mousedown", () => (mouse.down = true));
  window.addEventListener("mouseup", () => (mouse.down = false));

  // Prevent page scroll while playing (trackpads/wheel)
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

  // ---------- Game State ----------
  const state = {
    running: false,
    time: 0,
    score: 0,
    best: Number(localStorage.getItem("arcade_best") || 0),
    difficulty: 1,
    shake: 0
  };
  bestEl.textContent = String(state.best);

  const player = {
    x: innerWidth / 2,
    y: innerHeight / 2,
    vx: 0,
    vy: 0,
    r: 10,
    fireCd: 0
  };

  const bullets = [];
  const enemies = [];
  const particles = [];

  function reset() {
    state.time = 0;
    state.score = 0;
    state.difficulty = 1;
    state.shake = 0;

    player.x = innerWidth / 2;
    player.y = innerHeight / 2;
    player.vx = 0;
    player.vy = 0;
    player.fireCd = 0;

    bullets.length = 0;
    enemies.length = 0;
    particles.length = 0;

    scoreEl.textContent = "0";
  }

  // ---------- Spawning ----------
  function spawnEnemy() {
    // spawn just outside screen
    const margin = 60;
    let x, y;
    const side = Math.floor(rand(0, 4));
    if (side === 0) { x = rand(-margin, innerWidth + margin); y = -margin; }
    if (side === 1) { x = innerWidth + margin; y = rand(-margin, innerHeight + margin); }
    if (side === 2) { x = rand(-margin, innerWidth + margin); y = innerHeight + margin; }
    if (side === 3) { x = -margin; y = rand(-margin, innerHeight + margin); }

    // Types: chaser, drifter, swarm, tank
    const roll = Math.random();
    let type = "chaser";
    if (roll > 0.55) type = "drifter";
    if (roll > 0.78) type = "swarm";
    if (roll > 0.92) type = "tank";

    const base = {
      x, y,
      vx: 0, vy: 0,
      type,
      hit: 0
    };

    if (type === "chaser") {
      base.r = 12;
      base.hp = 2;
      base.spd = rand(75, 115);
      base.col = "rgba(255,70,220,0.95)";
    } else if (type === "drifter") {
      base.r = 10;
      base.hp = 2;
      base.spd = rand(55, 90);
      base.col = "rgba(255,210,40,0.95)";
      base.wob = rand(0.8, 1.6);
      base.ang = rand(0, Math.PI * 2);
    } else if (type === "swarm") {
      base.r = 7;
      base.hp = 1;
      base.spd = rand(130, 180);
      base.col = "rgba(80,255,255,0.95)";
    } else { // tank
      base.r = 16;
      base.hp = 6;
      base.spd = rand(35, 55);
      base.col = "rgba(255,80,80,0.95)";
    }

    enemies.push(base);
  }

  function spawnBurst(x, y, color, count = 18, force = 220) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(force * 0.35, force);
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: rand(0.35, 0.85),
        t: 0,
        col: color
      });
    }
  }

  // ---------- Drawing helpers ----------
  function glowCircle(x, y, r, color, blur = 18) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function strokeCircle(x, y, r, color, w = 2) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawPlayer() {
    // triangle pointing at aim
    const ang = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(ang);

    // glow
    ctx.shadowColor = "rgba(120,220,255,0.9)";
    ctx.shadowBlur = 22;

    ctx.fillStyle = "rgba(120,220,255,0.95)";
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-10, -9);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-10, 9);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawEnemy(e) {
    // hit flash
    const flash = e.hit > 0 ? 0.7 : 0;
    const col = e.col;

    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = 18;

    if (e.type === "chaser") {
      // triangle
      const ang = Math.atan2(player.y - e.y, player.x - e.x);
      ctx.translate(e.x, e.y);
      ctx.rotate(ang);
      ctx.fillStyle = flash ? "rgba(255,255,255,0.95)" : col;
      ctx.beginPath();
      ctx.moveTo(e.r + 6, 0);
      ctx.lineTo(-e.r, -e.r * 0.75);
      ctx.lineTo(-e.r * 0.7, 0);
      ctx.lineTo(-e.r, e.r * 0.75);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === "drifter") {
      ctx.fillStyle = flash ? "rgba(255,255,255,0.95)" : col;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
      strokeCircle(e.x, e.y, e.r + 4, "rgba(255,255,255,0.18)", 2);
    } else if (e.type === "swarm") {
      ctx.fillStyle = flash ? "rgba(255,255,255,0.95)" : col;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // tank square
      const s = e.r * 1.45;
      ctx.fillStyle = flash ? "rgba(255,255,255,0.95)" : col;
      ctx.fillRect(e.x - s / 2, e.y - s / 2, s, s);
      strokeCircle(e.x, e.y, e.r + 8, "rgba(255,255,255,0.14)", 2);
    }

    ctx.restore();
  }

  function drawBullet(b) {
    glowCircle(b.x, b.y, 2.6, "rgba(255,255,255,0.95)", 12);
  }

  function drawParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.001, dt); // fast damping
      p.vy *= Math.pow(0.001, dt);

      const a = clamp(p.life, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      glowCircle(p.x, p.y, 2.0, p.col, 14);
      ctx.restore();
    }
  }

  // ---------- Update ----------
  function update(dt) {
    state.time += dt;

    // Difficulty ramps over time
    state.difficulty = 1 + state.time * 0.04;

    // Score: time survived + kills
    state.score += dt * 10;
    scoreEl.textContent = String(Math.floor(state.score));

    // Player movement
    const up = keys.has("w") || keys.has("arrowup");
    const down = keys.has("s") || keys.has("arrowdown");
    const left = keys.has("a") || keys.has("arrowleft");
    const right = keys.has("d") || keys.has("arrowright");

    const ax = (right ? 1 : 0) - (left ? 1 : 0);
    const ay = (down ? 1 : 0) - (up ? 1 : 0);
    const len = Math.hypot(ax, ay) || 1;

    const accel = 1600;   // snappy
    const maxSpd = 420;

    player.vx += (ax / len) * accel * dt;
    player.vy += (ay / len) * accel * dt;

    // friction
    player.vx *= Math.pow(0.0015, dt);
    player.vy *= Math.pow(0.0015, dt);

    // clamp speed
    const sp = Math.hypot(player.vx, player.vy);
    if (sp > maxSpd) {
      player.vx = (player.vx / sp) * maxSpd;
      player.vy = (player.vy / sp) * maxSpd;
    }

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    player.x = clamp(player.x, 20, innerWidth - 20);
    player.y = clamp(player.y, 20, innerHeight - 20);

    // Shooting
    player.fireCd -= dt;
    if (mouse.down && player.fireCd <= 0) {
      player.fireCd = 0.07; // fire rate
      const ang = Math.atan2(mouse.y - player.y, mouse.x - player.x);
      const spd = 820;

      bullets.push({
        x: player.x + Math.cos(ang) * 16,
        y: player.y + Math.sin(ang) * 16,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1.2
      });

      // tiny muzzle pop
      spawnBurst(player.x + Math.cos(ang) * 18, player.y + Math.sin(ang) * 18, "rgba(255,255,255,0.7)", 6, 120);
    }

    // Spawn enemies
    const spawnRate = clamp(0.55 - state.difficulty * 0.02, 0.10, 0.55); // seconds between spawns
    if (!state._nextSpawn) state._nextSpawn = 0.2;
    state._nextSpawn -= dt;
    if (state._nextSpawn <= 0) {
      spawnEnemy();
      state._nextSpawn = spawnRate;
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.life -= dt;
      if (b.life <= 0) { bullets.splice(i, 1); continue; }
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // offscreen cull
      if (b.x < -50 || b.x > innerWidth + 50 || b.y < -50 || b.y > innerHeight + 50) {
        bullets.splice(i, 1);
      }
    }

    // Update enemies + collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.hit -= dt;

      const toPX = player.x - e.x;
      const toPY = player.y - e.y;
      const d = Math.hypot(toPX, toPY) || 1;

      if (e.type === "chaser" || e.type === "swarm" || e.type === "tank") {
        const spd = e.spd * (1 + state.difficulty * 0.12);
        e.vx = (toPX / d) * spd;
        e.vy = (toPY / d) * spd;
      } else if (e.type === "drifter") {
        e.ang += dt * e.wob;
        const spd = e.spd * (1 + state.difficulty * 0.08);
        // drift toward player but with wobble
        e.vx = (toPX / d) * spd + Math.cos(e.ang) * 90;
        e.vy = (toPY / d) * spd + Math.sin(e.ang) * 90;
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // Player collision (instant death)
      if (dist2(e.x, e.y, player.x, player.y) < (e.r + player.r) * (e.r + player.r)) {
        die();
        return;
      }

      // Bullet collisions
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (dist2(e.x, e.y, b.x, b.y) < (e.r + 3) * (e.r + 3)) {
          bullets.splice(j, 1);
          e.hp -= 1;
          e.hit = 0.08;

          spawnBurst(b.x, b.y, "rgba(255,255,255,0.85)", 8, 160);

          if (e.hp <= 0) {
            // Score for kill
            const bonus = e.type === "tank" ? 60 : e.type === "swarm" ? 20 : 35;
            state.score += bonus;

            spawnBurst(e.x, e.y, e.col, e.type === "tank" ? 34 : 22, e.type === "tank" ? 320 : 250);
            state.shake = Math.min(18, state.shake + (e.type === "tank" ? 12 : 6));

            enemies.splice(i, 1);
          }
          break;
        }
      }
    }

    // camera shake decay
    state.shake *= Math.pow(0.0008, dt);

    drawParticles(dt);
  }

  // ---------- Render ----------
  function render() {
    // background with subtle fade for trails
    ctx.fillStyle = "rgba(5,6,10,0.22)";
    ctx.fillRect(0, 0, innerWidth, innerHeight);

    // faint grid
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    const step = 80;
    for (let x = 0; x < innerWidth; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, innerHeight); ctx.stroke();
    }
    for (let y = 0; y < innerHeight; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(innerWidth, y); ctx.stroke();
    }
    ctx.restore();

    // draw bullets
    for (const b of bullets) drawBullet(b);

    // draw enemies
    for (const e of enemies) drawEnemy(e);

    // draw player
    drawPlayer();
  }

  // ---------- Loop ----------
  let last = 0;
  function loop(t) {
    if (!state.running) return;
    const now = t / 1000;
    const dt = clamp(now - last, 0, 0.033);
    last = now;

    // apply shake by offsetting draw
    const s = state.shake;
    const ox = (Math.random() - 0.5) * s;
    const oy = (Math.random() - 0.5) * s;

    ctx.save();
    ctx.translate(ox, oy);

    update(dt);
    render();

    ctx.restore();

    requestAnimationFrame(loop);
  }

  function start() {
    overlay.classList.add("hidden");
    reset();
    state.running = true;
    last = performance.now() / 1000;
    // clear background once
    ctx.fillStyle = "#05060a";
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    requestAnimationFrame(loop);
  }

  function die() {
    state.running = false;

    // best
    const final = Math.floor(state.score);
    if (final > state.best) {
      state.best = final;
      localStorage.setItem("arcade_best", String(final));
      bestEl.textContent = String(final);
    }

    ovTitle.textContent = "You exploded (tastefully).";
    ovBody.textContent = `Score: ${final} • Best: ${state.best}`;
    btnStart.textContent = "Restart";
    overlay.classList.remove("hidden");

    // little death burst at player
    spawnBurst(player.x, player.y, "rgba(120,220,255,0.95)", 60, 420);
  }

  // Start button + click overlay
  btnStart.addEventListener("click", start);
  overlay.addEventListener("click", (e) => {
    // Don’t start if they clicked a link/button
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "A" || tag === "BUTTON") return;
    start();
  });

  // Initial message
  ovTitle.textContent = "Click to start";
  ovBody.textContent = "Move: WASD/Arrows • Aim: Mouse • Fire: Click/hold • Esc: Exit";
})();
