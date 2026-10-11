"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import type { Business } from "@/lib/core";
import type { ArenaState, Strategy } from "@/lib/ai/arena";
import { Card, Stat, ChartTooltip, useChartColors, ease } from "@/components/layout/ui";

const ROUNDS = 5;
const pct = (w: number) => `${(w * 100).toFixed(1)}%`;
const describe = (s: Strategy) =>
  `${s.method} ${s.window}d${s.method === "ewma" ? ` α${s.alpha}` : ""}${s.weekdayWeight ? ` · weekday ${s.weekdayWeight}` : ""}${s.trendWeight ? ` · trend ${s.trendWeight}` : ""}${s.clip ? ` · clip ${s.clip}σ` : ""}`;

// The self-improving agent team: three agents propose forecasting strategies in parallel,
// code back-tests them on the books, a critic writes lessons, and the champion is finally
// scored on days no agent has seen.
export function AgentArena({ b }: { b: Business }) {
  const c = useChartColors();
  const [arena, setArena] = useState<ArenaState | null>(null);
  const [forecast, setForecast] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const running = !!status;

  useEffect(() => {
    fetch(`/api/arena?businessId=${b.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.arena) setArena(d.arena);
        if (typeof d.forecast === "number") setForecast(d.forecast);
      })
      .catch(() => {});
  }, [b.id]);

  async function step(step: "start" | "round" | "final") {
    const r = await fetch("/api/arena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: b.id, step }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Arena step failed");
    setArena(d.arena);
    setForecast(d.forecast);
  }

  async function run() {
    setError("");
    try {
      setStatus("Measuring the baseline…");
      await step("start");
      for (let i = 1; i <= ROUNDS; i++) {
        setStatus(`Round ${i} of ${ROUNDS}: agents proposing in parallel…`);
        await step("round");
      }
      setStatus("Testing the champion on unseen days…");
      await step("final");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Arena failed");
    } finally {
      setStatus("");
    }
  }

  const cur = arena?.current;
  const chart = cur
    ? [
        { name: "Base", error: +(cur.baseline.wape * 100).toFixed(1) },
        ...cur.rounds.map((r) => ({
          name: `R${r.n}`,
          error: +(r.bestSoFar * 100).toFixed(1),
          round: +(r.best.wape * 100).toFixed(1),
        })),
      ]
    : [];
  const last = cur?.rounds[cur.rounds.length - 1];

  return (
    <section className="mb-8">
      <Card className="mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="eyebrow">Agent Arena · self-improving forecaster</div>
            <h2 className="mt-2">Three agents compete to forecast tomorrow's sales, and get better every round</h2>
            <p className="muted text-sm mt-2">
              The Seasonalist, Smoother and Trend Scout propose strategies in parallel. Munshi back-tests each one
              on your own books, and a critic agent writes lessons the next round reads. The winner is then graded on
              the last {cur?.holdoutDays ?? 14} days, which no agent ever saw.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="tag">
              {cur ? (cur.live ? `Live · ${cur.model}` : "Offline search · no LLM key") : "Ready"}
            </span>
            <button className="btn" disabled={running} onClick={run}>
              {running ? "Running…" : cur ? "Run again (keeps memory)" : `Run ${ROUNDS} rounds`}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {status && (
            <motion.p
              className="text-sm mt-4 flex items-center gap-2"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span className="live-dot" /> {status}
            </motion.p>
          )}
        </AnimatePresence>
        {error && <p className="negative text-sm mt-4">{error}</p>}
      </Card>

      {cur && (
        <>
          <div className="gridstats mb-5">
            <Stat label="Baseline error" value={pct(cur.baseline.wape)} hint="Tomorrow = today" />
            <Stat
              label="Champion error"
              value={cur.champion ? pct(cur.champion.wape) : "—"}
              tone="positive"
              hint={cur.champion ? `${cur.champion.agent} · ${describe(cur.champion.strategy)}` : "Run a round"}
            />
            <Stat
              label="On unseen days"
              value={cur.final ? `−${cur.final.improvementPct}%` : "—"}
              tone="positive"
              hint={
                cur.final
                  ? `${pct(cur.final.baselineWape)} → ${pct(cur.final.championWape)} error on the hidden ${cur.holdoutDays} days`
                  : "Graded after the last round"
              }
            />
            <Stat
              label="Tomorrow's forecast"
              value={forecast !== null ? `$${forecast.toLocaleString("en-US")}` : "—"}
              hint="Feeds reorder points and the Leak Finder"
            />
          </div>

          <div className="grid md:grid-cols-[3fr_2fr] gap-5 mb-5">
            <Card>
              <h2>Forecast error by round</h2>
              <p className="muted text-xs mt-1">Lower is better. The dashed line is the starting baseline.</p>
              <div className="h-56 mt-4">
                <ResponsiveContainer>
                  <LineChart data={chart}>
                    <CartesianGrid stroke={c.grid} vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis unit="%" tickLine={false} axisLine={false} fontSize={12} width={44} domain={["dataMin - 3", "dataMax + 3"]} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={+(cur.baseline.wape * 100).toFixed(1)} stroke={c.neg} strokeDasharray="4 4" />
                    <Line name="Champion" dataKey="error" stroke={c.pos} strokeWidth={3} dot={{ r: 4 }} isAnimationActive />
                    <Line name="Round best" dataKey="round" stroke={c.ink2} strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <h2>What the team has learned</h2>
              <p className="muted text-xs mt-1">Long-term memory, carried into every new run</p>
              <ul className="mt-4 space-y-2 text-sm max-h-56 overflow-y-auto">
                {(arena?.memory ?? []).slice(-8).reverse().map((l, i) => (
                  <motion.li
                    key={l + i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, ease, delay: i * 0.03 }}
                    className="border-l-2 border-line pl-3"
                  >
                    {l}
                  </motion.li>
                ))}
                {!arena?.memory.length && <li className="muted">Lessons appear after the first round.</li>}
              </ul>
            </Card>
          </div>

          {last && (
            <Card>
              <h2>Round {last.n}: proposals</h2>
              <div className="tablewrap mt-3">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Strategy</th>
                      <th>Hypothesis</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...last.proposals]
                      .sort((a, z) => a.wape - z.wape)
                      .map((p, i) => (
                        <tr key={i}>
                          <td className="font-semibold">{p.agent}</td>
                          <td className="num text-xs">{describe(p.strategy)}</td>
                          <td className="text-sm muted">{p.hypothesis}</td>
                          <td className={"num " + (p.wape <= last.bestSoFar ? "positive" : "")}>{pct(p.wape)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {(arena?.history.length ?? 0) > 1 && (
            <p className="muted text-xs mt-3">
              Past runs on unseen days:{" "}
              {arena!.history.map((h) => `−${h.holdoutImprovementPct}%`).join(" · ")}
            </p>
          )}
        </>
      )}
    </section>
  );
}
