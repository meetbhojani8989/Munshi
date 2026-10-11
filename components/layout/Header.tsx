"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon, Search, ChevronsUpDown, SlidersHorizontal, PlayCircle } from "lucide-react";
import { useMunshi } from "@/components/MunshiProvider";

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: "var(--brand)",
        color: "var(--on-brand)",
      }}
    >
      <svg viewBox="0 0 24 24" width="58%" height="58%" aria-hidden>
        <path
          d="M5 17V8l7 7 7-7v9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function ThemeToggle() {
  const { dark, setDark } = useMunshi();
  return (
    <button
      className="w-11 h-11 rounded-full inline-flex items-center justify-center overflow-hidden hover:bg-[var(--surface-3)] transition-colors"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setDark(!dark)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? "sun" : "moon"}
          initial={{ scale: 0.4, rotate: -120, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.4, rotate: 120, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

// Floating capsule: who you are working as on the left, global tools on the
// right. Navigation lives in the dock, so this stays quiet.
export function Header({
  onSearch,
  onTour,
}: {
  onSearch: () => void;
  onTour: () => void;
}) {
  const { b, all, setBusiness } = useMunshi();
  return (
    <header className="sticky top-3 z-30 px-3 md:px-6" style={{ viewTransitionName: "header" }}>
      <div className="glass border border-line rounded-full h-[60px] max-w-[1240px] mx-auto pl-2.5 pr-2 flex items-center gap-2">
        <Link href="/dashboard" aria-label="Munshi home" className="flex items-center gap-2.5 pr-1">
          <Logo />
          <span className="desktop font-extrabold tracking-tight text-[17px]">Munshi</span>
        </Link>
        {b && (
          <label className="relative min-w-0">
            <span className="sr-only">Business</span>
            <select
              aria-label="Business"
              value={b.id}
              onChange={(e) => setBusiness(e.target.value)}
              className="appearance-none !rounded-full !border-transparent !bg-[var(--surface-2)] hover:!bg-[var(--surface-3)] max-w-[150px] md:max-w-60 truncate text-sm font-semibold !pl-4 !pr-9 h-11"
            >
              {all.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <ChevronsUpDown
              size={14}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none muted"
            />
          </label>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onSearch}
            className="desktop flex items-center gap-2.5 text-sm muted rounded-full pl-4 pr-2 h-11 w-60 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
          >
            <Search size={15} />
            <span className="flex-1 text-left">Jump to anything</span>
            <span className="kbd">⌘K</span>
          </button>
          <button
            className="mobile w-11 h-11 rounded-full inline-flex items-center justify-center"
            aria-label="Search"
            onClick={onSearch}
          >
            <Search size={17} />
          </button>
          <button
            onClick={onTour}
            className="desktop h-11 px-3.5 rounded-full inline-flex items-center gap-2 text-sm font-bold hover:bg-[var(--surface-3)] transition-colors"
          >
            <PlayCircle size={17} /> Tour
          </button>
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label="Settings and personalization"
            className="w-11 h-11 rounded-full inline-flex items-center justify-center hover:bg-[var(--surface-3)] transition-colors"
          >
            <SlidersHorizontal size={17} />
          </Link>
        </div>
      </div>
    </header>
  );
}
