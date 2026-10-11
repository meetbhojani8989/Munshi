"use client";
// Visual effects kit. BorderBeam and OrbitingCircles are adapted from Magic UI
// components retrieved via the 21st.dev registry; the rest are Munshi's own.
import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  Coffee,
  Croissant,
  Sandwich,
  Soup,
  Salad,
  Pizza,
  CupSoda,
  Cookie,
  Apple,
  Cherry,
  IceCreamCone,
  CakeSlice,
  Citrus,
  Donut,
  ChefHat,
  UtensilsCrossed,
  Egg,
  Wheat,
  Popcorn,
  Milk,
} from "lucide-react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/* ─── Border Beam (Magic UI via 21st.dev) ─────────────────────────────── */
export function BorderBeam({
  className,
  size = 220,
  duration = 9,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "#fb923c",
  colorTo = "#facc15",
  delay = 0,
}: {
  className?: string;
  size?: number;
  duration?: number;
  anchor?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}) {
  return (
    <div
      aria-hidden
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties
      }
      className={cx(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--anchor)*1%)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]",
        className,
      )}
    />
  );
}

/* ─── Orbiting Circles (Magic UI via 21st.dev) ────────────────────────── */
export function OrbitingCircles({
  className,
  children,
  reverse,
  duration = 20,
  delay = 10,
  radius = 50,
  path = true,
}: {
  className?: string;
  children?: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
}) {
  return (
    <>
      {path && (
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="var(--line-strong)"
            strokeDasharray="4 6"
          />
        </svg>
      )}
      <div
        style={{ "--duration": duration, "--radius": radius, "--delay": -delay } as React.CSSProperties}
        className={cx(
          "absolute flex transform-gpu animate-orbit items-center justify-center rounded-full [animation-delay:calc(var(--delay)*1000ms)]",
          reverse && "[animation-direction:reverse]",
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}

/* ─── Spotlight + tilt card ──────────────────────────────────────────── */
// A card that tilts toward the pointer and carries a saffron spotlight.
export function SpotCard({
  children,
  className = "",
  tilt = 6,
  beam = false,
}: {
  children: React.ReactNode;
  className?: string;
  tilt?: number;
  beam?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(-200),
    my = useMotionValue(-200);
  const rx = useSpring(0, { stiffness: 200, damping: 20 }),
    ry = useSpring(0, { stiffness: 200, damping: 20 });
  const bg = useMotionTemplate`radial-gradient(260px circle at ${mx}px ${my}px, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%)`;
  return (
    <motion.div
      ref={ref}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
        if (!reduce) {
          ry.set(((e.clientX - r.left) / r.width - 0.5) * tilt);
          rx.set(-((e.clientY - r.top) / r.height - 0.5) * tilt);
        }
      }}
      onPointerLeave={() => {
        mx.set(-200);
        my.set(-200);
        rx.set(0);
        ry.set(0);
      }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={"card group h-full overflow-hidden hover:shadow-[var(--glow)] " + className}
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: bg }} />
      {beam && <BorderBeam />}
      <div className="relative h-full">{children}</div>
    </motion.div>
  );
}

/* ─── Dish icons ─────────────────────────────────────────────────────── */
const dishRules: [RegExp, any][] = [
  [/latte|espresso|cappuccino|coffee|brew|mocha|americano/i, Coffee],
  [/tea|chai|matcha/i, Milk],
  [/croissant|pastry/i, Croissant],
  [/muffin|cake|brownie/i, CakeSlice],
  [/cookie|biscuit/i, Cookie],
  [/donut|bagel/i, Donut],
  [/bread|toast/i, Wheat],
  [/wrap|sandwich|panini|burger|sub/i, Sandwich],
  [/soup|stew/i, Soup],
  [/salad|bowl/i, Salad],
  [/pizza/i, Pizza],
  [/fries|chips|popcorn/i, Popcorn],
  [/lemonade|soda|water|juice|drink/i, CupSoda],
  [/lemon|lime|citrus|orange/i, Citrus],
  [/fruit|apple/i, Apple],
  [/cherry|berry/i, Cherry],
  [/ice cream|gelato|sundae/i, IceCreamCone],
  [/egg|breakfast/i, Egg],
];
export function dishIcon(name: string) {
  return dishRules.find(([re]) => re.test(name))?.[1] || UtensilsCrossed;
}
export function DishBadge({
  name,
  size = 40,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = dishIcon(name);
  return (
    <span
      className={"inline-flex items-center justify-center rounded-2xl shrink-0 bg-[var(--accent-soft)] text-[var(--accent-text)] " + className}
      style={{ width: size, height: size }}
    >
      <Icon size={size * 0.48} strokeWidth={1.8} />
    </span>
  );
}

/* ─── Floating food field ────────────────────────────────────────────── */
// Crisp food icons that drift, bob and lean away from the pointer (parallax).
const floaters = [
  { Icon: Coffee, x: 6, y: 14, s: 54, d: 7, r: -8 },
  { Icon: Croissant, x: 84, y: 10, s: 62, d: 8, r: 10 },
  { Icon: Pizza, x: 90, y: 62, s: 58, d: 6.5, r: -12 },
  { Icon: Soup, x: 3, y: 70, s: 50, d: 7.5, r: 6 },
  { Icon: Cherry, x: 48, y: 4, s: 40, d: 5.5, r: 14 },
  { Icon: Sandwich, x: 70, y: 86, s: 46, d: 6, r: -6 },
  { Icon: IceCreamCone, x: 26, y: 88, s: 42, d: 7, r: 12 },
  { Icon: ChefHat, x: 60, y: 30, s: 36, d: 9, r: -10 },
];
export function FloatingFood({
  className = "",
  items = floaters,
  dim = false,
}: {
  className?: string;
  items?: typeof floaters;
  dim?: boolean;
}) {
  const reduce = useReducedMotion();
  const px = useSpring(0, { stiffness: 60, damping: 18 }),
    py = useSpring(0, { stiffness: 60, damping: 18 });
  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth - 0.5) * 2);
      py.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, px, py]);
  return (
    <div aria-hidden className={"pointer-events-none absolute inset-0 overflow-hidden " + className}>
      {items.map(({ Icon, x, y, s, d, r }, i) => (
        <Parallax key={i} px={px} py={py} depth={(i % 3) + 1} style={{ left: `${x}%`, top: `${y}%` }}>
          <motion.span
            initial={{ opacity: 0, scale: 0.4, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 180, damping: 14 }}
            className={
              "animate-float inline-flex items-center justify-center rounded-[22px] border backdrop-blur-sm " +
              (dim
                ? "bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] border-line text-[var(--accent-text)] opacity-70"
                : "bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] border-line text-[var(--accent)] shadow-[var(--shadow)]")
            }
            style={{ width: s, height: s, "--dur": d, "--rot": `${r}deg`, "--float": 10 + (i % 3) * 4 } as React.CSSProperties}
          >
            <Icon size={s * 0.46} strokeWidth={1.7} />
          </motion.span>
        </Parallax>
      ))}
    </div>
  );
}
function Parallax({
  px,
  py,
  depth,
  style,
  children,
}: {
  px: any;
  py: any;
  depth: number;
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  const x = useSpring(0, { stiffness: 80, damping: 20 }),
    y = useSpring(0, { stiffness: 80, damping: 20 });
  useEffect(() => {
    const a = px.on("change", (v: number) => x.set(v * -10 * depth));
    const b = py.on("change", (v: number) => y.set(v * -10 * depth));
    return () => {
      a();
      b();
    };
  }, [px, py, depth, x, y]);
  return (
    <motion.div className="absolute" style={{ ...style, x, y }}>
      {children}
    </motion.div>
  );
}

/* ─── Steam ──────────────────────────────────────────────────────────── */
export function Steam({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={"pointer-events-none absolute flex gap-1.5 " + className}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-[3px] h-5 rounded-full animate-steam"
          style={{ background: "currentColor", animationDelay: `${i * 0.45}s` }}
        />
      ))}
    </span>
  );
}

