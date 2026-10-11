"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Mic, Square } from "lucide-react";
import type { Business } from "@/lib/core";
import { metrics } from "@/lib/core";
import { useMunshi } from "@/components/MunshiProvider";
import { accentHex } from "@/lib/prefs";
import { ThinkingOrb, type OrbShape } from "@/components/fx/ThinkingOrb";
import { usd, ease } from "@/components/layout/ui";

type Msg = { role: "user" | "assistant"; text: string };
const prompts = [
  "What was my best item?",
  "How is my profit?",
  "What is low on stock?",
  "Raise Chicken Wrap by $1",
];

// Ask Munshi: one orb, one bar. The orb idles as a sphere, becomes a brain
// while it thinks, then resolves into a shape that matches the answer.
export function Assistant({ b, act }: { b: Business; act: any }) {
  const { dark, prefs, notify } = useMunshi();
  const [input, setInput] = useState(""),
    [messages, setMessages] = useState<Msg[]>([]),
    [thinking, setThinking] = useState(false),
    [listening, setListening] = useState(false),
    [run, setRun] = useState(0),
    [sequence, setSequence] = useState<{ shape: OrbShape; hold: number }[]>([
      { shape: "sphere", hold: 1e9 },
    ]),
    [proposal, setProposal] = useState<{ id: string; price: number } | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const rec = useRef<any>(null);
  const chatting = messages.length > 0;

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, thinking]);

  function send(text = input) {
    const question = text.trim();
    if (!question || thinking) return;
    const q = question.toLowerCase();
    let shape: OrbShape = "sphere";
    let answer =
      "Your books and inventory are current. Try asking about your best item, profit, low stock, or a price change.";
    let next: typeof proposal = null;
    if (q.includes("best")) {
      shape = "bars";
      answer = `${b.items.slice().sort((a, z) => z.units - a.units)[0].name} led unit sales over the last 90 days.`;
    } else if (q.includes("profit")) {
      shape = "dollar";
      answer = `Gross profit is ${usd(metrics(b).profit)} at a ${Math.round(metrics(b).margin * 100)}% margin across loaded sales.`;
    } else if (q.includes("stock")) {
      shape = "target";
      answer = `${metrics(b).low} items are at or below their reorder point. Open Pantry for suggested quantities.`;
    } else if (q.includes("raise") || q.includes("price")) {
      shape = "curve";
      const i = b.items.find((i) => q.includes(i.name.toLowerCase())) || b.items[0];
      const num = Number(q.match(/\$?(\d+(?:\.\d+)?)/)?.[1] || 1);
      next = { id: i.id, price: i.price + num };
      answer = `I can raise ${i.name} from ${usd(i.price)} to ${usd(i.price + num)}. Review the action below before anything changes.`;
    }
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setThinking(true);
    setSequence([
      { shape: "brain", hold: 1300 },
      { shape: "scatter", hold: 320 },
      { shape, hold: 1e9 },
    ]);
    setRun((r) => r + 1);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", text: answer }]);
      setProposal(next);
      setThinking(false);
    }, 1700);
  }

  // A question typed into the command palette arrives here and is asked once.
  const asked = useRef("");
  const incoming = useSearchParams().get("q") || "";
  useEffect(() => {
    if (incoming && asked.current !== incoming) {
      asked.current = incoming;
      send(incoming);
    }
  }, [incoming]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleMic() {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      notify({ kind: "info", title: "Voice input isn’t available in this browser" });
      return;
    }
    const r = new SR();
    rec.current = r;
    r.lang = "en-US";
    r.interimResults = true;
    r.onresult = (e: any) =>
      setInput(Array.from(e.results).map((x: any) => x[0].transcript).join(""));
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    setListening(true);
    r.start();
  }

  return (
    <div className="mx-auto max-w-3xl flex flex-col items-center min-h-[calc(100vh-250px)]">
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 140, damping: 22 }}
        className={"relative shrink-0 cursor-crosshair " + (chatting ? "w-44 h-44" : "w-[min(74vw,44vh,420px)] h-[min(74vw,44vh,420px)] mt-[4vh]")}
        title="Move your pointer through the cloud"
      >
        <span
          aria-hidden
          className="absolute inset-[30%] rounded-full blur-2xl opacity-20"
          style={{ background: "var(--brand)" }}
        />
        <ThinkingOrb sequence={sequence} run={run} dark={dark} color={accentHex(prefs.hue)} />
      </motion.div>

      <AnimatePresence initial={false}>
        {!chatting && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.45, ease }}
          >
            <h1 className="mt-2">
              Ask <span className="serif">Munshi</span>
            </h1>
            <p className="muted mt-3 text-base">
              Anything about {b.name}. Money changes always wait for your approval.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {chatting && (
        <div className="w-full mt-4 space-y-3" aria-live="polite">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className={
                "max-w-[85%] w-fit px-5 py-3.5 text-[15px] leading-relaxed " +
                (m.role === "user"
                  ? "ml-auto rounded-[22px] rounded-br-md text-[var(--on-brand)] bg-[var(--brand)]"
                  : "card !py-3.5 !px-5 !rounded-[22px] !rounded-bl-md")
              }
            >
              {m.text}
            </motion.div>
          ))}
          {thinking && (
            <div className="card !py-3.5 !px-5 !rounded-[22px] !rounded-bl-md w-fit flex gap-1.5" aria-label="Munshi is thinking">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-[var(--brand)]"
                  animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          )}
          {proposal && (
            <motion.div
              className="card card-ink"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="eyebrow">Needs your approval</div>
              <p className="display text-xl font-bold mt-2">
                Change {b.items.find((i) => i.id === proposal.id)?.name} to {usd(proposal.price)}
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  className="btn-accent"
                  onClick={() => {
                    act("price", proposal, "Approved price change posted.");
                    setProposal(null);
                  }}
                >
                  Approve change
                </button>
                <button className="btn2" onClick={() => setProposal(null)}>
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
          <div ref={end} />
        </div>
      )}

      <div className={"w-full sticky bottom-[150px] md:bottom-24 z-20 " + (chatting ? "mt-auto pt-6" : "mt-8")}>
        <form
          className="glass border border-line rounded-full p-2 flex items-center gap-2 focus-within:border-[var(--brand)] focus-within:shadow-[var(--glow)] transition-shadow"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <button
            type="button"
            onClick={toggleMic}
            aria-label={listening ? "Stop listening" : "Speak your question"}
            className={
              "w-12 h-12 shrink-0 rounded-full inline-flex items-center justify-center transition-colors " +
              (listening ? "bg-[var(--neg)] text-white" : "bg-[var(--surface-3)] hover:bg-[var(--accent-soft)]")
            }
          >
            {listening ? <Square size={15} fill="currentColor" /> : <Mic size={18} />}
          </button>
          <input
            aria-label="Ask Munshi"
            className="flex-1 min-w-0 !bg-transparent !border-0 !shadow-none !px-2 !text-[17px] h-12"
            placeholder={listening ? "Listening…" : "Ask about sales, stock, profit or prices"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!input.trim() || thinking}
            className="btn !p-0 !min-h-0 w-12 h-12 shrink-0"
          >
            <ArrowUp size={19} strokeWidth={2.6} />
          </button>
        </form>
        {!chatting && (
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {prompts.map((p, i) => (
              <motion.button
                key={p}
                className="tag !py-2 !px-4 !text-[13px] glass border border-line hover:!text-[var(--accent-text)] hover:border-[var(--brand)] transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.07 }}
                onClick={() => send(p)}
              >
                {p}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
