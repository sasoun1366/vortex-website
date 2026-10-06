/* ==========================================================================
   VORTEX — لایهٔ سه‌بعدی (WebGL / three.js)
   دو صحنه:
     ۱) هیرو  : لوگوی سه‌بعدی VORTEX + گرداب ذرات، واکنش به موس و اسکرول
     ۲) شوکیس : چرخاندن سه‌بعدی تجهیزات (دمبل / کتل‌بل / صفحهٔ وزنه) با درگ
   در صورت نبود WebGL یا prefers-reduced-motion، همه‌چیز به همان لایهٔ ۲بعدی
   قبلی برمی‌گردد؛ هیچ خطایی روی صفحه نمی‌آید.
   ========================================================================== */

import * as THREE from "../vendor/three.module.min.js";

const doc = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
const isSmall = () => innerWidth < 760;

const PAL = {
  olive: 0x8fa24f,
  oliveLight: 0xcfe08f,
  oliveDeep: 0x3f4a23,
  metal: 0x2a2e26,
  dark: 0x0a0b08,
};

let ok = true;
try {
  const c = document.createElement("canvas");
  ok = !!(c.getContext("webgl2") || c.getContext("webgl"));
} catch (e) { ok = false; }
if (reduce) ok = false;
if (!ok) { doc.dataset.hero3d = "0"; doc.dataset.show3d = "0"; }

const stats = { hero: false, show: false, prop: "dumbbell", frames: 0, fps: 0, mode: ok ? "webgl" : "fallback" };
window.VX3D = {
  status: () => ({ ...stats, webgl: ok }),
  show: i => showProp(i),
};

/* ---------- بافت‌های تولیدی (بدون فایل خارجی) ------------------------------ */

/* هالهٔ نرم برای ذرات */
function glowTexture() {
  const s = 64, c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(207,224,143,0.75)");
  grd.addColorStop(0.6, "rgba(124,140,75,0.22)");
  grd.addColorStop(1, "rgba(124,140,75,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* محیط استودیویی مصنوعی، تا فلزها تیره و مرده نباشند */
function envTexture() {
  const w = 512, h = 256, c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  const lin = g.createLinearGradient(0, 0, 0, h);
  lin.addColorStop(0.0, "#f2f6df");
  lin.addColorStop(0.42, "#9fb173");
  lin.addColorStop(0.58, "#39421f");
  lin.addColorStop(1.0, "#070805");
  g.fillStyle = lin; g.fillRect(0, 0, w, h);
  /* دو نور کشیده برای بازتاب‌های جذاب روی فلز */
  g.globalAlpha = 0.55;
  g.fillStyle = "#ffffff";
  g.fillRect(w * 0.12, h * 0.08, w * 0.16, h * 0.22);
  g.fillRect(w * 0.62, h * 0.05, w * 0.22, h * 0.18);
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- لوگوی سه‌بعدی VORTEX ------------------------------------------ */
function buildVMark() {
  /* مسیر «V» از لوگوی برند (viewBox 0 0 100 100) */
  const pts = [[12, 16], [32, 16], [50, 60], [68, 16], [88, 16], [58, 90], [42, 90]];
  const shape = new THREE.Shape();
  pts.forEach(([x, y], i) => {
    const px = x - 50, py = 50 - y;                 // مرکز + برگرداندن محور Y
    if (i === 0) shape.moveTo(px, py); else shape.lineTo(px, py);
  });
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 15, bevelEnabled: true, bevelThickness: 2.2, bevelSize: 2, bevelSegments: 3, curveSegments: 2,
  });
  geo.center();

  const mat = new THREE.MeshStandardMaterial({
    color: PAL.olive, metalness: 0.92, roughness: 0.26,
    emissive: new THREE.Color(PAL.oliveDeep), emissiveIntensity: 0.35,
  });
  const mesh = new THREE.Mesh(geo, mat);

  /* لبهٔ نورانی دور لوگو */
  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo, 28),
    new THREE.LineBasicMaterial({ color: PAL.oliveLight, transparent: true, opacity: 0.28 })
  );
  const group = new THREE.Group();
  group.add(mesh, wire);
  group.scale.setScalar(0.055);
  return group;
}

/* ---------- گرداب ذرات --------------------------------------------------- */
function buildParticles(n) {
  const pos = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.2 + Math.pow(Math.random(), 0.62) * 5.6;
    const y = (Math.random() - 0.5) * 3.2;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(a) * r * 0.72;
    seed[i] = Math.random() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.16, map: glowTexture(), transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, color: 0xd8e7a5, opacity: 0.9, sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.userData.spin = 0.055;
  return points;
}

