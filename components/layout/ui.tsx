"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { X } from "lucide-react";

export const ease = [0.2, 0.8, 0.2, 1] as const;

export const money = (n: number) =>
  `${n < 0 ? "-" : "+"}$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
export const usd = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
export const signed = (n: number) => (
  <span className={n < 0 ? "negative" : "positive"}>{money(n)}</span>
);

export const Card = ({
  children,
  className = "",
  lift = false,
}: {
  children: React.ReactNode;
  className?: string;
  lift?: boolean;
}) => (
  <div className={"card " + (lift ? "lift " : "") + className}>{children}</div>
);

// Page heading (leaves room on the right for the page's 3D object): accent kicker, then the title tips up word by word. The last word is set in italic serif and painted with the accent.
export const Title = ({
  kicker,
  title,
  sub,
  action,
  compact = false,
}: {
  kicker: string;
  title: string;
  sub: string;
  action?: React.ReactNode;
  compact?: boolean;
}) => {
  const words = title.split(" ");
  return (
    <div
      className={
        "flex flex-wrap items-end justify-between gap-6 " +
        (compact ? "mb-6" : "mb-8 md:mb-12 md:pt-4 md:pr-[210px] lg:pr-[250px]")
      }
    >
      <div className="max-w-3xl">
        <motion.div
          className="flex items-center gap-2.5 text-sm font-bold text-[var(--accent-text)] mb-3"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease }}
        >
          <span className="h-[3px] w-7 rounded-full bg-current" />
          {kicker}
        </motion.div>
        <h1
          aria-label={title}
          className={compact ? "!text-[clamp(26px,3vw,36px)]" : ""}
          style={{ perspective: 800 }}
        >
          {words.map((w, i) => (
            <motion.span
              key={i}
              aria-hidden
              className={
                "inline-block mr-[0.22em] origin-bottom " +
                (words.length > 1 && i === words.length - 1 ? "serif" : "")
              }
              initial={{ opacity: 0, y: 26, rotateX: 55 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.06 + i * 0.07 }}
            >
              {w}
            </motion.span>
          ))}
        </h1>
        <motion.p
          className="muted mt-4 text-base max-w-xl"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.3 }}
        >
          {sub}
        </motion.p>
      </div>
      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease, delay: 0.35 }}
        >
          {action}
        </motion.div>
      )}
    </div>
  );
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 180, damping: 22 },
  },
};

export function Stagger({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function Rise({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={"min-w-0 " + className} variants={item}>
      {children}
    </motion.div>
  );
}

// Counts up to `value` when scrolled into view, and re-animates from the old
// value whenever it changes, so every cascade visibly moves the numbers.
export function Counter({
  value,
  format = (n) => Math.round(n).toLocaleString("en-US"),
  className = "",
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const from = useRef(0);
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setShown(value);
      return;
    }
    const controls = animate(from.current, value, {
      duration: 1.1,
      ease,
      onUpdate: (v) => setShown(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, inView, reduce]);
  return (
    <span ref={ref} className={"num " + className}>
      {format(shown)}
    </span>
  );
}

export function Stat({
  label,
  value,
  format,
  tone = "",
  hint,
  icon,
}: {
  label: string;
  value: number | string;
  format?: (n: number) => string;
  tone?: string;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card lift h-full overflow-hidden group">
      <div className="relative flex justify-between items-start">
        <div className="eyebrow">{label}</div>
        {icon && <span className="muted">{icon}</span>}
      </div>
      <div
        className={
          "relative display text-[34px] leading-none font-extrabold mt-4 tracking-[-0.045em] " +
          tone
        }
      >
        {typeof value === "number" ? (
          <Counter value={value} format={format} />
        ) : (
          <span className="num text-[22px] tracking-[-0.03em]">{value}</span>
        )}
      </div>
      {hint && <div className="relative text-xs muted mt-3">{hint}</div>}
    </div>
  );
}

// Segmented control with a sliding raised thumb.
export function Segmented({
  options,
  value,
  onChange,
  id,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex flex-wrap gap-1 p-1 rounded-full bg-[var(--surface-3)]"
    >
      {options.map((o) => (
        <button
          key={o}
          role="tab"
          aria-selected={o === value}
          onClick={() => onChange(o)}
          className={
            "relative px-4 h-9 rounded-full text-sm font-semibold transition-colors " +
            (o === value ? "text-[var(--ink)]" : "muted hover:text-[var(--ink)]")
          }
        >
          {o === value && (
            <motion.span
              layoutId={"seg-" + id}
              className="absolute inset-0 rounded-full bg-[var(--surface)] shadow-[var(--shadow)]"
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
            />
          )}
          <span className="relative">{o}</span>
        </button>
      ))}
    </div>
  );
}

// Right-hand drawer with backdrop.
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label={title}
            className="relative glass !bg-[var(--glass-strong)] w-full max-w-md h-[calc(100%-24px)] m-3 p-7 overflow-auto border border-line rounded-[var(--r)]"
            initial={{ x: "110%" }}
            animate={{ x: 0 }}
            exit={{ x: "110%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl">{title}</h2>
              <button
                className="btn2 !px-0 w-11"
                aria-label="Close"
                onClick={onClose}
              >
                <X size={16} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Animated horizontal bar (scaleX keeps it on the compositor).
export function Bar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
      <motion.div
        className={
          "h-full rounded-full origin-left " +
          (className || "bg-[var(--brand)]")
        }
        initial={{ scaleX: 0 }}
        animate={{ scaleX: Math.max(0, Math.min(1, value / 100)) }}
        transition={{ duration: 1, ease, delay: 0.3 }}
      />
    </div>
  );
}

// Chart colours resolve from the live accent tokens, so charts follow the
// owner's personalisation without re-rendering.
export function useChartColors() {
  return {
    ink: "var(--brand)",
    ink2: "var(--line-strong)",
    accent: "var(--accent-soft)",
    pos: "var(--pos)",
    neg: "var(--neg)",
    warn: "var(--warn)",
    grid: "var(--line)",
    series: [
      "var(--brand)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--pos)",
      "var(--warn)",
    ],
  };
}

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass !bg-[var(--glass-strong)] rounded-2xl border border-line px-3.5 py-2.5 text-xs">
      {label !== undefined && <div className="eyebrow mb-1">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} className="flex gap-3 justify-between">
          <span className="muted">{p.name}</span>
          <span className="num">{Number(p.value).toLocaleString("en-US")}</span>
        </div>
      ))}
    </div>
  );
}
