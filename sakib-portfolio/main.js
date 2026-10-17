/* A. A. Sakib — 3D portfolio
   three.js (procedural low-poly IT-office island) + GSAP ScrollTrigger camera flight. */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const hideLoader = () => setTimeout(() => $("#loader").classList.add("done"), 1300);

  document.getElementById("year").textContent = new Date().getFullYear();

  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ------------------------------------------------------------------ */
  /* 3D SCENE                                                            */
  /* ------------------------------------------------------------------ */
  const rig = { px: 9, py: 6, pz: 12, tx: 0, ty: 1.5, tz: 0, off: 0.2 };
  const WAYPOINTS = {
    home:       { px: 9,    py: 6,    pz: 12,  tx: 0,    ty: 1.5, tz: 0,    off: 0.2 },
    about:      { px: 1.5,  py: 3.4,  pz: 6.8, tx: 0,    ty: 2.4, tz: 0,    off: -0.2 },
    skills:     { px: -0.5, py: 3.2,  pz: 7.2, tx: -3.6, ty: 1.6, tz: -0.5, off: 0.2 },
    experience: { px: -3.2, py: 3.6,  pz: 7.5, tx: -1,   ty: 1.5, tz: 0.6,  off: -0.2 },
    work:       { px: 0,    py: 14,   pz: 6.5, tx: 0,    ty: 0,   tz: 0,    off: 0 },
    contact:    { px: 8.5,  py: 3.6,  pz: 6.5, tx: 3.6,  ty: 1.7, tz: 0.5,  off: 0.2 },
  };
  Object.assign(rig, WAYPOINTS.home);

  let renderer, scene, camera;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };

  function initScene() {
    const canvas = $("#scene");
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);

    /* lights */
    scene.add(new THREE.HemisphereLight(0xfff3e0, 0xcdb89a, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 0.6);
    sun.position.set(6, 12, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    const glow = new THREE.PointLight(0x9fd0ff, 0.7, 7);
    glow.position.set(0, 2.9, 1);
    scene.add(glow);

    const world = new THREE.Group();
    scene.add(world);

    /* helpers */
    const mats = {};
    const mat = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0.05, flatShading: true }, extra));
    const box = (w, h, d, color, x, y, z, parent = world, extra) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra));
      m.position.set(x, y, z);
      m.castShadow = m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    const cyl = (rt, rb, h, seg, color, x, y, z, parent = world) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color));
      m.position.set(x, y, z);
      m.castShadow = m.receiveShadow = true;
      parent.add(m);
      return m;
    };

    /* island */
    cyl(6.3, 5.6, 0.8, 8, 0xb9c79a, 0, -0.4, 0);
    cyl(5.6, 0.5, 3.4, 8, 0xb98c5e, 0, -2.5, 0);
    cyl(6.45, 6.45, 0.12, 8, 0xd6e0b8, 0, -0.04, 0).receiveShadow = true;

    /* desk */
    box(4.2, 0.18, 1.9, 0xc9925b, 0, 1.55, 0);
    [[-1.9, -0.8], [1.9, -0.8], [-1.9, 0.8], [1.9, 0.8]].forEach(([x, z]) => box(0.14, 1.5, 0.14, 0x8a5e37, x, 0.75, z));

    /* monitor */
    box(0.9, 0.06, 0.5, 0x2a2c33, 0, 1.67, -0.35);
    box(0.14, 0.55, 0.14, 0x2a2c33, 0, 1.95, -0.35);
    box(2.4, 1.5, 0.1, 0x23252b, 0, 2.9, -0.35);
    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = 512; screenCanvas.height = 300;
    const sctx = screenCanvas.getContext("2d");
    const screenTex = new THREE.CanvasTexture(screenCanvas);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), new THREE.MeshBasicMaterial({ map: screenTex }));
    screen.position.set(0, 2.9, -0.29);
    world.add(screen);

    const graph = Array.from({ length: 40 }, () => 0.5);
    let lastDraw = 0;
    function drawScreen(t) {
      if (t - lastDraw < 0.12) return;
      lastDraw = t;
      const W = 512, H = 300;
      sctx.fillStyle = "#0e1620"; sctx.fillRect(0, 0, W, H);
      sctx.fillStyle = "#17222f"; sctx.fillRect(0, 0, W, 34);
      ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => { sctx.fillStyle = c; sctx.beginPath(); sctx.arc(18 + i * 18, 17, 5, 0, 7); sctx.fill(); });
      sctx.font = "600 15px monospace"; sctx.fillStyle = "#8fb8ff"; sctx.fillText("NETWORK-OPS // sakib@ventura", 84, 22);
      sctx.font = "15px monospace";
      const rows = [["core-switch-01", "ONLINE"], ["erp-server", "ONLINE"], ["vlan-prod", "ONLINE"], ["backup-job", "OK"]];
      rows.forEach(([n, s], i) => {
        sctx.fillStyle = "#cfd8e3"; sctx.fillText(n, 20, 66 + i * 24);
        sctx.fillStyle = "#3ddc84"; sctx.fillText("● " + s, 190, 66 + i * 24);
      });
      sctx.fillStyle = "#ff923e"; sctx.fillText("uptime 99.9%   users 500+", 20, 176);
      if (Math.floor(t * 2) % 5 === 0) { graph.shift(); graph.push(0.35 + Math.random() * 0.5); }
      sctx.strokeStyle = "#ff923e"; sctx.lineWidth = 2; sctx.beginPath();
      graph.forEach((v, i) => { const x = 20 + i * (472 / (graph.length - 1)); const y = 280 - v * 80; i ? sctx.lineTo(x, y) : sctx.moveTo(x, y); });
      sctx.stroke();
      sctx.fillStyle = "#cfd8e3"; sctx.fillText("> ping 10.0.0.1 ..." + (Math.floor(t * 2) % 2 ? "_" : ""), 270, 66);
      screenTex.needsUpdate = true;
    }

    /* desk props */
    box(1.3, 0.05, 0.42, 0xdfd6c8, 0, 1.665, 0.55);
    box(0.2, 0.05, 0.3, 0xdfd6c8, 1.1, 1.665, 0.55);
    cyl(0.17, 0.15, 0.3, 10, 0xff923e, 1.6, 1.79, 0.25);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 6, 10, Math.PI), mat(0xff923e));
    handle.position.set(1.78, 1.79, 0.25); handle.rotation.z = -Math.PI / 2; world.add(handle);

    /* network switch on desk + LED ports */
    const leds = [];
    const addLed = (x, y, z, w = 0.06, color = 0x3ddc84, parent = world) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, 0.03), new THREE.MeshBasicMaterial({ color }));
      m.position.set(x, y, z);
      parent.add(m);
      leds.push({ m, phase: Math.random() * 10, speed: 2 + Math.random() * 5, color });
    };
    box(1.2, 0.16, 0.55, 0x2f3238, -1.4, 1.73, 0.1);
    for (let i = 0; i < 8; i++) addLed(-1.88 + i * 0.136, 1.73, 0.385);

    /* server rack */
    box(1.3, 2.8, 1.3, 0x2b2e35, -3.7, 1.4, -0.9);
    for (let i = 0; i < 6; i++) {
      const y = 0.45 + i * 0.42;
      box(1.1, 0.3, 0.05, 0x3d414b, -3.7, y, -0.22);
      addLed(-4.1, y, -0.185, 0.07, 0x3ddc84);
      addLed(-3.95, y, -0.185, 0.07, i % 2 ? 0xff923e : 0x3ddc84);
      for (let j = 0; j < 4; j++) box(0.12, 0.03, 0.03, 0x1b1d22, -3.4 + j * 0.15, y, -0.185);
    }

    /* side table + router */
    box(1.8, 0.1, 1.4, 0xc9925b, 3.6, 1.15, 0.5);
    [[-0.75, -0.55], [0.75, -0.55], [-0.75, 0.55], [0.75, 0.55]].forEach(([x, z]) => box(0.12, 1.1, 0.12, 0x8a5e37, 3.6 + x, 0.55, 0.5 + z));
    box(1.2, 0.16, 0.8, 0xf5f2ec, 3.6, 1.28, 0.5);
    [-0.35, 0.35].forEach((x) => {
      const a = cyl(0.04, 0.04, 0.9, 6, 0xf5f2ec, 3.6 + x, 1.7, 0.2);
      a.rotation.z = x > 0 ? -0.2 : 0.2;
    });
    [0, 1, 2].forEach((i) => addLed(3.3 + i * 0.15, 1.28, 0.905, 0.06, i === 1 ? 0xff923e : 0x3ddc84));

    /* wifi arcs */
    const wifi = new THREE.Group();
    wifi.position.set(3.6, 2.5, 0.5);
    world.add(wifi);
    const arcs = [0.3, 0.55, 0.8].map((r) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.035, 6, 28, Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xff923e, transparent: true })
      );
      m.rotation.z = Math.PI / 4;
      wifi.add(m);
      return m;
    });
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), new THREE.MeshBasicMaterial({ color: 0xff923e }));
    dot.position.y = -0.05; wifi.add(dot);

    /* cables + data packets */
    const cableMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 });
    const curves = [
      { c: new THREE.CatmullRomCurve3([[-1.6, 1.65, 0.38], [-1.9, 0.6, 1.4], [-2.8, 0.15, 1.5], [-3.5, 1.1, 0.5], [-3.45, 2.0, -0.2]].map((p) => new THREE.Vector3(...p))), color: 0xff923e },
      { c: new THREE.CatmullRomCurve3([[-1.0, 1.65, 0.38], [-0.2, 0.3, 1.8], [2.2, 0.15, 1.9], [3.1, 0.8, 1.3], [3.3, 1.28, 0.9]].map((p) => new THREE.Vector3(...p))), color: 0x4a90d9 },
    ];
    const packets = [];
    curves.forEach(({ c, color }) => {
      const tube = new THREE.Mesh(new THREE.TubeGeometry(c, 60, 0.045, 8, false), cableMat(color));
      tube.castShadow = true; world.add(tube);
      for (let i = 0; i < 3; i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        world.add(p);
        packets.push({ p, c, t: i / 3, speed: 0.12 + Math.random() * 0.05 });
      }
    });

    /* plant */
    cyl(0.35, 0.28, 0.5, 8, 0xe9a46d, -4.9, 0.25, 2.4);
    [[0, 0.85, 0, 0.42], [0.2, 1.15, 0.1, 0.3], [-0.2, 1.05, -0.1, 0.28]].forEach(([x, y, z, r]) => {
      const l = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(0x6f9a5b));
      l.position.set(-4.9 + x, y, 2.4 + z); l.castShadow = true; world.add(l);
    });

    /* floating bits */
    const floaters = [];
    const palette = [0xff923e, 0xffffff, 0x4a90d9, 0xf2c14e];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + Math.random();
      const r = 7.5 + Math.random() * 3;
      const s = 0.18 + Math.random() * 0.3;
      const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), mat(palette[i % palette.length]));
      let fx = Math.cos(a) * r, fz = Math.sin(a) * r;
      if (fx > 1 && fz > 1) fz = -fz; /* keep cubes off the camera side */
      m.position.set(fx, 1.5 + Math.random() * 6, fz);
      m.castShadow = true;
      scene.add(m);
      floaters.push({ m, sp: 0.2 + Math.random() * 0.6, ph: Math.random() * 6, y0: m.position.y });
    }

    /* events */
    window.addEventListener("mousemove", (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    window.addEventListener("resize", () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });

    const clock = new THREE.Clock();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function frame() {
      const t = clock.getElapsedTime();
      mouse.sx += (mouse.x - mouse.sx) * 0.05;
      mouse.sy += (mouse.y - mouse.sy) * 0.05;

      if (!reduce) world.position.y = Math.sin(t * 0.8) * 0.12;
      leds.forEach((l) => { l.m.material.color.setHex(Math.sin(t * l.speed + l.phase) > -0.2 ? l.color : 0x20242b); });
      packets.forEach((k) => {
        k.t = (k.t + k.speed * 0.016) % 1;
        k.p.position.copy(k.c.getPoint(k.t));
        k.p.position.y += world.position.y * 0;
      });
      arcs.forEach((a, i) => {
        const ph = (t * 1.6 - i * 0.45) % 3;
        a.material.opacity = 0.25 + 0.75 * Math.max(0, Math.sin(Math.max(ph, 0) * 1.0));
      });
      wifi.rotation.y = Math.atan2(camera.position.x - wifi.position.x, camera.position.z - wifi.position.z);
      floaters.forEach((f) => {
        f.m.rotation.x += 0.004 * f.sp; f.m.rotation.y += 0.006 * f.sp;
        f.m.position.y = f.y0 + Math.sin(t * f.sp + f.ph) * 0.35;
      });
      drawScreen(t);

      camera.position.set(rig.px + mouse.sx * 0.7, rig.py - mouse.sy * 0.4, rig.pz);
      camera.lookAt(rig.tx, rig.ty, rig.tz);
      const w = window.innerWidth, h = window.innerHeight;
      if (w > 900 && Math.abs(rig.off) > 0.001) camera.setViewOffset(w, h, -rig.off * w, 0, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();

      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    frame();
  }

  /* ------------------------------------------------------------------ */
  /* SCROLL CHOREOGRAPHY                                                 */
  /* ------------------------------------------------------------------ */
  function initScroll() {
    if (typeof gsap === "undefined") return;
    const order = ["home", "about", "skills", "experience", "work", "contact"];

    order.forEach((id, i) => {
      if (i > 0) {
        gsap.fromTo(
          rig,
          Object.assign({}, WAYPOINTS[order[i - 1]]),
          Object.assign({}, WAYPOINTS[id], {
            ease: "none",
            immediateRender: false,
            scrollTrigger: { trigger: "#" + id, start: "top 85%", end: "top 25%", scrub: 1 },
          })
        );
      }
      ScrollTrigger.create({
        trigger: "#" + id, start: "top 55%", end: "bottom 55%",
        onToggle: (self) => {
          if (self.isActive) $$(".nav nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
        },
      });
    });

    /* reveal on scroll */
    $$(".panel > *, .card, .timeline > li, .group, .photo").forEach((el) => {
      gsap.from(el, {
        y: 36, opacity: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" },
      });
    });

    /* counters */
    $$("[data-count]").forEach((el) => {
      const end = +el.dataset.count, o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: () => gsap.to(o, { v: end, duration: 1.6, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(o.v)) }),
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* UI bits                                                             */
  /* ------------------------------------------------------------------ */
  function initUI() {
    /* card tilt */
    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(700px) rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 12).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener("mouseleave", () => (card.style.transform = ""));
    });

    /* contact form -> opens the visitor's mail app (no backend needed) */
    const form = $("#contact-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      $$("label", form).forEach((l) => {
        const f = $("input, textarea", l);
        const valid = f.type === "email" ? /^\S+@\S+\.\S+$/.test(f.value.trim()) : f.value.trim().length > 0;
        l.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      if (!ok) return;
      const d = new FormData(form);
      const subject = encodeURIComponent("Portfolio enquiry from " + d.get("name"));
      const body = encodeURIComponent(d.get("message") + "\n\n— " + d.get("name") + " (" + d.get("email") + ")");
      window.location.href = "mailto:aasakib46@gmail.com?subject=" + subject + "&body=" + body;
    });
  }

  /* ------------------------------------------------------------------ */
  /* BOOT                                                                */
  /* ------------------------------------------------------------------ */
  initUI();
  try {
    if (typeof THREE === "undefined") throw new Error("three.js not loaded");
    initScene();
  } catch (err) {
    console.warn("3D scene unavailable:", err.message);
    $("#scene").style.display = "none";
  }
  initScroll();
  window.addEventListener("load", hideLoader);
  if (document.readyState === "complete") hideLoader();
})();
