import { useState } from "react";
import { X } from "lucide-react";
import type { Business, Sale } from "@/lib/core";
import { Title, Card, usd, money } from "@/components/layout/ui";

export function Sales({ b, act }: { b: Business; act: any }) {
  const [lines, setLines] = useState<{ id: string; qty: number }[]>([]),
    [payment, setPayment] = useState("Card"),
    [filter, setFilter] = useState("All"),
    [selected, setSelected] = useState<Sale | null>(null);
  const total = lines.reduce(
    (s, x) => s + (b.items.find((i) => i.id === x.id)?.price || 0) * x.qty,
    0,
  );
  return (
    <>
      <Title
        kicker="Every sale, accounted for"
        title="Sales"
        sub="Ring up a bill and watch the books change in real time."
      />
      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-5">
        <Card>
          <h2>Mock POS</h2>
          <p className="muted text-sm mt-1 mb-5">
            Choose a product and make a live demo sale.
          </p>
          <select
            className="w-full mb-3"
            onChange={(e) => {
              if (e.target.value)
                setLines([...lines, { id: e.target.value, qty: 1 }]);
            }}
            value=""
          >
            <option value="">Add an item…</option>
            {b.items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} · {usd(i.price)}
              </option>
            ))}
          </select>
          {lines.map((l, n) => (
            <div
              key={n}
              className="flex justify-between items-center border-b border-line py-3"
            >
              <span>{b.items.find((i) => i.id === l.id)?.name}</span>
              <div className="flex gap-2 items-center">
                <button
                  className="btn2"
                  onClick={() =>
                    setLines(
                      lines.map((x, j) =>
                        j === n ? { ...x, qty: Math.max(1, x.qty - 1) } : x,
                      ),
                    )
                  }
                >
                  −
                </button>
                {l.qty}
                <button
                  className="btn2"
                  onClick={() =>
                    setLines(
                      lines.map((x, j) =>
                        j === n ? { ...x, qty: x.qty + 1 } : x,
                      ),
                    )
                  }
                >
                  +
                </button>
                <button
                  onClick={() => setLines(lines.filter((_, j) => j !== n))}
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-between my-5">
            <b>Total</b>
            <b className="text-2xl">{usd(total)}</b>
          </div>
          <select
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            className="w-full mb-3"
          >
            <option>Card</option>
            <option>Cash</option>
          </select>
          <button
            className="btn w-full"
            disabled={!lines.length}
            onClick={async () => {
              await act(
                "sale",
                { items: lines, payment },
                `Sale ${usd(total)} posted. Stock fell, revenue rose, and the journal stayed balanced.`,
              );
              setLines([]);
            }}
          >
            Complete sale
          </button>
        </Card>
        <Card>
          <div className="flex justify-between items-center">
            <h2>Bill history</h2>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option>All</option>
              <option>In store</option>
              <option>DoorDash</option>
              <option>Uber Eats</option>
            </select>
          </div>
          <div className="tablewrap mt-4">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Date</th>
                  <th>Channel</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {b.sales
                  .filter((s) => filter === "All" || s.channel === filter)
                  .slice(0, 30)
                  .map((s) => (
                    <tr key={s.id}>
                      <td>{s.items.map((x) => x.name).join(", ")}</td>
                      <td>{s.date}</td>
                      <td>{s.channel}</td>
                      <td className="positive">{money(s.total)}</td>
                      <td>
                        <button
                          className="positive"
                          onClick={() => setSelected(s)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-40 flex justify-end">
          <div className="bg-surface w-full max-w-md p-6">
            <button className="float-right" onClick={() => setSelected(null)}>
              <X />
            </button>
            <h2>Bill detail</h2>
            <p className="muted text-sm my-3">
              {selected.date} · {selected.channel} · {selected.payment}
            </p>
            {selected.items.map((x) => (
              <div
                className="flex justify-between py-3 border-b border-line"
                key={x.id}
              >
                {x.qty} × {x.name}
                <b>{usd(x.qty * x.price)}</b>
              </div>
            ))}
            <div className="flex justify-between mt-5 text-xl font-bold">
              Total <span>{usd(selected.total)}</span>
            </div>
            <p className="tag inline-block mt-5">Inventory and books updated</p>
          </div>
        </div>
      )}
    </>
  );
}
