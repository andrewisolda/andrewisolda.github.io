// /js/easter-egg.js
const COPYRIGHT_ID = "copyright";

async function loadThree() {
  const THREE = await import("https://unpkg.com/three@0.160.0/build/three.module.js");
  return THREE;
}

function ensureOverlay() {
  let overlay = document.getElementById("egg-overlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "egg-overlay";

  overlay.innerHTML = `
    <canvas id="egg-canvas"></canvas>
    <div id="egg-ui">
      <div id="egg-hint">
        <strong>Secret mode</strong><br />
        Drag to rotate • Scroll to zoom • Esc to exit
      </div>
      <button id="egg-close" type="button" aria-label="Close">Close</button>
    </div>
  `;

  document.body.appendChild(overlay);
  return overlay;
}

function makeMessageTexture(THREE, message) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");

  // Paper background
  ctx.fillStyle = "#f7f4ee";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle grain
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const s = Math.random() * 1.2;
    ctx.fillStyle = Math.random() > 0.5 ? "#000" : "#fff";
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;

  // Text
  const pad = 70;
  ctx.fillStyle = "#111";
  ctx.font = "650 40px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";

  // Wrap nicely
  const maxWidth = canvas.width - pad * 2;
  const words = message.split(" ");
  let line = "";
  let y = 180;
  const lineHeight = 56;

  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth) {
      ctx.fillText(line.trim(), pad, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), pad, y);

  // Tiny signature line
  ctx.fillStyle = "#444";
  ctx.font = "400 22px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
  ctx.fillText("Press Esc to return to reality.", pad, canvas.height - 70);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

async function openEasterEgg() {
  const overlay = ensureOverlay();
  overlay.classList.add("is-open");

  const closeBtn = overlay.querySelector("#egg-close");
  const canvas = overlay.querySelector("#egg-canvas");

  const THREE = await loadThree();

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Scene
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 8, 18);

  // Camera
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  let zoom = 6.8;
  camera.position.set(0, 0.2, zoom);

  // Lights
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(3, 4, 4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x88aaff, 0.5);
  fill.position.set(-4, 1, 2);
  scene.add(fill);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  // One “card” object
  const group = new THREE.Group();
  scene.add(group);

  const message =
    "Congratulations, you found the secret. What are you doing poking around my site, anyway?";

  const tex = makeMessageTexture(THREE, message);

  const cardGeom = new THREE.PlaneGeometry(4.2, 2.1);
  const cardMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.9,
    metalness: 0.0
  });

  const card = new THREE.Mesh(cardGeom, cardMat);
  card.rotation.x = -0.08;
  card.rotation.y = 0.18;
  group.add(card);

  // Back of card for a tiny “thickness” vibe
  const backMat = new THREE.MeshStandardMaterial({
    color: 0xf2eee6,
    roughness: 0.95
  });
  const back = new THREE.Mesh(cardGeom, backMat);
  back.position.z = -0.02;
  back.rotation.y = Math.PI;
  card.add(back);

  // Interaction
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let targetRotX = 0;
  let targetRotY = 0;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function onDown(e) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  }

  function onMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    targetRotY += dx * 0.006;
    targetRotX += dy * 0.006;
    targetRotX = clamp(targetRotX, -1.0, 1.0);
  }

  function onUp() {
    isDragging = false;
  }

  function onWheel(e) {
    e.preventDefault();
    zoom += e.deltaY * 0.004;
    zoom = clamp(zoom, 4.2, 10.0);
    camera.position.z = zoom;
  }

  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  let raf = 0;
  let alive = true;

  function cleanup() {
    alive = false;
    cancelAnimationFrame(raf);

    window.removeEventListener("resize", onResize);
    window.removeEventListener("keydown", onKeyDown);

    canvas.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("wheel", onWheel, { passive: false });

    closeBtn.removeEventListener("click", onClose);

    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose?.();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
        else obj.material.dispose?.();
      }
      if (obj.material?.map) obj.material.map.dispose?.();
    });

    renderer.dispose();
    overlay.classList.remove("is-open");
  }

  function onClose() {
    cleanup();
  }

  function onKeyDown(e) {
    if (e.key === "Escape") onClose();
  }

  closeBtn.addEventListener("click", onClose);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", onResize);

  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  // Animate
  const clock = new THREE.Clock();

  function tick() {
    if (!alive) return;
    const t = clock.getElapsedTime();

    // Smooth follow to target + idle float
    group.rotation.y += (targetRotY - group.rotation.y) * 0.06;
    group.rotation.x += (targetRotX - group.rotation.x) * 0.06;
    group.position.y = Math.sin(t * 0.6) * 0.08;

    // Tiny light drift
    key.position.x = 3 + Math.sin(t * 0.7) * 0.5;
    key.position.y = 4 + Math.cos(t * 0.6) * 0.4;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  tick();
}

function initTrigger() {
  const el = document.getElementById(COPYRIGHT_ID);
  if (!el) return;

  el.addEventListener("click", (e) => {
    if (e.shiftKey) {
      e.preventDefault();
      openEasterEgg();
    }
  });
}

initTrigger();
