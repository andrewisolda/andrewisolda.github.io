(() => {
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });

  const overlay = document.getElementById("overlay");
  const ovTitle = document.getElementById("ov-title");
  const ovBody = document.getElementById("ov-body");
  const ovNote = document.getElementById("ov-note");
  const btnStart = document.getElementById("btn-start");

  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const bombsEl = document.getElementById("bombs");

  const stickMoveEl = document.getElementById("stick-move");
  const stickAimEl = document.getElementById("stick-aim");
  const btnFire = document.getElementById("btn-fire");
  const btnBomb = document.getElementById("btn-bomb");

  // ---------- Utilities ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const dist2 = (ax, ay, bx, by) => {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
  };
  const hypot = (x, y) => Math.hypot(x, y) || 1;

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
    const k = e.key.toLowerCase();
    keys.add(k);

    // Prevent page scroll with arrows/space while playing
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === "Escape") window.location.href = "/";

    // Bomb on Space press
    if (e.key === " " || e.code === "Space") {
      input.bombPressed = true;
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", (e) => {
    keys.delete(e.key.toLowerCase());
  });

  // Mouse is still used for menu clicks, but NOT required for shooting now
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

  // Prevent page scroll while playing
  window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

  // Pause on tab blur
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.running) {
      pause("Paused (tab inactive). Click Start to resume.");
    }
  });

  // ---------- Touch sticks ----------
  const isTouch =
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  function makeStick(el) {
    const knob = el.querySelector(".stick__knob");
    const rect = () => el.getBoundingClientRect();
    const max = 60;
    const stick = { id: null, active: false, dx: 0, dy: 0 };

    function setKnob(dx, dy) {
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    function down(e) {
      e.preventDefault();
      stick.active = true;
      stick.id = e.pointerId;

      const r = rect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);

      const d = hypot(x, y);
      const m = Math.min(max, d);
      stick.dx = (x / d) * m;
      stick.dy = (y / d) * m;
      setKnob(stick.dx, stick.dy);

      el.setPointerCapture(e.pointerId);
    }

    function move(e) {
      if (!stick.active || e.pointerId !== stick.id) return;
      e.preventDefault();

      const r = rect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);

      const d = hypot(x, y);
      const m = Math.min(max, d);
      stick.dx = (x / d) * m;
      stick.dy = (y / d) * m;
      setKnob(stick.dx, stick.dy);
    }

    function up(e) {
      if (e.pointerId !== stick.id) return;
      stick.active = false;
      stick.id = null;
      stick.dx = 0;
      stick.dy = 0;
      setKnob(0, 0);
    }

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    return stick;
  }

  const stickMove = isTouch && stickMoveEl ? makeStick(stickMoveEl) : null;
  const stickAim = isTouch && stickAimEl ? makeStick(stickAimEl) : null;

  // Touch buttons
  let touchFireHeld = false;
  let touchBombPressed = false;

  if (btnFire) {
    btnFire.addEventListener("pointerdown", (e) => { e.preventDefault(); touchFireHeld = true; });
    btnFire.addEventListener("pointerup", (e) => { e.preventDefault(); touchFireHeld = false; });
    btnFire.addEventListener("pointercancel", () => { touchFireHeld = false; });
  }

  if (btnBomb) {
    btnBomb.addEventListener("click", (e) => { e.preventDefault(); touchBombPressed = true; });
  }

  // ---------- Unified input object ----------
  const input = {
    moveX: 0, moveY: 0,
    aimX: 1, aimY: 0,
    firing: false,
    bombPressed: false,

    // keyboard internal
    kbMoveX: 0, kbMoveY: 0,
    kbAimX: 1, kbAimY: 0,
    kbFiring: false
  };

  // Keyboard: WASD for movement, Arrow keys for aim + shooting
  function applyKeyboardInput() {
    // Movement (WASD)
    const up = keys.has("w");
    const down = keys.has("s");
    const left = keys.has("a");
    const right = keys.has("d");

    let mx = (right ? 1 : 0) - (left ? 1 : 0);
    let my = (down ? 1 : 0) - (up ? 1 : 0);

    const ml = hypot(mx, my);
    mx /= ml; my /= ml;
    if (!isFinite(mx)) mx = 0;
    if (!isFinite(my)) my = 0;

    input.kbMoveX = mx;
    input.kbMoveY = my;

    // Aim + Shoot (Arrow keys)
    const aimUp = keys.has("arrowup");
    const aimDown = keys.has("arrowdown");
    const aimLeft = keys.has("arrowleft");
    const aimRight = keys.has("arrowright");

    let ax = (aimRight ? 1 : 0) - (aimLeft ? 1 : 0);
    let ay = (aimDown ? 1 : 0) - (aimUp ? 1 : 0);

    const aiming = (aimUp || aimDown || aimLeft || aimRight);

    if (aiming) {
      const al = hypot(ax, ay);
      ax /= al; ay /= al;
      if (isFinite(ax) && isFinite(ay)) {
        input.kbAimX = ax;
        input.kbAimY = ay;
      }
    }

    // Auto-fire while aiming (holding arrows)
    input.kbFiring = aiming;
  }

  // ---------- Gamepad ----------
  function deadzone(v, dz = 0.18) {
    const a = Math.abs(v);
    if (a < dz) return 0;
    const s = v / a;
    return s * (a - dz) / (1 - dz);
  }

  function readGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const p of pads) { if (p && p.connected) { gp = p; break; } }
    if (!gp) return null;

    const ax0 = deadzone(gp.axes[0] || 0);
    const ax1 = deadzone(gp.axes[1] || 0);
    const ax2 = deadzone(gp.axes[2] || 0);
    const ax3 = deadzone(gp.axes[3] || 0);

    // Fire: RT (button 7) or A (0)
    const fire = (gp.buttons[7]?.value || 0) > 0.2 || !!gp.buttons[0]?.pressed;
    // Bomb: LB (4) or X (2)
    const bomb = !!gp.buttons[4]?.pressed || !!gp.buttons[2]?.pressed;

    return { moveX: ax0, moveY: ax1, aimX: ax2, aimY: ax3, fire, bomb };
  }

  // ---------- Game State ----------
  const state = {
    running: false,
    time: 0,
    score: 0,
    best: Number(localStorage.getItem("arcade_best") || 0),
    difficulty: 1,
    shake: 0,
    bombs: 1,
    bombRecharge: 0
  };
  bestEl.textContent = String(state.best);
  bombsEl.textContent = String(state.bombs);

  const player = {
    x: innerWidth / 2,
    y: innerHeight / 2,
    vx: 0, vy: 0,
    r: 10,
    fireCd: 0
  };

  const bullets = [];
  const enemies = [];
  const particles = [];
  const pickups = []; // bomb pickups

  function reset() {
    state.time = 0;
    state.score = 0;
    state.difficulty = 1;
    state.shake = 0;
    state.bombs = 1;
    state.bombRecharge = 0;
    bombsEl.textContent = String(state.bombs);

    player.x = innerWidth / 2;
    player.y = innerHeight / 2;
    player.vx = 0;
    player.vy = 0;
    player.fireCd = 0;

    bullets.length = 0;
    enemies.length = 0;
    particles.length = 0;
    pickups.length = 0;

    scoreEl.textContent = "0";
    ovNote.textContent = "";
  }

  // ---------- Spawn patterns ----------
  const pattern = { nextIn: 0.5 };

  function spawnEnemyAt(x, y, typeOverride = null) {
    const type = typeOverride || (() => {
      const roll = Math.random();
      if (roll > 0.92) return "tank";
      if (roll > 0.76) return "swarm";
      if (roll > 0.52) return "drifter";
      return "chaser";
    })();

    const e = { x, y, vx: 0, vy: 0, type, hit: 0 };

    if (type === "chaser") {
      e.r = 12; e.hp = 2; e.spd = rand(75, 115);
      e.col = "rgba(255,70,220,0.95)";
    } else if (type === "drifter") {
      e.r = 10; e.hp = 2; e.spd = rand(55, 90);
      e.col = "rgba(255,210,40,0.95)";
      e.wob = rand(0.8, 1.6); e.ang = rand(0, Math.PI * 2);
    } else if (type === "swarm") {
      e.r = 7; e.hp = 1; e.spd = rand(130, 180);
      e.col = "rgba(80,255,255,0.95)";
    } else {
      e.r = 16; e.hp = 6; e.spd = rand(35, 55);
      e.col = "rgba(255,80,80,0.95)";
    }

    enemies.push(e);
  }

  function spawnOutside(typeOverride = null) {
    const margin = 70;
    let x, y;
    const side = Math.floor(rand(0, 4));
    if (side === 0) { x = rand(-margin, innerWidth + margin); y = -margin; }
    if (side === 1) { x = innerWidth + margin; y = rand(-margin, innerHeight + margin); }
    if (side === 2) { x = rand(-margin, innerWidth + margin); y = innerHeight + margin; }
    if (side === 3) { x = -margin; y = rand(-margin, innerHeight + margin); }
    spawnEnemyAt(x, y, typeOverride);
  }

  function spawnRing(count = 10) {
    const r = Math.min(innerWidth, innerHeight) * 0.55;
    const cx = innerWidth / 2;
    const cy = innerHeight / 2;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      spawnEnemyAt(cx + Math.cos(a) * r, cy + Math.sin(a) * r, "chaser");
    }
  }

  function spawnLane() {
    const vertical = Math.random() > 0.5;
    const count = Math.floor(rand(8, 14));
    const margin = 80;

    if (vertical) {
      const x = Math.random() > 0.5 ? -margin : innerWidth + margin;
      const y0 = rand(40, innerHeight - 40);
      for (let i = 0; i < count; i++) spawnEnemyAt(x, y0 + i * 22, "swarm");
    } else {
      const y = Math.random() > 0.5 ? -margin : innerHeight + margin;
      const x0 = rand(40, innerWidth - 40);
      for (let i = 0; i < count; i++) spawnEnemyAt(x0 + i * 22, y, "swarm");
    }
  }

  function spawnBurst() {
    const n = Math.floor(rand(6, 10));
    for (let i = 0; i < n; i++) spawnOutside();
    if (Math.random() > 0.85) spawnOutside("tank");
  }

  function spawnDrifters(count = 6) {
    for (let i = 0; i < count; i++) spawnOutside("drifter");
  }

  function schedulePatterns(dt) {
    pattern.nextIn -= dt;
    if (pattern.nextIn > 0) return;

    const d = state.difficulty;
    const pace = clamp(0.9 - d * 0.02, 0.25, 0.9);
    pattern.nextIn = rand(pace * 0.7, pace * 1.2);

    const roll = Math.random();
    if (roll < 0.30) spawnBurst();
    else if (roll < 0.48) spawnLane();
    else if (roll < 0.62) spawnDrifters(Math.floor(rand(4, 7)));
    else if (roll < 0.76) spawnRing(Math.floor(rand(8, 12)));
    else for (let i = 0; i < Math.floor(rand(4, 7)); i++) spawnOutside();
  }

  // ---------- Particles / glow ----------
  function spawnBurstParticles(x, y, color, count = 18, force = 220) {
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

  // ---------- Smart bomb ----------
  function addBomb(n = 1) {
    state.bombs = clamp(state.bombs + n, 0, 3);
    bombsEl.textContent = String(state.bombs);
  }

  function smartBomb() {
    if (state.bombs <= 0) return;

    state.bombs -= 1;
    bombsEl.textContent = String(state.bombs);

    const cx = player.x, cy = player.y;
    const radius = 520;
    const r2 = radius * radius;

    let cleared = 0;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (dist2(cx, cy, e.x, e.y) <= r2) {
        cleared += 1;
        spawnBurstParticles(e.x, e.y, e.col, e.type === "tank" ? 42 : 26, e.type === "tank" ? 360 : 280);
        enemies.splice(i, 1);
      }
    }

    particles.push({ ring: true, x: cx, y: cy, life: 0.35, t: 0 });
    state.score += cleared * 40;
    state.shake = Math.min(26, state.shake + 18);
  }

  function maybeRechargeBomb(dt) {
    state.bombRecharge += dt;
    if (state.bombRecharge >= 18) {
      state.bombRecharge = 0;
      if (state.bombs < 3) addBomb(1);
    }
  }

  function spawnBombPickup(x, y) {
    pickups.push({ x, y, r: 9, t: 0, life: 12 });
  }

  function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.t += dt;
      p.life -= dt;
      if (p.life <= 0) { pickups.splice(i, 1); continue; }

      if (dist2(p.x, p.y, player.x, player.y) < (p.r + player.r + 6) * (p.r + player.r + 6)) {
        addBomb(1);
        spawnBurstParticles(p.x, p.y, "rgba(255,255,255,0.9)", 20, 220);
        pickups.splice(i, 1);
      }
    }
  }

  // ---------- Drawing ----------
  function drawPlayer() {
    const ang = Math.atan2(input.aimY, input.aimX);

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(ang);

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
    const flash = e.hit > 0 ? 1 : 0;
    const col = e.col;

    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = 18;

    if (e.type === "chaser") {
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

  function drawPickups() {
    for (const p of pickups) {
      const pulse = 0.6 + Math.sin(p.t * 6) * 0.35;
      glowCircle(p.x, p.y, p.r, "rgba(255,255,255,0.35)", 18);
      strokeCircle(p.x, p.y, p.r + 4, `rgba(255,255,255,${0.35 * pulse})`, 2);
    }
  }

  function drawParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      if (p.ring) {
        p.t += dt;
        p.life -= dt;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        const k = 1 - p.life / 0.35;
        const rr = 40 + k * 520;
        ctx.save();
        ctx.globalAlpha = 0.22 * (1 - k);
        ctx.shadowColor = "rgba(120,220,255,0.9)";
        ctx.shadowBlur = 18;
        ctx.strokeStyle = "rgba(120,220,255,0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      p.t += dt;
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.001, dt);
      p.vy *= Math.pow(0.001, dt);

      const a = clamp(p.life, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      glowCircle(p.x, p.y, 2.0, p.col, 14);
      ctx.restore();
    }
  }

  // ---------- Update ----------
  function updateUnifiedInput() {
    input.bombPressed = false;

    // Keyboard baseline
    applyKeyboardInput();

    // Touch sticks (if present)
    const tMoveX = stickMove ? (stickMove.dx / 60) : 0;
    const tMoveY = stickMove ? (stickMove.dy / 60) : 0;
    const tAimX = stickAim ? (stickAim.dx / 60) : 0;
    const tAimY = stickAim ? (stickAim.dy / 60) : 0;

    // Gamepad
    const gp = readGamepad();

    // Movement: prefer touch > gamepad > keyboard
    let mx = 0, my = 0;
    if (stickMove && stickMove.active) { mx = tMoveX; my = tMoveY; }
    else if (gp) { mx = gp.moveX; my = gp.moveY; }
    else { mx = input.kbMoveX || 0; my = input.kbMoveY || 0; }

    // Aim: prefer touch aim > gamepad aim > keyboard aim (last arrow direction)
    let ax = 0, ay = 0;
    if (stickAim && stickAim.active) { ax = tAimX; ay = tAimY; }
    else if (gp && (Math.abs(gp.aimX) + Math.abs(gp.aimY) > 0.05)) { ax = gp.aimX; ay = gp.aimY; }
    else { ax = input.kbAimX; ay = input.kbAimY; }

    // Normalize aim
    const al = hypot(ax, ay);
    ax /= al; ay /= al;
    if (!isFinite(ax)) { ax = 1; ay = 0; }

    // Fire: touch button > gamepad > keyboard (holding arrows)
    const firing = !!touchFireHeld || (gp ? gp.fire : false) || !!input.kbFiring;

    // Bomb: space press OR touch bomb OR gamepad bomb
    const bombPressed = !!touchBombPressed || (gp ? gp.bomb : false) || !!input.bombPressed;
    touchBombPressed = false;

    input.moveX = mx;
    input.moveY = my;
    input.aimX = ax;
    input.aimY = ay;
    input.firing = firing;
    input.bombPressed = bombPressed;
  }

  function update(dt) {
    state.time += dt;
    state.difficulty = 1 + state.time * 0.05;

    // Score: time survived
    state.score += dt * 10;
    scoreEl.textContent = String(Math.floor(state.score));

    updateUnifiedInput();

    // Bomb
    if (input.bombPressed) smartBomb();

    // Recharge bombs
    maybeRechargeBomb(dt);

    // Player movement
    const accel = 1650;
    const maxSpd = 440;

    player.vx += input.moveX * accel * dt;
    player.vy += input.moveY * accel * dt;

    player.vx *= Math.pow(0.0015, dt);
    player.vy *= Math.pow(0.0015, dt);

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
    if (input.firing && player.fireCd <= 0) {
      player.fireCd = 0.07;
      const spd = 860;

      bullets.push({
        x: player.x + input.aimX * 16,
        y: player.y + input.aimY * 16,
        vx: input.aimX * spd,
        vy: input.aimY * spd,
        life: 1.2
      });

      spawnBurstParticles(
        player.x + input.aimX * 18,
        player.y + input.aimY * 18,
        "rgba(255,255,255,0.7)",
        6,
        120
      );
    }

    // Pattern spawns
    schedulePatterns(dt);

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.life -= dt;
      if (b.life <= 0) { bullets.splice(i, 1); continue; }
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.x < -80 || b.x > innerWidth + 80 || b.y < -80 || b.y > innerHeight + 80) {
        bullets.splice(i, 1);
      }
    }

    // Update pickups
    updatePickups(dt);

    // Update enemies + collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.hit -= dt;

      const toPX = player.x - e.x;
      const toPY = player.y - e.y;
      const d = hypot(toPX, toPY);

      if (e.type === "chaser" || e.type === "swarm" || e.type === "tank") {
        const spd = e.spd * (1 + state.difficulty * 0.11);
        e.vx = (toPX / d) * spd;
        e.vy = (toPY / d) * spd;
      } else if (e.type === "drifter") {
        e.ang += dt * e.wob;
        const spd = e.spd * (1 + state.difficulty * 0.08);
        e.vx = (toPX / d) * spd + Math.cos(e.ang) * 90;
        e.vy = (toPY / d) * spd + Math.sin(e.ang) * 90;
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // Player collision (death)
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

          spawnBurstParticles(b.x, b.y, "rgba(255,255,255,0.85)", 8, 160);

          if (e.hp <= 0) {
            const bonus = e.type === "tank" ? 70 : e.type === "swarm" ? 22 : 38;
            state.score += bonus;

            spawnBurstParticles(
              e.x, e.y, e.col,
              e.type === "tank" ? 44 : 24,
              e.type === "tank" ? 360 : 260
            );

            // Chance to drop a bomb pickup
            const drop = e.type === "tank" ? 0.30 : 0.06;
            if (Math.random() < drop && state.bombs < 3) spawnBombPickup(e.x, e.y);

            state.shake = Math.min(22, state.shake + (e.type === "tank" ? 13 : 6));
            enemies.splice(i, 1);
          }
          break;
        }
      }
    }

    state.shake *= Math.pow(0.0008, dt);

    drawParticles(dt);
  }

  // ---------- Render ----------
  function render() {
    // background with fade for trails
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

    drawPickups();

    for (const b of bullets) drawBullet(b);
    for (const e of enemies) drawEnemy(e);
    drawPlayer();
  }

  // ---------- Loop ----------
  let last = 0;
  function loop(t) {
    if (!state.running) return;

    const now = t / 1000;
    const dt = clamp(now - last, 0, 0.033);
    last = now;

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
    ctx.fillStyle = "#05060a";
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    requestAnimationFrame(loop);
  }

  function pause(message) {
    state.running = false;
    ovTitle.textContent = "Paused";
    ovBody.textContent = message || "Paused.";
    btnStart.textContent = "Resume";
    ovNote.textContent = "";
    overlay.classList.remove("hidden");
  }

  function die() {
    state.running = false;

    const final = Math.floor(state.score);
    if (final > state.best) {
      state.best = final;
      localStorage.setItem("arcade_best", String(final));
      bestEl.textContent = String(final);
    }

    ovTitle.textContent = "You exploded (tastefully).";
    ovBody.textContent = `Score: ${final} • Best: ${state.best}`;
    btnStart.textContent = "Restart";
    ovNote.textContent = "Tip: Hold arrow keys to fire. Tanks sometimes drop bombs.";
    overlay.classList.remove("hidden");

    spawnBurstParticles(player.x, player.y, "rgba(120,220,255,0.95)", 70, 460);
    state.shake = 0;
  }

  // Start/Resume button
  btnStart.addEventListener("click", () => {
    if (!state.running) {
      if (btnStart.textContent === "Resume") {
        overlay.classList.add("hidden");
        state.running = true;
        last = performance.now() / 1000;
        requestAnimationFrame(loop);
      } else {
        start();
      }
    }
  });

  // Click overlay starts/restarts (avoid clicking on buttons/links)
  overlay.addEventListener("click", (e) => {
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "A" || tag === "BUTTON") return;
    if (btnStart.textContent === "Resume") btnStart.click();
    else start();
  });

  // Init overlay copy
  ovTitle.textContent = "Click to start";
  ovBody.textContent =
    "Move: WASD • Aim/Shoot: Arrow keys (hold) • Bomb: Space • Esc: Exit";
  ovNote.textContent = isTouch
    ? "Touch controls enabled: use MOVE + AIM sticks and FIRE/BOMB."
    : "";

  // ---------- Smart bomb input consumption ----------
  // Bomb flag is set on keydown; consume happens in updateUnifiedInput()
})();
