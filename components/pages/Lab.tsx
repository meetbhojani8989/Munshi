"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FlaskConical, Play } from "lucide-react";
import type { Business } from "@/lib/core";
import {
  Title,
  Stagger,
  Rise,
  Segmented,
  usd,
  ease,
} from "@/components/layout/ui";

export function Lab({ b, act }: { b: Business; act: any }) {
  const [id, setId] = useState(b.items[0].id),
    [price, setPrice] = useState(b.items[0].price + 0.5),
    [days, setDays] = useState(14);
  const item = b.items.find((i) => i.id === id);
  const change = item ? ((price - item.price) / item.price) * 100 : 0;
  return (
    <>
      <Title
        kicker="Learn before committing"
        title="Pricing Lab"
        sub="Run a controlled price test and compare it with your baseline."
      />
      <Stagger className="grid lg:grid-cols-2 gap-4 items-start">
        <Rise>
          <div className="card">
            <h2>Start an experiment</h2>
            <label className="block text-xs muted mt-5">
              Item
              <select
                className="w-full mt-1.5 text-[var(--ink)]"
                value={id}
                onChange={(e) => {
                  setId(e.target.value);
                  setPrice(
                    (b.items.find((i) => i.id === e.target.value)?.price || 0) +
                      0.5,
                  );
                }}
              >
                {b.items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </label>
            {/* baseline vs test comparison */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="rounded-2xl bg-surface-2 p-4">
                <div className="text-xs muted">Baseline (A)</div>
                <div className="text-2xl font-bold num mt-1">
                  {usd(item?.price || 0)}
                </div>
              </div>
              <div className="rounded-2xl bg-[var(--accent-soft)] p-4">
                <div className="text-xs text-[var(--accent-text)]">
                  Test (B)
                </div>
                <div className="text-2xl font-bold num mt-1">
                  {usd(Math.round(price * 100) / 100)}
                </div>
                <div
                  className={
                    "text-xs mt-1 " + (change >= 0 ? "positive" : "negative")
                  }
                >
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(1)}%
                </div>
              </div>
            </div>
            <label className="block text-xs muted mt-5">
              Test price
              <input
                className="w-full mt-1.5 num text-[var(--ink)]"
                type="number"
                step=".1"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </label>
            <div className="mt-5">
              <div className="text-xs muted mb-2">Duration</div>
              <Segmented
                id="lab-days"
                options={["7 days", "14 days", "30 days"]}
                value={`${days} days`}
                onChange={(v) => setDays(parseInt(v))}
              />
            </div>
            <button
              className="btn mt-7"
              onClick={() =>
                act(
                  "experiment",
                  { itemId: id, price, days },
                  `Price experiment started for ${b.items.find((i) => i.id === id)?.name}.`,
                )
              }
            >
              <Play size={14} /> Start experiment
            </button>
          </div>
        </Rise>
        <Rise>
          <div className="card">
            <h2>Live experiments</h2>
            {b.experiments.length ? (
              <div className="mt-3">
                <AnimatePresence initial={false}>
                  {b.experiments.map((e) => (
                    <motion.div
                      className="border-b border-line py-4 last:border-0"
                      key={e.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.35, ease }}
                    >
                      <div className="flex justify-between items-center">
                        <b>{b.items.find((i) => i.id === e.itemId)?.name}</b>
                        <span className="tag tag-accent">
                          <span className="live-dot" /> {e.status}
                        </span>
                      </div>
                      <div className="text-sm muted mt-1">
                        Testing {usd(e.price)} for {e.days} days
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-3 mt-3 overflow-hidden">
                        <motion.div
                          className="h-full bg-[var(--accent)] origin-left"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 0.12 }}
                          transition={{ duration: 1, ease }}
                        />
                      </div>
                      <div className="text-xs muted mt-2">
                        Baseline vs test will update as sales arrive.
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-text)] inline-flex items-center justify-center">
                  <FlaskConical size={20} />
                </span>
                <p className="muted mt-3">
                  No experiments yet. Choose an item and start a test.
                </p>
              </div>
            )}
          </div>
        </Rise>
      </Stagger>
    </>
  );
}
