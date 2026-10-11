"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

export type OrbShape = "sphere" | "brain" | "dollar" | "bars" | "curve" | "target" | "scatter";

const N = 1800;
type V = [number, number, number];

/* ─── Shape generators (unit space, radius ≈ 1) ──────────────────────── */
function sphere(): V[] {
  const out: V[] = [];
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2,
      r = Math.sqrt(1 - y * y),
      t = g * i;
    out.push([Math.cos(t) * r, y, Math.sin(t) * r]);
  }
  return out;
}

// Two hemispheres with sinusoidal folds read as a brain.
function brain(): V[] {
  const out: V[] = [];
  for (let i = 0; i < N; i++) {
    const u = Math.random() * Math.PI * 2,
      v = Math.acos(2 * Math.random() - 1);
    const fold = 1 + 0.09 * Math.sin(9 * u) * Math.sin(7 * v) + 0.05 * Math.sin(17 * v);
    let x = Math.sin(v) * Math.cos(u) * 1.05 * fold,
      y = Math.cos(v) * 0.78 * fold,
      z = Math.sin(v) * Math.sin(u) * 0.95 * fold;
    x += x >= 0 ? 0.08 : -0.08; // longitudinal fissure
    if (y < -0.45) y = -0.45 + (y + 0.45) * 0.4; // flatten the base
    out.push([x, y + 0.08, z]);
  }
  return out;
}

