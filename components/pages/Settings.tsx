import { useState } from "react";
import type { Business } from "@/lib/core";
import { Title, Card } from "@/components/layout/ui";

export function SettingsPage({
  b,
  act,
  dark,
  setDark,
}: {
  b: Business;
  act: any;
  dark: boolean;
  setDark: (x: boolean) => void;
}) {
  const [name, setName] = useState(b.name);
  return (
    <>
      <Title
        kicker="Make it yours"
        title="Settings"
        sub="Manage the business, team, connections, and your data."
      />
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <h2>Business profile</h2>
          <label className="block text-sm mt-4">
            Business name
            <input
              className="w-full mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            className="btn mt-4"
            onClick={() => act("business", { name })}
          >
            Save changes
          </button>
          <div className="flex justify-between mt-5 pt-4 border-t border-line">
            Dark theme{" "}
            <button className="btn2" onClick={() => setDark(!dark)}>
              {dark ? "On" : "Off"}
            </button>
          </div>
        </Card>
        <Card>
          <h2>Team members</h2>
          <div className="flex justify-between py-4">
            <span>Demo Owner</span>
            <span className="tag">Owner</span>
          </div>
          <div className="flex justify-between py-4 border-t border-line">
            <span>Manager role</span>
            <span className="muted">Available on team plan</span>
          </div>
          <div className="flex justify-between py-4 border-t border-line">
            <span>Staff role</span>
            <span className="muted">Available on team plan</span>
          </div>
        </Card>
        <Card>
          <h2>Integrations</h2>
          {[
            ["POS", "Mock connected"],
            ["OCR", "Mock active"],
            ["AI", "Deterministic mock"],
            ["Payments", "Mock active"],
          ].map(([x, v]) => (
            <div
              className="flex justify-between py-3 border-b border-line text-sm"
              key={x}
            >
              {x}
              <span className="positive">{v}</span>
            </div>
          ))}
        </Card>
        <Card>
          <h2>Plan & data</h2>
          <p className="text-sm mt-3">Demo plan · Free</p>
          <button
            className="btn2 mt-4"
            onClick={() => {
              const a = document.createElement("a");
              a.href = URL.createObjectURL(
                new Blob([JSON.stringify(b, null, 2)], {
                  type: "application/json",
                }),
              );
              a.download = "munshi-export.json";
              a.click();
            }}
          >
            Export business data
          </button>
          <button
            className="block text-sm negative mt-7"
            onClick={() => {
              if (confirm("Reset all demo data?")) act("reset");
            }}
          >
            Reset demo account
          </button>
        </Card>
      </div>
    </>
  );
}
