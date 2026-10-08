import * as THREE from "three";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = matchMedia("(max-width: 860px)").matches;
const dprCap = mobile ? 1.5 : 2;
const segs = mobile ? 40 : 64;

const BODIES = [
  {
    id: "sun",
    name: "Sun",
    map: "textures/sun.jpg",
    r: 3.35,
    spin: 0.025,
    tilt: 7.25,
    emissive: true,
    au: "0 AU from the Sun",
    prevLabel: "Core",
    prevVal: "15,000,000 °C",
    nextLabel: "To Mercury",
    nextVal: "57.9 million km",
    stats: [
      ["Type", "G2V star"],
      ["Mass", "99.86% of the system"],
      ["Light to Earth", "8 min 20 s"],
      ["Age", "4.6 billion years"]
    ]
  },
  {
    id: "mercury",
    name: "Mercury",
    map: "textures/mercury.jpg",
    r: 0.52,
    spin: 0.012,
    tilt: 0.03,
    au: "0.39 AU · 57.9 million km",
    prevLabel: "From the Sun",
    prevVal: "57.9 million km",
    nextLabel: "To Venus",
    nextVal: "50.3 million km",
    stats: [
      ["Day", "176 Earth days"],
      ["Year", "88 Earth days"],
      ["Moons", "None"],
      ["Temp", "−180 to 430 °C"]
    ]
  },
  {
    id: "venus",
    name: "Venus",
    map: "textures/venus.jpg",
    r: 0.78,
    spin: -0.004,
    tilt: 177.4,
    au: "0.72 AU · 108.2 million km",
    prevLabel: "From Mercury",
    prevVal: "50.3 million km",
    nextLabel: "To Earth",
    nextVal: "41.4 million km",
    stats: [
      ["Day", "Longer than its year"],
      ["Air", "96% CO₂"],
      ["Temp", "465 °C"],
      ["Spin", "Retrograde"]
    ]
  },
  {
    id: "earth",
    name: "Earth",
    map: "textures/earth.jpg",
    r: 0.84,
    spin: 0.12,
    tilt: 23.44,
    earth: true,
    au: "1.00 AU · 149.6 million km",
    prevLabel: "To the Moon",
    prevVal: "384,400 km",
    nextLabel: "To Mars",
    nextVal: "78.3 million km",
    stats: [
      ["Moon", "384,400 km"],
      ["Water", "71% of the surface"],
      ["Day", "23h 56m"],
      ["Life", "Only confirmed"]
    ]
  },
  {
    id: "mars",
    name: "Mars",
    map: "textures/mars.jpg",
    r: 0.58,
    spin: 0.11,
    tilt: 25.19,
    au: "1.52 AU · 227.9 million km",
    prevLabel: "From Earth",
    prevVal: "78.3 million km",
    nextLabel: "To Jupiter",
    nextVal: "550 million km",
    stats: [
      ["Day", "24h 37m"],
      ["Moons", "Phobos, Deimos"],
      ["Olympus", "21.9 km"],
      ["Year", "687 Earth days"]
    ]
  },
  {
    id: "jupiter",
    name: "Jupiter",
    map: "textures/jupiter.jpg",
    r: 2.05,
    spin: 0.28,
    tilt: 3.13,
    au: "5.20 AU · 778.5 million km",
    prevLabel: "From Mars",
    prevVal: "550 million km",
    nextLabel: "To Saturn",
    nextVal: "655 million km",
    stats: [
      ["Mass", "2.5× the other planets"],
      ["Day", "9h 56m"],
      ["Moons", "95"],
      ["Spot", "Storm since ≤1830"]
    ]
  },
  {
    id: "saturn",
    name: "Saturn",
    map: "textures/saturn.jpg",
    r: 1.78,
    spin: 0.24,
    tilt: 26.73,
    rings: true,
    au: "9.58 AU · 1.43 billion km",
    prevLabel: "From Jupiter",
    prevVal: "655 million km",
    nextLabel: "To Uranus",
    nextVal: "1.44 billion km",
    stats: [
      ["Rings", "Ice, tens of metres"],
      ["Density", "0.69 g/cm³"],
      ["Moons", "146"],
      ["Titan", "Methane lakes"]
    ]
  },
  {
    id: "uranus",
    name: "Uranus",
    map: "textures/uranus.jpg",
    r: 1.12,
    spin: -0.16,
    tilt: 97.77,
    au: "19.2 AU · 2.87 billion km",
    prevLabel: "From Saturn",
    prevVal: "1.44 billion km",
    nextLabel: "To Neptune",
    nextVal: "1.63 billion km",
    stats: [
      ["Tilt", "98° — rolls on its side"],
      ["Year", "84 Earth years"],
      ["Moons", "28"],
      ["Temp", "−224 °C"]
    ]
  },
  {
    id: "neptune",
    name: "Neptune",
    map: "textures/neptune.jpg",
    r: 1.08,
    spin: 0.18,
    tilt: 28.32,
    au: "30.1 AU · 4.50 billion km",
    prevLabel: "From Uranus",
    prevVal: "1.63 billion km",
    nextLabel: "To the Kuiper belt",
    nextVal: "~10 AU more",
    stats: [
      ["Wind", "2,000 km/h"],
      ["Found", "By maths, 1846"],
      ["Moons", "16"],
      ["Sunlight", "0.1% of Earth's"]
    ]
  }
];

