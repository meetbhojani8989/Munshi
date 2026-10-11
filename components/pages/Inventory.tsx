import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { Business, Item } from "@/lib/core";
import { metrics } from "@/lib/core";
import { Title, usd, Card } from "@/components/layout/ui";

export function Inventory({
  b,
  m,
  event,
}: {
  b: Business;
  m: ReturnType<typeof metrics>;
  event: boolean;
}) {
  const [search, setSearch] = useState(""),
    [selected, setSelected] = useState<Item | null>(null);
  return (
    <>
      <Title
        kicker="Know what you have"
        title="Inventory"
        sub="Stock, cost, and reorder signals update with each invoice and sale."
      />
      <div className="gridstats mb-5">
        {[
          ["Inventory value", usd(m.inventory)],
          ["Low or out", String(m.low)],
          ["Next 2 weeks", event ? "Event demand +35%" : "Normal demand"],
          ["Reorder rule", "14-day cover"],
        ].map(([x, y]) => (
          <Card key={x}>
            <div className="muted text-sm">{x}</div>
            <b className="text-xl mt-2 block">{y}</b>
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex justify-between">
          <h2>Stock levels</h2>
          <input
            placeholder="Search items"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="tablewrap mt-4">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Stock</th>
                <th>Avg cost</th>
                <th>Days left</th>
                <th>Reorder at</th>
                <th>Suggested order</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {b.items
                .filter((i) =>
                  i.name.toLowerCase().includes(search.toLowerCase()),
                )
                .map((i) => {
                  const daily = i.units / 90,
                    days = daily ? Math.round(i.stock / daily) : 999,
                    order = Math.max(
                      0,
                      Math.ceil(daily * 14 * (event ? 1.35 : 1) - i.stock),
                    );
                  return (
                    <tr
                      key={i.id}
                      onClick={() => setSelected(i)}
                      className="cursor-pointer hover:bg-paper"
                    >
                      <td>
                        <Link
                          className="font-semibold positive"
                          href={"/items/" + i.id}
                        >
                          {i.name}
                        </Link>
                      </td>
                      <td>{i.stock}</td>
                      <td>{usd(i.cost)}</td>
                      <td>{days}</td>
                      <td>{i.reorder}</td>
                      <td>{order}</td>
                      <td>
                        <span
                          className={
                            i.stock === 0
                              ? "negative"
                              : i.stock <= i.reorder
                                ? "text-amber"
                                : "positive"
                          }
                        >
                          {i.stock === 0
                            ? "Out"
                            : i.stock <= i.reorder
                              ? "Low"
                              : i.stock > i.reorder * 6
                                ? "Overstock"
                                : "OK"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
      {selected && (
        <Card className="mt-5">
          <div className="flex justify-between">
            <h2>{selected.name} · movement history</h2>
            <button onClick={() => setSelected(null)}>
              <X />
            </button>
          </div>
          <p className="muted text-sm my-3">
            Recent sales and supplier receipts
          </p>
          {[
            ...b.sales
              .filter((s) => s.items.some((x) => x.id === selected.id))
              .slice(0, 5)
              .map((s) => ({
                date: s.date,
                delta: -s.items.find((x) => x.id === selected.id)!.qty,
                label: "Sale",
              })),
            ...b.invoices
              .filter((x) => x.items.some((z) => z.id === selected.id))
              .slice(0, 3)
              .map((x) => ({
                date: x.date,
                delta: x.items.find((z) => z.id === selected.id)!.qty,
                label: "Supplier invoice",
              })),
          ].map((x, n) => (
            <div
              className="flex justify-between border-b border-line py-2 text-sm"
              key={n}
            >
              {x.date} · {x.label}
              <b className={x.delta > 0 ? "positive" : "negative"}>
                {x.delta > 0 ? "+" : ""}
                {x.delta}
              </b>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
