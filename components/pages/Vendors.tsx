import { useState } from "react";
import { Truck, X } from "lucide-react";
import type { Business } from "@/lib/core";
import { Title, Card, usd } from "@/components/layout/ui";

export function Vendors({ b, act }: { b: Business; act: any }) {
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
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {names.map((name, n) => {
          const bills = b.invoices.filter((i) => i.vendor === name),
            owed = bills
              .filter((i) => !i.paid)
              .reduce((s, i) => s + i.total, 0);
          return (
            <Card key={name}>
              <div className="flex justify-between">
                <h2>{name}</h2>
                <Truck size={20} className="positive" />
              </div>
              <p className="text-sm muted mt-2">
                {name.toLowerCase().replaceAll(" ", "")}@example.com
              </p>
              <p className="text-sm mt-4">
                Supplies:{" "}
                {bills
                  .slice(0, 2)
                  .map((x) => x.items[0].name)
                  .join(", ") || "General supplies"}
              </p>
              <p className="text-sm mt-2">
                Amount owed:{" "}
                <b className={owed ? "negative" : "positive"}>{usd(owed)}</b>
              </p>
              <p className="text-xs muted mt-2">
                {n === 1
                  ? "Price alert: dairy up 4% since last month"
                  : "Prices stable this month"}
              </p>
              <button className="btn2 mt-4" onClick={() => setPo(name)}>
                Draft reorder
              </button>
            </Card>
          );
        })}
      </div>
      {po && (
        <Card className="mt-5">
          <div className="flex justify-between">
            <h2>Purchase order draft · {po}</h2>
            <button onClick={() => setPo("")}>
              <X />
            </button>
          </div>
          <p className="text-sm muted mt-3">
            Suggested: 20 units of {b.items[0].name} at {usd(b.items[0].cost)}{" "}
            each.
          </p>
          <p className="mt-3">
            <b>Estimated total:</b> {usd(20 * b.items[0].cost)}
          </p>
          <button
            className="btn mt-4"
            onClick={() => {
              alert(
                "Purchase order approved for demo. Vendor connection coming soon.",
              );
              setPo("");
            }}
          >
            Approve draft
          </button>
        </Card>
      )}
    </>
  );
}
