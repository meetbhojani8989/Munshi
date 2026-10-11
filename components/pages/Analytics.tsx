import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
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
import { Card, Title } from "@/components/layout/ui";

export function Analytics({
  b,
  data,
  colors,
}: {
  b: Business;
  data: any[];
  colors: string[];
}) {
  const cat = Object.entries(
    b.items.reduce((o: Record<string, number>, i) => {
      o[i.category] = (o[i.category] || 0) + i.units * i.price;
      return o;
    }, {}),
  ).map(([name, value]) => ({ name, value }));
  const byItem = b.items.slice(0, 10).map((i) => ({
    name: i.name.split(" ")[0],
    revenue: i.units * i.price,
    profit: i.units * (i.price - i.cost),
    popularity: i.units,
    margin: ((i.price - i.cost) / i.price) * 100,
  }));
  const heat = Array.from({ length: 7 }, (_, day) => ({
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day],
    ...Object.fromEntries(
      [7, 9, 11, 13, 15, 17, 19, 21].map((h) => [
        h,
        Math.round((h === 11 || h === 13 ? 65 : 20) * (day === 6 ? 1.4 : 1)),
      ]),
    ),
  }));
  const ChartCard = ({
    title,
    caption,
    children,
  }: {
    title: string;
    caption: string;
    children: React.ReactNode;
  }) => (
    <Card>
      <h2>{title}</h2>
      <div className="h-64 mt-5">{children}</div>
      <p className="text-sm muted mt-3">✦ {caption}</p>
    </Card>
  );
  return (
    <>
      <Title
        kicker="Patterns made practical"
        title="Analytics"
        sub="See where sales, margin, and demand are really moving."
      />
      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard
          title="Sales over time"
          caption="Weekend and event days bring the strongest lift."
        >
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                dataKey="sales"
                stroke="#16845e"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Revenue vs. profit by item"
          caption="High revenue does not always mean high profit."
        >
          <ResponsiveContainer>
            <BarChart data={byItem}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#91c4ad" />
              <Bar dataKey="profit" fill="#16845e" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Menu Engineering"
          caption="Stars combine popularity with healthy margins."
        >
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid />
              <XAxis type="number" dataKey="popularity" name="Units sold" />
              <YAxis type="number" dataKey="margin" name="Margin %" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <ReferenceLine x={100} stroke="#999" />
              <ReferenceLine y={65} stroke="#999" />
              <Scatter data={byItem} fill="#16845e" />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="text-xs muted">
            Stars · Plowhorses · Puzzles · Dogs
          </div>
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
                outerRadius={90}
                label
              >
                {cat.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
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
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area dataKey="value" stroke="#16845e" fill="#c8e7d5" />
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
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line dataKey="margin" stroke="#d1a345" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card>
          <h2>Sales by hour and weekday</h2>
          <div className="overflow-auto mt-5">
            <div className="grid grid-cols-9 gap-1 min-w-[480px] text-xs">
              <div />
              {[7, 9, 11, 13, 15, 17, 19, 21].map((h) => (
                <div key={h} className="text-center muted">
                  {h}:00
                </div>
              ))}
              {heat.flatMap((row) => [
                <div key={row.day} className="muted">
                  {row.day}
                </div>,
                ...[7, 9, 11, 13, 15, 17, 19, 21].map((h) => (
                  <div
                    key={row.day + h}
                    className="h-7 rounded"
                    style={{
                      background: `rgba(22,132,94,${(row as any)[h] / 120})`,
                    }}
                    title={`${row.day} ${h}:00`}
                  />
                )),
              ])}
            </div>
          </div>
          <p className="text-sm muted mt-5">
            ✦ Lunch hours are your busiest window.
          </p>
        </Card>
        <Card>
          <h2>Event day comparison</h2>
          <div className="flex gap-3 items-end h-52 mt-5">
            <div className="bg-[#a8cdb8] rounded-t w-1/2 h-28 flex items-end p-3 text-sm">
              Normal day
            </div>
            <div className="bg-[#16845e] text-white rounded-t w-1/2 h-44 flex items-end p-3 text-sm">
              Event day +35%
            </div>
          </div>
          <p className="text-sm muted mt-4">
            ✦ Prepare extra stock before big local events.
          </p>
        </Card>
      </div>
    </>
  );
}
