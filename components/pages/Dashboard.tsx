import Link from "next/link";
import { CircleDollarSign, ArrowUpRight } from "lucide-react";
import type { Business } from "@/lib/core";
import { metrics } from "@/lib/core";
import { money, usd, signed, Card, Title } from "@/components/layout/ui";

export function Dashboard({
  b,
  m,
  leak,
  act,
}: {
  b: Business;
  m: ReturnType<typeof metrics>;
  leak: number;
  act: any;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const todays = b.sales
    .filter((x) => x.date === today)
    .reduce((s, x) => s + x.total, 0);
  const top = b.items.slice().sort((a, c) => c.units - a.units);
  const health = Math.min(
    98,
    Math.round(65 + m.margin * 30 + (m.low < 4 ? 7 : 0)),
  );
  return (
    <>
      <Title
        kicker="Good morning"
        title={`Here’s the pulse at ${b.name}.`}
        sub="Your numbers are current as of the latest bill."
      />
      <div className="grid lg:grid-cols-[1.55fr_1fr] gap-5 mb-5">
        <Card className="bg-[#154635] !text-white border-0">
          <div className="text-xs uppercase tracking-widest text-[#b9d8c8] mb-4">
            Morning brief
          </div>
          <h2 className="text-2xl leading-snug mb-5">
            Yesterday's sales were steady. Today should bring a stronger lunch
            rush{b.eventDay ? " with the event crowd" : ""}. Your best move:
            keep {top[0].name} stocked.
          </h2>
          <Link
            href="/insights"
            className="inline-flex items-center gap-2 text-sm font-semibold"
          >
            See today’s advice <ArrowUpRight size={15} />
          </Link>
        </Card>
        <Card>
          <div className="flex justify-between">
            <div>
              <div className="muted text-sm">Money left on the table</div>
              <div className="text-4xl font-bold mt-2 negative">
                {usd(leak)}
                <span className="text-base muted"> / week</span>
              </div>
            </div>
            <CircleDollarSign className="text-amber" size={30} />
          </div>
          <p className="mt-5 text-sm">
            {b.eventDay
              ? "Event-day demand could outpace your stock."
              : "Your busiest item sells out before the rush ends."}
          </p>
          <Link
            href="/insights"
            className="positive text-sm font-semibold mt-3 inline-block"
          >
            Find the fix →
          </Link>
        </Card>
      </div>
      <div className="gridstats mb-5">
        {[
          ["Today’s sales", signed(todays)],
          [
            "Gross margin",
            <span className="positive">{Math.round(m.margin * 100)}%</span>,
          ],
          ["Cash on hand", signed(b.cash)],
          ["Payables due", <span className="negative">{usd(m.payables)}</span>],
          ["Low stock", <span className="text-amber">{m.low} items</span>],
        ].map(([a, v]) => (
          <Card key={String(a)}>
            <div className="text-sm muted mb-2">{a}</div>
            <div className="text-2xl font-bold">{v}</div>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex justify-between">
            <h2>Live bill feed</h2>
            <Link href="/sales" className="text-sm positive">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {b.sales.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="flex justify-between border-b border-line pb-3 text-sm"
              >
                <div>
                  <b>{s.items[0].name}</b>
                  <div className="muted">
                    Sale → stock ↓ · revenue ↑ · books ✓
                  </div>
                </div>
                <b className="positive">{money(s.total)}</b>
              </div>
            ))}
            {b.invoices.slice(0, 2).map((x) => (
              <div key={x.id} className="flex justify-between text-sm">
                <div>
                  <b>{x.vendor}</b>
                  <div className="muted">
                    Invoice → stock ↑ · payable ↑ · books ✓
                  </div>
                </div>
                <b className="negative">{money(-x.total)}</b>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-start">
            <div>
              <h2>Business health</h2>
              <p className="muted text-sm mt-1">
                Four signals, one clear score.
              </p>
            </div>
            <span className="text-4xl font-bold positive">
              {health}
              <span className="text-lg muted">/100</span>
            </span>
          </div>
          {[
            ["Profitability", Math.round(m.margin * 100)],
            ["Cash health", 78],
            ["Stock readiness", Math.max(30, 100 - m.low * 8)],
            ["Growth", 72],
          ].map(([label, value]) => (
            <div className="mt-4" key={label}>
              <div className="flex justify-between text-sm">
                <span>{label}</span>
                <b>{value}%</b>
              </div>
              <div className="bg-line h-2 rounded mt-2">
                <div
                  className="bg-green h-2 rounded"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
          <div className="mt-6 flex items-center justify-between bg-paper rounded-xl p-3">
            <div>
              <b>Event Day Mode</b>
              <div className="text-xs muted">
                Forecast demand spikes and extra stock
              </div>
            </div>
            <button
              className={b.eventDay ? "btn" : "btn2"}
              onClick={() => act("event", { value: !b.eventDay })}
            >
              {b.eventDay ? "On" : "Off"}
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
