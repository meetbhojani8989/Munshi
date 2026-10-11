import type { Business } from "@/lib/core";
import { Title, Card, usd, money } from "@/components/layout/ui";
import { useMunshi } from "@/components/MunshiProvider";

export function Insights({
  b,
  act,
  leak,
}: {
  b: Business;
  act: any;
  leak: number;
}) {
  const { notify } = useMunshi();
  const suggestions = b.suggestions.filter((s) => !s.status);
  return (
    <>
      <Title
        kicker="The AI manager"
        title="Good decisions, in dollars"
        sub="Every recommendation has a reason, a prediction, and your approval gate."
      />
      <Card className="mb-5 !bg-[var(--warn-soft)] !border-transparent">
        <div className="text-xs uppercase tracking-widest text-amber font-bold">
          Leak Finder
        </div>
        <h2 className="mt-2">{usd(leak)} a week is slipping away</h2>
        <p className="mt-2 text-sm">
          {b.items[11].name} sells out early on busy days. Three slow items also
          tie up stock. Review the fixes below.
        </p>
      </Card>
      <div className="grid md:grid-cols-2 gap-5">
        {suggestions.length ? (
          suggestions.map((s) => (
            <Card key={s.id}>
              <div className="flex justify-between">
                <span className="tag">{s.category}</span>
                <span className="text-xs muted">
                  {s.confidence}% confidence
                </span>
              </div>
              <h2 className="mt-5">{s.action}</h2>
              <p className="muted text-sm mt-2">{s.reason}</p>
              <div className="mt-5 text-2xl font-bold positive">
                {money(s.impact)}{" "}
                <span className="text-sm muted">/ month predicted</span>
              </div>
              <div className="flex gap-2 mt-5 flex-wrap">
                <button
                  className="btn"
                  onClick={() =>
                    act(
                      "suggestion",
                      { id: s.id, status: "Approved" },
                      `${s.action} approved. Munshi will check the outcome later.`,
                    )
                  }
                >
                  Approve
                </button>
                <button
                  className="btn2"
                  onClick={() =>
                    act(
                      "suggestion",
                      { id: s.id, status: "Testing" },
                      `A controlled test for “${s.action}” is now in Pricing Lab.`,
                    )
                  }
                >
                  Test it
                </button>
                <button
                  className="btn2"
                  onClick={() =>
                    act("suggestion", { id: s.id, status: "Dismissed" })
                  }
                >
                  Dismiss
                </button>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <h2>You're all caught up</h2>
            <p className="muted mt-2">
              New recommendations will appear as fresh sales arrive.
            </p>
          </Card>
        )}
      </div>
      <Card className="mt-5">
        <h2>Ghost Menu</h2>
        <p className="muted text-sm mt-2">
          Potential addition: a seasonal soup and sandwich combo. Similar cafés
          see strong lunch demand and attractive margins.
        </p>
        <div className="positive font-bold mt-4">
          {money(145)} / month estimated
        </div>
        <button
          className="btn2 mt-4"
          onClick={() =>
            notify({
              kind: "info",
              title: "Noted for this session",
              message: "Saved idea lists are not stored yet.",
            })
          }
        >
          Save idea
        </button>
      </Card>
    </>
  );
}
