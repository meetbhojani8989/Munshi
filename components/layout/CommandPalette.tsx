"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  CornerDownLeft,
  Moon,
  Sun,
  Building2,
  ScanLine,
  CalendarClock,
  MessageCircle,
  Palette,
  LogOut,
  PlayCircle,
  Clapperboard,
  History,
} from "lucide-react";
import { nav } from "@/components/layout/nav";
import { useMunshi } from "@/components/MunshiProvider";
import { metrics } from "@/lib/core";
import { usd } from "@/components/layout/ui";

type Cmd = {
  id: string;
  group: "Recent" | "Go to" | "Actions" | "Business";
  label: string;
  icon: any;
  keywords?: string;
  // Shown in the side pane: what this command will do, with live figures.
  preview: [string, string][];
  note: string;
  run: () => void;
};
const RECENT_KEY = "munshi_recent";

// Subsequence match, scored so that early and consecutive hits rank higher.
function score(text: string, q: string) {
  if (!q) return 1;
  const t = text.toLowerCase();
  let at = 0,
    total = 0,
    streak = 0;
  for (const ch of q.toLowerCase()) {
    const i = t.indexOf(ch, at);
    if (i < 0) return 0;
    streak = i === at ? streak + 1 : 0;
    total += 10 - Math.min(9, i - at) + streak * 4 + (i === 0 ? 8 : 0);
    at = i + 1;
  }
  return total;
}

