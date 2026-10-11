import { useState } from "react";
import type { Business } from "@/lib/core";
import { metrics } from "@/lib/core";
import { usd, Title, Card } from "@/components/layout/ui";

export function Assistant({ b, act }: { b: Business; act: any }) {
  const [input, setInput] = useState(""),
    [messages, setMessages] = useState<{ role: string; text: string }[]>([
      {
        role: "assistant",
        text: `Hi! I can help explain ${b.name}'s sales, stock, and profit. Ask me anything.`,
      },
    ]),
    [proposal, setProposal] = useState<{ id: string; price: number } | null>(
      null,
    );
  function send() {
    if (!input.trim()) return;
    const q = input.toLowerCase();
    let answer =
      "Your books and inventory are current. Try asking about your best item, profit, low stock, or a price change.";
    if (q.includes("best"))
      answer = `${b.items.slice().sort((a, z) => z.units - a.units)[0].name} led unit sales over the last 90 days.`;
    else if (q.includes("profit"))
      answer = `Gross profit is ${usd(metrics(b).profit)} at a ${Math.round(metrics(b).margin * 100)}% margin across loaded sales.`;
    else if (q.includes("stock"))
      answer = `${metrics(b).low} items are at or below their reorder point. Open Inventory for suggested quantities.`;
    else if (q.includes("raise") || q.includes("price")) {
      const i =
        b.items.find((i) => q.includes(i.name.toLowerCase())) || b.items[0];
      const num = Number(q.match(/\$?(\d+(?:\.\d+)?)/)?.[1] || 1);
      setProposal({ id: i.id, price: i.price + num });
      answer = `I can raise ${i.name} from ${usd(i.price)} to ${usd(i.price + num)}. Review the action below before anything changes.`;
    }
    setMessages([
      ...messages,
      { role: "user", text: input },
      { role: "assistant", text: answer },
    ]);
    setInput("");
  }
  return (
    <>
      <Title
        kicker="Ask in plain language"
        title="Your business assistant"
        sub="Ask a question or propose an action. Money changes always wait for approval."
      />
      <Card className="max-w-3xl">
        <div className="h-80 overflow-y-auto space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                "max-w-[85%] rounded-2xl p-4 text-sm " +
                (m.role === "user"
                  ? "ml-auto bg-[#dceee4] text-[#163f2d]"
                  : "bg-paper")
              }
            >
              {m.text}
            </div>
          ))}
        </div>
        {proposal && (
          <div className="border border-green rounded-xl p-4 mt-3">
            <b>Action needs approval</b>
            <p className="text-sm mt-2">
              Change {b.items.find((i) => i.id === proposal.id)?.name} to{" "}
              {usd(proposal.price)}.
            </p>
            <button
              className="btn mt-3"
              onClick={() => {
                act("price", proposal, "Approved price change posted.");
                setProposal(null);
              }}
            >
              Approve change
            </button>
            <button className="btn2 ml-2" onClick={() => setProposal(null)}>
              Dismiss
            </button>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <input
            className="flex-1 min-w-0"
            placeholder="What was my best item?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button className="btn" onClick={send}>
            Send
          </button>
        </div>
      </Card>
    </>
  );
}