function glyph(ch: string): V[] {
  const S = 160;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.font = `800 ${S * 0.9}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ch, S / 2, S / 2 + S * 0.04);
  const d = ctx.getImageData(0, 0, S, S).data;
  const px: [number, number][] = [];
  for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) if (d[(y * S + x) * 4 + 3] > 128) px.push([x, y]);
  const out: V[] = [];
  for (let i = 0; i < N; i++) {
    const [x, y] = px[Math.floor(Math.random() * px.length)] || [S / 2, S / 2];
    out.push([(x / S - 0.5) * 2.1, -(y / S - 0.5) * 2.1, (Math.random() - 0.5) * 0.32]);
  }
  return out;
}

// Five rising 3D bars.
function bars(): V[] {
  const hs = [0.55, 0.85, 0.7, 1.25, 1.7];
  const out: V[] = [];
  for (let i = 0; i < N; i++) {
    const b = i % 5,
      w = 0.17,
      cx = -0.84 + b * 0.42,
      h = hs[b];
    const face = Math.floor(Math.random() * 3);
    let x = cx + (Math.random() - 0.5) * w * 2,
      y = -0.9 + Math.random() * h,
      z = (Math.random() - 0.5) * w * 2;
    if (face === 0) x = cx + (Math.random() < 0.5 ? -w : w);
    else if (face === 1) z = Math.random() < 0.5 ? -w : w;
    else y = -0.9 + h;
    out.push([x, y, z]);
  }
  return out;
}

// Profit curve ribbon (price → profit hump).
function curve(): V[] {
  const out: V[] = [];
  for (let i = 0; i < N; i++) {
    const t = Math.random() * 2 - 1;
    const y = 0.9 * Math.exp(-((t - 0.15) ** 2) / 0.22) - 0.5;
    out.push([t * 1.15, y + (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.5]);
  }
  return out;
}

function target(): V[] {
  const rings = [0.25, 0.55, 0.85, 1.12];
  const out: V[] = [];
  for (let i = 0; i < N; i++) {
    if (i % 9 === 0) {
      const a = Math.random() * Math.PI * 2,
        r = Math.random() * 0.1;
      out.push([Math.cos(a) * r, Math.sin(a) * r, 0]);
      continue;
    }
    const r = rings[i % 4],
      a = Math.random() * Math.PI * 2;
    out.push([Math.cos(a) * r, Math.sin(a) * r, (Math.random() - 0.5) * 0.12]);
  }
  return out;
}

function scatter(): V[] {
  return Array.from({ length: N }, () => {
    const r = 1.6 + Math.random() * 1.6,
      u = Math.random() * Math.PI * 2,
      v = Math.acos(2 * Math.random() - 1);
    return [Math.sin(v) * Math.cos(u) * r, Math.cos(v) * r, Math.sin(v) * Math.sin(u) * r] as V;
  });
}

const makers: Record<OrbShape, () => V[]> = {
  sphere,
  brain,
  dollar: () => glyph("$"),
  bars,
  curve,
  target,
  scatter,
};

/* ─── Component ──────────────────────────────────────────────────────── */
// Canvas point cloud with perspective projection. `sequence` is played once
// (each step: shape + hold ms); the last shape stays. Pointer repels points.
export function ThinkingOrb({
  sequence,
  run = 0,
  dark = false,
  color,
  className = "",
  onStep,
}: {
  sequence: { shape: OrbShape; hold: number }[];
  run?: number;
  dark?: boolean;
  color?: string;
  className?: string;
  onStep?: (i: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const stepRef = useRef(onStep);
  stepRef.current = onStep;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const cache: Partial<Record<OrbShape, V[]>> = {};
    const get = (s: OrbShape) => (cache[s] ||= makers[s]());
    const final = sequence[sequence.length - 1].shape;
    const pos: V[] = (reduce ? get(final) : get("scatter")).map((p) => [...p] as V);
    let tgt = reduce ? get(final) : get(sequence[0].shape);
    const delay = Array.from({ length: N }, () => Math.random() * 0.5);
    let stepStart = performance.now(),
      step = 0,
      rotY = 0,
      tiltX = -0.25,
      tiltTarget = -0.25,
      last = performance.now(),
      mouse: [number, number] | null = null,
      raf = 0,
      w = 0,
      h = 0,
      dpr = 1;
    stepRef.current?.(0);

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse = [e.clientX - r.left, e.clientY - r.top];
      tiltTarget = -0.25 + ((e.clientY - r.top) / r.height - 0.5) * 0.6;
    };
    const onLeave = () => {
      mouse = null;
      tiltTarget = -0.25;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

const hex = (color || "#6d4dff").replace("#", "");
    const base = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const mix = (to: number, t: number) => base.map((v) => Math.round(v + (to - v) * t));
    const front = dark ? mix(255, 0.45) : base;
    const back = dark ? mix(40, 0.55) : mix(225, 0.7);
    const gold = dark ? [255, 255, 255] : mix(0, 0.45);

    const frame = (now: number) => {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      // Frame-rate independent easing: same convergence at 30, 60 or 120 fps.
      const k = reduce ? 1 : 1 - Math.pow(1 - 0.075, dt * 60);
      // Advance the sequence.
      if (!reduce && step < sequence.length - 1 && now - stepStart > sequence[step].hold) {
        step++;
        stepStart = now;
        tgt = get(sequence[step].shape);
        for (let i = 0; i < N; i++) delay[i] = Math.random() * 0.35;
        stepRef.current?.(step);
      }
      const since = (now - stepStart) / 1000;
      rotY += reduce ? 0 : (sequence[step].shape === "brain" ? 0.36 : 0.21) * dt;
      tiltX += (tiltTarget - tiltX) * Math.min(1, dt * 3);
      const cy = Math.cos(rotY),
        sy = Math.sin(rotY),
        cxr = Math.cos(tiltX),
        sxr = Math.sin(tiltX);
      const R = Math.min(w, h) * 0.36,
        f = 3.2;
      const pulse = sequence[step].shape === "brain" ? 1 + Math.sin(now / 260) * 0.025 : 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const pts: [number, number, number, number][] = [];
      for (let i = 0; i < N; i++) {
        const p = pos[i],
          t = tgt[i];
        if (since > delay[i]) {
          p[0] += (t[0] * pulse - p[0]) * k;
          p[1] += (t[1] * pulse - p[1]) * k;
          p[2] += (t[2] * pulse - p[2]) * k;
        }
        // rotate Y then X
        let x = p[0] * cy - p[2] * sy,
          z = p[0] * sy + p[2] * cy,
          y = p[1];
        const y2 = y * cxr - z * sxr;
        z = y * sxr + z * cxr;
        y = y2;
        const s = f / (f + z);
        let X = w / 2 + x * R * s,
          Y = h / 2 - y * R * s;
        if (mouse) {
          const dx = X - mouse[0],
            dy = Y - mouse[1],
            d2 = dx * dx + dy * dy;
          if (d2 < 3600) {
            const push = (1 - d2 / 3600) * 22;
            const d = Math.sqrt(d2) || 1;
            X += (dx / d) * push;
            Y += (dy / d) * push;
          }
        }
        pts.push([X, Y, z, i]);
      }
      pts.sort((a, b) => b[2] - a[2]);
      for (const [X, Y, z, i] of pts) {
        const depth = Math.max(0, Math.min(1, (1.3 - z) / 2.6));
        const c = i % 23 === 0 ? gold : front;
        const r = Math.round(back[0] + (c[0] - back[0]) * depth),
          g = Math.round(back[1] + (c[1] - back[1]) * depth),
          b = Math.round(back[2] + (c[2] - back[2]) * depth);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.35 + depth * 0.65})`;
        const size = 0.6 + depth * 1.5;
        ctx.beginPath();
        ctx.arc(X, Y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, dark, color, reduce, sequence.map((s) => s.shape).join()]);

  return <canvas ref={ref} className={"block w-full h-full touch-none " + className} aria-hidden />;
}
