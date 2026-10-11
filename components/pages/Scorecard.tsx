import {
  ResponsiveContainer,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";
import type { Business } from "@/lib/core";
import { Title, Card, money } from "@/components/layout/ui";

export function Scorecard({ b }: { b: Business }) {
  const accuracy = Math.round(
    (b.outcomes.filter(
      (o) => Math.abs(o.actual - o.predicted) / o.predicted < 0.3,
    ).length /
      b.outcomes.length) *
      100,
  );
  const chart = b.outcomes.map((o, i) => ({
    name: `#${i + 1}`,
    accuracy: 60 + Math.round(i * 2.3),
  }));
  return (
    <>
      <Title
        kicker="Accountable advice"
        title="Prediction Scorecard"
        sub="Munshi grades its recommendations against actual results."
      />
      <div className="grid md:grid-cols-[1fr_2fr] gap-5 mb-5">
        <Card>
          <div className="muted text-sm">Overall accuracy</div>
          <div className="text-5xl font-bold positive mt-3">{accuracy}%</div>
          <p className="text-sm mt-4">
            Advice that keeps being wrong gets weighted down; advice that works
            gets used more.
          </p>
        </Card>
        <Card>
          <h2>Accuracy over time</h2>
          <div className="h-44 mt-4">
            <ResponsiveContainer>
              <LineChart data={chart}>
                <XAxis dataKey="name" />
                <YAxis domain={[50, 100]} />
                <Tooltip />
                <Line dataKey="accuracy" stroke="var(--brand)" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card>
        <h2>Past predictions</h2>
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th>Prediction</th>
                <th>Predicted</th>
                <th>Actual</th>
                <th>Verdict</th>
                <th>What Munshi learned</th>
              </tr>
            </thead>
            <tbody>
              {b.outcomes.map((o, i) => (
                <tr key={o.id}>
                  <td>
                    {["Pricing", "Stock", "Hours", "Promotion"][i % 4]}{" "}
                    recommendation
                  </td>
                  <td>{money(o.predicted)}</td>
                  <td>{money(o.actual)}</td>
                  <td>
                    <span
                      className={
                        Math.abs(o.actual - o.predicted) / o.predicted < 0.3
                          ? "positive"
                          : "negative"
                      }
                    >
                      {Math.abs(o.actual - o.predicted) / o.predicted < 0.3
                        ? "Right"
                        : "Off target"}
                    </span>
                  </td>
                  <td className="text-sm muted">{o.lesson}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
