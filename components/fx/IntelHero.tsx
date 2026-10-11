"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Sparkles, ScanSearch, BrainCircuit, Lightbulb } from "lucide-react";
import { useMunshi } from "@/components/MunshiProvider";
import { metrics } from "@/lib/core";
import { ThinkingOrb, type OrbShape } from "@/components/fx/ThinkingOrb";
import { BorderBeam } from "@/components/fx";

const answerShape: Record<string, OrbShape> = {
  analytics: "bars",
  insights: "dollar",
  lab: "curve",
  scorecard: "target",
  assistant: "brain",
};

// Banner shown on every Intelligence page: the orb assembles, "thinks" as a
// brain, then bursts into the shape of this page's answer.
export function IntelHero({ page }: { page: string }) {
  const { b } = useMunshi();
  const [run, setRun] = useState(0);
  const [step, setStep] = useState(0);
  const final = answerShape[page] || "sphere";

  const sequence = useMemo(
    () =>
      final === "brain"
        ? [
            { shape: "sphere" as OrbShape, hold: 1500 },
            { shape: "brain" as OrbShape, hold: 1e9 },
          ]
        : [
            { shape: "sphere" as OrbShape, hold: 1500 },
            { shape: "brain" as OrbShape, hold: 2300 },
            { shape: "scatter" as OrbShape, hold: 420 },
            { shape: final, hold: 1e9 },
          ],
    [final],
  );

  if (!b) return null;
  const m = metrics(b);
  const bills = b.sales.length + b.invoices.length;
  const leak = 240 + (b.eventDay ? 125 : 0);
  const answers: Record<string, string> = {
    analytics: `Sales patterns mapped across ${b.sales.length.toLocaleString()} bills.`,
    insights: `$${leak} a week found on the table.`,
    lab: "Price sweet spot located on the profit curve.",
    scorecard: `${b.outcomes.length} predictions graded against reality.`,
    assistant: "Listening. Ask anything about your kitchen’s money.",
  };
  const stages = [
    { icon: ScanSearch, label: "Reading", text: `Reading ${bills.toLocaleString()} bills and invoices…` },
    { icon: BrainCircuit, label: "Thinking", text: `Weighing ${b.items.length} dishes at ${Math.round(m.margin * 100)}% margin…` },
    { icon: Lightbulb, label: "Answer", text: answers[page] || "Done." },
  ];
  const stage = final === "brain" ? (step === 0 ? 0 : 2) : Math.min(step, 2);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      className="card card-ink relative !p-0 overflow-hidden mb-8"
      aria-label="Munshi Intelligence"
    >
      <BorderBeam duration={10} size={260} />
      <div className="grid md:grid-cols-[1fr_minmax(280px,440px)] items-center">
        <div className="p-7 md:p-9 relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#fdba74]">
            <Sparkles size={14} /> Munshi Intelligence
          </div>
          <div className="mt-5 min-h-[88px]" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.p
                key={stage + "-" + run}
                className="display text-2xl md:text-[32px] leading-tight font-semibold"
                initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                transition={{ duration: 0.45 }}
              >
                {stages[stage].text}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-2 mt-6">
            {stages.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <span
                  className={
                    "h-8 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-medium transition-colors duration-500 " +
                    (i <= stage ? "bg-[#fb923c] text-[#1c0a00]" : "bg-white/10 text-white/60")
                  }
                >
                  <s.icon size={13} /> {s.label}
                </span>
                {i < 2 && (
                  <span className="relative w-6 h-px bg-white/20 overflow-hidden">
                    <motion.span
                      className="absolute inset-0 bg-[#fb923c] origin-left"
                      animate={{ scaleX: i < stage ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  </span>
                )}
              </div>
            ))}
            <button
              className="ml-2 h-8 w-8 rounded-full inline-flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Think again"
              onClick={() => {
                setStep(0);
                setRun((r) => r + 1);
              }}
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
        <div className="relative h-[260px] md:h-[300px] cursor-crosshair" title="Move your pointer through the cloud">
          <ThinkingOrb sequence={sequence} run={run} dark onStep={setStep} />
        </div>
      </div>
    </motion.section>
  );
}
