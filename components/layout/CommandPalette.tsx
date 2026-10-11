import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, CornerDownLeft, Moon, Building2 } from "lucide-react";
import { nav } from "@/components/layout/nav";
import { useMunshi } from "@/components/MunshiProvider";
import { ease } from "@/components/layout/ui";

type Cmd = {
  id: string;
  label: string;
  hint: string;
  icon: any;
  run: () => void;
};

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { dark, setDark, all, setBusiness } = useMunshi();
  const [q, setQ] = useState(""),
    [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const cmds: Cmd[] = useMemo(
    () => [
      ...nav.map(([path, label, Icon]) => ({
        id: path,
        label,
        hint: "Go to",
        icon: Icon,
        run: () => router.push("/" + path),
      })),
      {
        id: "theme",
        label: dark ? "Switch to light mode" : "Switch to dark mode",
        hint: "Theme",
        icon: Moon,
        run: () => setDark(!dark),
      },
      ...all.map((x) => ({
        id: "biz-" + x.id,
        label: "Switch to " + x.name,
        hint: "Business",
        icon: Building2,
        run: () => setBusiness(x.id),
      })),
    ],
    [router, dark, setDark, all, setBusiness],
  );
  const list = cmds.filter((c) =>
    c.label.toLowerCase().includes(q.toLowerCase()),
  );

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => input.current?.focus(), 30);
    }
  }, [open]);
  useEffect(() => setSel(0), [q]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(list.length - 1, s + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    }
    if (e.key === "Enter" && list[sel]) {
      list[sel].run();
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Command palette"
            className="relative w-full max-w-xl rounded-2xl border border-line bg-surface shadow-[var(--shadow-lg)] overflow-hidden"
            initial={{ y: -12, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{
              y: -8,
              scale: 0.98,
              opacity: 0,
              transition: { duration: 0.15 },
            }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="flex items-center gap-3 px-4 border-b border-line">
              <Search size={16} className="muted" />
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder="Search pages and actions…"
                aria-label="Search commands"
                className="flex-1 !border-0 !shadow-none !px-0 h-14 !bg-transparent text-base"
              />
              <span className="kbd">esc</span>
            </div>
            <div className="max-h-[50vh] overflow-auto p-2" role="listbox">
              {list.map((c, i) => (
                <button
                  key={c.id}
                  role="option"
                  aria-selected={i === sel}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => {
                    c.run();
                    onClose();
                  }}
                  className="relative w-full flex items-center gap-3 px-3 h-11 rounded-xl text-sm text-left"
                >
                  {i === sel && (
                    <motion.span
                      layoutId="cmd-sel"
                      className="absolute inset-0 rounded-xl bg-surface-2"
                      transition={{
                        type: "spring",
                        stiffness: 600,
                        damping: 42,
                      }}
                    />
                  )}
                  <c.icon size={16} className="relative muted" />
                  <span className="relative flex-1">{c.label}</span>
                  <span className="relative eyebrow !text-[10px]">
                    {c.hint}
                  </span>
                  {i === sel && (
                    <CornerDownLeft size={14} className="relative muted" />
                  )}
                </button>
              ))}
              {!list.length && <p className="muted text-sm p-4">No matches.</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
