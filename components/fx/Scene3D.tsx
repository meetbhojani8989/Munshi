"use client";
import { useEffect, useRef, useState } from "react";
import { useMunshi } from "@/components/MunshiProvider";
import { accentHex } from "@/lib/prefs";
import { workspaceOf } from "@/components/layout/nav";

// Which 3D object each part of the app shows. Pages outside a workspace
// (landing, onboarding, Ask Munshi, settings) show none.
const OBJECT: Record<string, string> = {
  overview: "burger",
  sales: "cloche",
  stock: "jar",
  finance: "donut",
  intel: "pizza",
};
const objectFor = (page: string) => OBJECT[workspaceOf(page)?.key || ""] || "";

type Live = { page: string; boot: boolean; hex: string; on: boolean; still: boolean };

// One WebGL canvas for the whole app. Each workspace has its own food object,
// built from primitives, that sits beside the page title and slowly revolves,
// with one part in the accent colour. The burger also plays the loading screen:
// its layers fly in and stack while the app boots.
export function Scene3D({ page, boot }: { page: string; boot: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { prefs } = useMunshi();
  const live = useRef<Live>({ page, boot, hex: "", on: true, still: false });
  // Stay above the page while the curtain is up and for the flight that
  // follows, then settle behind the content.
  const [front, setFront] = useState(true);
  useEffect(() => {
    if (boot) return setFront(true);
    const t = setTimeout(() => setFront(false), 900);
    return () => clearTimeout(t);
  }, [boot]);

  live.current = {
    page,
    boot,
    hex: accentHex(prefs.hue),
    on: prefs.object3d,
    still: prefs.motion === "reduced",
  };

  useEffect(() => {
    let dispose = () => {};
    let dead = false;
    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import(
        "three/examples/jsm/environments/RoomEnvironment.js"
      );
      if (dead || !canvas.current) return;

      const renderer = new THREE.WebGLRenderer({
        canvas: canvas.current,
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      cam.position.z = 12;
      // Warm key from the front-left, cool rim from behind: food-photo lighting.
      const sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
      sun.position.set(-3, 6, 6);
      const rimLight = new THREE.DirectionalLight(0xdfe9ff, 1.4);
      rimLight.position.set(4, 3, -5);
      scene.add(sun, rimLight);

      const mat = (color: number | string, roughness = 0.6, metalness = 0) =>
        new THREE.MeshStandardMaterial({ color, roughness, metalness });
      const mesh = (g: any, m: any, x = 0, y = 0, z = 0) => {
        const o = new THREE.Mesh(g, m);
        o.position.set(x, y, z);
        return o;
      };
      const rand = (() => {
        let s = 7;
        return () => (s = (s * 16807) % 2147483647) / 2147483647;
      })();
      const phys = (o: Record<string, unknown>) => new THREE.MeshPhysicalMaterial(o);
      // Small painted textures stand in for photographs: colour maps for
      // browning and toppings, grey speckle maps for surface bumps.
      const paint = (size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, colour = true) => {
        const c = document.createElement("canvas");
        c.width = c.height = size;
        draw(c.getContext("2d")!, size);
        const t = new THREE.CanvasTexture(c);
        if (colour) t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = 8;
        return t;
      };
      const dots = (g: CanvasRenderingContext2D, s: number, n: number, colours: string[], min: number, max: number, alpha = 1) => {
        g.globalAlpha = alpha;
        for (let i = 0; i < n; i++) {
          g.fillStyle = colours[i % colours.length];
          g.beginPath();
          g.arc(rand() * s, rand() * s, min + rand() * (max - min), 0, 7);
          g.fill();
        }
        g.globalAlpha = 1;
      };
      // Parts tinted with the owner's accent share this material.
      const accent = mat("#888", 0.35, 0.1);

      const pores = paint(256, (g, n) => {
        g.fillStyle = "#808080";
        g.fillRect(0, 0, n, n);
        dots(g, n, 900, ["#6a6a6a", "#9a9a9a", "#747474"], 0.6, 2.4);
      }, false);
      const crumb = paint(256, (g, n) => {
        g.fillStyle = "#808080";
        g.fillRect(0, 0, n, n);
        dots(g, n, 2600, ["#3c3c3c", "#b4b4b4", "#5a5a5a", "#989898"], 0.8, 3.2);
      }, false);

      /* ── Burger: layers that can pull apart ───────────────────────────── */
      const burger = new THREE.Group();
      const layers: { o: any; y: number }[] = [];
      const layer = (o: any, y: number) => {
        o.position.y = y;
        burger.add(o);
        layers.push({ o, y });
      };
      // Egg-washed bun: dark golden crown fading to a pale waist.
      const crust = paint(256, (g, n) => {
        const k = g.createLinearGradient(0, 0, 0, n);
        k.addColorStop(0, "#96480f");
        k.addColorStop(0.5, "#bf7424");
        k.addColorStop(0.85, "#dda04f");
        k.addColorStop(1, "#eec98a");
        g.fillStyle = k;
        g.fillRect(0, 0, n, n);
        dots(g, n, 260, ["#8a4312", "#b86c22"], 1, 4, 0.18);
      });
      const bunTop = phys({ map: crust, bumpMap: pores, bumpScale: 0.6, roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.35 });
      const bunSide = phys({ color: "#e2ab5c", bumpMap: pores, bumpScale: 0.6, roughness: 0.6 });
      const crumbMat = phys({ color: "#f6e3b4", bumpMap: crumb, bumpScale: 1.2, roughness: 0.9 });

      const heel = new THREE.Group();
      const heelProfile = [[0, -0.16], [0.7, -0.16], [0.93, -0.12], [1.02, -0.02], [1.02, 0.1], [0.98, 0.16]].map(([x, y]) => new THREE.Vector2(x, y));
      heel.add(new THREE.Mesh(new THREE.LatheGeometry(heelProfile, 64), bunSide));
      heel.add(mesh(new THREE.CircleGeometry(0.98, 64).rotateX(-Math.PI / 2), crumbMat, 0, 0.16, 0));
      layer(heel, -0.66);

      // Seared patty: uneven edge, charred crust, a little rendered fat.
      const pattyG = new THREE.CylinderGeometry(1.06, 1.04, 0.3, 72, 5);
      const pp = pattyG.attributes.position;
      for (let i = 0; i < pp.count; i++) {
        const x = pp.getX(i), z = pp.getZ(i), y = pp.getY(i);
        const a = Math.atan2(z, x), r = Math.hypot(x, z);
        const edge = r > 0.5 ? 1 + Math.sin(a * 7) * 0.025 + Math.sin(a * 19 + y * 9) * 0.02 + Math.sin(a * 41) * 0.01 : 1;
        const bulge = 1 + (1 - (y / 0.15) ** 2) * 0.03;
        pp.setXYZ(i, x * edge * bulge, y + (r < 0.9 ? Math.sin(x * 9) * Math.cos(z * 8) * 0.012 : 0), z * edge * bulge);
      }
      pattyG.computeVertexNormals();
      const sear = paint(256, (g, n) => {
        g.fillStyle = "#4b2613";
        g.fillRect(0, 0, n, n);
        dots(g, n, 1500, ["#2a1309", "#6e3a1d", "#3a1b0d", "#85492a"], 1, 5, 0.75);
      });
      sear.repeat.set(3, 1);
      layer(new THREE.Mesh(pattyG, phys({ map: sear, bumpMap: crumb, bumpScale: 2.2, roughness: 0.78, clearcoat: 0.25, clearcoatRoughness: 0.5 })), -0.35);

      // Cheese slice that has started to melt over the edge.
      const cheeseG = new THREE.PlaneGeometry(2.05, 2.05, 28, 28).rotateX(-Math.PI / 2).rotateY(Math.PI / 4);
      const cp = cheeseG.attributes.position;
      for (let i = 0; i < cp.count; i++) {
        const x = cp.getX(i), z = cp.getZ(i);
        const r = Math.hypot(x, z);
        if (r > 1.0) {
          const over = r - 1.0;
          const k = 1 - Math.min(0.2, over * 0.45) / r;
          cp.setXYZ(i, x * k, -Math.min(0.34, over * 1.25 + over * over * 0.9), z * k);
        }
      }
      cheeseG.computeVertexNormals();
      layer(new THREE.Mesh(cheeseG, phys({ color: "#ffae1a", roughness: 0.3, clearcoat: 0.55, clearcoatRoughness: 0.25, side: THREE.DoubleSide })), -0.17);

      // Tomato slices and red onion rings.
      const tomato = new THREE.Group();
      const flesh = paint(256, (g, n) => {
        g.fillStyle = "#d42a1b";
        g.fillRect(0, 0, n, n);
        g.translate(n / 2, n / 2);
        for (let k = 0; k < 5; k++) {
          g.rotate((Math.PI * 2) / 5);
          g.fillStyle = "#f0604a";
          g.beginPath();
          g.ellipse(0, n * 0.27, n * 0.1, n * 0.16, 0, 0, 7);
          g.fill();
          g.fillStyle = "#f7d58a";
          for (let m = 0; m < 5; m++) g.fillRect(-n * 0.05 + m * n * 0.022, n * 0.2 + (m % 2) * n * 0.06, n * 0.012, n * 0.03);
        }
      });
      const tomatoSkin = phys({ color: "#c81f13", roughness: 0.2, clearcoat: 1 });
      const tomatoFace = phys({ map: flesh, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1 });
      for (const [x, z] of [[-0.42, 0.18], [0.44, 0.08], [0.02, -0.46]])
        tomato.add(mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.09, 40), [tomatoSkin, tomatoFace, tomatoFace], x, 0, z));
      const onion = phys({ color: "#b4589e", roughness: 0.3, clearcoat: 0.8 });
      for (const [x, z, r] of [[-0.3, -0.25, 0.34], [0.36, 0.3, 0.3], [0.1, 0.02, 0.22]])
        tomato.add(mesh(new THREE.TorusGeometry(r, 0.035, 10, 40).rotateX(Math.PI / 2), onion, x, 0.075, z));
      layer(tomato, -0.05);

      // Ruffled lettuce.
      const leafG = new THREE.CylinderGeometry(1.2, 1.2, 0.015, 96, 6);
      const lp = leafG.attributes.position;
      for (let i = 0; i < lp.count; i++) {
        const x = lp.getX(i), z = lp.getZ(i);
        const a = Math.atan2(z, x), r = Math.hypot(x, z);
        if (r < 0.3) continue;
        const k = 1 + Math.sin(a * 6) * 0.07 + Math.sin(a * 23) * 0.025;
        lp.setXYZ(i, x * k, lp.getY(i) + (Math.sin(a * 13) * 0.085 + Math.sin(a * 5 + 1) * 0.05) * r, z * k);
      }
      leafG.computeVertexNormals();
      layer(new THREE.Mesh(leafG, phys({ color: "#6fbf3a", roughness: 0.5, sheen: 1, sheenColor: "#e3f7b0", side: THREE.DoubleSide })), 0.09);

      const top = new THREE.Group();
      const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), bunTop);
      dome.scale.y = 0.66;
      top.add(dome, mesh(new THREE.CircleGeometry(1, 64).rotateX(Math.PI / 2), crumbMat));
      const seedG = new THREE.SphereGeometry(0.038, 10, 8);
      const seed = phys({ color: "#fbf0d2", roughness: 0.45 });
      for (let i = 0; i < 46; i++) {
        const a = rand() * Math.PI * 2,
          r = 0.08 + Math.sqrt(rand()) * 0.74;
        const y = Math.sqrt(1 - r * r) * 0.66;
        const sd = mesh(seedG, seed, Math.cos(a) * r, y + 0.005, Math.sin(a) * r);
        sd.scale.set(0.75, 0.42, 1.55);
        sd.rotation.set(-Math.sin(a) * r * 0.9, rand() * 3, Math.cos(a) * r * 0.9);
        top.add(sd);
      }
      layer(top, 0.18);
      // toothpick flag carries the accent
      const pick = new THREE.Group();
      pick.add(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.9, 8), mat("#e8d2a6")));
      pick.add(mesh(new THREE.BoxGeometry(0.34, 0.2, 0.012), accent, 0.17, 0.33, 0));
      layer(pick, 1.1);

      /* ── Cloche: a dome that lifts off the plate ──────────────────────── */
      const cloche = new THREE.Group();
      cloche.add(mesh(new THREE.CylinderGeometry(1.3, 1.15, 0.08, 64), mat("#f7f7f5", 0.25), 0, -0.55, 0));
      cloche.add(mesh(new THREE.SphereGeometry(0.42, 32, 24), accent, 0, -0.16, 0));
      const lid = new THREE.Group();
      const steel = mat("#e9ecef", 0.12, 1);
      lid.add(new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), steel));
      lid.add(mesh(new THREE.TorusGeometry(1, 0.04, 12, 64).rotateX(Math.PI / 2), steel));
      lid.add(mesh(new THREE.SphereGeometry(0.13, 24, 24), steel, 0, 1.08, 0));
      lid.position.y = -0.5;
      cloche.add(lid);

      /* ── Jar: glass, accent lid, dry goods inside ─────────────────────── */
      const jar = new THREE.Group();
      const glass = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.22,
        roughness: 0.04,
        clearcoat: 1,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      jar.add(mesh(new THREE.CylinderGeometry(0.82, 0.82, 1.6, 48, 1, true), glass, 0, -0.1, 0));
      jar.add(mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.04, 48), glass, 0, -0.9, 0));
      jar.add(mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.24, 48), accent, 0, 0.82, 0));
      const goods = ["#e9c46a", "#b5452c", "#7a4a26", "#f1dca7"].map((c) => mat(c, 0.7));
      const bean = new THREE.SphereGeometry(0.13, 12, 12);
      for (let i = 0; i < 46; i++) {
        const a = rand() * Math.PI * 2,
          r = Math.sqrt(rand()) * 0.62;
        const b = mesh(bean, goods[i % 4], Math.cos(a) * r, -0.78 + rand() * 0.95, Math.sin(a) * r);
        b.scale.set(1, 0.7 + rand() * 0.5, 1.25);
        b.rotation.set(rand() * 3, rand() * 3, rand() * 3);
        jar.add(b);
      }

      /* ── Donut: fried ring, glossy accent glaze that drips, sprinkles ─── */
      const donut = new THREE.Group();
      const fried = paint(256, (g, n) => {
        const k = g.createLinearGradient(0, 0, 0, n);
        k.addColorStop(0, "#f0d199");
        k.addColorStop(0.12, "#c98742");
        k.addColorStop(0.5, "#b87332");
        k.addColorStop(0.88, "#c98742");
        k.addColorStop(1, "#f0d199");
        g.fillStyle = k;
        g.fillRect(0, 0, n, n);
        dots(g, n, 300, ["#a5632a", "#d9a25c"], 1, 4, 0.25);
      });
      donut.add(new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.4, 40, 96), phys({ map: fried, bumpMap: pores, bumpScale: 0.8, roughness: 0.72 })));
      // Glaze: the top of the torus, with an uneven lower edge that runs.
      const SEG = 128, RING = 18, TUBE = 0.415;
      const gv: number[] = [], gi: number[] = [];
      for (let i = 0; i <= SEG; i++) {
        const th = (i / SEG) * Math.PI * 2;
        const reach = 1.3 + Math.sin(th * 5) * 0.22 + Math.sin(th * 11 + 1) * 0.16 + Math.max(0, Math.sin(th * 3 + 2)) ** 6 * 0.5;
        for (let j = 0; j <= RING; j++) {
          const ph = Math.PI / 2 + (j / RING - 0.5) * 2 * reach;
          const r = 0.72 + TUBE * Math.cos(ph);
          gv.push(r * Math.cos(th), r * Math.sin(th), TUBE * Math.sin(ph));
        }
      }
      for (let i = 0; i < SEG; i++)
        for (let j = 0; j < RING; j++) {
          const p0 = i * (RING + 1) + j, p1 = p0 + RING + 1;
          gi.push(p0, p0 + 1, p1, p1, p0 + 1, p1 + 1);
        }
      const glazeG = new THREE.BufferGeometry();
      glazeG.setAttribute("position", new THREE.Float32BufferAttribute(gv, 3));
      glazeG.setIndex(gi);
      glazeG.computeVertexNormals();
      const glaze = phys({ roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide });
      donut.add(new THREE.Mesh(glazeG, glaze));
      const sprinkle = new THREE.CapsuleGeometry(0.024, 0.09, 4, 8);
      const tints = ["#ffffff", "#ffd23f", "#ff6b6b", "#7ae0d6", "#ffb3d9"].map((c) => phys({ color: c, roughness: 0.3, clearcoat: 0.6 }));
      for (let i = 0; i < 70; i++) {
        const a = rand() * Math.PI * 2,
          r = 0.72 + (rand() - 0.5) * 0.5;
        const lift = Math.sqrt(Math.max(0, TUBE * TUBE - (r - 0.72) ** 2)) + 0.012;
        const sp = mesh(sprinkle, tints[i % 5], Math.cos(a) * r, Math.sin(a) * r, lift);
        sp.rotation.set((rand() - 0.5) * 0.6, (rand() - 0.5) * 0.6, rand() * Math.PI);
        donut.add(sp);
      }
      donut.rotation.x = -1.05;

      /* ── Pizza as a pie chart: one slice pulled out, on an accent board ─ */
      const pizza = new THREE.Group();
      const melted = paint(512, (g, n) => {
        g.fillStyle = "#b5371c";
        g.fillRect(0, 0, n, n);
        g.fillStyle = "#f3b638";
        g.beginPath();
        g.arc(n / 2, n / 2, n * 0.47, 0, 7);
        g.fill();
        dots(g, n, 220, ["#fbe19a", "#f7cf66"], 8, 26, 0.5);
        dots(g, n, 120, ["#c9722a", "#b85a1e"], 4, 14, 0.4);
        dots(g, n, 90, ["#c2452a"], 5, 16, 0.35);
        dots(g, n, 260, ["#3f6b24", "#55802f"], 0.8, 2.2, 0.8);
      });
      const cheeseTop = phys({ map: melted, bumpMap: crumb, bumpScale: 1.4, roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.4 });
      const base = phys({ color: "#d7a258", bumpMap: pores, bumpScale: 0.8, roughness: 0.8 });
      const rim = phys({ map: crust, bumpMap: crumb, bumpScale: 1.6, roughness: 0.7 });
      const pep = phys({ color: "#a3271a", bumpMap: crumb, bumpScale: 1.5, roughness: 0.35, clearcoat: 0.6 });
      const basil = phys({ color: "#3f8f2f", roughness: 0.45, sheen: 1, sheenColor: "#c8f0a0" });
      const slices: { g: any; a: number }[] = [];
      const cuts = [0.3, 0.22, 0.18, 0.16, 0.14];
      let at = 0;
      cuts.forEach((share, n) => {
        const len = share * Math.PI * 2 - 0.05;
        const g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.04, 1.04, 0.08, 40, 1, false, at, len), base));
        g.add(mesh(new THREE.CylinderGeometry(0.94, 0.94, 0.035, 40, 1, false, at, len), cheeseTop, 0, 0.055, 0));
        const edge = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.085, 14, 32, len).rotateX(-Math.PI / 2), rim);
        edge.rotation.y = at - Math.PI / 2;
        edge.position.y = 0.035;
        g.add(edge);
        const mid = at + len / 2;
        const spots: [number, number][] = [[mid, 0.34], [mid - len * 0.22, 0.66], [mid + len * 0.24, 0.7]];
        spots.slice(0, share > 0.17 ? 3 : 2).forEach(([a, r]) => {
          const p = mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.022, 24), pep, Math.sin(a) * r, 0.085, Math.cos(a) * r);
          p.rotation.set((rand() - 0.5) * 0.12, 0, (rand() - 0.5) * 0.12);
          g.add(p);
        });
        if (n % 2 === 0) {
          const leaf = mesh(new THREE.SphereGeometry(0.11, 16, 12), basil, Math.sin(mid + 0.2) * 0.52, 0.095, Math.cos(mid + 0.2) * 0.52);
          leaf.scale.set(1.5, 0.12, 0.85);
          leaf.rotation.y = rand() * 3;
          g.add(leaf);
        }
        pizza.add(g);
        slices.push({ g, a: mid });
        at += share * Math.PI * 2;
      });
      pizza.add(mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.05, 64), accent, 0, -0.07, 0));
      pizza.rotation.x = 0.95;

      // Soft shadow on the "table" beneath whichever object is showing.
      const shade = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 0.7),
        new THREE.MeshBasicMaterial({
          map: paint(128, (g, n) => {
            const k = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
            k.addColorStop(0, "rgba(0,0,0,.55)");
            k.addColorStop(1, "rgba(0,0,0,0)");
            g.fillStyle = k;
            g.fillRect(0, 0, n, n);
          }),
          transparent: true,
          depthWrite: false,
        }),
      );
      shade.position.y = -1.32;

      const models: Record<string, any> = { burger, cloche, jar, donut, pizza };
      const shown: Record<string, number> = {};
      const root = new THREE.Group();
      for (const k in models) {
        const holder = new THREE.Group();
        holder.add(models[k]);
        holder.scale.setScalar(0.001);
        root.add(holder);
        shown[k] = 0;
        models[k] = holder;
      }
      const rig = new THREE.Group();
      rig.add(root, shade);
      scene.add(rig);

      let W = 1,
        H = 1;
      // The canvas is only as big as the object (full screen just for the
      // launch), and is moved with a transform, so the page never has to
      // composite a screen-sized WebGL layer.
      let cw = 0,
        ch = 0;
      const fit = (w: number, h: number) => {
        if (w === cw && h === ch) return;
        cw = w;
        ch = h;
        renderer.setSize(w, h, true);
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
      };
      const resize = () => {
        W = window.innerWidth;
        H = window.innerHeight;
      };
      resize();
      const pointer = { x: 0, y: 0 };
      const onMove = (e: PointerEvent) => {
        pointer.x = e.clientX / W - 0.5;
        pointer.y = e.clientY / H - 0.5;
      };
      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", onMove, { passive: true });

      let hex = "",
        turn = 0,
        px = 0,
        py = 0,
        ps = 0.001,
        spread = 2.4,
        titleY = 190,
        frames = 0,
        wasShowing = true,
        first = true,
        raf = 0,
        t0 = performance.now();
      const born = t0;

      const frame = (now: number) => {
        const s = live.current;
        const dt = Math.min(0.05, (now - t0) / 1000);
        const t = (now - born) / 1000;
        t0 = now;
        if (s.hex !== hex) {
          hex = s.hex;
          accent.color.set(hex);
          glaze.color.set(hex);
        }
        const active = s.boot ? "burger" : s.on ? objectFor(s.page) : "";
        const mobile = W < 768;

        // Anchor: centre of the screen while booting, otherwise level with
        // the page's own heading (wherever the layout puts it), on the right.
        // It is pinned to the page, so it scrolls away with it.
        const head = s.boot || frames++ % 8 ? null : document.querySelector("#content h1");
        if (head) {
          const r = head.getBoundingClientRect();
          titleY = mobile ? r.top - 26 : r.top + r.height / 2 + 6;
        }
        const ax = s.boot ? W / 2 : mobile ? W - 52 : Math.min(W - 130, W / 2 + 480);
        const ay = s.boot ? H * 0.4 : titleY;
        // target radius of one model unit, in CSS pixels
        const ar = s.boot ? Math.min(W, H) * (mobile ? 0.16 : 0.19) : mobile ? 34 : 88;
        const k = first ? 1 : 1 - Math.exp(-dt * 4);
        px += (ax - px) * k;
        py += (ay - py) * k;
        ps += (ar - ps) * k;
        first = false;
        const side = mobile ? 170 : 440;
        if (s.boot) fit(W, H);
        else fit(side, side);
        const vh = 2 * Math.tan((cam.fov * Math.PI) / 360) * cam.position.z;
        rig.scale.setScalar((ps * vh) / ch);
        canvas.current!.style.transform = `translate3d(${px - cw / 2}px, ${py - ch / 2}px, 0)`;

        // Swap objects: the outgoing one shrinks away as the new one grows in.
        let any = 0;
        for (const key in models) {
          shown[key] += ((key === active ? 1 : 0) - shown[key]) * (1 - Math.exp(-dt * 7));
          models[key].scale.setScalar(Math.max(0.001, shown[key]));
          models[key].visible = shown[key] > 0.01;
          any = Math.max(any, shown[key]);
        }
        (shade.material as any).opacity = s.boot ? 0 : any * 0.5;

        if (!s.still) turn += dt * (s.boot ? 1.5 : 0.45);
        root.rotation.set(0.32 + pointer.y * 0.35, turn + pointer.x * 0.5, 0);

        // Burger: layers stack up during boot, then breathe apart now and then.
        const want = s.boot
          ? Math.max(0, 2.4 - t * 1.7)
          : s.still
            ? 0
            : Math.max(0, Math.sin(t * 0.7)) ** 6 * 0.55;
        spread += (want - spread) * (1 - Math.exp(-dt * 5));
        layers.forEach(({ o, y }, i) => {
          o.position.y = y * (1 + spread * 1.5) + spread * (i - 3.5) * 0.18;
          o.rotation.z = spread * (i % 2 ? 0.12 : -0.12);
        });
        // Cloche lid lifts to reveal the plate; a pizza slice slides out.
        lid.position.y = -0.5 + (s.still ? 0.5 : Math.max(0, Math.sin(t * 0.9)) ** 2 * 0.95);
        const out = s.still ? 0.3 : 0.18 + Math.max(0, Math.sin(t * 1.1)) * 0.3;
        slices[0].g.position.set(Math.sin(slices[0].a) * out, out * 0.4, Math.cos(slices[0].a) * out);

        // Nothing on show (landing, onboarding, Ask, settings): draw nothing.
        const showing = s.boot || Object.values(shown).some((v) => v > 0.01);
        if (showing || wasShowing) renderer.render(scene, cam);
        wasShowing = showing;
        raf = requestAnimationFrame(frame);
      };
      frame(performance.now());

      dispose = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onMove);
        pmrem.dispose();
        renderer.dispose();
      };
    })();
    return () => {
      dead = true;
      dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className="no-print fixed left-0 top-0 pointer-events-none will-change-transform"
      style={{ zIndex: front ? 95 : 1, viewTransitionName: "scene" }}
    />
  );
}
