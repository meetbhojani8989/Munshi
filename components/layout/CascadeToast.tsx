import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { ease } from "@/components/layout/ui";

const steps = ["Inventory", "Payables", "Journal", "Margins"];

// Black "receipt" that ticks through each ledger the action touched.
export function CascadeToast({
  cascade,
}: {
  cascade: { id: number; message: string } | null;
}) {
  return (
    <div
      className="fixed right-4 md:right-6 bottom-28 md:bottom-24 z-40 w-[min(360px,calc(100vw-32px))]"
      aria-live="polite"
    >
      <AnimatePresence>
        {cascade && (
          <motion.div
            key={cascade.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: 12,
              scale: 0.98,
              transition: { duration: 0.2 },
            }}
            transition={{ duration: 0.5, ease }}
            className="card card-ink !p-0 overflow-hidden shadow-[var(--shadow-lg)]"
          >
            <div className="p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="w-5 h-5 rounded-full bg-accent text-[var(--on-accent)] inline-flex items-center justify-center">
                  <Check size={12} strokeWidth={3} />
                </span>
                The cascade is complete
              </div>
              <p className="text-sm mt-2 opacity-70 leading-relaxed">
                {cascade.message}
              </p>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {steps.map((s, i) => (
                  <div key={s}>
                    <div className="h-[3px] rounded-full ink-track overflow-hidden">
                      <motion.div
                        className="h-full bg-accent origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{
                          duration: 0.35,
                          delay: 0.25 + i * 0.3,
                          ease,
                        }}
                      />
                    </div>
                    <motion.div
                      className="mono text-[10px] mt-1.5 uppercase tracking-wider"
                      initial={{ opacity: 0.35 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 + i * 0.3 }}
                    >
                      {s}
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
            <motion.div
              className="h-[2px] ink-track origin-left"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5.2, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
