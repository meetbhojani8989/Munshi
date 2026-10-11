"use client";
import React from "react";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  ReferenceLine,
  Scatter,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import type { Business } from "@/lib/core";
import {
  Title,
  Stagger,
  Rise,
  ChartTooltip,
  useChartColors,
  ease,
} from "@/components/layout/ui";

function ChartCard({
  title,
  caption,
  children,
  extra,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <Rise>
      <div className="card lift h-full flex flex-col">
        <h2>{title}</h2>
        <div className="h-64 mt-5">{children}</div>
        {extra}
        <p className="text-sm mt-4 flex items-start gap-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)] px-3 py-2.5">
          <Lightbulb size={15} className="shrink-0 mt-0.5" /> {caption}
        </p>
      </div>
    </Rise>
  );
}

export function Analytics({
  b,
  data,
  colors,
}: {
  b: Business;
  data: any[];
  colors: string[];
}) {
  const c = useChartColors();
  const cat = Object.entries(
    b.items.reduce((o: Record<string, number>, i) => {
      o[i.category] = (o[i.category] || 0) + i.units * i.price;
      return o;
    }, {}),
  ).map(([name, value]) => ({ name, value: Math.round(value) }));
  const byItem = b.items.slice(0, 10).map((i) => ({
    name: i.name.split(" ")[0],
    revenue: Math.round(i.units * i.price),
    profit: Math.round(i.units * (i.price - i.cost)),
    popularity: i.units,
    margin: Math.round(((i.price - i.cost) / i.price) * 100),
  }));
  const hours = [7, 9, 11, 13, 15, 17, 19, 21];
  const heat = Array.from({ length: 7 }, (_, day) => ({
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day],
    ...Object.fromEntries(
      hours.map((h) => [
        h,
        Math.round((h === 11 || h === 13 ? 65 : 20) * (day === 6 ? 1.4 : 1)),
      ]),
    ),
  }));
  const axis = { tickLine: false, axisLine: false } as const;
  const tip = (
    <Tooltip
      content={<ChartTooltip />}
      cursor={{ fill: c.grid, stroke: c.ink2 }}
    />
  );

  return (
    <>
      <Title
        kicker="Patterns made practical"
        title="Analytics"
        sub="See where sales, margin, and demand are really moving."
      />
      <Stagger className="grid lg:grid-cols-2 gap-4">
        <ChartCard
          title="Sales over time"
          caption="Weekend and event days bring the strongest lift."
        >
          <ResponsiveContainer>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="anSales" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={c.ink} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={c.ink} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" {...axis} />
              <YAxis {...axis} width={36} />
              {tip}
              <Area
                name="Sales"
                type="monotone"
                dataKey="sales"
                stroke={c.ink}
                strokeWidth={2.5}
                fill="url(#anSales)"
                animationDuration={1300}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Revenue vs. profit by item"
          caption="High revenue does not always mean high profit."
        >
          <ResponsiveContainer>
            <BarChart data={byItem} barGap={3}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" {...axis} />
              <YAxis {...axis} width={36} />
              {tip}
              <Legend
                verticalAlign="top"
                align="right"
                iconType="square"
                height={28}
                wrapperStyle={{ fontSize: 12 }}
                formatter={(v) => (
                  <span style={{ color: "var(--ink)" }}>{v}</span>
                )}
              />
              <Bar
                name="Revenue"
                dataKey="revenue"
                fill={c.accent}
                stroke={c.ink}
                strokeWidth={1}
                strokeDasharray="3 2"
                radius={[6, 6, 0, 0]}
                animationDuration={1100}
              />
              <Bar
                name="Profit"
                dataKey="profit"
                fill={c.ink}
                radius={[6, 6, 0, 0]}
                animationDuration={1300}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Menu engineering"
          caption="Stars combine popularity with healthy margins."
          extra={
            <div className="grid grid-cols-4 gap-2 text-[11px] mt-3 text-center">
              {["Stars", "Plowhorses", "Puzzles", "Dogs"].map((q) => (
                <span key={q} className="tag justify-center">
                  {q}
                </span>
              ))}
            </div>
          }
        >
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid />
              <XAxis
                type="number"
                dataKey="popularity"
                name="Units sold"
                {...axis}
              />
              <YAxis
                type="number"
                dataKey="margin"
                name="Margin %"
                {...axis}
                width={36}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <ReferenceLine x={100} stroke={c.ink2} strokeDasharray="4 4" />
              <ReferenceLine y={65} stroke={c.ink2} strokeDasharray="4 4" />
              <Scatter data={byItem} fill={c.ink} animationDuration={1200} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Category mix"
          caption="Food anchors your revenue; drinks lift margin."
        >
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={cat}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={3}
                cornerRadius={6}
                label
                animationDuration={1200}
              >
                {cat.map((_, i) => (
                  <Cell
                    key={i}
                    fill={colors[i % colors.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Inventory value trend"
          caption="Recent purchases rebuilt stock ahead of demand."
        >
          <ResponsiveContainer>
            <AreaChart
              data={data.map((x, i) => ({
                ...x,
                value: 5800 + i * 85 + (i % 3) * 100,
              }))}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" {...axis} />
              <YAxis {...axis} width={40} />
              {tip}
              <Area
                name="Value"
                type="stepAfter"
                dataKey="value"
                stroke={c.ink}
                strokeWidth={2}
                fill={c.accent}
                fillOpacity={0.6}
                animationDuration={1300}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Margin trend"
          caption="Margin is steady; small price changes may improve it."
        >
          <ResponsiveContainer>
            <LineChart
              data={data.map((x) => ({
                ...x,
                margin: x.sales ? Math.round((x.profit / x.sales) * 100) : 0,
              }))}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" {...axis} />
              <YAxis domain={[0, 100]} {...axis} width={36} />
              {tip}
              <Line
                name="Margin %"
                type="monotone"
                dataKey="margin"
                stroke={c.warn}
                strokeWidth={2.5}
                dot={{ r: 3, fill: c.warn }}
                animationDuration={1300}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <Rise>
          <div className="card lift h-full">
            <h2>Sales by hour and weekday</h2>
            <div className="overflow-auto mt-5">
              <div className="grid grid-cols-9 gap-1.5 min-w-[480px] text-xs">
                <div />
                {hours.map((h) => (
                  <div key={h} className="text-center muted">
                    {h}:00
                  </div>
                ))}
                {heat.flatMap((row, r) => [
                  <div key={row.day} className="muted self-center">
                    {row.day}
                  </div>,
                  ...hours.map((h, i) => (
                    <motion.div
                      key={row.day + h}
                      className="h-8 rounded-md"
                      style={{
                        background: `color-mix(in srgb, var(--accent) ${Math.round(((row as any)[h] / 95) * 100)}%, var(--surface-2))`,
                      }}
                      title={`${row.day} ${h}:00`}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.2 + (r + i) * 0.03,
                        duration: 0.35,
                        ease,
                      }}
                    />
                  )),
                ])}
              </div>
            </div>
            <p className="text-sm mt-5 flex items-start gap-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)] px-3 py-2.5">
              <Lightbulb size={15} className="shrink-0 mt-0.5" /> Lunch hours
              are your busiest window.
            </p>
          </div>
        </Rise>
        <Rise>
          <div className="card lift h-full">
            <h2>Event day comparison</h2>
            <div className="flex gap-4 items-end h-56 mt-5">
              {[
                ["Normal day", 0.62, "bg-surface-3", ""],
                [
                  "Event day +35%",
                  1,
                  "bg-[var(--brand)]",
                  "text-[var(--on-brand)]",
                ],
              ].map(([label, h, bg, fg], i) => (
                <motion.div
                  key={label as string}
                  className={
                    "rounded-xl w-1/2 flex items-end p-4 text-sm font-medium origin-bottom " +
                    bg +
                    " " +
                    fg
                  }
                  style={{ height: `${(h as number) * 100}%` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.9, delay: 0.3 + i * 0.15, ease }}
                >
                  {label as string}
                </motion.div>
              ))}
            </div>
            <p className="text-sm mt-5 flex items-start gap-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)] px-3 py-2.5">
              <Lightbulb size={15} className="shrink-0 mt-0.5" /> Prepare extra
              stock before big local events.
            </p>
          </div>
        </Rise>
      </Stagger>
    </>
  );
}
