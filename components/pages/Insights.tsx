import { useState } from "react";
import type { Business } from "@/lib/core";
import { Title, Card, usd, money } from "@/components/layout/ui";

export function Insights({
  b,
  act,
  leak,
}: {
  b: Business;
  act: any;
  leak: number;
}) {
  const suggestions = b.suggestions.filter((s) => !s.status);
  const [thinking, setThinking] = useState(false);
  const soup = b.items.find((i) => /soup/i.test(i.name)) ?? b.items[10];
  async function refresh() {
    setThinking(true);
    await act("insights", {}, "Munshi re-read your books and wrote fresh advice.");
    setThinking(false);
  }
  return (
    <>
      <Title
        kicker="The AI manager"
        title="Good decisions, in dollars"
        sub="Every recommendation has a reason, a prediction, and your approval gate."
        action={
          <button className="btn" disabled={thinking} onClick={refresh}>
            {thinking ? "Reading your books…" : "Get fresh advice"}
          </button>
        }
      />
      <Card className="mb-5 bg-[#fff9e8]">
        <div className="text-xs uppercase tracking-widest text-amber font-bold">
          Leak Finder
        </div>
        <h2 className="mt-2">{usd(leak)} a week is slipping away</h2>
        <p className="mt-2 text-sm">
          {soup.name} stops selling around 8 PM, but you stay open until 10 PM.
          Evening guests who want it walk out, and three slow items tie up stock
          on the shelf. Review the fixes below.
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
          onClick={() => alert("Added to your ideas list for review.")}
        >
          Save idea
        </button>
      </Card>
    </>
  );
}
