"use client";
import { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Apple } from "lucide-react";
import { Logo, ThemeToggle } from "@/components/layout/Header";
import { ease } from "@/components/layout/ui";

const headline = ["Every", "bill", "updates", "everything."];

function GoogleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.7 3.72 14.56 2.8 12 2.8 6.95 2.8 2.87 6.88 2.87 11.93S6.95 21.06 12 21.06c6.93 0 9.53-4.87 9.53-7.4 0-.5-.05-.88-.18-1.26z"
      />
    </svg>
  );
}

// A dining table seen from directly above, drawn line by line: first the
// table, then the chairs and place settings. Then the food is served: real
// overhead photographs, one dish at a time.
// Photos are from Unsplash (free licence): personalgraphic.com, David Hunter,
// Jay Nlper, Alexandra Kusper, Nosh Caterers, David Foodphototasty,
// Coffee with Joshua.
const photo = (id: string, crop = "") =>
  `https://images.unsplash.com/photo-${id}?w=420&h=420&fit=crop&q=80&auto=format${crop}`;
const seats = [
  { x: 195, y: 214, side: "top", src: photo("1691480184494-d9f822edd4d1", "&crop=focalpoint&fp-x=0.5&fp-y=0.5&fp-z=1.4") },
  { x: 405, y: 214, side: "top", src: photo("1603911036147-2f35cce108ef") },
  { x: 450, y: 300, side: "right", src: photo("1617421753170-46511a8d73fc") },
  { x: 405, y: 386, side: "bottom", src: photo("1592778024292-d6782d22add7", "&crop=focalpoint&fp-x=0.6&fp-y=0.5&fp-z=1.25") },
  { x: 195, y: 386, side: "bottom", src: photo("1517306085770-871ff74b2274") },
  { x: 150, y: 300, side: "left", src: photo("1736680056361-6a2f6e35fa50") },
] as const;
const centre = photo("1692737580547-b45bb4a02356");
const drinks = [
  { x: 300, y: 200, src: photo("1587982704600-e5f79d652fe5", "&crop=focalpoint&fp-x=0.5&fp-y=0.55&fp-z=2.1") },
  { x: 300, y: 400, src: photo("1587982708730-ffc82d18e9fc", "&crop=focalpoint&fp-x=0.5&fp-y=0.52&fp-z=2.2") },
];
const at = (s: number) => ({ "--d": s + "s" }) as React.CSSProperties;

// One served dish: a round photo with a soft shadow that lands on its plate.
function Dish({ id, shadow, x, y, r, src, d }: { id: string; shadow: string; x: number; y: number; r: number; src: string; d: number }) {
  return (
    <g className="serve" style={at(d)}>
      <clipPath id={id}>
        <circle cx={x} cy={y} r={r} />
      </clipPath>
      <circle cx={x + 2} cy={y + 5} r={r} fill="#000" opacity={0.28} filter={`url(#${shadow})`} />
      <image href={src} x={x - r} y={y - r} width={r * 2} height={r * 2} clipPath={`url(#${id})`} preserveAspectRatio="xMidYMid slice" />
      <circle cx={x} cy={y} r={r} stroke="rgba(255,255,255,.5)" strokeWidth={1} />
    </g>
  );
}

function Chair({ x, y, side, d }: { x: number; y: number; side: string; d: number }) {
  // seat centre sits just outside the table edge on its side
  const cx = side === "left" ? 52 : side === "right" ? 548 : x;
  const cy = side === "top" ? 112 : side === "bottom" ? 488 : y;
  const flat = side === "top" || side === "bottom";
  const w = flat ? 70 : 54,
    h = flat ? 54 : 70;
  const out = side === "top" || side === "left" ? -1 : 1;
  const back = flat
    ? `M ${cx - 33} ${cy + out * 30} Q ${cx} ${cy + out * 44} ${cx + 33} ${cy + out * 30}`
    : `M ${cx + out * 30} ${cy - 33} Q ${cx + out * 44} ${cy} ${cx + out * 30} ${cy + 33}`;
  return (
    <g style={at(d)}>
      <rect pathLength={1} x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={14} />
      <path pathLength={1} d={back} strokeWidth={4} />
    </g>
  );
}

function Setting({ x, y, side, d }: { x: number; y: number; side: string; d: number }) {
  const flat = side === "top" || side === "bottom";
  return (
    <g style={at(d)}>
      <circle pathLength={1} cx={x} cy={y} r={46} />
      {[-1, 1].map((k) =>
        flat ? (
          <line key={k} pathLength={1} x1={x + k * 56} y1={y - 20} x2={x + k * 56} y2={y + 20} />
        ) : (
          <line key={k} pathLength={1} x1={x - 20} y1={y + k * 56} x2={x + 20} y2={y + k * 56} />
        ),
      )}
    </g>
  );
}

