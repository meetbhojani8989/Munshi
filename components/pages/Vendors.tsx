"use client";
import { useState } from "react";
import { Truck, Mail, TrendingUp, Check } from "lucide-react";
import type { Business } from "@/lib/core";
import { useMunshi } from "@/components/MunshiProvider";
import { Title, Stagger, Rise, Sheet, usd } from "@/components/layout/ui";

export function Vendors({ b, act }: { b: Business; act: any }) {
  const { notify } = useMunshi();
  const names = [
    "Keystone Produce",
    "Centre Dairy",
    "Happy Valley Bakery",
    "Mountain Coffee",
    "Fresh Supply",
    "Paper & Co",
  ];
  const [po, setPo] = useState("");
  return (
    <>
      <Title
        kicker="Better buying"
        title="Vendors"
        sub="Track who supplies what, price changes, and what you owe."
      />
      <Stagger className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {names.map((name, n) => {
          const bills = b.invoices.filter((i) => i.vendor === name),
            owed = bills
              .filter((i) => !i.paid)
              .reduce((s, i) => s + i.total, 0);
          const initials = name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2);
          return (
            <Rise key={name}>
              <div className="card lift h-full flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)] font-bold inline-flex items-center justify-center">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate">{name}</h2>
                    <p className="text-xs muted flex items-center gap-1 mt-0.5 truncate">
                      <Mail size={11} />{" "}
                      {name.toLowerCase().replaceAll(" ", "")}@example.com
                    </p>
                  </div>
                  <Truck size={18} className="ml-auto muted" />
                </div>
                <p className="text-sm mt-5">
                  <span className="muted">Supplies: </span>
                  {bills
                    .slice(0, 2)
                    .map((x) => x.items[0].name)
                    .join(", ") || "General supplies"}
                </p>
                <div className="flex items-baseline justify-between mt-4 p-3 rounded-xl bg-surface-2">
                  <span className="text-sm muted">Amount owed</span>
                  <b
                    className={
                      "num text-lg " + (owed ? "negative" : "positive")
                    }
                  >
                    {usd(owed)}
                  </b>
                </div>
                <p
                  className={
                    "text-xs mt-3 flex items-center gap-1.5 " +
                    (n === 1 ? "text-amber" : "muted")
                  }
                >
                  {n === 1 ? <TrendingUp size={13} /> : <Check size={13} />}
                  {n === 1
                    ? "Price alert: dairy up 4% since last month"
                    : "Prices stable this month"}
                </p>
                <button
                  className="btn2 mt-5 self-start"
                  onClick={() => setPo(name)}
                >
                  Draft reorder
                </button>
              </div>
            </Rise>
          );
        })}
      </Stagger>
      <Sheet
        open={!!po}
        onClose={() => setPo("")}
        title={"Purchase order · " + po}
      >
        <span className="tag tag-accent">Draft</span>
        <p className="text-sm muted mt-5">Suggested order</p>
        <div className="flex justify-between py-4 border-b border-line mt-2">
          <span>20 × {b.items[0].name}</span>
          <span className="num">{usd(b.items[0].cost)} each</span>
        </div>
        <div className="flex justify-between mt-5 text-xl font-semibold">
          Estimated total{" "}
          <span className="num">{usd(20 * b.items[0].cost)}</span>
        </div>
        <button
          className="btn w-full mt-8"
          onClick={() => {
            notify({
              kind: "info",
              title: "Draft approved",
              message: "Demo only: nothing is sent to the vendor yet.",
            });
            setPo("");
          }}
        >
          Approve draft
        </button>
      </Sheet>
    </>
  );
}