export function CommandPalette({
  open,
  onClose,
  onTour,
}: {
  open: boolean;
  onClose: () => void;
  onTour: () => void;
}) {
  const router = useRouter();
  const { b, dark, setDark, all, setBusiness, act, logout } = useMunshi();
  const [q, setQ] = useState(""),
    [sel, setSel] = useState(0),
    [recent, setRecent] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const cmds: Cmd[] = useMemo(() => {
    if (!b) return [];
    const m = metrics(b);
    const today = new Date().toISOString().slice(0, 10);
    const todays = b.sales.filter((s) => s.date === today);
    const facts: Record<string, [string, string][]> = {
      dashboard: [["Taken today", usd(Math.round(todays.reduce((s, x) => s + x.total, 0)))], ["Bills today", String(todays.length)]],
      sales: [["Sales on record", String(b.sales.length)], ["Revenue", usd(Math.round(m.revenue))]],
      orders: [["Open orders", String(b.orders.filter((o) => o.status !== "Done").length)]],
      inventory: [["Items", String(b.items.length)], ["Running low", String(m.low)]],
      vendors: [["Supplier bills", String(b.invoices.length)], ["Unpaid", String(b.invoices.filter((x) => !x.paid).length)]],
      books: [["Journal entries", String(b.entries.length)], ["Bills to pay", usd(Math.round(m.payables))]],
      valuation: [["Gross profit", usd(Math.round(m.profit))]],
      payroll: [["Team", String((b.staff || []).length)], ["Pay runs", String((b.payruns || []).length)]],
      analytics: [["Gross margin", Math.round(m.margin * 100) + "%"]],
      insights: [["Suggestions waiting", String(b.suggestions.filter((s) => !s.status).length)]],
      lab: [["Price tests", String(b.experiments.length)]],
      scorecard: [["Predictions graded", String(b.outcomes.length)]],
      assistant: [["Answers from", `${b.sales.length} sales`]],
      settings: [["Signed in as", "Demo Owner"]],
    };
    return [
      ...nav
        .filter(([path]) => path !== "scan")
        .map(([path, label, Icon]) => ({
          id: path,
          group: "Go to" as const,
          label,
          icon: Icon,
          preview: facts[path] || [],
          note: `Open ${label}.`,
          run: () => router.push("/" + path),
        })),
      {
        id: "scan",
        group: "Actions" as const,
        label: "Scan a supplier bill",
        icon: ScanLine,
        keywords: "invoice upload ocr receive stock",
        preview: [["Updates", "Stock, payables, journal"]],
        note: "Opens Pantry with the scanner ready.",
        run: () => router.push("/inventory?scan=1"),
      },
      {
        id: "event",
        group: "Actions" as const,
        label: b.eventDay ? "Turn Event day off" : "Turn Event day on",
        icon: CalendarClock,
        keywords: "busy demand forecast",
        preview: [["Currently", b.eventDay ? "On" : "Off"], ["Effect", "Reorder quantities +35%"]],
        note: "Changes demand planning for this business.",
        run: () => act("event", { value: !b.eventDay }),
      },
      {
        id: "theme",
        group: "Actions" as const,
        label: dark ? "Switch to white background" : "Switch to black background",
        icon: dark ? Sun : Moon,
        keywords: "dark light theme mode",
        preview: [["Currently", dark ? "Black" : "White"]],
        note: "Applies immediately and is remembered.",
        run: () => setDark(!dark),
      },
      {
        id: "personalize",
        group: "Actions" as const,
        label: "Change accent colour",
        icon: Palette,
        keywords: "personalize color wheel look",
        preview: [],
        note: "Opens the colour wheel in Settings.",
        run: () => router.push("/settings"),
      },
      {
        id: "tour",
        group: "Actions" as const,
        label: "Start the guided tour",
        icon: PlayCircle,
        keywords: "demo walkthrough present judges",
        preview: [["Length", "About 75 seconds"], ["Stops", "5"]],
        note: "Walks through the product. It only navigates; nothing is changed.",
        run: onTour,
      },
      {
        id: "intro",
        group: "Actions" as const,
        label: "Replay the launch intro",
        icon: Clapperboard,
        keywords: "loading splash",
        preview: [],
        note: "Reloads the app and plays the opening once more.",
        run: () => {
          sessionStorage.removeItem("munshi_booted");
          location.reload();
        },
      },
      {
        id: "logout",
        group: "Actions" as const,
        label: "Log out",
        icon: LogOut,
        keywords: "sign out exit",
        preview: [],
        note: "Returns to the landing page.",
        run: () => logout(),
      },
      ...all
        .filter((x) => x.id !== b.id)
        .map((x) => ({
          id: "biz-" + x.id,
          group: "Business" as const,
          label: "Switch to " + x.name,
          icon: Building2,
          preview: [["Type", x.type], ["Items", String(x.items.length)]] as [string, string][],
          note: "Every page follows the business you pick.",
          run: () => setBusiness(x.id),
        })),
    ];
  }, [b, router, dark, setDark, all, setBusiness, act, logout, onTour]);

  const list = useMemo(() => {
    const query = q.trim();
    if (!query) {
      const recents = recent
        .map((id) => cmds.find((c) => c.id === id))
        .filter(Boolean)
        .map((c) => ({ ...(c as Cmd), group: "Recent" as const, id: "recent-" + c!.id }));
      return [...recents, ...cmds];
    }
    const hits = cmds
      .map((c) => ({ c, s: Math.max(score(c.label, query), score(c.keywords || "", query) * 0.6) }))
      .filter((x) => x.s > 0)
      .sort((a, z) => z.s - a.s)
      .map((x) => x.c);
    // Anything typed can always be sent to the assistant as a question.
    return [
      ...hits,
      {
        id: "ask",
        group: "Actions" as const,
        label: `Ask Munshi “${query}”`,
        icon: MessageCircle,
        preview: [],
        note: "Sends this as a question to Ask Munshi.",
        run: () => router.push("/assistant?q=" + encodeURIComponent(query)),
      },
    ];
  }, [q, cmds, recent, router]);
  const active = list[Math.min(sel, list.length - 1)];

  useEffect(() => {
    if (!open) return;
    setQ("");
    setSel(0);
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"));
    } catch {}
    setTimeout(() => input.current?.focus(), 30);
  }, [open]);
  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  function run(c: Cmd) {
    const id = c.id.replace(/^recent-/, "");
    if (id !== "ask") {
      const next = [id, ...recent.filter((x) => x !== id)].slice(0, 4);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    }
    onClose();
    c.run();
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") setSel((s) => (s + 1) % list.length);
    else if (e.key === "ArrowUp") setSel((s) => (s - 1 + list.length) % list.length);
    else if (e.key === "Enter" && active) run(active);
    else return;
    e.preventDefault();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center pt-[10vh] px-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.14 } }}
        >
          <div className="absolute inset-0 bg-black/35 backdrop-blur-md" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Command palette"
            className="relative w-full max-w-[760px] rounded-[24px] border border-line bg-[var(--bg)] shadow-[var(--shadow-lg)] overflow-hidden"
            initial={{ y: -24, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -12, scale: 0.97, opacity: 0, transition: { duration: 0.14 } }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            <div className="flex items-center gap-3 px-5 border-b border-line">
              <Search size={18} className="muted" />
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder="Jump to a page, run an action, or ask a question"
                aria-label="Search commands"
                role="combobox"
                aria-expanded
                aria-controls="cmd-list"
                className="flex-1 !border-0 !shadow-none !px-0 h-16 !bg-transparent !text-[17px]"
              />
              <span className="kbd">esc</span>
            </div>
            <div className="grid md:grid-cols-[1fr_260px]">
              <div ref={listRef} id="cmd-list" role="listbox" className="max-h-[52vh] overflow-auto p-2">
                {list.map((c, i) => {
                  const head = i === 0 || list[i - 1].group !== c.group;
                  return (
                    <div key={c.id}>
                      {head && (
                        <div className="eyebrow !text-[11px] px-3 pt-3 pb-1.5 flex items-center gap-1.5">
                          {c.group === "Recent" && <History size={11} />} {c.group}
                        </div>
                      )}
                      <motion.button
                        role="option"
                        aria-selected={i === sel}
                        onMouseMove={() => i !== sel && setSel(i)}
                        onClick={() => run(c)}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i, 10) * 0.018, duration: 0.2 }}
                        className={
                          "relative w-full flex items-center gap-3 px-3 h-12 rounded-[14px] text-sm text-left " +
                          (i === sel ? "text-[var(--on-brand)]" : "")
                        }
                      >
                        {i === sel && (
                          <motion.span
                            layoutId="cmd-sel"
                            className="absolute inset-0 rounded-[14px] bg-[var(--brand)]"
                            transition={{ type: "spring", stiffness: 700, damping: 46 }}
                          />
                        )}
                        <c.icon size={17} className="relative shrink-0" />
                        <span className="relative flex-1 truncate font-semibold">{c.label}</span>
                        {i === sel && <CornerDownLeft size={14} className="relative opacity-80" />}
                      </motion.button>
                    </div>
                  );
                })}
              </div>
              {/* What the highlighted command does, with live figures */}
              <div className="desktop border-l border-line bg-[var(--surface)] p-5 flex flex-col" aria-live="polite">
                <AnimatePresence mode="wait">
                  {active && (
                    <motion.div
                      key={active.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.14 }}
                    >
                      <span className="w-12 h-12 rounded-full bg-[var(--brand)] text-[var(--on-brand)] inline-flex items-center justify-center">
                        <active.icon size={21} />
                      </span>
                      <div className="display font-extrabold text-lg tracking-tight mt-3 leading-snug">{active.label}</div>
                      <p className="text-sm muted mt-1">{active.note}</p>
                      {active.preview.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3 text-sm mt-3 pt-3 border-t border-line">
                          <span className="muted">{k}</span>
                          <span className="font-bold num text-right">{v}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 h-11 border-t border-line text-xs muted">
              <span className="flex items-center gap-1.5">
                <span className="kbd">↑</span>
                <span className="kbd">↓</span> move
              </span>
              <span className="flex items-center gap-1.5">
                <span className="kbd">↵</span> run
              </span>
              <span className="ml-auto">{list.length} results</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