/* ─── Live ticket burst ──────────────────────────────────────────────── */
// Chips that pop up and float away, like order tickets coming off the printer.
export function TicketBurst({
  items,
  every = 2200,
  className = "",
}: {
  items: { label: string; amount: string }[];
  every?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [live, setLive] = useState<{ id: number; label: string; amount: string; x: number }[]>([]);
  const n = useRef(0);
  useEffect(() => {
    if (reduce || !items.length) return;
    const t = setInterval(() => {
      const it = items[n.current % items.length];
      const id = n.current++;
      setLive((l) => [...l.slice(-3), { id, ...it, x: 8 + ((id * 37) % 60) }]);
      setTimeout(() => setLive((l) => l.filter((z) => z.id !== id)), 3200);
    }, every);
    return () => clearInterval(t);
  }, [items, every, reduce]);
  return (
    <div aria-hidden className={"pointer-events-none absolute inset-0 overflow-hidden " + className}>
      <AnimatePresence>
        {live.map((t) => {
          const Icon = dishIcon(t.label);
          return (
            <motion.div
              key={t.id}
              className="absolute bottom-4 flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5 bg-white/95 text-[#1c1410] shadow-lg text-xs font-medium"
              style={{ left: `${t.x}%` }}
              initial={{ opacity: 0, y: 20, scale: 0.7, rotate: -6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -150, scale: 1, rotate: 4 }}
              transition={{ duration: 3.1, ease: "easeOut", times: [0, 0.12, 0.75, 1] }}
            >
              <span className="w-6 h-6 rounded-full bg-[#fff1e7] text-[#c2410c] inline-flex items-center justify-center">
                <Icon size={13} />
              </span>
              {t.label}
              <span className="text-[#15803d] font-semibold">{t.amount}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ─── Shimmer text sweep ─────────────────────────────────────────────── */
export function Shine({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={"pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] " + className}>
      <span className="absolute inset-y-0 -left-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    </span>
  );
}
