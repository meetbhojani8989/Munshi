"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { labelOf, workspaces, workspaceOf } from "@/components/layout/nav";

const spring = { type: "spring", stiffness: 420, damping: 34 } as const;

// Small living orb that opens Ask Munshi from anywhere.
function AskOrb({ active }: { active: boolean }) {
  return (
    <Link
      href="/assistant"
      aria-label="Ask Munshi"
      data-magnetic
      aria-current={active ? "page" : undefined}
      className="relative shrink-0 h-12 px-1.5 md:pr-4 rounded-full flex items-center gap-2.5 text-sm font-bold overflow-hidden"
      style={{ background: "var(--ink)", color: "var(--bg)" }}
    >
      <motion.span
        aria-hidden
        className="w-9 h-9 rounded-full"
        style={{ background: "var(--brand)", boxShadow: "0 0 0 4px color-mix(in oklch, var(--brand) 35%, transparent)" }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="desktop">Ask</span>
    </Link>
  );
}

// Floating dock. Each workspace is an icon; the one you are in unfolds to show
// its pages, so there is never a second navigation bar to learn.
export function Dock({ page }: { page: string }) {
  const current = workspaceOf(page);
  const subpage = page === "item" || page === "scan" ? "inventory" : page;
  return (
    <>
      {current && current.pages.length > 1 && (
        <nav
          aria-label={current.label + " pages"}
          className="dock mobile fixed bottom-[84px] inset-x-0 z-40 flex justify-center px-3"
        >
          <div className="glass border border-line rounded-full p-1 flex gap-1 max-w-full overflow-x-auto">
            {current.pages.map((p) => (
              <Link
                key={p}
                href={"/" + p}
                className={
                  "h-9 px-3.5 rounded-full text-[13px] font-semibold inline-flex items-center whitespace-nowrap " +
                  (p === subpage ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" : "muted")
                }
              >
                {labelOf(p)}
              </Link>
            ))}
          </div>
        </nav>
      )}

      <nav
        aria-label="Workspaces"
        className="dock fixed bottom-4 inset-x-0 z-40 flex justify-center px-3 pointer-events-none"
        style={{ viewTransitionName: "dock" }}
      >
        <motion.div
          layout
          transition={spring}
          className="pointer-events-auto glass border border-line rounded-full p-1.5 flex items-center gap-1 max-w-full"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          {workspaces.map((w) => {
            const active = current?.key === w.key;
            const Icon = w.icon;
            return (
              <motion.div
                layout
                key={w.key}
                transition={spring}
                className="relative flex items-center rounded-full"
              >
                {active && (
                  <motion.span
                    layoutId="dock-active"
                    transition={spring}
                    className="absolute inset-0 rounded-full"
                    style={{ background: "var(--brand)" }}
                  />
                )}
                <motion.div layout="position" whileHover={active ? undefined : { y: -4, scale: 1.12 }} transition={spring}>
                  <Link
                    href={"/" + w.pages[0]}
                    aria-current={active ? "page" : undefined}
                    aria-label={w.label}
                    title={w.label}
                    className={
                      "relative h-12 rounded-full flex items-center gap-2 text-sm font-bold transition-colors " +
                      (active
                        ? "w-12 justify-center md:w-auto md:pl-4 md:pr-3 text-[var(--on-brand)]"
                        : "w-12 justify-center text-[var(--muted)] hover:text-[var(--ink)]")
                    }
                  >
                    <Icon size={19} strokeWidth={2.1} />
                    {active && <span className="desktop">{w.label}</span>}
                  </Link>
                </motion.div>
                {active && w.pages.length > 1 && (
                  <motion.div
                    className="desktop relative flex items-center gap-0.5 pr-1.5"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12, duration: 0.3 }}
                  >
                    <span className="w-px h-5 bg-current opacity-30 mr-1 text-[var(--on-brand)]" />
                    {w.pages.map((p) => (
                      <Link
                        key={p}
                        href={"/" + p}
                        aria-current={p === subpage ? "page" : undefined}
                        className={
                          "relative h-9 px-3 rounded-full text-[13px] font-semibold inline-flex items-center whitespace-nowrap transition-colors text-[var(--on-brand)] " +
                          (p === subpage ? "" : "opacity-70 hover:opacity-100")
                        }
                      >
                        {p === subpage && (
                          <motion.span
                            layoutId="dock-sub"
                            transition={spring}
                            className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--on-brand)_22%,transparent)]"
                          />
                        )}
                        <span className="relative">{labelOf(p)}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
          <span className="w-px h-7 bg-[var(--line-strong)] mx-1" />
          <AskOrb active={page === "assistant"} />
        </motion.div>
      </nav>
    </>
  );
}