/* ---------- نورپردازی مشترک ---------------------------------------------- */
function lights(scene, { key = 3.2, rim = 2.4 } = {}) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));
  const k = new THREE.DirectionalLight(0xfff3d6, key);
  k.position.set(4, 6, 5);
  const r = new THREE.PointLight(PAL.oliveLight, rim, 22);
  r.position.set(-5, 1.2, -4);
  const f = new THREE.PointLight(0x9fb173, 1.4, 18);
  f.position.set(4.5, -2.5, 3.5);
  scene.add(k, r, f);
  return { k, r, f };
}

/* ==========================================================================
   ۱) صحنهٔ هیرو
   ========================================================================== */
function bootHero() {
  const canvas = document.getElementById("vortex-3d");
  if (!canvas || !ok) return;
  /* روی موبایل همان گرداب ۲بعدیِ سبک می‌ماند و متن هیرو تمیز دیده می‌شود */
  if (innerWidth < 900) { doc.dataset.hero3d = "0"; return; }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(PAL.dark, 0.055);
  scene.environment = envTexture();

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  camera.position.set(0, 0.15, 6.4);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmall(), alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(isSmall() ? Math.min(dpr, 1.4) : dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const v = buildVMark();
  const vortex = buildParticles(isSmall() ? 320 : 720);
  const group = new THREE.Group();
  group.add(v, vortex);
  scene.add(group);
  lights(scene, { key: 3.4, rim: 3.1 });

  /* چیدمان افقی بر اساس زبان: در فارسی متن راست است → لوگو سمت چپ */
  function layout() {
    const rtl = doc.dir === "rtl";
    const x = (isSmall() ? 0 : rtl ? -1.85 : 2.3);
    const y = isSmall() ? 0.4 : 0.35;
    group.position.set(x, y, 0);
    group.scale.setScalar(isSmall() ? 0.82 : 1);
    camera.position.x = isSmall() ? 0 : 0;
  }

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    layout();
  }

  /* ورود نرم لوگو */
  let intro = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const scroll = { p: 0 };

  window.addEventListener("pointermove", e => {
    pointer.tx = (e.clientX / innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  const hero = document.querySelector(".hero");
  const onScroll = () => {
    if (!hero) return;
    const p = Math.min(1, Math.max(0, (window.scrollY || 0) / Math.max(1, hero.offsetHeight)));
    scroll.p = p;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  let running = false, raf = null, t = 0, degraded = false;
  const t0 = performance.now();
  function frame() {
    if (!running) return;
    t += 0.016;
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    intro += (1 - intro) * 0.035;

    const p = scroll.p;
    group.rotation.y += 0.0032 + p * 0.02;
    group.rotation.x = -0.12 + Math.sin(t * 0.45) * 0.05 + p * 0.5;
    group.rotation.z = pointer.x * 0.12;
    group.position.y = (isSmall() ? 0.4 : 0.35) + Math.sin(t * 0.7) * 0.06 - p * 0.8;
    group.scale.setScalar(THREE.MathUtils.lerp(0.02, 1, intro) * 0.88);

    vortex.rotation.y -= vortex.userData.spin;
    vortex.rotation.z = 0;
    vortex.rotation.x = 0.22;

    camera.position.x = pointer.x * 0.5;
    camera.position.y = 0.15 - pointer.y * 0.32 + p * 0.35;
    camera.position.z = 6.4 - p * 1.1;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    stats.frames++;
    raf = requestAnimationFrame(frame);
  }

  function start() { if (running) return; running = true; frame(); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

  resize();
  addEventListener("resize", resize, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(en => (en[0].isIntersecting ? start() : stop()), { threshold: 0.02 }).observe(hero);
  } else start();

  /* صحنهٔ ۳بعدی جای صحنهٔ ۲بعدی را می‌گیرد (تا دوبار رندر نشود) */
  doc.dataset.hero3d = "1";
  canvas.classList.add("on");
  const c2 = document.getElementById("vortex-canvas");
  if (c2) { c2.classList.add("vx-hide"); }
  if (window.FX && typeof window.FX.stopVortex === "function") { try { window.FX.stopVortex(); } catch (e) {} }
  stats.hero = true;
}

/* ==========================================================================
   ۲) شوکیس تعاملی تجهیزات
   ========================================================================== */
let showScene = null;

function buildDumbbell() {
  const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa77a, metalness: 0.95, roughness: 0.32 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x1d2018, metalness: 0.35, roughness: 0.78 });
  const plate = new THREE.MeshStandardMaterial({ color: 0x545c33, metalness: 0.85, roughness: 0.42 });

  /* دسته */
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.9, 24), steel);
  bar.rotation.z = Math.PI / 2;
  const gripMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 1.5, 24), grip);
  gripMesh.rotation.z = Math.PI / 2;
  g.add(bar, gripMesh);

  /* صفحه‌های شش‌ضلعی دو طرف */
  [-1.05, 1.05].forEach(x => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.34, 6), plate);
    p.rotation.z = Math.PI / 2; p.position.x = x;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.055, 10, 26), steel);
    ring.rotation.y = Math.PI / 2; ring.position.x = x + 0.19;
    const ring2 = ring.clone(); ring2.position.x = x - 0.19;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.24, 20), steel);
    collar.rotation.z = Math.PI / 2; collar.position.x = x + (x > 0 ? 0.22 : -0.22);
    g.add(p, ring, ring2, collar);
  });
  g.rotation.z = Math.PI / 2;
  return g;
}

