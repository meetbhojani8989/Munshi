import { useState } from "react";
import type { Business } from "@/lib/core";
import { Title, Card, usd } from "@/components/layout/ui";

export function Lab({ b, act }: { b: Business; act: any }) {
  const [id, setId] = useState(b.items[0].id),
    [price, setPrice] = useState(b.items[0].price + 0.5),
    [days, setDays] = useState(14);
  return (
    <>
      <Title
        kicker="Learn before committing"
        title="Pricing Lab"
        sub="Run a controlled price test and compare it with your baseline."
      />
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <h2>Start an experiment</h2>
          <label className="block text-sm mt-5">
            Item
            <select
              className="w-full mt-1"
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
          <label className="block text-sm mt-4">
            Test price
            <input
              className="w-full mt-1"
              type="number"
              step=".1"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm mt-4">
            Duration
            <select
              className="w-full mt-1"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </label>
          <button
            className="btn mt-6"
            onClick={() =>
              act(
                "experiment",
                { itemId: id, price, days },
                `Price experiment started for ${b.items.find((i) => i.id === id)?.name}.`,
              )
            }
          >
            Start experiment
          </button>
        </Card>
        <Card>
          <h2>Live experiments</h2>
          {b.experiments.length ? (
            b.experiments.map((e) => (
              <div className="border-b border-line py-4" key={e.id}>
                <b>{b.items.find((i) => i.id === e.itemId)?.name}</b>
                <div className="text-sm muted">
                  Testing {usd(e.price)} for {e.days} days · {e.status}
                </div>
                <div className="text-xs positive mt-2">
                  Baseline vs test will update as sales arrive.
                </div>
              </div>
            ))
          ) : (
            <p className="muted mt-3">
              No experiments yet. Choose an item and start a test.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
