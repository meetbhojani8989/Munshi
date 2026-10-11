"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, ArrowUpRight } from "lucide-react";
import type { Business, Item } from "@/lib/core";
import { DishBadge } from "@/components/fx";
import { metrics } from "@/lib/core";
import {
  Title,
  Stagger,
  Rise,
  Stat,
  Sheet,
  Segmented,
  usd,
  ease,
} from "@/components/layout/ui";

const statusOf = (i: Item) =>
  i.stock === 0
    ? "Out"
    : i.stock <= i.reorder
      ? "Low"
      : i.stock > i.reorder * 6
        ? "Overstock"
        : "OK";
const tone: Record<string, string> = {
  Out: "tag-neg",
  Low: "tag-warn",
  Overstock: "",
  OK: "tag-pos",
};

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
    [view, setView] = useState("All"),
    [selected, setSelected] = useState<Item | null>(null);
  const maxStock = Math.max(...b.items.map((i) => i.stock), 1);
  const rows = b.items
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .filter(
      (i) =>
        view === "All" ||
        (view === "Needs attention"
          ? ["Out", "Low"].includes(statusOf(i))
          : statusOf(i) === view),
    );

  return (
    <>
      <Title
        kicker="Know what’s in the walk-in"
        title="Pantry stock"
        sub="Every ingredient and dish, counted live as bills come in and plates go out."
      />
      <Stagger className="grid gap-4">
        <div className="gridstats">
          <Rise>
            <Stat
              label="Inventory value"
              value={m.inventory}
              format={(n) => usd(Math.round(n * 100) / 100)}
            />
          </Rise>
          <Rise>
            <Stat
              label="Low or out"
              value={m.low}
              tone={m.low ? "text-amber" : ""}
            />
          </Rise>
          <Rise>
            <Stat
              label="Next 2 weeks"
              value={event ? "Event demand +35%" : "Normal demand"}
            />
          </Rise>
          <Rise>
            <Stat label="Reorder rule" value="14-day cover" />
          </Rise>
        </div>
        <Rise>
          <div className="card">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h2>Stock levels</h2>
              <div className="flex flex-wrap gap-3 items-center">
                <Segmented
                  id="inv-view"
                  options={["All", "Needs attention", "Overstock"]}
                  value={view}
                  onChange={setView}
                />
                <label className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 muted"
                  />
                  <input
                    className="!pl-9 !rounded-full w-48"
                    placeholder="Search items"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search items"
                  />
                </label>
              </div>
            </div>
            <div className="tablewrap mt-4">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="w-[22%]">Stock</th>
                    <th>Avg cost</th>
                    <th>Days left</th>
                    <th>Reorder at</th>
                    <th>Suggested order</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((i, n) => {
                    const daily = i.units / 90,
                      days = daily ? Math.round(i.stock / daily) : 999,
                      order = Math.max(
                        0,
                        Math.ceil(daily * 14 * (event ? 1.35 : 1) - i.stock),
                      );
                    const s = statusOf(i);
                    return (
                      <motion.tr
                        key={i.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(n, 15) * 0.025, ease }}
                        onClick={() => setSelected(i)}
                        className="cursor-pointer"
                      >
                        <td>
                          <Link
                            className="font-medium inline-flex items-center gap-2.5 hover:underline underline-offset-4"
                            href={"/items/" + i.id}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DishBadge name={i.name} size={30} className="!rounded-lg" />
                            {i.name}
                            <ArrowUpRight size={12} className="muted" />
                          </Link>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <span className="num w-8">{i.stock}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden relative">
                              <motion.div
                                className={
                                  "h-full rounded-full origin-left " +
                                  (s === "Out" || s === "Low"
                                    ? "bg-[var(--neg)]"
                                    : "bg-[var(--brand)]")
                                }
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: i.stock / maxStock }}
                                transition={{
                                  duration: 0.8,
                                  delay: 0.2 + Math.min(n, 15) * 0.03,
                                  ease,
                                }}
                              />
                              <span
                                className="absolute top-[-2px] bottom-[-2px] w-px bg-[var(--muted)]"
                                style={{
                                  left: `${(i.reorder / maxStock) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="num">{usd(i.cost)}</td>
                        <td className="num">{days}</td>
                        <td className="num">{i.reorder}</td>
                        <td className="num">
                          {order || <span className="muted">—</span>}
                        </td>
                        <td>
                          <span className={"tag " + tone[s]}>{s}</span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              {!rows.length && (
                <p className="muted text-sm p-6 text-center">No items match.</p>
              )}
            </div>
          </div>
        </Rise>
      </Stagger>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? selected.name : ""}
      >
        {selected && (
          <>
            <span className="eyebrow">Movement history</span>
            <p className="muted text-sm mt-2 mb-5">
              Recent sales and supplier receipts
            </p>
            <div className="relative pl-5">
              <span className="absolute left-[5px] top-2 bottom-2 w-px bg-[var(--line-strong)]" />
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
                <motion.div
                  key={n}
                  className="relative flex justify-between py-3 text-sm"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + n * 0.05 }}
                >
                  <span
                    className={
                      "absolute -left-5 top-[18px] w-[11px] h-[11px] rounded-full border-2 border-[var(--bg)] " +
                      (x.delta > 0 ? "bg-[var(--pos)]" : "bg-[var(--brand)]")
                    }
                  />
                  <span>
                    {x.label}
                    <span className="block mono text-xs muted">{x.date}</span>
                  </span>
                  <b
                    className={"num " + (x.delta > 0 ? "positive" : "negative")}
                  >
                    {x.delta > 0 ? "+" : ""}
                    {x.delta}
                  </b>
                </motion.div>
              ))}
            </div>
            <Link href={"/items/" + selected.id} className="btn w-full mt-6">
              Open item analysis <ArrowUpRight size={15} />
            </Link>
          </>
        )}
      </Sheet>
    </>
  );
}
