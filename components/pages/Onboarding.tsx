import { useState } from "react";
import type { Business } from "@/lib/core";
import { Title, Card, usd } from "@/components/layout/ui";

export function Onboarding({
  b,
  act,
  done,
}: {
  b: Business;
  act: any;
  done: () => void;
}) {
  const [step, setStep] = useState(0),
    [type, setType] = useState(b.type),
    [name, setName] = useState(b.name),
    [method, setMethod] = useState("Demo data");
  const steps = [
    "Business type",
    "Details",
    "Products",
    "History",
    "Data readiness",
    "Morning brief",
  ];
  return (
    <div className="max-w-3xl mx-auto">
      <Title
        kicker="Getting started"
        title="Set up your business"
        sub="A few details help Munshi make better suggestions."
      />
      <div className="h-2 bg-line rounded mb-3">
        <div
          className="h-2 bg-green rounded"
          style={{ width: `${((step + 1) / 6) * 100}%` }}
        />
      </div>
      <div className="text-sm muted mb-6">
        Step {step + 1} of 6 · {steps[step]}
      </div>
      <Card>
        {step === 0 ? (
          <>
            <h2>What kind of business do you run?</h2>
            <div className="grid grid-cols-2 gap-3 mt-5">
              {[
                "Restaurant / café",
                "Retail shop",
                "Salon / service",
                "Food truck",
                "Convenience store",
                "Nonprofit thrift / food bank",
                "Other",
              ].map((x) => (
                <button
                  key={x}
                  className={type === x ? "btn" : "btn2"}
                  onClick={() => setType(x)}
                >
                  {x}
                </button>
              ))}
            </div>
          </>
        ) : step === 1 ? (
          <>
            <h2>Business details</h2>
            <div className="grid gap-3 mt-5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Business name"
              />
              <input placeholder="Address" />
              <input type="number" placeholder="Opening hours per day" />
              <select>
                <option>USD · US Dollar</option>
              </select>
              <input placeholder="Typical busy seasons" />
              <label className="flex gap-2">
                <input type="checkbox" /> Home-game or event days
              </label>
            </div>
          </>
        ) : step === 2 ? (
          <>
            <h2>Products or menu</h2>
            <p className="muted mt-2">
              {b.items.length} items are ready in the demo catalog.
            </p>
            <div className="mt-4 flex gap-2">
              <button className="btn2">Add item manually</button>
              <label className="btn2 cursor-pointer">
                Upload CSV
                <input className="hidden" type="file" accept=".csv" />
              </label>
              <button className="btn2">Snap menu photo</button>
            </div>
            <div className="mt-5 text-sm">
              {b.items.slice(0, 5).map((i) => (
                <div
                  key={i.id}
                  className="flex justify-between border-b border-line py-2"
                >
                  {i.name}
                  <span>{usd(i.price)}</span>
                </div>
              ))}
            </div>
          </>
        ) : step === 3 ? (
          <>
            <h2>Bring your history</h2>
            <div className="grid gap-3 mt-5">
              {[
                "Upload POS export (Square / Toast / Clover CSV)",
                "Upload supplier invoices",
                "Connect POS · coming soon",
                "Demo data",
              ].map((x) => (
                <button
                  key={x}
                  className={method === x ? "btn" : "btn2"}
                  onClick={() => setMethod(x)}
                >
                  {x}
                </button>
              ))}
            </div>
          </>
        ) : step === 4 ? (
          <>
            <h2>Data sufficiency</h2>
            <div className="text-4xl positive font-bold mt-4">90 days</div>
            <p className="mt-2">Ready for personalized advice.</p>
            <p className="muted text-sm mt-2">
              Under 14 days, Munshi uses patterns from similar businesses until
              it learns yours.
            </p>
          </>
        ) : (
          <>
            <h2>Your first Morning Brief</h2>
            <p className="mt-4">
              Sales are steady, and your top products have healthy margins.
              Event days may need extra stock. Start by reviewing the top
              recommendation in Insights.
            </p>
          </>
        )}
        <div className="flex justify-between mt-8">
          <button
            className="btn2"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
          <button
            className="btn"
            onClick={() => {
              if (step === 1) act("business", { name });
              if (step < 5) setStep(step + 1);
              else done();
            }}
          >
            {step === 5 ? "Open dashboard" : "Continue"}
          </button>
        </div>
      </Card>
    </div>
  );
}
