import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon, Search, ChevronDown } from "lucide-react";
import { useMunshi } from "@/components/MunshiProvider";
import { workspaceOf, labelOf } from "@/components/layout/nav";

export function ThemeToggle() {
  const { dark, setDark } = useMunshi();
  return (
    <button
      className="btn2 !px-0 w-10 overflow-hidden"
      aria-label="Toggle theme"
      onClick={() => setDark(!dark)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? "sun" : "moon"}
          initial={{ y: 14, rotate: -90, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -14, rotate: 90, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

// Workspace header: workspace name, its page tabs (sliding underline), and
// global controls. Replaces the long sidebar list.
export function TopBar({
  page,
  onSearch,
}: {
  page: string;
  onSearch: () => void;
}) {
  const { b, all, setBusiness } = useMunshi();
  const ws = workspaceOf(page);
  const title =
    ws?.label ||
    (page === "settings"
      ? "Settings"
      : page === "onboarding"
        ? "Onboarding"
        : "");
  const tabs = ws && ws.pages.length > 1 ? ws.pages : [];
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <header className="sticky top-0 z-20 glass border-b border-line">
      <div className="px-5 md:px-10 h-16 flex items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <AnimatePresence mode="wait">
            <motion.span
              key={title}
              className="font-bold text-[17px] tracking-tight whitespace-nowrap truncate block"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {title}
            </motion.span>
          </AnimatePresence>
          {!tabs.length && (
            <span className="text-sm muted desktop whitespace-nowrap">
              · {today}
            </span>
          )}
        </div>

        {tabs.length > 0 && (
          <nav
            className="desktop flex items-center gap-1 h-full ml-2"
            aria-label={title + " pages"}
          >
            {tabs.map((p) => {
              const active =
                p === page || (page === "item" && p === "inventory");
              return (
                <Link
                  key={p}
                  href={"/" + p}
                  className={
                    "relative h-full px-3 flex items-center text-sm font-medium transition-colors " +
                    (active
                      ? "text-[var(--ink)]"
                      : "muted hover:text-[var(--ink)]")
                  }
                >
                  {labelOf(p)}
                  {active && (
                    <motion.span
                      layoutId="ws-tab"
                      className="absolute left-2 right-2 -bottom-px h-[2.5px] rounded-full bg-[var(--accent)]"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 40,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex gap-2 items-center ml-auto shrink-0">
          <button
            onClick={onSearch}
            className="desktop flex items-center gap-2 text-sm muted border border-line rounded-xl px-3 h-10 w-56 hover:border-[var(--line-strong)] transition-colors"
          >
            <Search size={15} />
            <span className="flex-1 text-left">Search Munshi</span>
            <span className="kbd">⌘K</span>
          </button>
          <button
            className="btn2 !px-0 w-10 md:hidden"
            aria-label="Search"
            onClick={onSearch}
          >
            <Search size={16} />
          </button>
          {b && (
            <label className="relative">
              <span className="sr-only">Business</span>
              <select
                aria-label="Business"
                value={b.id}
                onChange={(e) => setBusiness(e.target.value)}
                className="appearance-none max-w-[132px] md:max-w-48 truncate text-sm font-medium !pl-3 !pr-9 h-10"
              >
                {all.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none muted"
              />
            </label>
          )}
          <ThemeToggle />
          <span
            className="desktop w-10 h-10 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] text-xs font-bold inline-flex items-center justify-center"
            title="Demo Owner"
          >
            DO
          </span>
        </div>
      </div>

      {/* Mobile: workspace tabs scroll under the header */}
      {tabs.length > 0 && (
        <nav
          className="md:hidden flex gap-1 overflow-x-auto px-4 pb-2 -mt-1"
          aria-label={title + " pages"}
        >
          {tabs.map((p) => (
            <Link
              key={p}
              href={"/" + p}
              className={
                "whitespace-nowrap px-3 h-8 rounded-full text-sm inline-flex items-center " +
                (p === page
                  ? "bg-[var(--accent-soft)] text-[var(--accent-text)] font-semibold"
                  : "muted")
              }
            >
              {labelOf(p)}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
