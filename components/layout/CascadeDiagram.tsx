import { motion } from "framer-motion";
import { Check, FileText } from "lucide-react";
import { ease } from "@/components/layout/ui";

export type CascadeTarget = { label: string; value: string };

const W = 600,
  H = 380;
const SRC = { x: 30, y: 95, w: 210, h: 190 };
const TGT_X = 380,
  TGT_W = 200,
  TGT_H = 64;

// One source document fans out into four ledgers. Paths draw in sequence,
// a dot rides each path, and each ledger stamps itself complete on arrival.
export function CascadeDiagram({
  title,
  lines,
  total,
  targets,
  run = 0,
  className = "",
}: {
  title: string;
  lines: [string, string][];
  total: string;
  targets: CascadeTarget[];
  run?: number;
  className?: string;
}) {
  const gap = (H - 20 - targets.length * TGT_H) / (targets.length - 1);
  const ty = (i: number) => 10 + i * (TGT_H + gap);
  const sx = SRC.x + SRC.w,
    sy = SRC.y + SRC.h / 2;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  return (
    <div
      key={run}
      className={"relative w-full " + className}
      style={{ aspectRatio: `${W}/${H}` }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full"
        aria-hidden
      >
        {targets.map((_, i) => {
          const ey = ty(i) + TGT_H / 2;
          const d = `M ${sx} ${sy} C ${sx + 80} ${sy}, ${TGT_X - 80} ${ey}, ${TGT_X} ${ey}`;
          const delay = 0.9 + i * 0.45;
          return (
            <g key={i}>
              <path
                d={d}
                fill="none"
                stroke="var(--line-strong)"
                strokeWidth={1}
                strokeDasharray="3 4"
              />
              <motion.path
                d={d}
                fill="none"
                stroke="var(--brand)"
                strokeWidth={1.5}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, delay, ease }}
              />
              <motion.circle
                r={4}
                fill="var(--accent)"
                stroke="var(--brand)"
                strokeWidth={1.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.7, delay, times: [0, 0.1, 0.85, 1] }}
              >
                <animateMotion
                  dur="0.7s"
                  begin={`${delay}s`}
                  fill="freeze"
                  path={d}
                  keyPoints="0;1"
                  keyTimes="0;1"
                  calcMode="spline"
                  keySplines="0.2 0.8 0.2 1"
                />
              </motion.circle>
            </g>
          );
        })}
      </svg>

      {/* Source document */}
      <motion.div
        className="absolute card !p-4 !rounded-2xl shadow-[var(--shadow)] overflow-hidden"
        style={{
          left: pct(SRC.x, W),
          top: pct(SRC.y, H),
          width: pct(SRC.w, W),
          height: pct(SRC.h, H),
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <div className="flex items-center gap-2 text-[11px] eyebrow">
          <FileText size={12} /> Invoice
        </div>
        <div className="font-medium text-sm mt-2 truncate">{title}</div>
        <div className="mt-2 space-y-1">
          {lines.map(([a, v], i) => (
            <motion.div
              key={i}
              className="flex justify-between mono text-[11px]"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.1 }}
            >
              <span className="muted truncate pr-2">{a}</span>
              <span>{v}</span>
            </motion.div>
          ))}
        </div>
        <div className="hairline-x h-px mt-2" />
        <div className="flex justify-between mono text-xs mt-2 font-medium">
          <span>Total</span>
          <span>{total}</span>
        </div>
        {/* scan beam passes once over the document */}
        <motion.div
          className="absolute left-0 right-0 h-8 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent, color-mix(in srgb, var(--accent) 45%, transparent), transparent)",
          }}
          initial={{ top: "-20%" }}
          animate={{ top: "110%" }}
          transition={{ duration: 0.9, delay: 0.1, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Ledgers */}
      {targets.map((t, i) => {
        const delay = 0.9 + i * 0.45 + 0.65;
        return (
          <motion.div
            key={t.label}
            className="absolute card !p-3 !rounded-xl flex items-center gap-3"
            style={{
              left: pct(TGT_X, W),
              top: pct(ty(i), H),
              width: pct(TGT_W, W),
              height: pct(TGT_H, H),
            }}
            initial={{ opacity: 0.35 }}
            animate={{
              opacity: 1,
              borderColor: [
                "var(--line)",
                "var(--accent)",
                "color-mix(in srgb, var(--accent) 40%, var(--line))",
              ],
            }}
            transition={{ delay, duration: 0.9 }}
          >
            <motion.span
              className="shrink-0 w-6 h-6 rounded-full inline-flex items-center justify-center bg-accent text-[var(--on-accent)]"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay,
                type: "spring",
                stiffness: 500,
                damping: 18,
              }}
            >
              <Check size={13} strokeWidth={3} />
            </motion.span>
            <div className="min-w-0">
              <div className="text-[11px] muted truncate">{t.label}</div>
              <motion.div
                className="mono text-[13px] font-medium truncate"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + 0.1 }}
              >
                {t.value}
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
