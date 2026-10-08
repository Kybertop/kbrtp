(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const lerp = (a, b, t) => a + (b - a) * t;

  function sizeCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return { w: 0, h: 0, dpr };
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h, dpr, ctx };
  }

  function starfield() {
    const canvas = document.getElementById("starfield");
    if (!canvas) return;
    let stars = [];
    let w = 0;
    let h = 0;

    const seed = () => {
      ({ w, h } = sizeCanvas(canvas));
      const n = Math.min(520, Math.floor((w * h) / 4200));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.15,
        a: Math.random() * 0.7 + 0.15,
        s: Math.random() * 0.8 + 0.2,
        p: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (t) => {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = reduce ? s.a : s.a * (0.55 + 0.45 * Math.sin(t * 0.001 * s.s + s.p));
        ctx.fillStyle = `rgba(236,230,216,${tw})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    seed();
    window.addEventListener("resize", seed, { passive: true });
    return { draw };
  }

  function spiral(canvas, opts) {
    if (!canvas) return { draw() {}, resize() {} };
    const o = {
      arms: 2,
      count: 1400,
      core: "rgba(255, 214, 160, 0.9)",
      arm: "rgba(180, 170, 255, 0.55)",
      rotate: 0.00004,
      ...opts,
    };
    let particles = [];
    let w = 0;
    let h = 0;

    const seed = () => {
      ({ w, h } = sizeCanvas(canvas));
      const n = Math.min(o.count, Math.floor((w * h) / 900));
      particles = Array.from({ length: n }, (_, i) => {
        const arm = i % o.arms;
        const spread = (Math.random() - 0.5) * 0.55;
        const t = Math.pow(Math.random(), 0.55);
        const theta = t * 5.6 + arm * Math.PI + spread;
        const r = t * 0.48 + Math.abs(spread) * 0.08;
        return {
          theta,
          r,
          z: Math.random(),
          size: Math.random() * 1.3 + 0.2,
          tint: Math.random(),
        };
      });
    };

    const draw = (time) => {
      if (!w || !h) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      const cx = w * (o.cx ?? 0.62);
      const cy = h * (o.cy ?? 0.48);
      const scale = Math.min(w, h) * (o.scale ?? 1.15);
      const rot = reduce ? 0.4 : time * o.rotate;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.18);
      g.addColorStop(0, "rgba(255, 228, 180, 0.28)");
      g.addColorStop(1, "rgba(255, 228, 180, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * 0.18, 0, Math.PI * 2);
      ctx.fill();

      for (const p of particles) {
        const th = p.theta + rot;
        const x = cx + Math.cos(th) * p.r * scale;
        const y = cy + Math.sin(th) * p.r * scale * 0.46;
        const a = (1 - p.r) * (0.25 + p.z * 0.55);
        ctx.fillStyle = p.tint > 0.72 ? `rgba(255,214,160,${a})` : `rgba(176,168,255,${a})`;
        ctx.fillRect(x, y, p.size, p.size);
      }
      ctx.restore();
    };

    seed();
    return { draw, resize: seed };
  }

  function nav() {
    const bar = document.querySelector("[data-nav]");
    const toggle = document.querySelector("[data-menu-toggle]");
    const sheet = document.querySelector("[data-sheet]");
    const links = document.querySelector("[data-menu]");

    const solid = () => {
      bar?.classList.toggle("is-solid", window.scrollY > 24);
    };

    const close = () => {
      if (!sheet) return;
      sheet.hidden = true;
      toggle?.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    };

    toggle?.addEventListener("click", () => {
      const open = sheet.hidden;
      sheet.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });

    sheet?.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) close();
    });

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (!id || id === "#") return;
        const el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        close();
        const y = id === "#top" ? 0 : el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
      });
    });

    solid();
    window.addEventListener("scroll", solid, { passive: true });
    return { links };
  }

  function voyage() {
    const root = document.querySelector("[data-voyage]");
    if (!root) return { update() {} };

    const track = root.querySelector("[data-track]");
    const bodies = [...root.querySelectorAll(".body")];
    const cards = [...root.querySelectorAll("[data-card]")];
    const ticks = root.querySelector("[data-ticks]");
    let x = 0;
    let xTo = 0;
    let active = "earth";

    ticks.innerHTML = bodies
      .map((b) => `<li data-tick="${b.dataset.id}"></li>`)
      .join("");

    const setActive = (id) => {
      if (id === active) return;
      active = id;
      bodies.forEach((b) => b.classList.toggle("is-on", b.dataset.id === id));
      cards.forEach((c) => c.classList.toggle("is-on", c.dataset.card === id));
      ticks.querySelectorAll("li").forEach((t) => {
        t.classList.toggle("is-on", t.dataset.tick === id);
      });
    };

    bodies.forEach((b, i) => {
      if (b.dataset.id === "earth") b.classList.add("is-on");
      b.addEventListener("click", () => {
        const rect = root.getBoundingClientRect();
        const start = window.scrollY + rect.top;
        const total = root.offsetHeight - window.innerHeight;
        const t = bodies.length === 1 ? 0 : i / (bodies.length - 1);
        window.scrollTo({ top: start + total * t, behavior: reduce ? "auto" : "smooth" });
      });
    });

    const measure = () => {
      const rect = root.getBoundingClientRect();
      const total = Math.max(1, root.offsetHeight - window.innerHeight);
      const p = clamp(-rect.top / total, 0, 1);
      const first = bodies[0];
      const last = bodies[bodies.length - 1];
      const start = first.offsetLeft + first.offsetWidth / 2;
      const end = last.offsetLeft + last.offsetWidth / 2;
      const center = window.innerWidth / 2;
      xTo = center - (start + (end - start) * p);

      let best = bodies[0];
      let bestD = Infinity;
      for (const b of bodies) {
        const c = b.offsetLeft + b.offsetWidth / 2 + xTo;
        const d = Math.abs(c - center);
        if (d < bestD) {
          bestD = d;
          best = b;
        }
      }
      setActive(best.dataset.id);
    };

    const update = () => {
      measure();
      x = reduce ? xTo : lerp(x, xTo, 0.12);
      track.style.transform = `translate3d(${x}px,0,0)`;
    };

    window.addEventListener("resize", measure, { passive: true });
    return { update };
  }

  const stars = starfield();
  const heroGal = spiral(document.getElementById("hero-galaxy"), {
    count: 1600,
    cx: 0.7,
    cy: 0.48,
    scale: 1.05,
  });
  const mw = spiral(document.getElementById("mw-canvas"), {
    count: 1800,
    cx: 0.58,
    cy: 0.5,
    scale: 1.35,
    rotate: 0.00003,
  });
  nav();
  const path = voyage();

  let lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    if (Math.abs(window.innerWidth - lastW) < 2) return;
    lastW = window.innerWidth;
    heroGal.resize();
    mw.resize();
  });

  const loop = (t) => {
    stars?.draw(t);
    heroGal.draw(t);
    mw.draw(t);
    path.update();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