function buildKettlebell() {
  const g = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: 0x2c3126, metalness: 0.82, roughness: 0.46 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xa8b489, metalness: 0.95, roughness: 0.3 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.92, 34, 26), iron);
  body.scale.set(1, 0.94, 1);
  body.position.y = -0.12;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 0.42, 26), iron);
  neck.position.y = 0.72;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.115, 14, 34, Math.PI), steel);
  handle.position.y = 0.98;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.14, 26), steel);
  base.position.y = -1.0;
  const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.06, 20), steel);
  dot.rotation.x = Math.PI / 2; dot.position.set(0, -0.05, 0.9);
  g.add(body, neck, handle, base, dot);
  g.position.y = 0.05;
  return g;
}

function buildPlate() {
  const g = new THREE.Group();
  const rubber = new THREE.MeshStandardMaterial({ color: 0x22261b, metalness: 0.25, roughness: 0.85 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xa8b489, metalness: 0.95, roughness: 0.28 });

  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.3, 48), rubber);
  disc.rotation.x = Math.PI / 2;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(1.13, 0.075, 12, 54), steel);
  const hubOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.44, 28), steel);
  hubOuter.rotation.x = Math.PI / 2;
  const hubHole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 20), new THREE.MeshStandardMaterial({ color: 0x0b0c09, metalness: 0.2, roughness: 0.9 }));
  hubHole.rotation.x = Math.PI / 2;
  /* سه سوراخ دستگیره */
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.34, 18), new THREE.MeshStandardMaterial({ color: 0x0b0c09, metalness: 0.2, roughness: 0.9 }));
    hole.rotation.x = Math.PI / 2;
    hole.position.set(Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0);
    g.add(hole);
  }
  g.add(disc, lip, hubOuter, hubHole);
  g.rotation.x = 0.15;
  return g;
}

const BUILDERS = { dumbbell: buildDumbbell, kettlebell: buildKettlebell, plate: buildPlate };

function showProp(i) {
  if (!showScene) { stats.prop = typeof i === "string" ? i : "dumbbell"; return; }
  const key = typeof i === "number" ? ["dumbbell", "kettlebell", "plate"][i] : i;
  if (!BUILDERS[key]) return;
  showScene.set(key);
  stats.prop = key;
}

