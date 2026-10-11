"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarClock,
  AlertTriangle,
  Flame,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { BorderBeam, DishBadge, Steam, TicketBurst, FloatingFood } from "@/components/fx";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
import type { Business } from "@/lib/core";
import { metrics } from "@/lib/core";
import {
  money,
  usd,
  Title,
  Stagger,
  Rise,
  Stat,
  Counter,
  Bar,
  ChartTooltip,
  useChartColors,
  ease,
} from "@/components/layout/ui";
import { Flash, LiveSalesPanel, type Live } from "./LiveSales";

function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(
      () => setN((x) => (x >= text.length ? (clearInterval(t), x) : x + 1)),
      16,
    );
    return () => clearInterval(t);
  }, [text]);
  return (
    <span>
      {text.slice(0, n)}
      {n < text.length && <span className="caret">▍</span>}
    </span>
  );
}

function Gauge({ value }: { value: number }) {
  const r = 52,
    c = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth="8"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.4, ease, delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Counter value={value} className="text-4xl font-medium" />
        <span className="eyebrow !text-[10px]">of 100</span>
      </div>
    </div>
  );
}

export function Dashboard({
  b,
  m,
  leak,
  act,
  data,
  live,
}: {
  b: Business;
  m: ReturnType<typeof metrics>;
  leak: number;
  act: any;
  data: { name: string; sales: number; profit: number }[];
  live: Live;
}) {
  const c = useChartColors();
  const today = new Date().toISOString().slice(0, 10);
  const todays = b.sales
    .filter((x) => x.date === today)
    .reduce((s, x) => s + x.total, 0);
  const units = b.items.reduce((s, i) => s + i.stock, 0);
  const top = b.items.slice().sort((a, c) => c.units - a.units);
  const health = Math.min(
    98,
    Math.round(65 + m.margin * 30 + (m.low < 4 ? 7 : 0)),
  );
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const brief = `Yesterday's sales were steady. Today should bring a stronger lunch rush${b.eventDay ? " with the event crowd" : ""}. Your best move: keep ${top[0].name} stocked.`;
  const feed = [
    ...b.sales.slice(0, 4).map((s) => ({
      id: s.id,
      in: true,
      name: s.items[0].name,
      meta: "Sale → stock ↓ · revenue ↑ · books ✓",
      amount: s.total,
    })),
    ...b.invoices.slice(0, 2).map((x) => ({
      id: x.id,
      in: false,
      name: x.vendor,
      meta: "Invoice → stock ↑ · payable ↑ · books ✓",
      amount: -x.total,
    })),
  ];

  return (
    <>
      <Title
        kicker={greeting}
        title={`Here’s the pulse at ${b.name}.`}
        sub="Your numbers are current as of the latest bill."
        action={
          <button
            onClick={() => act("event", { value: !b.eventDay })}
            className="flex items-center gap-3 rounded-full border border-line pl-4 pr-1.5 h-12 hover:border-[var(--accent)] transition-colors"
            role="switch"
            aria-checked={b.eventDay}
          >
            <CalendarClock size={16} />
            <span className="text-sm">Event Day Mode</span>
            <span
              className={
                "relative w-14 h-9 rounded-full transition-colors " +
                (b.eventDay ? "bg-[var(--brand)]" : "bg-[var(--line-strong)]")
              }
            >
              <motion.span
                className="absolute top-1 w-7 h-7 rounded-full bg-white shadow"
                animate={{ left: b.eventDay ? 24 : 4 }}
                transition={{ type: "spring", stiffness: 600, damping: 32 }}
              />
            </span>
          </button>
        }
      />

      {/* Service pulse: today's takings with live tickets floating off the pass */}
      <motion.section
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease }}
        className="card card-ink relative !p-0 overflow-hidden mb-4"
      >
        <BorderBeam duration={12} size={300} />
        <FloatingFood dim className="opacity-25" />
        <TicketBurst
          items={b.sales.slice(0, 10).map((s) => ({ label: s.items[0].name, amount: money(s.total) }))}
          every={1900}
          className="!left-[45%]"
        />
        <div className="relative grid md:grid-cols-[1.2fr_1fr] gap-6 p-7 md:p-10 items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#fdba74]">
              <span className="live-dot" /> Service is live
            </div>
            <div className="mt-4 text-sm opacity-70">Today so far</div>
            <div className="display text-6xl md:text-7xl font-extrabold tracking-tight mt-1">
              <Counter value={todays} format={(n) => usd(Math.round(n))} />
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              {[
                { Icon: Receipt, t: `${b.sales.filter((x) => x.date === today).length} bills today` },
                { Icon: TrendingUp, t: `${Math.round(m.margin * 100)}% margin` },
                { Icon: Flame, t: `Hot: ${top[0].name}` },
              ].map(({ Icon, t }, i) => (
                <motion.span
                  key={t}
                  className="animate-float inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-white/10 border border-white/10 text-sm backdrop-blur"
                  style={{ "--dur": 5 + i, "--float": 6 } as React.CSSProperties}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.12 }}
                >
                  <Icon size={14} className="text-[#fb923c]" /> {t}
                </motion.span>
              ))}
            </div>
          </div>
          <div className="relative h-48 md:h-56 flex items-center justify-center">
            <motion.div
              className="relative w-44 h-44 md:w-52 md:h-52 rounded-full flex items-center justify-center"
              initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.3 }}
            >
              <span className="absolute inset-0 rounded-full bg-white/[0.06] border border-white/10" />
              <span className="absolute inset-4 rounded-full border border-dashed border-white/15" />
              <motion.span
                className="absolute -inset-3 rounded-full border-2 border-[#fb923c] border-b-transparent border-r-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              />
              <span className="relative text-[#fb923c]">
                <Steam className="-top-8 left-1/2 -translate-x-1/2 text-[#fdba74]" />
                <DishBadge name={top[0].name} size={84} className="!bg-white/10 !text-[#fb923c] !rounded-full" />
              </span>
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#fb923c] text-[#1c0a00] text-xs font-semibold px-3 py-1">
                Best seller · {top[0].units} sold
              </span>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <Stagger className="grid gap-4">
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
          <Rise>
            <div className="card h-full !p-7 md:!p-9 overflow-hidden relative">
              <BorderBeam duration={8} />
              <div className="flex items-center justify-between">
                <span className="eyebrow">
                  Morning brief
                </span>
                <span className="tag tag-accent">AI · today</span>
              </div>
              <p className="text-[22px] md:text-[28px] leading-[1.25] tracking-tight mt-6 min-h-[5.2em]">
                <Typewriter text={brief} />
              </p>
              <Link
                href="/insights"
                className="inline-flex items-center gap-2 text-sm font-medium mt-6 group"
              >
                See today’s advice
                <ArrowUpRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>
          </Rise>
          <Rise>
            <div className="card lift h-full !p-7 flex flex-col">
              <div className="flex justify-between items-start">
                <span className="eyebrow">Money left on the table</span>
                <AlertTriangle size={16} className="text-amber" />
              </div>
              <div className="mt-5 flex items-baseline gap-2">
                <Counter
                  value={leak}
                  format={(n) => usd(Math.round(n))}
                  className="text-5xl font-medium negative"
                />
                <span className="muted text-sm">/ week</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed">
                {b.eventDay
                  ? "Event-day demand could outpace your stock."
                  : "Your busiest item sells out before the rush ends."}
              </p>
              <div className="mt-auto pt-6">
                <Link href="/insights" className="btn w-full group">
                  Find the fix
                  <ArrowUpRight
                    size={15}
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              </div>
            </div>
          </Rise>
        </div>

        <div className="gridstats">
          <Rise>
            <Flash block value={todays}>
              <Stat
                label="Today’s sales"
                value={todays}
                format={(n) => money(n)}
                tone={todays < 0 ? "negative" : "positive"}
              />
            </Flash>
          </Rise>
          <Rise>
            <Stat
              label="Gross margin"
              value={Math.round(m.margin * 100)}
              format={(n) => `${Math.round(n)}%`}
            />
          </Rise>
          <Rise>
            <Flash block value={b.cash}>
              <Stat
                label="Cash on hand"
                value={b.cash}
                format={(n) => money(n)}
                tone={b.cash < 0 ? "negative" : ""}
              />
            </Flash>
          </Rise>
          <Rise>
            <Stat
              label="Payables due"
              value={m.payables}
              format={(n) => usd(Math.round(n))}
              tone="negative"
              hint={
                <Link href="/books" className="underline underline-offset-2">
                  Review bills →
                </Link>
              }
            />
          </Rise>
          <Rise>
            <Flash block value={units}>
              <Stat
                label="Units in stock"
                value={units}
                format={(n) => Math.round(n).toLocaleString("en-US")}
              />
            </Flash>
          </Rise>
          <Rise>
            <Flash block value={m.low}>
              <Stat
                label="Low stock"
                value={m.low}
                format={(n) => `${Math.round(n)} items`}
                tone="text-amber"
              />
            </Flash>
          </Rise>
        </div>

        <Rise>
          <LiveSalesPanel b={b} live={live} />
        </Rise>

        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
          <Rise>
            <div className="card h-full">
              <div className="flex justify-between items-start">
                <div>
                  <span className="eyebrow">Revenue pulse · 14 days</span>
                  <div className="mt-2 text-2xl font-medium">
                    <Counter
                      value={data.reduce((s, d) => s + d.sales, 0)}
                      format={(n) => usd(Math.round(n))}
                    />
                  </div>
                </div>
                <div className="flex gap-4 text-xs muted">
                  <span className="flex items-center gap-1.5">
                    <i
                      className="w-3 h-[2px] inline-block"
                      style={{ background: c.ink }}
                    />{" "}
                    Sales
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="w-3 h-2 inline-block rounded-sm bg-accent" />{" "}
                    Profit
                  </span>
                </div>
              </div>
              <div className="h-56 mt-4 -mx-2">
                <ResponsiveContainer>
                  <AreaChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient
                        id="dashSales"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={c.ink}
                          stopOpacity={0.12}
                        />
                        <stop offset="100%" stopColor={c.ink} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      interval={1}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ stroke: c.ink2, strokeDasharray: "3 3" }}
                    />
                    <Area
                      name="Profit"
                      dataKey="profit"
                      type="monotone"
                      stroke="none"
                      fill={c.accent}
                      fillOpacity={0.9}
                      animationDuration={1400}
                    />
                    <Area
                      name="Sales"
                      dataKey="sales"
                      type="monotone"
                      stroke={c.ink}
                      strokeWidth={2}
                      fill="url(#dashSales)"
                      animationDuration={1400}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Rise>
          <Rise>
            <div className="card h-full">
              <div className="flex justify-between items-center">
                <span className="eyebrow">Live bill feed</span>
                <Link
                  href="/sales"
                  className="text-sm underline underline-offset-4 decoration-[var(--line-strong)] hover:decoration-[var(--ink)]"
                >
                  View all
                </Link>
              </div>
              <div className="mt-4">
                {feed.map((f, i) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.07, duration: 0.45, ease }}
                    className="flex items-center gap-3 py-3 border-b border-line last:border-0"
                  >
                    {f.in ? (
                      <DishBadge name={f.name} size={36} />
                    ) : (
                      <span className="w-9 h-9 rounded-2xl inline-flex items-center justify-center shrink-0 tag-neg">
                        <ArrowUpRight size={15} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {f.name}
                      </div>
                      <div className="text-[11px] muted truncate">{f.meta}</div>
                    </div>
                    <span
                      className={
                        "num text-sm " + (f.in ? "positive" : "negative")
                      }
                    >
                      {money(f.amount)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Rise>
        </div>

        <Rise>
          <div className="card grid md:grid-cols-[auto_1fr] gap-8 items-center">
            <div className="flex items-center gap-6">
              <Gauge value={health} />
              <div>
                <span className="eyebrow">Business health</span>
                <h2 className="text-2xl mt-2">
                  Four signals, <span className="serif">one</span> score.
                </h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
              {[
                ["Profitability", Math.round(m.margin * 100)],
                ["Cash health", 78],
                ["Stock readiness", Math.max(30, 100 - m.low * 8)],
                ["Growth", 72],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{label}</span>
                    <span className="num">{value}%</span>
                  </div>
                  <Bar value={Number(value)} />
                </div>
              ))}
            </div>
          </div>
        </Rise>
      </Stagger>
    </>
  );
}
