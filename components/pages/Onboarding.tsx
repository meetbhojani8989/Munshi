"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Coffee,
  Store,
  Scissors,
  Truck,
  ShoppingBasket,
  HeartHandshake,
  Shapes,
  Check,
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  PlugZap,
  Database,
  Plus,
  Camera,
  Sun,
} from "lucide-react";
import type { Business } from "@/lib/core";
import { Title, Counter, usd, ease } from "@/components/layout/ui";

const types: [string, any][] = [
  ["Restaurant / café", Coffee],
  ["Retail shop", Store],
  ["Salon / service", Scissors],
  ["Food truck", Truck],
  ["Convenience store", ShoppingBasket],
  ["Nonprofit thrift / food bank", HeartHandshake],
  ["Other", Shapes],
];
const sources: [string, any][] = [
  ["Upload POS export (Square / Toast / Clover CSV)", Upload],
  ["Upload supplier invoices", FileText],
  ["Connect POS · coming soon", PlugZap],
  ["Demo data", Database],
];
const steps = [
  "Business type",
  "Details",
  "Products",
  "History",
  "Data readiness",
  "Morning brief",
];

function Choice({
  on,
  onClick,
  icon: Icon,
  label,
}: {
  on: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-pressed={on}
      className={
        "relative flex items-center gap-3 text-left p-4 rounded-2xl border transition-colors " +
        (on
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-line hover:border-[var(--line-strong)]")
      }
    >
      <span
        className={
          "w-10 h-10 rounded-xl inline-flex items-center justify-center shrink-0 " +
          (on ? "bg-[var(--brand)] text-[var(--on-brand)]" : "bg-surface-2")
        }
      >
        <Icon size={18} />
      </span>
      <span className="text-sm font-medium">{label}</span>
      {on && (
        <motion.span
          layoutId="onb-check"
          className="ml-auto w-5 h-5 rounded-full bg-[var(--brand)] text-[var(--on-brand)] inline-flex items-center justify-center"
        >
          <Check size={12} strokeWidth={3} />
        </motion.span>
      )}
    </motion.button>
  );
}

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
    [dir, setDir] = useState(1),
    [type, setType] = useState(b.type),
    [name, setName] = useState(b.name),
    [method, setMethod] = useState("Demo data");
  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Title
        kicker="Getting started"
        title="Set up your business"
        sub="A few details help Munshi make better suggestions."
      />
      <div className="flex gap-1.5 mb-3">
        {steps.map((s, i) => (
          <div
            key={s}
            className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden"
          >
            <motion.div
              className="h-full bg-[var(--brand)] origin-left"
              initial={false}
              animate={{ scaleX: i <= step ? 1 : 0 }}
              transition={{ duration: 0.5, ease }}
            />
          </div>
        ))}
      </div>
      <div className="text-sm muted mb-6">
        Step {step + 1} of 6 ·{" "}
        <span className="text-[var(--ink)] font-medium">{steps[step]}</span>
      </div>
      <div className="card !p-7 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.3, ease }}
            className="min-h-[300px]"
          >
            {step === 0 ? (
              <>
                <h2 className="text-xl">What kind of business do you run?</h2>
                <div className="grid sm:grid-cols-2 gap-3 mt-5">
                  {types.map(([x, Icon]) => (
                    <Choice
                      key={x}
                      on={type === x}
                      onClick={() => setType(x)}
                      icon={Icon}
                      label={x}
                    />
                  ))}
                </div>
              </>
            ) : step === 1 ? (
              <>
                <h2 className="text-xl">Business details</h2>
                <div className="grid sm:grid-cols-2 gap-3 mt-5">
                  <label className="text-xs muted sm:col-span-2">
                    Business name
                    <input
                      className="w-full mt-1.5 text-[var(--ink)]"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Business name"
                    />
                  </label>
                  <label className="text-xs muted sm:col-span-2">
                    Address
                    <input className="w-full mt-1.5" placeholder="Address" />
                  </label>
                  <label className="text-xs muted">
                    Opening hours per day
                    <input
                      className="w-full mt-1.5"
                      type="number"
                      placeholder="10"
                    />
                  </label>
                  <label className="text-xs muted">
                    Currency
                    <select className="w-full mt-1.5">
                      <option>USD · US Dollar</option>
                    </select>
                  </label>
                  <label className="text-xs muted sm:col-span-2">
                    Typical busy seasons
                    <input
                      className="w-full mt-1.5"
                      placeholder="e.g. Football weekends, December"
                    />
                  </label>
                  <label className="flex gap-2 items-center text-sm">
                    <input type="checkbox" /> Home-game or event days
                  </label>
                </div>
              </>
            ) : step === 2 ? (
              <>
                <h2 className="text-xl">Products or menu</h2>
                <p className="muted mt-2">
                  <Counter value={b.items.length} /> items are ready in the demo
                  catalog.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn2">
                    <Plus size={14} /> Add item manually
                  </button>
                  <label className="btn2 cursor-pointer">
                    <Upload size={14} /> Upload CSV
                    <input className="hidden" type="file" accept=".csv" />
                  </label>
                  <button className="btn2">
                    <Camera size={14} /> Snap menu photo
                  </button>
                </div>
                <div className="mt-5 text-sm">
                  {b.items.slice(0, 5).map((i, n) => (
                    <motion.div
                      key={i.id}
                      className="flex justify-between border-b border-line py-2.5"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + n * 0.05 }}
                    >
                      {i.name}
                      <span className="num">{usd(i.price)}</span>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : step === 3 ? (
              <>
                <h2 className="text-xl">Bring your history</h2>
                <div className="grid gap-3 mt-5">
                  {sources.map(([x, Icon]) => (
                    <Choice
                      key={x}
                      on={method === x}
                      onClick={() => setMethod(x)}
                      icon={Icon}
                      label={x}
                    />
                  ))}
                </div>
              </>
            ) : step === 4 ? (
              <div className="text-center py-6">
                <h2 className="text-xl">Data sufficiency</h2>
                <div className="relative w-44 h-44 mx-auto mt-6">
                  <svg
                    viewBox="0 0 120 120"
                    className="w-full h-full -rotate-90"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="var(--surface-3)"
                      strokeWidth="10"
                    />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.4, ease }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Counter value={90} className="text-4xl font-bold" />
                    <span className="text-xs muted">days</span>
                  </div>
                </div>
                <p className="mt-5 font-medium positive">
                  Ready for personalized advice.
                </p>
                <p className="muted text-sm mt-2 max-w-sm mx-auto">
                  Under 14 days, Munshi uses patterns from similar businesses
                  until it learns yours.
                </p>
              </div>
            ) : (
              <div className="card card-ink !p-7">
                <div className="flex items-center gap-2">
                  <Sun size={16} />
                  <span className="eyebrow">Your first Morning Brief</span>
                </div>
                <p className="mt-4 text-xl leading-relaxed">
                  Sales are steady, and your top products have healthy margins.
                  Event days may need extra stock. Start by reviewing the top
                  recommendation in Insights.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="flex justify-between mt-8 pt-6 border-t border-line">
          <button
            className="btn2"
            disabled={step === 0}
            onClick={() => go(step - 1)}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            className="btn group"
            onClick={() => {
              if (step === 1) act("business", { name });
              if (step < 5) go(step + 1);
              else done();
            }}
          >
            {step === 5 ? "Open dashboard" : "Continue"}
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
