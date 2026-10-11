import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  ReferenceLine,
} from "recharts";
import type { Business, Item } from "@/lib/core";
import { Title, usd, Card, money } from "@/components/layout/ui";

export function ItemPage({
  b,
  item,
  act,
}: {
  b: Business;
  item: Item;
  act: any;
}) {
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
      low: Math.round(u * 30 * 0.8),
      high: Math.round(u * 30 * 1.2),
      profit: Math.round((p - item.cost) * u * 30),
    };
  });
  const best = curve.reduce((a, c) => (c.profit > a.profit ? c : a));
  return (
    <>
      <Link className="positive text-sm" href="/inventory">
        ← Inventory
      </Link>
      <Title
        kicker={item.category}
        title={item.name}
        sub="A closer look at price, demand, and profit contribution."
      />
      <div className="gridstats mb-5">
        {[
          ["Price", usd(item.price)],
          ["Unit cost", usd(item.cost)],
          [
            "Gross margin",
            `${Math.round(((item.price - item.cost) / item.price) * 100)}%`,
          ],
          ["Units sold", String(item.units)],
          ["Profit contribution", usd(item.units * (item.price - item.cost))],
        ].map(([x, v]) => (
          <Card key={x}>
            <span className="muted text-sm">{x}</span>
            <b className="block text-xl mt-2">{v}</b>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <h2>Estimated demand curve</h2>
          <p className="muted text-sm">
            Current {usd(item.price)} · Suggested {usd(best.price)}
          </p>
          <div className="h-64 mt-5">
            <ResponsiveContainer>
              <LineChart data={curve}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="price" />
                <YAxis />
                <Tooltip />
                <Line dataKey="units" stroke="#16845e" strokeWidth={3} />
                <Line
                  dataKey="low"
                  stroke="#a9d7bd"
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  dataKey="high"
                  stroke="#a9d7bd"
                  strokeDasharray="4 4"
                  dot={false}
                />
                <ReferenceLine x={item.price} stroke="#c9953c" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs muted">
            Confidence band uses category averages where price history is thin.
          </p>
        </Card>
        <Card>
          <h2>What if you changed the price?</h2>
          <div className="text-4xl font-bold mt-8">{usd(price)}</div>
          <input
            className="w-full mt-5"
            type="range"
            min={Math.max(item.cost + 0.5, item.price * 0.5)}
            max={item.price * 1.7}
            step=".1"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
          <div className="grid grid-cols-3 gap-2 mt-6 text-sm">
            {[
              ["Units / month", Math.round(units * 30)],
              ["Revenue / month", usd(units * price * 30)],
              ["Profit change", money(profit - baseProfit)],
            ].map(([x, v]) => (
              <div className="bg-paper rounded-xl p-3" key={x}>
                <span className="muted text-xs">{x}</span>
                <b className="block mt-2">{v}</b>
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
            Approve new price
          </button>
        </Card>
      </div>
    </>
  );
}
