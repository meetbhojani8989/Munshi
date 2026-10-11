"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  Area,
  ReferenceLine,
} from "recharts";
import type { Business, Item } from "@/lib/core";
import {
  Title,
  Stagger,
  Rise,
  Stat,
  Counter,
  ChartTooltip,
  useChartColors,
  usd,
  money,
} from "@/components/layout/ui";

export function ItemPage({
  b,
  item,
  act,
}: {
  b: Business;
  item: Item;
  act: any;
}) {
  const c = useChartColors();
  const [price, setPrice] = useState(item.price);
  useEffect(() => setPrice(item.price), [item.id, item.price]);
  const base = item.units / 90,
    elasticity = -1.3,
    units = Math.max(0, base * Math.pow(price / item.price, elasticity)),
    profit = (price - item.cost) * units * 30,
    baseProfit = (item.price - item.cost) * base * 30;
  const curve = Array.from({ length: 12 }, (_, i) => {
    const p = Math.max(
        item.cost + 0.5,
        item.price * 0.6 + i * item.price * 0.08,
      ),
      u = base * Math.pow(p / item.price, elasticity);
    return {
      price: Math.round(p * 100) / 100,
      units: Math.round(u * 30),
      band: [Math.round(u * 30 * 0.8), Math.round(u * 30 * 1.2)],
      profit: Math.round((p - item.cost) * u * 30),
    };
  });
  const best = curve.reduce((a, c) => (c.profit > a.profit ? c : a));
  const min = Math.max(item.cost + 0.5, item.price * 0.5),
    max = item.price * 1.7;
  const delta = profit - baseProfit;

  return (
    <>
      <Link
        className="inline-flex items-center gap-1.5 text-sm muted hover:text-[var(--ink)] mb-5"
        href="/inventory"
      >
        <ArrowLeft size={14} /> Inventory
      </Link>
      <Title
        kicker={item.category}
        title={item.name}
        sub="A closer look at price, demand, and profit contribution."
      />
      <Stagger className="grid gap-4">
        <div className="gridstats">
          <Rise>
            <Stat
              label="Price"
              value={item.price}
              format={(n) => usd(Math.round(n * 100) / 100)}
            />
          </Rise>
          <Rise>
            <Stat
              label="Unit cost"
              value={item.cost}
              format={(n) => usd(Math.round(n * 100) / 100)}
            />
          </Rise>
          <Rise>
            <Stat
              label="Gross margin"
              value={Math.round(((item.price - item.cost) / item.price) * 100)}
              format={(n) => `${Math.round(n)}%`}
              tone="positive"
            />
          </Rise>
          <Rise>
            <Stat label="Units sold" value={item.units} />
          </Rise>
          <Rise>
            <Stat
              label="Profit contribution"
              value={item.units * (item.price - item.cost)}
              format={(n) => usd(Math.round(n))}
            />
          </Rise>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Rise>
            <div className="card h-full">
              <h2>Estimated demand curve</h2>
              <p className="muted text-sm mt-1">
                Current {usd(item.price)} · Suggested{" "}
                <b className="positive">{usd(best.price)}</b>
              </p>
              <div className="h-64 mt-5">
                <ResponsiveContainer>
                  <ComposedChart data={curve}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="price" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={36} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      name="Range"
                      dataKey="band"
                      stroke="none"
                      fill={c.accent}
                      fillOpacity={0.55}
                    />
                    <Line
                      name="Units"
                      dataKey="units"
                      stroke={c.ink}
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <ReferenceLine
                      x={Math.round(item.price * 100) / 100}
                      stroke={c.warn}
                      strokeDasharray="4 4"
                      label={{
                        value: "now",
                        fill: c.warn,
                        fontSize: 11,
                        position: "top",
                      }}
                    />
                    <ReferenceLine
                      x={Math.round(price * 100) / 100}
                      stroke={c.ink}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs muted mt-2">
                Confidence band uses category averages where price history is
                thin.
              </p>
            </div>
          </Rise>
          <Rise>
            <div className="card h-full">
              <h2>What if you changed the price?</h2>
              <div className="flex items-baseline justify-between mt-6">
                <span className="text-5xl font-bold tracking-tight num">
                  {usd(Math.round(price * 100) / 100)}
                </span>
                <span className={"tag " + (delta >= 0 ? "tag-pos" : "tag-neg")}>
                  {money(delta)} / mo
                </span>
              </div>
              <input
                className="w-full mt-6"
                type="range"
                min={min}
                max={max}
                step=".1"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                aria-label="Test price"
              />
              <div className="flex justify-between text-xs muted mt-1">
                <span>{usd(Math.round(min * 100) / 100)}</span>
                <button
                  className="underline underline-offset-2"
                  onClick={() => setPrice(best.price)}
                >
                  Use suggested
                </button>
                <span>{usd(Math.round(max * 100) / 100)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-6 text-sm">
                {[
                  [
                    "Units / month",
                    Math.round(units * 30),
                    (n: number) => String(Math.round(n)),
                  ],
                  [
                    "Revenue / month",
                    units * price * 30,
                    (n: number) => usd(Math.round(n)),
                  ],
                  ["Profit change", delta, (n: number) => money(n)],
                ].map(([x, v, f]: any) => (
                  <div className="bg-surface-2 rounded-xl p-3" key={x}>
                    <span className="muted text-xs">{x}</span>
                    <b className="block mt-2 text-lg">
                      <Counter value={v} format={f} />
                    </b>
                  </div>
                ))}
              </div>
              <button
                className="btn mt-6"
                onClick={() =>
                  act(
                    "price",
                    { id: item.id, price },
                    `${item.name} price changed to ${usd(price)}.`,
                  )
                }
              >
                <Check size={15} /> Approve new price
              </button>
            </div>
          </Rise>
        </div>
      </Stagger>
    </>
  );
}
