"use client";
import { motion } from "framer-motion";
import type { Business } from "@/lib/core";
import { metrics } from "@/lib/core";
import {
  Title,
  Stagger,
  Rise,
  Counter,
  Bar,
  usd,
  ease,
} from "@/components/layout/ui";

export function Valuation({
  b,
  m,
}: {
  b: Business;
  m: ReturnType<typeof metrics>;
}) {
  const annual = (m.profit * 365) / 90,
    low = annual * 1.5,
    high = annual * 2.5;
  const fmt = (n: number) => usd(Math.round(n * 100) / 100);
  const scores: [string, number][] = [
    ["Profitability", Math.round(m.margin * 100)],
    ["Growth", 72],
    ["Inventory efficiency", Math.max(40, 85 - m.low * 3)],
    ["Cash health", 78],
  ];
  return (
    <>
      <Title
        kicker="See the bigger picture"
        title="Business valuation"
        sub="A simple estimate from trailing gross profit and operational health."
      />
      <Stagger className="grid lg:grid-cols-[1.4fr_1fr] gap-4 max-w-6xl">
        <Rise>
          <div className="card card-ink !p-8 h-full">
            <div className="eyebrow">Estimated range · {b.name}</div>
            <div className="text-4xl md:text-5xl font-bold mt-4 tracking-tight">
              <Counter value={low} format={fmt} />{" "}
              <span className="opacity-50">–</span>{" "}
              <Counter value={high} format={fmt} />
            </div>
            {/* range bar: low marker, high marker, midpoint */}
            <div className="relative h-2 rounded-full ink-track mt-8">
              <motion.div
                className="absolute inset-y-0 left-[20%] right-[20%] rounded-full bg-[#fb923c] origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, ease, delay: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2 opacity-70">
              <span>1.5× profit</span>
              <span>2.5× profit</span>
            </div>
            <p className="text-sm mt-6 opacity-70">
              Method: annualized trailing 90-day gross profit × 1.5–2.5. This is
              an estimate, not professional advice.
            </p>
          </div>
        </Rise>
        <Rise>
          <div className="card h-full">
            <h2>Health inputs</h2>
            <div className="mt-5 space-y-5">
              {scores.map(([x, v]) => (
                <div key={x}>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{x}</span>
                    <b className="num">
                      <Counter value={v} />
                      <span className="muted font-normal">/100</span>
                    </b>
                  </div>
                  <Bar value={v} className="bg-[var(--accent)]" />
                </div>
              ))}
            </div>
          </div>
        </Rise>
      </Stagger>
    </>
  );
}