function bootShowcase() {
  const canvas = document.getElementById("vx-3d-canvas");
  if (!canvas || !ok) return;

  const scene = new THREE.Scene();
  scene.environment = envTexture();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
  camera.position.set(0, 0.6, 5.2);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmall(), alpha: true });
  renderer.setPixelRatio(isSmall() ? 1.4 : dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (!isSmall()) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  const { k } = lights(scene, { key: 3.6, rim: 2.2 });
  k.position.set(3.5, 6, 4.5);
  if (!isSmall()) {
    k.castShadow = true;
    k.shadow.mapSize.set(1024, 1024);
    k.shadow.camera.near = 1; k.shadow.camera.far = 20;
    k.shadow.camera.left = -5; k.shadow.camera.right = 5;
    k.shadow.camera.top = 5; k.shadow.camera.bottom = -5;
  }

  /* سایهٔ نرم زمین */
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 48),
    new THREE.ShadowMaterial({ opacity: 0.42 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.32;
  if (!isSmall()) floor.receiveShadow = true;
  scene.add(floor);

  /* حلقهٔ نوری زیر شیء */
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 1.72, 64),
    new THREE.MeshBasicMaterial({ color: PAL.olive, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = -1.3;
  scene.add(halo);

  /* هر سه شیء ساخته می‌شوند و با اسکیل/شفافیت سوییچ می‌شوند */
  const props = {};
  Object.entries(BUILDERS).forEach(([key, build]) => {
    const o = build();
    o.userData.key = key;
    o.scale.setScalar(key === stats.prop ? 1 : 0.001);
    o.traverse(n => { if (n.isMesh && !isSmall()) { n.castShadow = true; n.receiveShadow = true; } });
    scene.add(o);
    props[key] = o;
  });

  let current = stats.prop;
  let yaw = 0.5, pitch = 0.18, tYaw = 0.5, tPitch = 0.18, zoom = 1, tZoom = 1;
  let dragging = false, lastX = 0, lastY = 0, idle = 0, moved = false;
  const scrollP = { p: 0 };

  showScene = {
    set(key) {
      if (key === current) return;
      props[current].scale.setScalar(0.001);
      props[current].userData.out = true;
      current = key;
      props[key].userData.out = false;
      /* چرخش تازه برای شیء جدید */
      yaw = 0.5; tYaw = 0.5;
    },
  };

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* درگ برای چرخاندن */
  canvas.addEventListener("pointerdown", e => {
    dragging = true; moved = false; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("dragging");
    canvas.parentElement.classList.add("is-dragging");
  });
  canvas.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    tYaw += dx * 0.009;
    tPitch = Math.max(-0.6, Math.min(0.75, tPitch + dy * 0.006));
    idle = 0;
  });
  const endDrag = e => {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove("dragging");
    canvas.parentElement.classList.remove("is-dragging");
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", endDrag);

  /* چرخ ماوس = زوم، دوبار کلیک = ریست */
  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    tZoom = Math.max(0.72, Math.min(1.5, tZoom - e.deltaY * 0.0012));
  }, { passive: false });
  canvas.addEventListener("dblclick", () => { tYaw = 0.5; tPitch = 0.18; tZoom = 1; });

  const onScroll = () => {
    const r = canvas.getBoundingClientRect();
    const p = 1 - Math.min(1, Math.max(0, (r.top + r.height / 2) / innerHeight));
    scrollP.p = p;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  let running = false, raf = null, t = 0, fpsT = performance.now(), fpsN = 0, showDegraded = false;
  function frame() {
    if (!running) return;
    t += 0.016;
    yaw += (tYaw - yaw) * 0.12;
    pitch += (tPitch - pitch) * 0.12;
    zoom += (tZoom - zoom) * 0.1;

    idle += 0.016;
    if (!dragging && idle > 1.6) tYaw += 0.004;   // چرخش خودکار در حالت بی‌کاری

    Object.values(props).forEach(o => {
      const on = o.userData.key === current;
      const target = on ? 1 : 0.001;
      const s = o.scale.x + (target - o.scale.x) * 0.14;
      o.scale.setScalar(s);
      o.visible = s > 0.02;
      /* ورود: از پایین بالا می‌آید */
      const intro = Math.min(1, Math.max(0, (s - 0.001) / 0.999));
      o.position.y = (1 - intro) * -1.1;
      o.rotation.y = yaw;
      o.rotation.x = pitch * 0.55 + Math.sin(t * 0.6) * 0.05;
      o.rotation.z = Math.sin(t * 0.35) * 0.035;
    });

    stats.yaw = +yaw.toFixed(3); stats.pitch = +pitch.toFixed(3); stats.zoom = +zoom.toFixed(2);
    stats.prop = current;

    halo.scale.setScalar(1 + Math.sin(t * 1.4) * 0.035);
    halo.material.opacity = 0.2 + Math.sin(t * 1.4) * 0.07;

    camera.position.y = 0.6 + Math.sin(t * 0.5) * 0.05 + scrollP.p * 0.2;
    camera.position.z = 5.2 * zoom;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    stats.frames++;
    if (stats.fps && stats.fps < 26 && !showDegraded) {
      showDegraded = true;
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;
      floor.visible = false;
      k.castShadow = false;
      Object.values(props).forEach(o => o.traverse(n => { if (n.isMesh) n.castShadow = false; }));
    }
    fpsN++;
    const now = performance.now();
    if (now - fpsT > 1000) { stats.fps = Math.round(fpsN * 1000 / (now - fpsT)); fpsN = 0; fpsT = now; }
    raf = requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; frame(); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

  resize();
  addEventListener("resize", resize, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(en => (en[0].isIntersecting ? start() : stop()), { threshold: 0.05 }).observe(canvas);
  } else start();

  /* دکمه‌های انتخاب شیء */
  document.querySelectorAll("[data-prop-3d]").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-prop-3d]").forEach(b => b.classList.remove("on"));
      btn.classList.add("on");
      showProp(btn.dataset.prop3d || i);
    });
  });

  canvas.classList.add("on");
  stats.show = true;
}

/* ---------- بالا آوردن ------------------------------------------------ */
if (ok) {
  try { bootHero(); } catch (e) { console.warn("3D hero:", e); doc.dataset.hero3d = "0"; }
  try { bootShowcase(); } catch (e) { console.warn("3D showcase:", e); doc.dataset.show3d = "0"; }
  doc.dataset.show3d = stats.show ? "1" : "0";
} else {
  doc.classList.add("vx-no3d");
}