function TableScene({ className = "" }: { className?: string }) {
  // On a fresh load the loading curtain is still up, so hold the drawing
  // until it lifts; arriving from inside the app starts straight away.
  const uid = useId().replace(/:/g, "");
  const [base, setBase] = useState<number | null>(null);
  useEffect(() => setBase(performance.now() < 2500 ? 1.7 : 0), []);
  if (base === null) return <div aria-hidden className={"aspect-[584/496] " + className} />;
  const delay = (s: number) => ({ "--d": base + s + "s" }) as React.CSSProperties;
  return (
    <div
      aria-hidden
      className={"table-shot " + className}
      style={{ animationDelay: `${base}s, ${base + 4.2}s` }}
    >
      <svg viewBox="8 52 584 496" className="w-full h-auto overflow-visible" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g className="draw" stroke="var(--line-strong)" strokeWidth={1.6}>
          {/* table */}
          <g style={{ ...delay(0.3), "--dur": "1.8s" } as React.CSSProperties}>
            <rect pathLength={1} x={90} y={150} width={420} height={300} rx={38} strokeWidth={2.4} />
          </g>
          <g style={{ ...delay(0.9), "--dur": "1.6s" } as React.CSSProperties}>
            <rect pathLength={1} x={104} y={164} width={392} height={272} rx={28} />
          </g>
          {seats.map((s, i) => (
            <Chair key={"c" + i} {...s} d={base + 1.5 + i * 0.16} />
          ))}
          {seats.map((s, i) => (
            <Setting key={"s" + i} {...s} d={base + 2.5 + i * 0.16} />
          ))}
          {/* serving platter in the middle */}
          <g style={delay(3.4)}>
            <circle pathLength={1} cx={300} cy={300} r={62} />
          </g>
        </g>
        {/* the food is served, one dish at a time */}
        <defs>
          <filter id={uid + "shadow"} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        {seats.map(({ x, y, src }, i) => (
          <Dish key={i} shadow={uid + "shadow"} id={uid + "dish" + i} x={x} y={y} r={41} src={src} d={base + 4 + i * 0.42} />
        ))}
        <Dish shadow={uid + "shadow"} id={uid + "centre"} x={300} y={300} r={57} src={centre} d={base + 4 + seats.length * 0.42} />
        {drinks.map((k, i) => (
          <Dish key={i} shadow={uid + "shadow"} id={uid + "drink" + i} {...k} r={19} d={base + 4.6 + (seats.length + i) * 0.42} />
        ))}
      </svg>
    </div>
  );
}

export function Login({
  login,
}: {
  login: (provider?: string, next?: string) => void;
}) {
  const [busy, setBusy] = useState("");
  const go = async (id: string, provider?: string, next?: string) => {
    setBusy(id);
    try {
      await login(provider, next);
    } finally {
      setBusy("");
    }
  };
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 md:px-10 h-20">
        <span className="flex items-center gap-3 text-xl font-extrabold tracking-tight">
          <Logo size={40} /> Munshi
        </span>
        <ThemeToggle />
      </header>

      <main className="flex-1 grid lg:grid-cols-[1fr_1.15fr] gap-8 items-center px-5 md:px-10 pb-12 max-w-[1320px] w-full mx-auto">
        <div>
          <TableScene className="lg:hidden max-w-[320px] mx-auto -mt-4 mb-2" />
          <motion.div
            className="flex items-center gap-2.5 text-sm font-bold text-[var(--accent-text)] mb-5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="h-[3px] w-7 rounded-full bg-current" />
            The AI back office for small business
          </motion.div>
          <h1
            aria-label="Every bill updates everything."
            className="!text-[clamp(52px,8vw,118px)] !leading-[0.92] !tracking-[-0.055em] !font-extrabold"
            style={{ perspective: 900 }}
          >
            {headline.map((w, i) => (
              <motion.span
                key={w}
                aria-hidden
                className={"inline-block mr-[0.18em] origin-bottom " + (i === 3 ? "serif" : "")}
                initial={{ opacity: 0, y: 60, rotateX: 70 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.95, ease, delay: 0.2 + i * 0.11 }}
              >
                {w}
              </motion.span>
            ))}
          </h1>
          <motion.p
            className="text-lg md:text-xl muted mt-7 max-w-md leading-relaxed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75, ease }}
          >
            Sales, stock and books in one place. Scan a supplier bill and Munshi
            updates all three, then tells you what to do next.
          </motion.p>
          <motion.div
            className="mt-9 max-w-lg"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.9 }}
          >
            <button
              className="btn w-full !h-14 !text-base group"
              disabled={!!busy}
              onClick={() => go("start", undefined, "/onboarding")}
            >
              {busy === "start" ? "Setting up…" : "Set up my business"}
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </button>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button className="btn2 !h-[52px]" disabled={!!busy} onClick={() => go("apple", "apple", "/onboarding")}>
                <Apple size={16} /> Continue with Apple
              </button>
              <button className="btn2 !h-[52px]" disabled={!!busy} onClick={() => go("google", "google", "/onboarding")}>
                <GoogleMark /> Continue with Google
              </button>
            </div>
            <button
              className="mt-5 text-sm font-bold text-[var(--accent-text)] inline-flex items-center gap-1.5 group"
              disabled={!!busy}
              onClick={() => go("demo")}
            >
              {busy === "demo" ? "Opening the demo…" : "Just looking? Open the demo account"}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
        <TableScene className="hidden lg:block max-w-[760px] w-full mx-auto" />
      </main>
    </div>
  );
}
