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
import { useMunshi } from "@/components/MunshiProvider";
import { SpotCard } from "@/components/fx";

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

// Page heading: mono eyebrow, then the title rises word by word out of a mask.
export const Title = ({
  kicker,
  title,
  sub,
  action,
}: {
  kicker: string;
  title: string;
  sub: string;
  action?: React.ReactNode;
}) => {
  const words = title.split(" ");
  return (
    <div className="mb-8 md:mb-10 flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-3xl">
        <motion.div
          className="tag tag-accent mb-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
        >
          <span className="live-dot" />
          {kicker}
        </motion.div>
        <h1 aria-label={title}>
          {words.map((w, i) => (
            <span
              key={i}
              aria-hidden
              className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]"
            >
              <motion.span
                className={
                  "inline-block " +
                  (words.length > 1 && i === words.length - 1 ? "serif" : "")
                }
                initial={{ y: "105%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.7, ease, delay: 0.05 + i * 0.06 }}
              >
                {w}
                {i < words.length - 1 ? " " : ""}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p
          className="muted mt-4 text-[15px] max-w-xl"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.25 }}
        >
          {sub}
        </motion.p>
      </div>
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.3 }}
        >
          {action}
        </motion.div>
      )}
    </div>
  );
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.12 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
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
    <SpotCard>
      <div className="flex justify-between items-start">
        <div className="eyebrow">{label}</div>
        {icon && <span className="muted">{icon}</span>}
      </div>
      <div className={"display text-[30px] font-bold mt-4 tracking-tight " + tone}>
        {typeof value === "number" ? (
          <Counter value={value} format={format} />
        ) : (
          <span className="num">{value}</span>
        )}
      </div>
      {hint && <div className="text-xs muted mt-2">{hint}</div>}
    </SpotCard>
  );
}

// Pill tabs with a sliding ink indicator.
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
      className="inline-flex flex-wrap gap-1 p-1 rounded-full border border-line bg-surface-2"
    >
      {options.map((o) => (
        <button
          key={o}
          role="tab"
          aria-selected={o === value}
          onClick={() => onChange(o)}
          className={
            "relative px-4 h-9 rounded-full text-sm transition-colors " +
            (o === value
              ? "text-[var(--on-brand)]"
              : "muted hover:text-[var(--ink)]")
          }
        >
          {o === value && (
            <motion.span
              layoutId={"seg-" + id}
              className="absolute inset-0 rounded-full bg-[var(--brand)] shadow-sm"
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
            className="relative bg-surface w-full max-w-md h-full p-7 overflow-auto border-l border-line"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl">{title}</h2>
              <button
                className="btn2 !px-0 w-10"
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
    <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
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

export function useChartColors() {
  const { dark } = useMunshi();
  return {
    ink: dark ? "#fb923c" : "#c2410c",
    ink2: dark ? "#2a332f" : "#c9d4d0",
    accent: dark ? "#7c2d12" : "#fed7aa",
    pos: dark ? "#4ade80" : "#15803d",
    neg: dark ? "#ff6b74" : "#d92d3a",
    warn: dark ? "#fbbf24" : "#b45309",
    grid: dark ? "#1c2220" : "#e6ebe9",
    series: dark
      ? ["#fb923c", "#facc15", "#fdba74", "#9a3412", "#fed7aa"]
      : ["#c2410c", "#ea580c", "#ca8a04", "#7c2d12", "#fdba74"],
  };
}

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-[var(--shadow)] text-xs">
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
