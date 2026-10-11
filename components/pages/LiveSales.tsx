import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Radio } from "lucide-react";
import type { Business } from "@/lib/core";
import { randomTicket, squarePaymentEvent } from "@/lib/pos-ticket";
import { Card } from "@/components/layout/ui";

const LIVE_KEY = "munshi_live";
const EVERY_MS = 5000;

export type Live = { on: boolean; toggle: () => void; problem: string };

// While on, rings up a realistic café sale every 5 seconds by posting a Square-style payment to
// /api/pos/webhook, the same route a real point of sale would call. The switch is remembered, so it
// keeps running as you move between pages; it pauses while the tab is hidden.
export function useLiveSales(
  b: Business | undefined,
  refresh: () => Promise<void>,
): Live {
  const [on, setOn] = useState(false),
    [problem, setProblem] = useState("");
  const latest = useRef({ b, refresh });
  latest.current = { b, refresh };
  useEffect(() => setOn(localStorage.getItem(LIVE_KEY) === "1"), []);
  useEffect(() => {
    if (!on) return;
    let stopped = false,
      busy = false;
    async function ring() {
      const { b, refresh } = latest.current;
      if (!b || busy || document.hidden) return;
      const lines = randomTicket(b.items);
      if (!lines.length) {
        setProblem("Everything is sold out, so there is nothing left to sell.");
        return;
      }
      busy = true;
      try {
        const r = await fetch(
          `/api/pos/webhook?businessId=${encodeURIComponent(b.id)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(squarePaymentEvent(lines)),
          },
        );
        if (stopped) return;
        // 409 means another sale took the last one first; the next ticket will pick something else.
        if (r.ok || r.status === 409) setProblem("");
        else
          setProblem(
            (await r.json().catch(() => ({}))).error ||
              "The sale could not be posted.",
          );
        await refresh();
      } catch {
        if (!stopped) setProblem("Could not reach the server.");
      } finally {
        busy = false;
      }
    }
    ring();
    const timer = setInterval(ring, EVERY_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [on]);
  return {
    on,
    problem: on ? problem : "",
    toggle: () => {
      localStorage.setItem(LIVE_KEY, on ? "0" : "1");
      setProblem("");
      setOn(!on);
    },
  };
}

/** Briefly highlights its contents whenever `value` changes (not on first render). */
export function Flash({
  value,
  children,
}: {
  value: unknown;
  children: React.ReactNode;
}) {
  const [lit, setLit] = useState(false);
  const seen = useRef(value);
  useEffect(() => {
    if (seen.current === value) return;
    seen.current = value;
    setLit(true);
    const timer = setTimeout(() => setLit(false), 1400);
    return () => clearTimeout(timer);
  }, [value]);
  return (
    <span
      data-flash={lit ? "on" : undefined}
      className="rounded-md px-1.5 -mx-1.5 inline-block"
      style={{
        backgroundColor: lit ? "rgba(190,138,42,.3)" : "transparent",
        transition: lit ? "none" : "background-color 900ms ease-out",
      }}
    >
      {children}
    </span>
  );
}

/** Sales that came in from the point of sale today, newest first; each new one slides in at the top. */
export function LiveSalesPanel({ b, live }: { b: Business; live: Live }) {
  const today = new Date().toISOString().slice(0, 10);
  const sales = b.sales
    .filter((s) => s.id.startsWith("sq-") && s.date === today)
    .slice(0, 6);
  const stock = new Map(b.items.map((i) => [i.id, i.stock]));
  return (
    <Card className="mb-5">
      <div className="flex justify-between items-center gap-3">
        <div>
          <h2 className="flex items-center gap-2">
            Live sales
            {live.on && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold positive">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green" />
                </span>
                Live
              </span>
            )}
          </h2>
          <p className="muted text-sm mt-1">
            {live.on
              ? "A sale comes in from the point of sale every 5 seconds."
              : "Go live to stream sales from the point of sale and watch the numbers move."}
          </p>
        </div>
        <button
          className={(live.on ? "btn" : "btn2") + " inline-flex items-center gap-2 shrink-0"}
          aria-pressed={live.on}
          onClick={live.toggle}
        >
          <Radio size={16} />
          {live.on ? "Stop live" : "Go live"}
        </button>
      </div>
      {live.problem && (
        <p className="text-sm negative mt-3">{live.problem}</p>
      )}
      <div className="mt-4">
        <AnimatePresence initial={false}>
          {sales.map((s) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: -28, backgroundColor: "rgba(23,131,91,.18)" }}
              animate={{ opacity: 1, y: 0, backgroundColor: "rgba(23,131,91,0)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, backgroundColor: { duration: 1.6 } }}
              className="flex justify-between items-center gap-4 border-b border-line py-3 px-2 -mx-2 rounded-lg text-sm"
            >
              <div className="min-w-0">
                <b>
                  {s.items
                    .map((i) => (i.qty > 1 ? `${i.qty} × ${i.name}` : i.name))
                    .join(", ")}
                </b>
                <div className="muted">
                  {s.payment} ·{" "}
                  {s.items.map((i) => (
                    <span key={i.id} className="mr-2">
                      {i.name}:{" "}
                      <Flash value={stock.get(i.id)}>
                        {stock.get(i.id) ?? 0} left
                      </Flash>
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <b className="positive">+${s.total.toFixed(2)}</b>
                <div className="muted">
                  {new Date(s.time ?? s.date).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {!sales.length && (
          <p className="muted text-sm py-3">No live sales yet today.</p>
        )}
      </div>
    </Card>
  );
}
