/* A. A. Sakib — 3D portfolio
   three.js (procedural low-poly IT-office island) + GSAP ScrollTrigger camera flight. */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const hideLoader = () => setTimeout(() => $("#loader").classList.add("done"), 1300);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.getElementById("year").textContent = new Date().getFullYear();

  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ------------------------------------------------------------------ */
  /* 3D SCENE                                                            */
  /* ------------------------------------------------------------------ */
  /* px..tz = camera position / look-at, off = horizontal view shift,
     bx,by = screen position (NDC) of the floating portrait, bs = its scale */
  const WAYPOINTS = {
    home:       { px: 9,    py: 6,    pz: 12,  tx: 0,    ty: 1.5, tz: 0,    off: 0.2,  bx: 0.74,  by: 0.5,  bs: 1 },
    about:      { px: 1.5,  py: 3.4,  pz: 6.8, tx: 0,    ty: 2.4, tz: 0,    off: -0.2, bx: -0.74, by: 0.5,  bs: 0 },
    skills:     { px: -0.5, py: 3.2,  pz: 7.2, tx: -3.6, ty: 1.6, tz: -0.5, off: 0.2,  bx: 0.8,   by: 0.6,  bs: 1 },
    experience: { px: -3.2, py: 3.6,  pz: 7.5, tx: -1,   ty: 1.5, tz: 0.6,  off: -0.2, bx: -0.8,  by: 0.58, bs: 1 },
    work:       { px: 0,    py: 14,   pz: 6.5, tx: 0,    ty: 0,   tz: 0,    off: 0,    bx: 0.85,  by: 0.5,  bs: 0 },
    contact:    { px: 8.5,  py: 3.6,  pz: 6.5, tx: 3.6,  ty: 1.7, tz: 0.5,  off: 0.2,  bx: 0.82,  by: 0.55, bs: 1 },
  };
  const rig = Object.assign({}, WAYPOINTS.home);

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

    /* orbit rings around the island */
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(8.2, 0.035, 6, 90), new THREE.MeshBasicMaterial({ color: 0xff923e, transparent: true, opacity: 0.32 }));
    ringA.rotation.x = Math.PI / 2 - 0.15; ringA.position.y = 0.6; scene.add(ringA);
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(9.4, 0.03, 6, 90), new THREE.MeshBasicMaterial({ color: 0x1fa2ff, transparent: true, opacity: 0.28 }));
    ringB.rotation.x = Math.PI / 2 + 0.3; ringB.rotation.y = 0.4; ringB.position.y = 1.2; scene.add(ringB);
    const orbiters = [];
    [[ringA, 0xff923e], [ringB, 0x1fa2ff]].forEach(([ring, color], k) => {
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), new THREE.MeshBasicMaterial({ color }));
      scene.add(o);
      orbiters.push({ o, ring, r: k ? 9.4 : 8.2, sp: k ? -0.35 : 0.5 });
    });

    /* sparkle particles */
    const dotC = document.createElement("canvas"); dotC.width = dotC.height = 32;
    const dctx = dotC.getContext("2d"); dctx.fillStyle = "#fff"; dctx.beginPath(); dctx.arc(16, 16, 15, 0, 7); dctx.fill();
    const dotTex = new THREE.CanvasTexture(dotC);
    const sparkles = [];
    [[0xff923e, 0.16], [0x1fa2ff, 0.13], [0xff5d8f, 0.12]].forEach(([color, size]) => {
      const n = 70, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * 8;
        pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = -1 + Math.random() * 10; pos[i * 3 + 2] = Math.sin(a) * r;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size: size * 1.3, map: dotTex, alphaTest: 0.3, transparent: true, opacity: 0.85, sizeAttenuation: true }));
      scene.add(pts); sparkles.push(pts);
    });

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
      const W = 512;
      sctx.fillStyle = "#0e1620"; sctx.fillRect(0, 0, W, 300);
      sctx.fillStyle = "#17222f"; sctx.fillRect(0, 0, W, 34);
      ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => { sctx.fillStyle = c; sctx.beginPath(); sctx.arc(18 + i * 18, 17, 5, 0, 7); sctx.fill(); });
      sctx.font = "600 15px monospace"; sctx.fillStyle = "#8fb8ff"; sctx.fillText("NETWORK-OPS // sakib@ventura", 84, 22);
      sctx.font = "15px monospace";
      [["core-switch-01", "ONLINE"], ["erp-server", "ONLINE"], ["vlan-prod", "ONLINE"], ["backup-job", "OK"]].forEach(([n, s], i) => {
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

    /* network switch + LEDs */
    const leds = [];
    const addLed = (x, y, z, w = 0.06, color = 0x3ddc84) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, 0.03), new THREE.MeshBasicMaterial({ color }));
      m.position.set(x, y, z);
      world.add(m);
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
      const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 6, 28, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff923e, transparent: true }));
      m.rotation.z = Math.PI / 4;
      wifi.add(m);
      return m;
    });
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), new THREE.MeshBasicMaterial({ color: 0xff923e }));
    dot.position.y = -0.05; wifi.add(dot);

    /* cables + data packets */
    const curves = [
      { c: new THREE.CatmullRomCurve3([[-1.6, 1.65, 0.38], [-1.9, 0.6, 1.4], [-2.8, 0.15, 1.5], [-3.5, 1.1, 0.5], [-3.45, 2.0, -0.2]].map((p) => new THREE.Vector3(...p))), color: 0xff923e },
      { c: new THREE.CatmullRomCurve3([[-1.0, 1.65, 0.38], [-0.2, 0.3, 1.8], [2.2, 0.15, 1.9], [3.1, 0.8, 1.3], [3.3, 1.28, 0.9]].map((p) => new THREE.Vector3(...p))), color: 0x4a90d9 },
    ];
    const packets = [];
    curves.forEach(({ c, color }) => {
      const tube = new THREE.Mesh(new THREE.TubeGeometry(c, 60, 0.045, 8, false), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
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

    /* floating cubes */
    const floaters = [];
    const palette = [0xff923e, 0xffffff, 0x4a90d9, 0xf2c14e, 0xff5d8f];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + Math.random();
      const r = 7.5 + Math.random() * 3;
      const s = 0.18 + Math.random() * 0.3;
      const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), mat(palette[i % palette.length]));
      let fx = Math.cos(a) * r, fz = -Math.abs(Math.sin(a) * r) - 1; /* behind the island, never over page text */
      m.position.set(fx, 1.5 + Math.random() * 6, fz);
      m.castShadow = true;
      scene.add(m);
      floaters.push({ m, sp: 0.2 + Math.random() * 0.6, ph: Math.random() * 6, y0: m.position.y });
    }

    /* floating portrait bubble (billboard, screen-anchored) */
    let bubble = null;
    if (window.SAKIB_CUTOUT) {
      const img = new Image();
      img.onload = () => {
        const W = 512, R = 256, H = 700;
        const c = document.createElement("canvas"); c.width = W; c.height = H;
        const x = c.getContext("2d");
        const cy = H - R;
        const grad = x.createRadialGradient(W * 0.3, cy - R * 0.5, 20, W / 2, cy, R);
        grad.addColorStop(0, "#7ad0ff"); grad.addColorStop(0.55, "#1fa2ff"); grad.addColorStop(1, "#0b78d8");
        /* 1) blue disc + white ring first, so they sit BEHIND the head */
        x.fillStyle = grad; x.beginPath(); x.arc(W / 2, cy, R - 6, 0, Math.PI * 2); x.fill();
        x.lineWidth = 12; x.strokeStyle = "#ffffff";
        x.beginPath(); x.arc(W / 2, cy, R - 6, 0, Math.PI * 2); x.stroke();
        /* 2) portrait: free above the disc centre (head pops out), clipped to the disc below it */
        x.save();
        x.beginPath(); x.rect(0, 0, W, cy); x.moveTo(W - 6, cy); x.arc(W / 2, cy, R - 6, 0, Math.PI, false); x.closePath(); x.clip();
        const iw = W - 12, ih = iw * (img.height / img.width); /* keep the true aspect ratio */
        x.drawImage(img, 6, H - ih, iw, ih);
        x.restore();
        /* 3) re-draw only the lower half of the ring over the shoulders for a crisp edge */
        x.beginPath(); x.arc(W / 2, cy, R - 6, 0, Math.PI, false); x.stroke();
        const tex = new THREE.CanvasTexture(c);
        const wdt = 1.35;
        bubble = new THREE.Mesh(
          new THREE.PlaneGeometry(wdt, wdt * H / W),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })
        );
        bubble.renderOrder = 10;
        scene.add(bubble);
      };
      img.src = window.SAKIB_CUTOUT;
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
    const tmp = new THREE.Vector3();

    function frame() {
      const t = clock.getElapsedTime();
      mouse.sx += (mouse.x - mouse.sx) * 0.05;
      mouse.sy += (mouse.y - mouse.sy) * 0.05;

      if (!reduce) world.position.y = Math.sin(t * 0.8) * 0.12;
      leds.forEach((l) => { l.m.material.color.setHex(Math.sin(t * l.speed + l.phase) > -0.2 ? l.color : 0x20242b); });
      packets.forEach((k) => {
        k.t = (k.t + k.speed * 0.016) % 1;
        k.p.position.copy(k.c.getPoint(k.t));
      });
      arcs.forEach((a, i) => {
        const ph = (t * 1.6 - i * 0.45) % 3;
        a.material.opacity = 0.25 + 0.75 * Math.max(0, Math.sin(Math.max(ph, 0)));
      });
      wifi.rotation.y = Math.atan2(camera.position.x - wifi.position.x, camera.position.z - wifi.position.z);
      floaters.forEach((f) => {
        f.m.rotation.x += 0.004 * f.sp; f.m.rotation.y += 0.006 * f.sp;
        f.m.position.y = f.y0 + Math.sin(t * f.sp + f.ph) * 0.35;
      });
      orbiters.forEach((k) => {
        const a = t * k.sp;
        tmp.set(Math.cos(a) * k.r, Math.sin(a) * k.r, 0);
        k.ring.updateMatrixWorld();
        k.o.position.copy(tmp.applyMatrix4(k.ring.matrixWorld));
      });
      sparkles.forEach((p, i) => { p.rotation.y = t * (0.03 + i * 0.012); p.position.y = Math.sin(t * 0.6 + i) * 0.25; });
      drawScreen(t);

      camera.position.set(rig.px + mouse.sx * 0.7, rig.py - mouse.sy * 0.4, rig.pz);
      camera.lookAt(rig.tx, rig.ty, rig.tz);
      const w = window.innerWidth, h = window.innerHeight;
      if (w > 900 && Math.abs(rig.off) > 0.001) camera.setViewOffset(w, h, -rig.off * w, 0, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();

      if (bubble) {
        const mobile = w <= 900;
        const nx = mobile ? 0.62 : rig.bx, ny = mobile ? 0.66 : rig.by;
        tmp.set(nx, ny + Math.sin(t * 1.2) * 0.025, 0.5).unproject(camera).sub(camera.position).normalize();
        bubble.position.copy(camera.position).addScaledVector(tmp, 10);
        bubble.quaternion.copy(camera.quaternion);
        const s = mobile ? 0 : Math.max(rig.bs, 0.0001); /* portrait lives in the About card on phones */
        bubble.scale.setScalar(s);
        bubble.rotation.z += Math.sin(t * 1.5) * 0.0015;
        bubble.visible = s > 0.02;
      }

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
    $$(".panel > *, .about-top > *, .card, .timeline > li, .group, .stats > div, .marquee").forEach((el) => {
      gsap.from(el, {
        y: 36, opacity: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" },
      });
    });
    /* portrait pops up */
    gsap.from(".pop .clip img", { y: 60, duration: 1.1, ease: "back.out(1.6)", scrollTrigger: { trigger: ".pop", start: "top 85%" } });
    gsap.from(".badge", { scale: 0, duration: 0.6, stagger: 0.15, ease: "back.out(2.5)", scrollTrigger: { trigger: ".pop", start: "top 80%" } });

    /* counters */
    $$("[data-count]").forEach((el) => {
      const end = +el.dataset.count, o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 95%", once: true,
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

    /* typing effect */
    const el = $("#typed");
    const phrases = ["network & infrastructure support", "ERP implementation", "IT asset management", "user training & onboarding", "problem solving at scale"];
    if (reduce) { el.textContent = phrases[0]; }
    else {
      let p = 0, i = 0, del = false;
      (function tick() {
        const word = phrases[p];
        el.textContent = word.slice(0, i);
        if (!del && i === word.length) { del = true; return setTimeout(tick, 1600); }
        if (del && i === 0) { del = false; p = (p + 1) % phrases.length; }
        i += del ? -1 : 1;
        setTimeout(tick, del ? 28 : 65);
      })();
    }

    /* scroll progress */
    const bar = $("#progress");
    const upd = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", upd, { passive: true }); upd();

    /* cursor glow */
    const glow = $("#glow");
    window.addEventListener("mousemove", (e) => {
      glow.style.opacity = 1;
      glow.style.transform = `translate(${e.clientX - 180}px, ${e.clientY - 180}px)`;
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
