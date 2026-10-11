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

// The latest bills as a till receipt that prints out of a slot on load.
function ReceiptTape({
  feed,
}: {
  feed: { id: string; in: boolean; name: string; amount: number }[];
}) {
  const net = feed.reduce((s, f) => s + f.amount, 0);
  return (
    <div className="mt-4 mx-auto max-w-[420px]">
      <div className="relative z-10 h-4 rounded-full bg-[var(--ink)] shadow-[0_6px_14px_-6px_rgba(0,0,0,.6)]" />
      <div className="overflow-hidden -mt-2 px-3">
        <motion.div
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 2.2, ease: [0.3, 0, 0.2, 1], delay: 0.5 }}
          className="bg-white text-[#16161a] mono text-[12px] pt-6 pb-7 px-5 shadow-[var(--shadow)] [mask:radial-gradient(7px_at_7px_100%,#0000_98%,#000)_-7px_0/14px_100%_repeat-x]"
        >
          <div className="flex justify-between text-[10px] text-[#6b6b72]">
            <span>MUNSHI · LIVE FEED</span>
            <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
          <div className="border-t border-dashed border-[#c9c9cf] my-3" />
          {feed.map((f) => (
            <div key={f.id} className="flex items-center gap-2 py-1.5">
              <span className="w-10 text-[10px] text-[#6b6b72]">{f.in ? "SALE" : "BILL"}</span>
              <span className="flex-1 truncate font-sans text-[13px] font-semibold">{f.name}</span>
              <span className={"num font-semibold " + (f.in ? "text-[#0b7a45]" : "text-[#c62a35]")}>{money(f.amount)}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-[#c9c9cf] my-3" />
          <div className="flex justify-between font-bold text-[13px]">
            <span>NET</span>
            <span className="num">{money(net)}</span>
          </div>
          <div
            aria-hidden
            className="mt-4 h-8 opacity-80"
            style={{
              background:
                "repeating-linear-gradient(90deg,#16161a 0 2px,transparent 2px 5px,#16161a 5px 6px,transparent 6px 10px,#16161a 10px 13px,transparent 13px 15px)",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

// Fourteen days of sales as bars that grow in sequence; today is highlighted
// and hovering a bar reads out its day.
function PulseBars({ data }: { data: { name: string; sales: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.sales));
  const shown = hover ?? data.length - 1;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="opacity-70">Last 14 days</span>
        <span className="mono">
          <span className="opacity-60">{data[shown].name}</span>{" "}
          {usd(data[shown].sales)}
        </span>
      </div>
      <div
        className="mt-4 h-36 md:h-44 flex items-end gap-1.5"
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Sales for the last 14 days, ${usd(data[data.length - 1].sales)} today`}
      >
        {data.map((d, i) => {
          const last = i === data.length - 1;
          return (
            <div
              key={d.name}
              className="flex-1 h-full flex items-end"
              onPointerEnter={() => setHover(i)}
            >
              <motion.div
                className={
                  "w-full rounded-full origin-bottom transition-colors duration-200 " +
                  (last || hover === i ? "bg-white" : "bg-white/25")
                }
                style={{ height: `${Math.max(4, (d.sales / max) * 100)}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.7, ease, delay: 0.25 + i * 0.035 }}
              />
            </div>
          );
        })}
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
  const today = new Date().toISOString().slice(0, 10);
  const todays = b.sales
    .filter((x) => x.date === today)
    .reduce((s, x) => s + x.total, 0);
  const top = b.items.slice().sort((a, c) => c.units - a.units);
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

  const toggle = (
    <button
      onClick={() => act("event", { value: !b.eventDay })}
      className="glass border border-line flex items-center gap-3 rounded-full pl-5 pr-2 h-14 hover:border-[var(--brand)] transition-colors"
      role="switch"
      aria-checked={b.eventDay}
    >
      <CalendarClock size={17} />
      <span className="text-sm font-semibold">Event day</span>
      <span
        className={
          "relative w-[58px] h-9 rounded-full transition-colors duration-300 " +
          (b.eventDay ? "bg-[var(--brand)]" : "bg-[var(--surface-3)]")
        }
      >
        <motion.span
          className="absolute top-1 w-7 h-7 rounded-full bg-white shadow-md"
          animate={{ left: b.eventDay ? 26 : 4 }}
          transition={{ type: "spring", stiffness: 600, damping: 32 }}
        />
      </span>
    </button>
  );
  const link =
    "inline-flex items-center gap-1.5 text-sm font-bold text-[var(--accent-text)] group";
  const arrow = (
    <ArrowUpRight
      size={15}
      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
    />
  );

  return (
    <>
      <Title
        kicker={`${greeting} · ${b.name}`}
        title="Your day, already sorted."
        sub="Every number below is current as of the last bill that came in."
        action={toggle}
      />

      <Stagger className="grid lg:grid-cols-12 gap-[var(--gap)]">
        {/* Pulse: today's takings with the last fortnight beside it */}
        <Rise className="lg:col-span-8">
          <section className="card card-ink h-full !p-7 md:!p-9 overflow-hidden">
            <div className="grid md:grid-cols-[1fr_1.15fr] gap-8 items-end h-full">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span className="live-dot !text-white" /> Service is live
                </div>
                <div className="mt-8 text-sm muted font-semibold">Taken today</div>
                <div className="display text-[clamp(56px,7vw,96px)] leading-none font-extrabold tracking-[-0.05em] mt-1">
                  <Counter value={todays} format={(n) => usd(Math.round(n))} />
                </div>
                <div className="flex flex-wrap gap-2 mt-6">
                  {[
                    { Icon: Receipt, t: `${b.sales.filter((x) => x.date === today).length} bills` },
                    { Icon: TrendingUp, t: `${Math.round(m.margin * 100)}% margin` },
                    { Icon: Flame, t: top[0].name },
                  ].map(({ Icon, t }) => (
                    <span key={t} className="tag !py-1.5 !px-3 !text-[13px]">
                      <Icon size={14} /> {t}
                    </span>
                  ))}
                </div>
              </div>
              <PulseBars data={data} />
            </div>
          </section>
        </Rise>

        {/* The one thing to fix */}
        <Rise className="lg:col-span-4">
          <section className="card lift h-full flex flex-col">
            <div className="flex justify-between items-start">
              <span className="eyebrow">Money left on the table</span>
              <span className="w-9 h-9 rounded-full tag-warn inline-flex items-center justify-center">
                <AlertTriangle size={16} />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <Counter
                value={leak}
                format={(n) => usd(Math.round(n))}
                className="display text-6xl font-extrabold tracking-[-0.05em] negative"
              />
              <span className="muted text-sm font-semibold">a week</span>
            </div>
            <p className="mt-3 muted">
              {b.eventDay
                ? "Event-day demand could outpace your stock."
                : "Your busiest item sells out before the rush ends."}
            </p>
            <Link href="/insights" data-magnetic className="btn w-full group mt-auto">
              Find the fix {arrow}
            </Link>
          </section>
        </Rise>

        <div className="lg:col-span-12 gridstats">
          <Rise>
            <Flash block value={b.cash}>
              <Stat label="Cash on hand" value={b.cash} format={(n) => usd(Math.round(n))} tone={b.cash < 0 ? "negative" : ""} />
            </Flash>
          </Rise>
          <Rise>
            <Stat
              label="Bills to pay"
              value={m.payables}
              format={(n) => usd(Math.round(n))}
              hint={<Link href="/books" className="underline underline-offset-2">Review bills</Link>}
            />
          </Rise>
          <Rise>
            <Flash block value={m.low}>
              <Stat
                label="Running low"
                value={m.low}
                format={(n) => `${Math.round(n)} items`}
                tone={m.low ? "text-amber" : ""}
                hint={<Link href="/inventory" className="underline underline-offset-2">Open pantry</Link>}
              />
            </Flash>
          </Rise>
        </div>

        {/* Live sales arriving from the point of sale */}
        <Rise className="lg:col-span-12">
          <LiveSalesPanel b={b} live={live} />
        </Rise>

        {/* Munshi's read of the day */}
        <Rise className="lg:col-span-5">
          <section className="card h-full flex flex-col">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="w-9 h-9 rounded-full"
                style={{ background: "var(--brand)" }}
              />
              <span className="eyebrow">Munshi’s morning brief</span>
            </div>
            <p className="display text-[22px] md:text-[26px] leading-[1.25] font-bold tracking-[-0.03em] mt-5 min-h-[6.2em]">
              <Typewriter text={brief} />
            </p>
            <Link href="/assistant" className={link + " mt-auto pt-4"}>
              Ask a follow-up {arrow}
            </Link>
          </section>
        </Rise>

        <Rise className="lg:col-span-7">
          <section className="card h-full overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="eyebrow">Latest bills, hot off the printer</span>
              <Link href="/sales" className={link}>
                All sales {arrow}
              </Link>
            </div>
            <ReceiptTape feed={feed} />
          </section>
        </Rise>

      </Stagger>
    </>
  );
}
