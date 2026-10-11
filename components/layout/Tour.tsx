"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Pause, Play, X } from "lucide-react";

// A 90-second walk through what already works. Each stop only navigates and
// explains; every action is left for the presenter to perform for real.
const stops: { path: string; focus?: string; title: string; body: string }[] = [
  { path: "/dashboard", title: "One back office", body: "Sales, stock and books for a small business, kept current by every bill that comes in." },
  { path: "/sales", title: "Ring up a sale", body: "Add an item and complete the sale. A notification confirms the books updated, and the receipt on Today prints the new bill." },
  { path: "/inventory", title: "Scan a supplier bill", body: "Scanning sits at the top of Pantry. One invoice raises stock, records what you owe and posts a balanced journal entry." },
  { path: "/books", title: "Books that balance themselves", body: "Every sale and bill is already a double-entry posting. Debits equal credits without anyone keying them in." },
  { path: "/assistant", title: "Ask in plain language", body: "Ask about your best item, profit or stock. Anything that would change money waits for your approval." },
];
const STOP_MS = 15000;

export function Tour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [i, setI] = useState(0),
    [playing, setPlaying] = useState(true);
  const stop = stops[i];

  useEffect(() => {
    if (open) {
      setI(0);
      setPlaying(true);
    }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    if (pathname !== stop.path) router.push(stop.path);
    const t = setTimeout(() => {
      const el = stop.focus && document.getElementById(stop.focus);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }, 500);
    return () => clearTimeout(t);
  }, [open, i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open || !playing) return;
    const t = setTimeout(() => (i < stops.length - 1 ? setI(i + 1) : onClose()), STOP_MS);
    return () => clearTimeout(t);
  }, [open, playing, i, onClose]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          role="dialog"
          aria-label="Guided tour"
          className="no-print fixed left-3 md:left-6 bottom-[150px] md:bottom-6 z-[55] w-[min(360px,calc(100vw-24px))] glass !bg-[var(--glass-strong)] border border-line rounded-[22px] overflow-hidden"
          style={{ viewTransitionName: "tour" }}
          initial={{ opacity: 0, y: 30, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          <div className="h-1 bg-[var(--surface-3)]">
            <motion.div
              key={i + (playing ? "p" : "s")}
              className="h-full bg-[var(--brand)] origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: playing ? 1 : 0 }}
              transition={{ duration: playing ? STOP_MS / 1000 : 0, ease: "linear" }}
            />
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="eyebrow">
                Tour · {i + 1} of {stops.length}
              </span>
              <button aria-label="End tour" className="w-8 h-8 -mr-1.5 rounded-full inline-flex items-center justify-center muted hover:bg-[var(--surface-3)]" onClick={onClose}>
                <X size={15} />
              </button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                <div className="display text-xl font-extrabold tracking-tight mt-2">{stop.title}</div>
                <p className="text-sm muted mt-1.5 leading-relaxed">{stop.body}</p>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center gap-2 mt-4">
              <button className="btn2 !min-h-0 !h-10 !px-3" disabled={i === 0} onClick={() => setI(i - 1)} aria-label="Previous stop">
                <ArrowLeft size={15} />
              </button>
              <button className="btn2 !min-h-0 !h-10 !px-3" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause tour" : "Resume tour"}>
                {playing ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <button className="btn !min-h-0 !h-10 flex-1" onClick={() => (i < stops.length - 1 ? setI(i + 1) : onClose())}>
                {i < stops.length - 1 ? "Next" : "Finish"} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
