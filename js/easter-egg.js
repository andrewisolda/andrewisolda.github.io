// /js/easter-egg.js
const COPYRIGHT_ID = "copyright";

// Load Three.js only when needed
async function loadThree() {
  // Using a stable CDN ESM build
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
        <strong>The Brief (3D)</strong><br />
        Drag to rotate • Scroll to zoom • Click a layer to isolate • Esc to exit
      </div>
      <button id="egg-close" type="button" aria-label="Close">Close</button>
    </div>
  `;

  document.body.appendChild(overlay);
  return overlay;
}

function makeTextTexture(THREE, { title, body, width = 1024, height = 512 }) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  // Paper-ish background
  ctx.fillStyle = "#f7f4ee";
  ctx.fillRect(0, 0, width, height);

  // Subtle grain
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 1.2;
    ctx.fillStyle = Math.random() > 0.5 ? "#000" : "#fff";
    ctx.fillRect(x, y, r, r);
  }
  ctx.globalAlpha = 1;

  // Text
  const pad = 64;

  ctx.fillStyle = "#111";
  ctx.font = "700 54px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
  ctx.fillText(title, pad, pad + 10);

  ctx.fillStyle = "#333";
  ctx.font = "400 34px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";

  // Wrap body text
  const maxWidth = width - pad * 2;
  const lineHeight = 46;
  let y = pad + 90;

  const words = body.split(" ");
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth) {
      ctx.fillText(line.trim(), pad, y);
      line = words[i] + " ";
      y += lineHeight;
      if (y > height - pad) break;
    } else {
      line = test;
    }
  }
  if (y <= height - pad) ctx.fillText(line.trim(), pad, y);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  return texture;
}

function makeLayer(THREE, { title, body, w = 3.2, h = 1.6 }) {
  const geom = new THREE.PlaneGeometry(w, h, 1, 1);

  const tex = makeTextTexture(THREE, { title, body });
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.9,
    metalness: 0.0,
    transparent: true,
    opacity: 1
  });

  const mesh = new THREE.Mesh(geom, mat);

  // Give it a tiny thickness vibe by adding a back plane (optional)
  const backMat = new THREE.MeshStandardMaterial({
    color: 0xf2eee6,
    roughness: 0.95,
    metalness: 0.0,
    transparent: true,
    opacity: 1
  });
  const back = new THREE.Mesh(geom, backMat);
  back.position.z = -0.02;
  back.rotateY(Math.PI);
  mesh.add(back);

  mesh.userData.isLayer = true;
  return mesh;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
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
  camera.position.set(0, 0.25, 7.2);

  // Lights
  const key = new THREE.DirectionalLight(0xffffff, 1.25);
  key.position.set(3, 4, 4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x88aaff, 0.55);
  fill.position.set(-4, 1, 2);
  scene.add(fill);

  const amb = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(amb);

  // Group: the “brief”
  const brief = new THREE.Group();
  scene.add(brief);

  const layersData = [
    {
      title: "HEADLINE",
      body: "Clarity, but make it pop. (Respectfully.)"
    },
    {
      title: "SUBHEAD",
      body: "One sentence that tells a human what this is — without starting a feud with Legal."
    },
    {
      title: "PROOF",
      body: "Three receipts. Real outcomes. No interpretive dance. Preferably in plain English."
    },
    {
      title: "CTA",
      body: "Tell them what to do next. Bonus points if it doesn’t sound like a ransom note."
    }
  ];

  const layerMeshes = layersData.map((d, i) => {
    const m = makeLayer(THREE, d);
    // Stack with slight offsets
    m.position.z = i * 0.08;
    m.position.y = -i * 0.03;
    m.rotation.x = -0.08;
    m.rotation.y = 0.18;
    brief.add(m);
    return m;
  });

  // Add a subtle “spine” behind to sell depth (optional)
  const spineGeom = new THREE.BoxGeometry(0.1, 1.55, 0.5);
  const spineMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d7, roughness: 0.95 });
  const spine = new THREE.Mesh(spineGeom, spineMat);
  spine.position.set(-1.65, -0.05, 0.15);
  spine.rotation.y = 0.15;
  brief.add(spine);

  // Interaction state
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let targetRotX = 0;
  let targetRotY = 0;
  let zoom = 7.2;

  let isolated = null; // mesh or null
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function setAllOpacity(op) {
    layerMeshes.forEach((m) => {
      m.material.opacity = op;
      m.children.forEach((child) => {
        if (child.material) child.material.opacity = op;
      });
    });
  }

  function isolate(mesh) {
    isolated = mesh;
    layerMeshes.forEach((m) => {
      const op = m === mesh ? 1 : 0.12;
      m.material.opacity = op;
      m.children.forEach((child) => {
        if (child.material) child.material.opacity = op;
      });
    });
  }

  function clearIsolation() {
    isolated = null;
    setAllOpacity(1);
  }

  // Pointer events
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
    targetRotX = clamp(targetRotX, -1.1, 1.1);
  }

  function onUp() {
    isDragging = false;
  }

  function onWheel(e) {
    e.preventDefault();
    zoom += e.deltaY * 0.004;
    zoom = clamp(zoom, 4.2, 10.5);
    camera.position.z = zoom;
  }

  function onClick(e) {
    // Ignore if it was a drag
    if (Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY) > 6) return;

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(layerMeshes, true);

    if (!hits.length) {
      clearIsolation();
      return;
    }

    // Find the parent layer mesh
    let hit = hits[0].object;
    while (hit && !hit.userData.isLayer && hit.parent) hit = hit.parent;

    if (!hit || !hit.userData.isLayer) {
      clearIsolation();
      return;
    }

    if (isolated === hit) clearIsolation();
    else isolate(hit);
  }

  // Resize
  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  // Close / cleanup
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
    canvas.removeEventListener("click", onClick);

    closeBtn.removeEventListener("click", onClose);

    // Dispose GPU resources
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
  canvas.addEventListener("click", onClick);

  // Animate
  const clock = new THREE.Clock();

  function tick() {
    if (!alive) return;

    const t = clock.getElapsedTime();

    // Smooth rotation toward target + subtle idle motion
    brief.rotation.y += (targetRotY - brief.rotation.y) * 0.06;
    brief.rotation.x += (targetRotX - brief.rotation.x) * 0.06;

    brief.position.y = Math.sin(t * 0.6) * 0.08;

    // Gentle “breathing” light motion
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
    // Shift-click to open the secret
    if (e.shiftKey) {
      e.preventDefault();
      openEasterEgg();
    }
  });
}

initTrigger();