const SPACING = 11;
const loader = new THREE.TextureLoader();
const manager = THREE.DefaultLoadingManager;
let loaded = 0;
let total = 0;
manager.onStart = (_u, n, t) => {
  total = t;
};
manager.onProgress = (_u, n, t) => {
  loaded = n;
  total = t;
  const boot = document.querySelector("[data-boot] i");
  if (boot) boot.style.setProperty("--p", `${(n / Math.max(t, 1)) * 100}%`);
};

function tex(url, srgb = true) {
  const t = loader.load(url);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

const RING_INNER = 1.22;
const RING_OUTER = 2.32;

function ringHash(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function ringOptical(rs) {
  if (rs < 1.24 || rs > 2.27) return 0;
  if (rs > 1.95 && rs < 2.023) return 0.015 * ringHash(rs * 90);
  if (rs > 2.214 && rs < 2.226) return 0.03;
  if (rs > 2.263 && rs < 2.268) return 0.04;
  let od;
  if (rs < 1.525) {
    od = 0.16 + 0.1 * Math.sin((rs - 1.24) * 58);
  } else if (rs < 1.95) {
    const t = (rs - 1.525) / 0.425;
    od = 0.78 + 0.22 * (1 - Math.abs(t - 0.42));
  } else {
    od = 0.4 + 0.14 * Math.sin(rs * 68);
  }
  od *= 0.74 + 0.26 * ringHash(Math.floor(rs * 980));
  od += 0.07 * Math.sin(rs * 431.4) * Math.sin(rs * 79.2);
  return Math.max(0, Math.min(1, od));
}

function ringTexture() {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const cx = (size - 1) * 0.5;
  for (let y = 0; y < size; y++) {
    const ny = (y - cx) / cx;
    for (let x = 0; x < size; x++) {
      const nx = (x - cx) / cx;
      const rho = Math.hypot(nx, ny);
      const i = (y * size + x) * 4;
      if (rho < RING_INNER / RING_OUTER || rho > 1) continue;
      const rs = rho * RING_OUTER;
      const od = ringOptical(rs);
      if (od <= 0.01) continue;
      const warm = rs < 1.95 ? 1 : 0.92;
      d[i] = 228 * warm;
      d[i + 1] = 218 * warm;
      d[i + 2] = 198;
      d[i + 3] = Math.min(255, od * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

function atmosphere(color, scale) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { c: { value: color } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main(){
        vN = normalize(normalMatrix * normal);
        vec4 p = modelViewMatrix * vec4(position,1.0);
        vV = normalize(-p.xyz);
        gl_Position = projectionMatrix * p;
      }`,
    fragmentShader: `
      uniform vec3 c; varying vec3 vN; varying vec3 vV;
      void main(){
        float f = pow(1.0 - abs(dot(vN, vV)), 3.4);
        gl_FragColor = vec4(c, f * 0.9);
      }`,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, segs, segs), mat);
  mesh.scale.setScalar(scale);
  return mesh;
}

function earthMat(day, night, normal, spec) {
  return new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: day },
      nightMap: { value: night },
      normalMap: { value: normal },
      specMap: { value: spec },
      lightDir: { value: new THREE.Vector3(1, 0.2, 0.15).normalize() }
    },
    vertexShader: `
      varying vec2 vUv; varying vec3 vN;
      void main(){
        vUv = uv;
        vN = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }`,
    fragmentShader: `
      uniform sampler2D dayMap, nightMap, specMap;
      uniform vec3 lightDir;
      varying vec2 vUv; varying vec3 vN;
      void main(){
        vec3 n = normalize(vN);
        float ndl = dot(n, normalize(lightDir));
        float t = smoothstep(-0.08, 0.28, ndl);
        vec3 day = texture2D(dayMap, vUv).rgb;
        vec3 night = texture2D(nightMap, vUv).rgb * 1.35;
        float spec = texture2D(specMap, vUv).r * pow(max(ndl, 0.0), 18.0) * 0.45;
        vec3 col = mix(night, day, t) + vec3(spec);
        gl_FragColor = vec4(col, 1.0);
      }`
  });
}

function makeUfo() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({
    color: 0xb9c2c8,
    metalness: 0.85,
    roughness: 0.28,
    emissive: 0x7ee7de,
    emissiveIntensity: 0.35
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x7ee7de,
    emissive: 0x3ad1c4,
    emissiveIntensity: 0.8,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85
  });
  const disc = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 12), metal);
  disc.scale.y = 0.22;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.045, 10, 28), metal);
  rim.rotation.x = Math.PI / 2;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass);
  dome.position.y = 0.06;
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 1.1, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x7ee7de, transparent: true, opacity: 0.07, side: THREE.DoubleSide })
  );
  beam.position.y = -0.55;
  g.add(disc, rim, dome, beam);
  g.traverse((o) => {
    if (o.isMesh) o.userData.ufo = true;
  });
  return g;
}

function starfield(scene, count, spread) {
  const geo = new THREE.BufferGeometry();
  const a = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    a[i * 3] = (Math.random() - 0.5) * spread;
    a[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.5;
    a[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(a, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xddd6c8, size: 0.025, transparent: true, opacity: 0.85 })));
}

function inView(el) {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight && r.width > 0;
}

function makeRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

function resize(renderer, camera, canvas) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function nav() {
  const bar = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const sheet = document.querySelector("[data-sheet]");
  const solid = () => bar?.classList.toggle("is-solid", window.scrollY > 20);
  const close = () => {
    if (!sheet) return;
    sheet.hidden = true;
    toggle?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    document.body.classList.remove("menu-open");
  };
  toggle?.addEventListener("click", () => {
    const open = sheet.hidden;
    sheet.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    document.body.classList.toggle("menu-open", open);
  });
  sheet?.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const el = document.querySelector(a.getAttribute("href"));
      if (!el) return;
      e.preventDefault();
      close();
      const y = a.getAttribute("href") === "#top" ? 0 : el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    });
  });
  solid();
  window.addEventListener("scroll", solid, { passive: true });
}

function heroScene() {
  const canvas = document.getElementById("hero-gl");
  if (!canvas) return { update() {}, resize() {} };
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  camera.position.set(0.35, 0.12, 4.15);

  starfield(scene, mobile ? 400 : 900, 40);
  scene.add(new THREE.AmbientLight(0x6b7c99, 0.18));
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.15);
  sun.position.set(-4, 1.2, 3.2);
  scene.add(sun);
  scene.add(new THREE.DirectionalLight(0x1a2a60, 0.35).translateX(4));

  const day = tex("textures/earth.jpg");
  const night = tex("textures/earth_night.jpg");
  const normal = tex("textures/earth_normal.jpg", false);
  const spec = tex("textures/earth_spec.jpg", false);
  const cloudsTex = tex("textures/clouds.jpg");
  cloudsTex.premultiplyAlpha = false;

  const globe = new THREE.Group();
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, segs, segs),
    earthMat(day, night, normal, spec)
  );
  earth.rotation.z = THREE.MathUtils.degToRad(23.44);
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(1.018, segs, segs),
    new THREE.MeshLambertMaterial({
      map: cloudsTex,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  globe.add(earth, clouds, atmosphere(new THREE.Vector3(0.35, 0.6, 1.0), 1.08));

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 32, 32),
    new THREE.MeshStandardMaterial({ map: tex("textures/moon.jpg"), roughness: 1, metalness: 0 })
  );
  const moonPivot = new THREE.Group();
  moon.position.set(2.35, 0.15, 0);
  moonPivot.add(moon);
  globe.add(moonPivot);
  globe.position.set(0.55, -0.05, 0);
  scene.add(globe);

  const ufo = makeUfo();
  ufo.scale.setScalar(0.62);
  ufo.visible = true;
  const ufoLamp = new THREE.PointLight(0x7ee7de, 14, 7, 2);
  ufo.add(ufoLamp);
  const ufoPivot = new THREE.Group();
  ufo.position.set(0.15, 0.42, 1.78);
  ufoPivot.add(ufo);
  globe.add(ufoPivot);

  const pointer = new THREE.Vector2(0, 0);
  let dragging = false;
  let dragX = 0;
  let dragY = 0;
  canvas.style.cursor = "grab";
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
  });
  canvas.addEventListener("pointerup", () => {
    dragging = false;
    canvas.style.cursor = "grab";
  });
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    if (dragging) {
      dragX += e.movementX * 0.005;
      dragY += e.movementY * 0.003;
    }
  });

  const ray = new THREE.Raycaster();
  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(
      new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)),
      camera
    );
    const hit = ray.intersectObjects(ufoPivot.children, true);
    if (hit.length) {
      const toast = document.querySelector("[data-toast]");
      if (toast) {
        toast.hidden = false;
        setTimeout(() => {
          toast.hidden = true;
        }, 2400);
      }
    }
  });

  const clock = new THREE.Clock();
  const update = () => {
    if (!inView(canvas)) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduce) {
      earth.rotation.y += dt * 0.08;
      clouds.rotation.y += dt * 0.095;
      moonPivot.rotation.y += dt * 0.12;
      moon.rotation.y += dt * 0.12;
      ufoPivot.rotation.y = Math.sin(performance.now() * 0.00038) * 0.85;
      ufo.rotation.z = Math.sin(performance.now() * 0.003) * 0.14;
      ufo.position.y = 0.42 + Math.sin(performance.now() * 0.0022) * 0.06;
    }
    globe.rotation.y = THREE.MathUtils.damp(globe.rotation.y, dragX + pointer.x * 0.12, 4, dt);
    globe.rotation.x = THREE.MathUtils.damp(
      globe.rotation.x,
      THREE.MathUtils.clamp(dragY + pointer.y * 0.08, -0.4, 0.4),
      4,
      dt
    );
    earth.material.uniforms.lightDir.value.set(-0.85, 0.25, 0.4).normalize();
    resize(renderer, camera, canvas);
    renderer.render(scene, camera);
  };
  return { update, resize: () => resize(renderer, camera, canvas) };
}

function voyageScene() {
  const root = document.querySelector("[data-voyage]");
  const canvas = document.getElementById("voyage-gl");
  if (!root || !canvas) return { update() {}, setProgress() {} };

  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  camera.position.set(0, 0.4, 9.5);

  starfield(scene, mobile ? 600 : 1400, 90);
  scene.add(new THREE.AmbientLight(0x5a6a88, 0.42));
  const key = new THREE.PointLight(0xffe6b8, 220, 140, 1.35);
  scene.add(key);
  const fill = new THREE.PointLight(0xc9d6ff, 55, 28, 1.7);
  scene.add(fill);

  const groups = [];
  const moonPivot = new THREE.Group();
  let moonMesh = null;

  BODIES.forEach((b, i) => {
    const g = new THREE.Group();
    g.position.x = i * SPACING;
    const map = tex(b.map);
    let mesh;
    if (b.emissive) {
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(b.r, segs, segs),
        new THREE.MeshBasicMaterial({ map })
      );
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(b.r * 1.22, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xffb14a, transparent: true, opacity: 0.14, side: THREE.BackSide })
      );
      g.add(glow);
      key.position.copy(g.position);
    } else if (b.earth) {
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(b.r, segs, segs),
        earthMat(map, tex("textures/earth_night.jpg"), tex("textures/earth_normal.jpg", false), tex("textures/earth_spec.jpg", false))
      );
      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(b.r * 1.018, segs, segs),
        new THREE.MeshLambertMaterial({
          map: tex("textures/clouds.jpg"),
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      clouds.userData.cloud = true;
      g.add(clouds);
      g.add(atmosphere(new THREE.Vector3(0.35, 0.6, 1.0), b.r * 1.09));
      moonMesh = new THREE.Mesh(
        new THREE.SphereGeometry(b.r * 0.27, 32, 32),
        new THREE.MeshStandardMaterial({ map: tex("textures/moon.jpg"), roughness: 1 })
      );
      moonMesh.position.set(b.r * 2.35, b.r * 0.15, 0);
      moonPivot.add(moonMesh);
      g.add(moonPivot);
    } else {
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(b.r, segs, segs),
        new THREE.MeshStandardMaterial({ map, roughness: 0.72, metalness: 0.04 })
      );
    }
    mesh.userData.spin = b.spin;
    if (b.rings) {
      const equator = new THREE.Group();
      equator.rotation.z = THREE.MathUtils.degToRad(b.tilt);
      equator.add(mesh);
      const rings = new THREE.Mesh(
        new THREE.RingGeometry(b.r * RING_INNER, b.r * RING_OUTER, 192, 2),
        new THREE.MeshStandardMaterial({
          map: ringTexture(),
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          roughness: 0.62,
          metalness: 0.04,
          emissive: 0x1c1a14,
          emissiveIntensity: 0.22,
          alphaTest: 0.04
        })
      );
      rings.rotation.x = Math.PI / 2;
      equator.add(rings);
      g.add(equator);
    } else {
      mesh.rotation.z = THREE.MathUtils.degToRad(b.tilt);
      g.add(mesh);
    }
    if (b.id === "venus") g.add(atmosphere(new THREE.Vector3(0.9, 0.75, 0.4), b.r * 1.06));
    if (b.id === "neptune" || b.id === "uranus") g.add(atmosphere(new THREE.Vector3(0.4, 0.65, 0.9), b.r * 1.07));
    scene.add(g);
    groups.push({ g, b, mesh });
  });

  const ticks = root.querySelector("[data-ticks]");
  ticks.innerHTML = BODIES.map((b, i) => `<li><button type="button" data-i="${i}" aria-label="${b.name}"></button></li>`).join("");
  ticks.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const i = Number(btn.dataset.i);
    const rect = root.getBoundingClientRect();
    const start = window.scrollY + rect.top;
    const totalH = root.offsetHeight - window.innerHeight;
    window.scrollTo({ top: start + (totalH * i) / (BODIES.length - 1), behavior: reduce ? "auto" : "smooth" });
  });

  const intel = root.querySelector("[data-intel]");
  const nameEl = root.querySelector("[data-name]");
  const auEl = root.querySelector("[data-au]");
  const prevL = root.querySelector("[data-prev-label]");
  const prevV = root.querySelector("[data-prev-val]");
  const nextL = root.querySelector("[data-next-label]");
  const nextV = root.querySelector("[data-next-val]");
  let active = -1;
  const setActive = (i) => {
    if (i === active) return;
    active = i;
    const b = BODIES[i];
    nameEl.textContent = b.name;
    auEl.textContent = b.au;
    prevL.textContent = b.prevLabel;
    prevV.textContent = b.prevVal;
    nextL.textContent = b.nextLabel;
    nextV.textContent = b.nextVal;
    intel.innerHTML = b.stats.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("");
    ticks.querySelectorAll("button").forEach((btn, n) => btn.classList.toggle("is-on", n === i));
  };
  setActive(0);

  let progress = 0;
  const setProgress = (p) => {
    progress = p;
  };

  const cam = { x: 0 };
  const clock = new THREE.Clock();
  const update = () => {
    if (!inView(canvas) && !inView(root)) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const rect = root.getBoundingClientRect();
    const totalH = Math.max(1, root.offsetHeight - window.innerHeight);
    progress = Math.min(1, Math.max(0, -rect.top / totalH));
    const maxI = BODIES.length - 1;
    const f = progress * maxI;
    const i = Math.round(Math.min(maxI, Math.max(0, f)));
    setActive(i);
    const xTo = f * SPACING;
    cam.x += (xTo - cam.x) * (reduce ? 1 : 0.08);
    camera.position.x = cam.x;
    camera.position.y = 0.35;
    camera.position.z = 9.2 + (groups[i]?.b.r || 1) * 0.35;
    camera.lookAt(cam.x, 0, 0);
    key.position.set(0, 0.2, 0.4);
    fill.position.set(cam.x - 3.2, 1.6, 6.2);

    groups.forEach(({ mesh, g, b }) => {
      if (!reduce) mesh.rotation.y += dt * mesh.userData.spin;
      g.children.forEach((c) => {
        if (c.userData.cloud && !reduce) c.rotation.y += dt * 0.14;
      });
      if (b.earth && mesh.material.uniforms) {
        mesh.material.uniforms.lightDir.value.set(-1, 0.12, 0.18).normalize();
      }
    });
    if (!reduce && moonPivot) moonPivot.rotation.y += dt * 0.35;
    resize(renderer, camera, canvas);
    renderer.render(scene, camera);
  };

  return { update, setProgress };
}

function galaxyBody({ url, w, h, pos, tilt, roll, spin, bulge, pcount, thick, hue }) {
  const g = new THREE.Group();
  g.position.copy(pos);
  g.rotation.x = tilt;
  g.rotation.z = roll;
  g.userData.spin = spin;

  const map = tex(url);
  const disc = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  g.add(disc);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(bulge, 28, 18),
    new THREE.MeshBasicMaterial({
      color: hue,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  core.scale.set(1.15, 1.15, 0.38);
  g.add(core);

  const n = mobile ? Math.floor(pcount * 0.45) : pcount;
  const posA = new Float32Array(n * 3);
  const colA = new Float32Array(n * 3);
  const rx = w * 0.46;
  const ry = h * 0.46;
  for (let i = 0; i < n; i++) {
    const t = Math.pow(Math.random(), 0.58);
    const a = Math.random() * Math.PI * 2;
    posA[i * 3] = Math.cos(a) * t * rx;
    posA[i * 3 + 1] = Math.sin(a) * t * ry;
    posA[i * 3 + 2] = (Math.random() - 0.5) * thick * (1 - t * 0.85);
    const warm = Math.random() > 0.5;
    colA[i * 3] = warm ? 1 : 0.62;
    colA[i * 3 + 1] = warm ? 0.86 : 0.74;
    colA[i * 3 + 2] = warm ? 0.68 : 1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(posA, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colA, 3));
  g.add(
    new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.016,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    )
  );
  return g;
}

function galaxyScene() {
  const canvas = document.getElementById("galaxies-gl");
  if (!canvas) return { update() {} };
  const renderer = makeRenderer(canvas);
  renderer.toneMappingExposure = 1.12;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  camera.position.set(0, 1.85, 5.6);
  camera.lookAt(0.05, 0.05, 0);

  const mw = galaxyBody({
    url: "textures/galaxy_mw.png",
    w: 2.7,
    h: 2.7,
    pos: new THREE.Vector3(-1.55, 0.05, 0),
    tilt: 0.72,
    roll: 0.22,
    spin: 0.045,
    bulge: 0.28,
    pcount: 2200,
    thick: 0.22,
    hue: 0xffe2b0
  });
  const and = galaxyBody({
    url: "textures/galaxy_and.png",
    w: 3.05,
    h: 1.55,
    pos: new THREE.Vector3(1.7, 0.22, -0.35),
    tilt: 0.38,
    roll: -0.18,
    spin: 0.012,
    bulge: 0.16,
    pcount: 1600,
    thick: 0.14,
    hue: 0xffd9a8
  });
  const tri = galaxyBody({
    url: "textures/galaxy_m33.png",
    w: 1.55,
    h: 0.88,
    pos: new THREE.Vector3(0.15, -0.55, 0.7),
    tilt: 0.58,
    roll: 0.3,
    spin: 0.06,
    bulge: 0.1,
    pcount: 900,
    thick: 0.1,
    hue: 0xc8dcff
  });
  scene.add(mw, and, tri);
  starfield(scene, mobile ? 700 : 1600, 44);

  const clock = new THREE.Clock();
  const update = () => {
    if (!inView(canvas)) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduce) {
      mw.rotation.z += dt * mw.userData.spin;
      and.rotation.z += dt * and.userData.spin;
      tri.rotation.z += dt * tri.userData.spin;
    }
    resize(renderer, camera, canvas);
    renderer.render(scene, camera);
  };
  return { update };
}

function n2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = n2(x0, y0);
  const b = n2(x0 + 1, y0);
  const c = n2(x0, y0 + 1);
  const d = n2(x0 + 1, y0 + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
function fbm(x, y) {
  let v = 0;
  let a = 1;
  let f = 1;
  let t = 0;
  for (let i = 0; i < 5; i++) {
    v += vnoise(x * f, y * f) * a;
    t += a;
    a *= 0.5;
    f *= 2.03;
  }
  return v / t;
}

const WORLD_PAL = {
  proxima: { ocean: [62, 24, 22], land: [142, 62, 40], ice: [186, 164, 150], cloud: 0.08, seed: 11 },
  trappist: { ocean: [16, 52, 98], land: [48, 96, 54], ice: [222, 232, 240], cloud: 0.3, seed: 23 },
  toi700: { ocean: [14, 58, 90], land: [78, 96, 44], ice: [214, 224, 232], cloud: 0.22, seed: 41 },
  k186: { ocean: [32, 40, 72], land: [118, 82, 44], ice: [204, 208, 214], cloud: 0.12, seed: 57 },
  k442: { ocean: [10, 64, 118], land: [38, 108, 72], ice: [232, 238, 244], cloud: 0.32, seed: 73 },
  k452: { ocean: [12, 48, 100], land: [54, 98, 50], ice: [226, 234, 242], cloud: 0.34, seed: 89 }
};

function paintWorldMap(kind) {
  const w = 512;
  const h = 256;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const p = WORLD_PAL[kind];
  const off = p.seed;
  for (let y = 0; y < h; y++) {
    const lat = (y / (h - 1) - 0.5) * Math.PI;
    const ice = Math.max(0, Math.abs(lat) - 1.15) * 4;
    for (let x = 0; x < w; x++) {
      const lon = (x / w) * 6.4 + off;
      const n = fbm(lon, y / 42 + off * 0.2);
      const land = n > 0.52;
      const shore = Math.abs(n - 0.52) < 0.03;
      let r, g, b;
      if (ice > 0.35) {
        r = p.ice[0];
        g = p.ice[1];
        b = p.ice[2];
      } else if (land) {
        const k = 0.75 + (n - 0.52) * 1.4;
        r = p.land[0] * k;
        g = p.land[1] * k;
        b = p.land[2] * k;
        if (shore) {
          r = r * 0.7 + 40;
          g = g * 0.75 + 30;
        }
      } else {
        const deep = 0.7 + n * 0.45;
        r = p.ocean[0] * deep;
        g = p.ocean[1] * deep;
        b = p.ocean[2] * deep;
      }
      if (ice > 0) {
        r = r + (p.ice[0] - r) * Math.min(1, ice);
        g = g + (p.ice[1] - g) * Math.min(1, ice);
        b = b + (p.ice[2] - b) * Math.min(1, ice);
      }
      const i = (y * w + x) * 4;
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  if (p.cloud > 0) {
    ctx.globalAlpha = p.cloud;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cld = fbm(x / 36 + 9, y / 28 + off);
        if (cld > 0.62) {
          ctx.fillStyle = `rgba(236,240,248,${(cld - 0.62) * 2.2})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  return ctx.getImageData(0, 0, w, h);
}

function projectGlobe(canvas, map, rot, lx, ly, lz, night = 0.12) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");
  const out = ctx.createImageData(w, h);
  const o = out.data;
  const m = map.data;
  const mw = map.width;
  const mh = map.height;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const r = Math.min(cx, cy) - 1;
  for (let y = 0; y < h; y++) {
    const ny = (y - cy) / r;
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / r;
      const i = (y * w + x) * 4;
      const d2 = nx * nx + ny * ny;
      if (d2 > 1) continue;
      const nz = Math.sqrt(1 - d2);
      let u = Math.atan2(nx, nz) / (Math.PI * 2) + rot;
      u -= Math.floor(u);
      const v = 0.5 - Math.asin(Math.max(-1, Math.min(1, ny))) / Math.PI;
      const mx = Math.min(mw - 1, (u * mw) | 0);
      const my = Math.min(mh - 1, (v * mh) | 0);
      const mi = (my * mw + mx) * 4;
      let ndl = nx * lx + ny * ly + nz * lz;
      ndl = ndl < 0 ? night * (ndl + 1) * 0.5 : ndl;
      const rim = (1 - nz) * (1 - nz) * 28;
      o[i] = Math.min(255, m[mi] * ndl + rim * 0.55);
      o[i + 1] = Math.min(255, m[mi + 1] * ndl + rim * 0.7);
      o[i + 2] = Math.min(255, m[mi + 2] * ndl + rim);
      o[i + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
}

function initGlobes() {
  const nodes = [...document.querySelectorAll("[data-globe]")];
  if (!nodes.length) return { update() {} };
  const maps = {};
  Object.keys(WORLD_PAL).forEach((k) => {
    maps[k] = paintWorldMap(k);
  });
  const states = nodes.map((el) => {
    const kind = el.dataset.globe;
    const size = Math.round(Math.min(220, Math.max(140, el.clientWidth || 180)) * Math.min(devicePixelRatio || 1, 1.5));
    el.width = size;
    el.height = size;
    return { el, kind, rot: Math.random() * 0.4, map: maps[kind] || null };
  });
  const marsImg = new Image();
  marsImg.onload = () => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    c.getContext("2d").drawImage(marsImg, 0, 0, 512, 256);
    const map = c.getContext("2d").getImageData(0, 0, 512, 256);
    states.forEach((s) => {
      if (s.kind === "mars") s.map = map;
    });
  };
  marsImg.src = "textures/mars.jpg";

  const clock = { t: 0 };
  const update = () => {
    clock.t += reduce ? 0 : 0.004;
    states.forEach((s) => {
      if (!s.map || !inView(s.el)) return;
      s.rot = clock.t * 0.35 + s.kind.length * 0.2;
      projectGlobe(s.el, s.map, s.rot, -0.55, 0.2, 0.8, 0.14);
    });
  };
  update();
  return { update };
}

const SYNODIC = 29.53058867;
const NEW_MOON0 = Date.UTC(2000, 0, 6, 18, 14, 0);

function moonAge(ms = Date.now()) {
  const days = (ms - NEW_MOON0) / 86400000;
  return ((days % SYNODIC) + SYNODIC) % SYNODIC;
}

function phaseTitle(age) {
  const t = age / SYNODIC;
  if (t < 0.03 || t >= 0.97) return "New Moon";
  if (t < 0.22) return "Waxing crescent";
  if (t < 0.28) return "First quarter";
  if (t < 0.47) return "Waxing gibbous";
  if (t < 0.53) return "Full Moon";
  if (t < 0.72) return "Waning gibbous";
  if (t < 0.78) return "Last quarter";
  return "Waning crescent";
}

function initMoon() {
  const canvas = document.getElementById("moon-phase");
  if (!canvas) return { update() {} };
  const age = moonAge();
  const t = age / SYNODIC;
  const illum = (1 - Math.cos(2 * Math.PI * t)) / 2;
  const name = phaseTitle(age);
  const fmt = (d) =>
    d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const primaries = [
    { name: "New Moon", frac: 0 },
    { name: "First quarter", frac: 0.25 },
    { name: "Full Moon", frac: 0.5 },
    { name: "Last quarter", frac: 0.75 }
  ];
  let next = primaries.find((p) => p.frac * SYNODIC > age + 0.35);
  if (!next) next = { name: "New Moon", frac: 1 };
  const nextMs = Date.now() + (next.frac * SYNODIC - age) * 86400000;
  const set = (sel, v) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = v;
  };
  set("[data-phase-name]", name);
  set("[data-phase-illum]", `${Math.round(illum * 100)}% lit · ${age.toFixed(1)} d old`);
  set("[data-phase-age]", `${age.toFixed(1)} / 29.53 days`);
  set("[data-phase-next]", `${next.name} · ${fmt(new Date(nextMs))}`);
  const list = document.querySelector("[data-phase-list]");
  if (list) {
    const marks = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75];
    const names = ["New Moon", "First quarter", "Full Moon", "Last quarter"];
    list.innerHTML = marks
      .map((frac, i) => ({ name: names[i % 4], frac }))
      .filter((p) => p.frac > t + 0.012)
      .slice(0, 4)
      .map((p) => `<li>${p.name}<span>${fmt(new Date(Date.now() + (p.frac * SYNODIC - age) * 86400000))}</span></li>`)
      .join("");
  }

  const size = Math.round(Math.min(360, Math.max(200, canvas.clientWidth || 280)) * Math.min(devicePixelRatio || 1, 1.5));
  canvas.width = size;
  canvas.height = size;
  let map = null;
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    c.getContext("2d").drawImage(img, 0, 0, 512, 256);
    map = c.getContext("2d").getImageData(0, 0, 512, 256);
  };
  img.src = "textures/moon.jpg";
  const ang = 2 * Math.PI * t;
  const lx = Math.sin(ang);
  const lz = -Math.cos(ang);
  let rot = 0.18;
  const update = () => {
    if (!map || !inView(canvas)) return;
    if (!reduce) rot += 0.0012;
    projectGlobe(canvas, map, rot, lx, 0.05, lz, 0.035);
  };
  return { update };
}

const PAYPAL_BUSINESS = "kybertop505@gmail.com";

function shopPay() {
  document.querySelectorAll("[data-pay]").forEach((a) => {
    const u = new URL("https://www.paypal.com/cgi-bin/webscr");
    u.searchParams.set("cmd", "_xclick");
    u.searchParams.set("business", PAYPAL_BUSINESS);
    u.searchParams.set("item_name", a.dataset.pay);
    u.searchParams.set("amount", Number(a.dataset.eur).toFixed(2));
    u.searchParams.set("currency_code", "EUR");
    u.searchParams.set("no_shipping", "1");
    a.href = u.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  });
}

nav();
shopPay();

const hero = heroScene();
const voyage = voyageScene();
const galaxies = galaxyScene();
const globes = initGlobes();
const moon = initMoon();

if (window.Lenis && !reduce) {
  const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
  function raf(t) {
    lenis.raf(t);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  if (window.ScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);
  }
}

function loop() {
  hero.update();
  voyage.update();
  galaxies.update();
  globes.update();
  moon.update();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function hideBoot() {
  const boot = document.querySelector("[data-boot]");
  if (!boot) return;
  boot.classList.add("is-out");
  setTimeout(() => boot.remove(), 700);
}
manager.onLoad = hideBoot;
window.addEventListener("load", () => setTimeout(hideBoot, 2200));
if (reduce) hideBoot();
