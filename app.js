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

function ringTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 1024;
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 1024);
  grd.addColorStop(0, "rgba(0,0,0,0)");
  grd.addColorStop(0.12, "rgba(210,190,150,0.15)");
  grd.addColorStop(0.28, "rgba(226,210,170,0.85)");
  grd.addColorStop(0.42, "rgba(0,0,0,0)");
  grd.addColorStop(0.48, "rgba(0,0,0,0)");
  grd.addColorStop(0.55, "rgba(176,156,120,0.7)");
  grd.addColorStop(0.78, "rgba(210,190,150,0.35)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 1024);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
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
    emissive: 0x1a2a2c,
    emissiveIntensity: 0.2
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
  ufo.scale.setScalar(0.28);
  ufo.visible = false;
  scene.add(ufo);

  const pointer = new THREE.Vector2(0, 0);
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
  });

  const ray = new THREE.Raycaster();
  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(
      new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)),
      camera
    );
    const hit = ray.intersectObjects(ufo.children, true);
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

  let ufoT = 0;
  let ufoOn = false;
  let nextUfo = 9;

  const clock = new THREE.Clock();
  const update = () => {
    if (!inView(canvas)) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduce) {
      earth.rotation.y += dt * 0.08;
      clouds.rotation.y += dt * 0.095;
      moonPivot.rotation.y += dt * 0.12;
      moon.rotation.y += dt * 0.12;
    }
    globe.rotation.y = THREE.MathUtils.damp(globe.rotation.y, pointer.x * 0.35, 4, dt);
    globe.rotation.x = THREE.MathUtils.damp(globe.rotation.x, pointer.y * 0.18, 4, dt);
    earth.material.uniforms.lightDir.value.set(-0.85, 0.25, 0.4).normalize();

    nextUfo -= dt;
    if (nextUfo < 0 && !ufoOn) {
      ufoOn = true;
      ufoT = 0;
      ufo.visible = true;
      nextUfo = 28 + Math.random() * 18;
    }
    if (ufoOn) {
      ufoT += dt * 0.22;
      const t = ufoT;
      ufo.position.set(-3.4 + t * 6.5, 1.15 + Math.sin(t * 3) * 0.15, 1.2);
      ufo.rotation.z = Math.sin(t * 2) * 0.15;
      ufo.rotation.y = t * 0.4;
      if (t > 1.2) {
        ufoOn = false;
        ufo.visible = false;
      }
    }
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
  scene.add(new THREE.AmbientLight(0x33415c, 0.22));
  const key = new THREE.PointLight(0xffe6b8, 140, 80, 2);
  scene.add(key);
  scene.add(new THREE.PointLight(0x223355, 8, 40, 2).translateY(-4));

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
    mesh.rotation.z = THREE.MathUtils.degToRad(b.tilt);
    mesh.userData.spin = b.spin;
    g.add(mesh);
    if (b.rings) {
      const rings = new THREE.Mesh(
        new THREE.RingGeometry(b.r * 1.25, b.r * 2.25, 96),
        new THREE.MeshBasicMaterial({
          map: ringTexture(),
          side: THREE.DoubleSide,
          transparent: true,
          depthWrite: false
        })
      );
      rings.rotation.x = Math.PI / 2.35;
      g.add(rings);
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

function galaxyScene() {
  const canvas = document.getElementById("galaxies-gl");
  if (!canvas) return { update() {} };
  const renderer = makeRenderer(canvas);
  renderer.toneMappingExposure = 0.9;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
  camera.position.set(0, 3.2, 7.4);
  camera.lookAt(0, 0, 0);

  const makeGalaxy = (arms, count, spread, core, armCol, pos, scale) => {
    const geo = new THREE.BufferGeometry();
    const posA = new Float32Array(count * 3);
    const colA = new Float32Array(count * 3);
    const coreC = new THREE.Color(core);
    const armC = new THREE.Color(armCol);
    for (let i = 0; i < count; i++) {
      const arm = i % arms;
      const t = Math.pow(Math.random(), 0.55);
      const theta = t * 6.2 + (arm * Math.PI * 2) / arms + (Math.random() - 0.5) * spread;
      const r = t * 2.8;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      const y = (Math.random() - 0.5) * 0.18 * (1 - t);
      posA.set([x, y, z], i * 3);
      const c = coreC.clone().lerp(armC, t);
      colA.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(posA, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colA, 3));
    const pts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ size: 0.018 * scale, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false })
    );
    pts.position.copy(pos);
    pts.scale.setScalar(scale);
    pts.rotation.x = -0.55;
    return pts;
  };

  const n = mobile ? 4500 : 9000;
  const mw = makeGalaxy(2, n, 0.55, "#ffe6b0", "#a8b4ff", new THREE.Vector3(-0.8, 0.2, 0), 1.15);
  const and = makeGalaxy(2, Math.floor(n * 0.45), 0.4, "#ffd7c0", "#c9b8ff", new THREE.Vector3(3.4, 0.9, -1.4), 0.55);
  const tri = makeGalaxy(3, Math.floor(n * 0.22), 0.5, "#f0e0c0", "#9ad", new THREE.Vector3(2.2, -0.6, 1.6), 0.32);
  scene.add(mw, and, tri);

  const clock = new THREE.Clock();
  const update = () => {
    if (!inView(canvas)) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduce) {
      mw.rotation.y += dt * 0.02;
      and.rotation.y += dt * 0.028;
      tri.rotation.y += dt * 0.04;
    }
    resize(renderer, camera, canvas);
    renderer.render(scene, camera);
  };
  return { update };
}

nav();

const hero = heroScene();
const voyage = voyageScene();
const galaxies = galaxyScene();

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
