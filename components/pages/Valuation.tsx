import type { Business } from "@/lib/core";
import { metrics } from "@/lib/core";
import { Title, Card, usd } from "@/components/layout/ui";

export function Valuation({
  b,
  m,
}: {
  b: Business;
  m: ReturnType<typeof metrics>;
}) {
  const annual = (m.profit * 365) / 90,
    low = annual * 1.5,
    high = annual * 2.5;
  return (
    <>
      <Title
        kicker="See the bigger picture"
        title="Business valuation"
        sub="A simple estimate from trailing gross profit and operational health."
      />
      <Card className="max-w-3xl bg-[#154635] !text-white border-0">
        <div className="text-sm text-[#bdd9ca]">Estimated range</div>
        <div className="text-4xl md:text-5xl font-bold mt-3">
          {usd(low)} – {usd(high)}
        </div>
        <p className="text-sm text-[#bdd9ca] mt-4">
          Method: annualized trailing 90-day gross profit × 1.5–2.5. This is an
          estimate, not professional advice.
        </p>
      </Card>
      <div className="gridstats max-w-3xl mt-5">
        {[
          ["Profitability", Math.round(m.margin * 100)],
          ["Growth", 72],
          ["Inventory efficiency", Math.max(40, 85 - m.low * 3)],
          ["Cash health", 78],
        ].map(([x, v]) => (
          <Card key={x}>
            <div className="text-sm muted">{x}</div>
            <b className="text-2xl positive mt-2 block">{v}/100</b>
          </Card>
        ))}
      </div>
    </>
  );
}
