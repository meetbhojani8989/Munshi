"use client";
import { useEffect, useState } from "react";

const lines = ["Toasting the bun", "Stacking the layers", "Balancing the books", "Order up"];

// First-load curtain. A 3D burger assembles above it (Scene3D raises itself
// while `open`), a counter runs to 100, then the curtain lifts.
export function Splash({ open, duration }: { open: boolean; duration: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p >= 1) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [duration]);
  return (
    <div
      aria-hidden={!open}
      role="status"
      className="splash no-print fixed inset-0 z-[90] flex flex-col items-center justify-end pb-[14vh] bg-[var(--bg)]"
      style={{
        opacity: open ? 1 : 0,
        visibility: open ? "visible" : "hidden",
        transform: open ? "none" : "scale(1.06)",
        transition: "opacity .7s ease, transform .9s cubic-bezier(.2,.9,.2,1), visibility 0s linear " + (open ? "0s" : ".9s"),
      }}
    >
      <div className="relative text-center">
        <div className="display text-[clamp(44px,8vw,88px)] font-extrabold tracking-[-0.05em] leading-none">
          Mun<span className="serif">shi</span>
        </div>
        <div className="mt-5 text-sm font-semibold muted h-5">
          {lines[Math.min(lines.length - 1, Math.floor((n / 100) * lines.length))]}
        </div>
        <div className="mt-5 mx-auto w-56 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
          <div
            className="h-full rounded-full origin-left"
            style={{
              transform: `scaleX(${n / 100})`,
              background: "var(--brand)",
            }}
          />
        </div>
        <div className="mono text-xs muted mt-3 num">{n}%</div>
        <div className="text-xs muted mt-6">Click or press any key to skip</div>
      </div>
    </div>
  );
}
