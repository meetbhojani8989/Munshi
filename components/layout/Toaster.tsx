"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CircleAlert, Info, X } from "lucide-react";
import { useMunshi, type Toast } from "@/components/MunshiProvider";

const ledgers = ["Stock", "Payables", "Journal", "Margin"];
const tone: Record<Toast["kind"], string> = {
  success: "bg-[var(--pos)] text-white",
  cascade: "bg-[var(--brand)] text-[var(--on-brand)]",
  info: "bg-[var(--surface-3)] text-[var(--ink)]",
  error: "bg-[var(--neg)] text-white",
};
const Icon = { success: Check, cascade: Check, info: Info, error: CircleAlert };

// Notifications. The newest sits in front with older ones tucked behind it;
// hovering or focusing the pile fans it out. Errors are announced as alerts
// and stay until dismissed.
export function Toaster() {
  const { toasts, dismiss } = useMunshi();
  const [open, setOpen] = useState(false);
  const list = [...toasts].reverse();
  return (
    <div
      className="no-print fixed right-3 md:right-6 bottom-[150px] md:bottom-6 z-[60] w-[min(380px,calc(100vw-24px))]"
      style={{ viewTransitionName: "toasts" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <AnimatePresence>
        {list.map((t, i) => {
          const I = Icon[t.kind];
          const depth = open ? 0 : Math.min(i, 2);
          return (
            <motion.div
              key={t.id}
              layout
              role={t.kind === "error" ? "alert" : "status"}
              aria-live={t.kind === "error" ? "assertive" : "polite"}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{
                opacity: !open && i > 2 ? 0 : 1,
                y: open ? 0 : -depth * 10,
                scale: 1 - depth * 0.05,
              }}
              exit={{ opacity: 0, x: 80, transition: { duration: 0.22 } }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              style={{ zIndex: 10 - i, transformOrigin: "50% 100%" }}
              className={
                "glass !bg-[var(--glass-strong)] border border-line rounded-[20px] p-4 flex gap-3 items-start " +
                (open || i === 0 ? "relative mt-2" : "absolute inset-x-0 bottom-0")
              }
            >
              <span className={"w-8 h-8 rounded-full inline-flex items-center justify-center shrink-0 " + tone[t.kind]}>
                <I size={16} strokeWidth={2.6} />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="text-sm font-bold">{t.title}</div>
                {t.message && <p className="text-sm muted mt-0.5 leading-snug">{t.message}</p>}
                {t.kind === "cascade" && (
                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {ledgers.map((s, n) => (
                      <div key={s}>
                        <div className="h-1 rounded-full bg-[var(--surface-3)] overflow-hidden">
                          <motion.div
                            className="h-full bg-[var(--brand)] origin-left"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.35, delay: 0.25 + n * 0.28 }}
                          />
                        </div>
                        <div className="text-[10px] font-bold muted mt-1">{s}</div>
                      </div>
                    ))}
                  </div>
                )}
                {t.action && (
                  <button
                    className="mt-2 text-sm font-bold text-[var(--accent-text)]"
                    onClick={() => {
                      t.action!.run();
                      dismiss(t.id);
                    }}
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                aria-label="Dismiss notification"
                className="w-8 h-8 -mr-1 -mt-1 rounded-full inline-flex items-center justify-center muted hover:bg-[var(--surface-3)] shrink-0"
                onClick={() => dismiss(t.id)}
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
