"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  RefreshCw,
  Monitor,
  Trophy,
  Search,
  CreditCard,
  Banknote,
  Store,
  Bike,
  Car,
  Globe,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell,
} from "recharts";
import type { Business, Sale } from "@/lib/core";
import { DishBadge } from "@/components/fx";
import {
  Title,
  Stagger,
  Rise,
  Stat,
  Segmented,
  Sheet,
  ChartTooltip,
  useChartColors,
  usd,
  money,
  ease,
} from "@/components/layout/ui";

const periods: Record<string, number> = {
  "7 days": 7,
  "30 days": 30,
  "90 days": 90,
};
const channelIcon: Record<string, any> = {
  "In store": Store,
  DoorDash: Bike,
  "Uber Eats": Car,
  Website: Globe,
};

// Bills are rung up on the café's POS machine; Munshi only syncs and reads them.
export function Sales({ b }: { b: Business; act?: any }) {
  const c = useChartColors();
  const [period, setPeriod] = useState("30 days"),
    [channel, setChannel] = useState("All"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<Sale | null>(null),
    [syncing, setSyncing] = useState(false),
    [syncedAt, setSyncedAt] = useState(() => Date.now() - 2 * 60000),
    [now, setNow] = useState(Date.now()),
    [pulse, setPulse] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  const ago = Math.max(0, Math.round((now - syncedAt) / 60000));

  const since = new Date(Date.now() - periods[period] * 86400000)
    .toISOString()
    .slice(0, 10);
  const inPeriod = useMemo(
    () => b.sales.filter((s) => s.date >= since),
    [b.sales, since],
  );
  const revenue = inPeriod.reduce((s, x) => s + x.total, 0);
  const itemsSold = inPeriod.reduce(
    (s, x) => s + x.items.reduce((a, i) => a + i.qty, 0),
    0,
  );

  // Top dishes by revenue in the period.
  const dishes = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; qty: number; revenue: number; profit: number }
    >();
    for (const s of inPeriod)
      for (const i of s.items) {
        const d = map.get(i.id) || {
          id: i.id,
          name: i.name,
          qty: 0,
          revenue: 0,
          profit: 0,
        };
        d.qty += i.qty;
        d.revenue += i.qty * i.price;
        d.profit += i.qty * (i.price - i.cost);
        map.set(i.id, d);
      }
    return [...map.values()].sort((a, z) => z.revenue - a.revenue);
  }, [inPeriod]);
  const top = dishes.slice(0, 8);
  const topMax = top[0]?.revenue || 1;

  const channels = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of inPeriod) m[s.channel] = (m[s.channel] || 0) + s.total;
    return Object.entries(m).sort((a, z) => z[1] - a[1]);
  }, [inPeriod]);

  const daily = useMemo(() => {
    const days = Math.min(periods[period], 30);
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(Date.now() - (days - 1 - i) * 86400000)
        .toISOString()
        .slice(0, 10);
      return {
        name: date.slice(5),
        sales: Math.round(
          b.sales
            .filter((s) => s.date === date)
            .reduce((a, s) => a + s.total, 0),
        ),
      };
    });
  }, [b.sales, period]);

  const bills = inPeriod
    .filter((s) => channel === "All" || s.channel === channel)
    .filter(
      (s) =>
        !query ||
        s.items.some((i) => i.name.toLowerCase().includes(query.toLowerCase())),
    )
    .slice(0, 40);

  function sync() {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncedAt(Date.now());
      setNow(Date.now());
      setPulse((p) => p + 1);
    }, 1400);
  }

  return (
    <>
      <Title
        kicker="Synced from your POS"
        title="Sales overview"
        sub="Every bill rung up on the till lands here automatically, already posted to stock and books."
        action={
          <div className="card !p-3 !rounded-2xl flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)] inline-flex items-center justify-center relative">
              <Monitor size={18} />
              <span className="absolute -top-0.5 -right-0.5 live-dot" />
            </span>
            <div className="text-sm leading-tight">
              <div className="font-semibold">POS terminal · Counter 1</div>
              <div className="muted text-xs mt-0.5">
                {syncing
                  ? "Syncing bills…"
                  : `Connected · synced ${ago === 0 ? "just now" : ago + " min ago"}`}
              </div>
            </div>
            <button
              className="btn2 !h-9 !min-h-0 ml-2"
              onClick={sync}
              disabled={syncing}
              aria-label="Sync now"
            >
              <motion.span
                animate={syncing ? { rotate: 360 } : { rotate: 0 }}
                transition={
                  syncing
                    ? { duration: 0.8, repeat: Infinity, ease: "linear" }
                    : { duration: 0 }
                }
              >
                <RefreshCw size={14} />
              </motion.span>
              Sync
            </button>
          </div>
        }
      />

      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <Segmented
          id="sales-period"
          options={Object.keys(periods)}
          value={period}
          onChange={setPeriod}
        />
        <span className="text-xs muted">
          {inPeriod.length} bills · since {since}
        </span>
      </div>

      <Stagger className="grid gap-4" key={period + pulse}>
        <div className="gridstats">
          <Rise>
            <Stat
              label="Revenue"
              value={revenue}
              format={(n) => usd(Math.round(n))}
              tone="positive"
            />
          </Rise>
          <Rise>
            <Stat label="Bills" value={inPeriod.length} />
          </Rise>
          <Rise>
            <Stat
              label="Average bill"
              value={inPeriod.length ? revenue / inPeriod.length : 0}
              format={(n) => usd(Math.round(n * 100) / 100)}
            />
          </Rise>
          <Rise>
            <Stat label="Items sold" value={itemsSold} />
          </Rise>
        </div>

        <div className="grid xl:grid-cols-[1.25fr_1fr] gap-4">
          {/* Top revenue dishes */}
          <Rise>
            <div className="card h-full">
              <div className="flex items-center justify-between">
                <h2>Top revenue dishes</h2>
                <span className="tag">{period}</span>
              </div>
              {top.length >= 3 && (
                <div className="relative mt-6 grid grid-cols-3 gap-3 items-end h-[250px] rounded-2xl bg-surface-2 border border-line px-4 pt-4 overflow-hidden">
                  {[1, 0, 2].map((rank, col) => {
                    const d = top[rank];
                    const h = [170, 125, 95][rank];
                    return (
                      <div key={d.id} className="flex flex-col items-center justify-end h-full">
                        <motion.div
                          className="animate-float flex flex-col items-center mb-2"
                          style={{ "--dur": 4 + rank, "--float": 8 } as React.CSSProperties}
                          initial={{ opacity: 0, y: -40, scale: 0.5 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.9 + col * 0.15, type: "spring", stiffness: 260, damping: 14 }}
                        >
                          {rank === 0 && <Trophy size={18} className="text-gold mb-1" />}
                          <DishBadge name={d.name} size={rank === 0 ? 56 : 46} className={rank === 0 ? "!bg-[var(--accent)] !text-[var(--on-accent)] shadow-[var(--glow)]" : "shadow-[var(--shadow)]"} />
                          <span className="text-xs font-semibold mt-2 text-center leading-tight max-w-[110px] truncate">{d.name}</span>
                          <span className="num text-xs muted">{usd(Math.round(d.revenue))}</span>
                        </motion.div>
                        <motion.div
                          className={
                            "w-full rounded-t-2xl origin-bottom flex items-start justify-center pt-2 display font-extrabold text-2xl " +
                            (rank === 0 ? "bg-[var(--brand)] text-[var(--on-brand)]" : rank === 1 ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" : "bg-[var(--gold-soft)] text-[var(--gold)]")
                          }
                          style={{ height: h }}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.8, delay: 0.3 + col * 0.12, ease }}
                        >
                          {rank + 1}
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-3">
                {top.slice(3).map((d, i) => (
                  <motion.div
                    key={d.id}
                    className="grid grid-cols-[30px_1fr_auto] gap-3 items-center py-3 border-b border-line last:border-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.06, ease }}
                  >
                    <span className="relative">
                      <DishBadge name={d.name} size={30} className="!rounded-lg" />
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[var(--ink)] text-[var(--bg)] text-[9px] font-bold inline-flex items-center justify-center">{i + 4}</span>
                    </span>
                    <div className="min-w-0">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate">{d.name}</span>
                        <span className="muted text-xs ml-2 whitespace-nowrap">
                          {d.qty} sold
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-3 mt-2 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-[var(--accent)] origin-left"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: d.revenue / topMax }}
                          transition={{
                            duration: 0.9,
                            delay: 0.45 + i * 0.06,
                            ease,
                          }}
                        />
                      </div>
                    </div>
                    <span className="num font-semibold text-sm w-20 text-right">
                      {usd(Math.round(d.revenue))}
                    </span>
                  </motion.div>
                ))}
                {!top.length && (
                  <p className="muted text-sm py-6">
                    No bills in this period yet.
                  </p>
                )}
              </div>
            </div>
          </Rise>

          <div className="grid gap-4">
            <Rise>
              <div className="card">
                <h2>Daily revenue</h2>
                <div className="h-44 mt-4 -mx-1">
                  <ResponsiveContainer>
                    <BarChart data={daily}>
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        interval={Math.ceil(daily.length / 7)}
                      />
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{ fill: c.grid }}
                      />
                      <Bar
                        name="Revenue"
                        dataKey="sales"
                        radius={[5, 5, 0, 0]}
                        animationDuration={1100}
                      >
                        {daily.map((d, i) => (
                          <Cell
                            key={i}
                            fill={i === daily.length - 1 ? c.ink : c.accent}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Rise>
            <Rise>
              <div className="card">
                <h2>Where sales come from</h2>
                <div className="flex h-3 rounded-full overflow-hidden mt-5 gap-0.5">
                  {channels.map(([ch, v], i) => (
                    <motion.div
                      key={ch}
                      className="h-full origin-left"
                      style={{
                        width: `${(v / (revenue || 1)) * 100}%`,
                        background: c.series[i % c.series.length],
                      }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: 0.7,
                        delay: 0.3 + i * 0.12,
                        ease,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {channels.map(([ch, v], i) => {
                    const Icon = channelIcon[ch] || Globe;
                    return (
                      <div
                        key={ch}
                        className="flex items-center gap-2.5 text-sm"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: c.series[i % c.series.length] }}
                        />
                        <Icon size={14} className="muted" />
                        <span className="flex-1 truncate">{ch}</span>
                        <span className="num font-semibold">
                          {Math.round((v / (revenue || 1)) * 100)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Rise>
          </div>
        </div>

        {/* Synced bills */}
        <Rise>
          <div className="card">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2>Bills from the POS</h2>
                <p className="text-xs muted mt-1">
                  Read-only · edits happen on the till
                </p>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <Segmented
                  id="sales-channel"
                  options={["All", "In store", "DoorDash", "Uber Eats"]}
                  value={channel}
                  onChange={setChannel}
                />
                <label className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 muted"
                  />
                  <input
                    className="!pl-9 w-48"
                    placeholder="Search dishes"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search dishes"
                  />
                </label>
              </div>
            </div>
            <div className="tablewrap mt-4">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bill #</th>
                    <th>Items</th>
                    <th>Date</th>
                    <th>Channel</th>
                    <th>Paid by</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {bills.map((s, i) => {
                      const Icon = channelIcon[s.channel] || Globe;
                      return (
                        <motion.tr
                          key={s.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(i, 12) * 0.025 }}
                          className="cursor-pointer"
                          onClick={() => setSelected(s)}
                        >
                          <td className="mono text-xs muted">
                            #{s.id.slice(-6).toUpperCase()}
                          </td>
                          <td className="max-w-[280px] truncate font-medium">
                            {s.items.map((x) => x.name).join(", ")}
                          </td>
                          <td className="text-xs muted">{s.date}</td>
                          <td>
                            <span className="tag">
                              <Icon size={11} /> {s.channel}
                            </span>
                          </td>
                          <td className="text-sm">
                            <span className="inline-flex items-center gap-1.5 muted">
                              {s.payment === "Cash" ? (
                                <Banknote size={14} />
                              ) : (
                                <CreditCard size={14} />
                              )}{" "}
                              {s.payment}
                            </span>
                          </td>
                          <td className="num positive text-right font-semibold">
                            {money(s.total)}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
              {!bills.length && (
                <p className="muted text-sm p-6 text-center">No bills match.</p>
              )}
            </div>
          </div>
        </Rise>
      </Stagger>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Bill detail"
      >
        {selected && (
          <>
            <div className="rounded-2xl border border-line p-5">
              <div className="flex justify-between text-xs muted">
                <span className="mono">
                  #{selected.id.slice(-6).toUpperCase()}
                </span>
                <span>{selected.date}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <span className="tag">{selected.channel}</span>
                <span className="tag">{selected.payment}</span>
                <span className="tag tag-accent">
                  <Monitor size={11} /> POS
                </span>
              </div>
              <div className="mt-5">
                {selected.items.map((x) => (
                  <div
                    className="flex justify-between py-2.5 border-b border-dashed border-line text-sm"
                    key={x.id}
                  >
                    <span>
                      {x.qty} × {x.name}
                    </span>
                    <span className="num">{usd(x.qty * x.price)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-5 text-2xl font-bold">
                Total <span className="num">{usd(selected.total)}</span>
              </div>
            </div>
            <div className="mt-5 grid gap-2 text-sm">
              {[
                "Stock reduced",
                "Revenue recorded",
                "Journal entry balanced",
              ].map((t, i) => (
                <motion.div
                  key={t}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <span className="w-5 h-5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] inline-flex items-center justify-center">
                    <ArrowUpRight size={11} />
                  </span>
                  {t}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </Sheet>
    </>
  );
}
