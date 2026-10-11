"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Printer, Scale, Check } from "lucide-react";
import type { Business } from "@/lib/core";
import { balances, metrics } from "@/lib/core";
import { Title, Segmented, Counter, usd, ease } from "@/components/layout/ui";

const tabs = [
  "Journal",
  "Profit & Loss",
  "Balance Sheet",
  "Accounts Payable",
  "Accounts Receivable",
];

export function Books({ b, act }: { b: Business; act: any }) {
  const [tab, setTab] = useState("Journal"),
    [period, setPeriod] = useState("Month");
  const bal = balances(b),
    m = metrics(b);
  // Everything below is computed from the journal. Accounts outside the balance sheet are P&L accounts.
  const sheetAccounts = ["Cash", "Card Clearing", "Inventory", "Accounts Payable", "Owner Equity"];
  const opex = Object.entries(bal)
    .filter(([a]) => !sheetAccounts.includes(a) && a !== "Sales Revenue" && a !== "Cost of Goods Sold")
    .reduce((s, [, v]) => s + v, 0);
  const netIncome = m.profit - opex;
  const assets = (bal.Cash || 0) + (bal["Card Clearing"] || 0) + (bal.Inventory || 0);
  const liabilities = -(bal["Accounts Payable"] || 0);
  const equity = -(bal["Owner Equity"] || 0) + netIncome;
  // The badge needs every entry balanced AND Assets = Liabilities + Equity.
  const balanced =
    b.entries.every(
      (e) =>
        Math.abs(e.lines.reduce((s, l) => s + l.debit - l.credit, 0)) < 0.001,
    ) && Math.abs(assets - liabilities - equity) < 0.01;
  const shown = b.entries.slice(0, 50);
  const debits = shown.reduce(
    (s, e) => s + e.lines.reduce((a, l) => a + l.debit, 0),
    0,
  );
  const credits = shown.reduce(
    (s, e) => s + e.lines.reduce((a, l) => a + l.credit, 0),
    0,
  );

  function csv() {
    const rows =
      tab === "Journal"
        ? [
            "Date,Memo,Account,Debit,Credit",
            ...b.entries.flatMap((e) =>
              e.lines.map(
                (l) =>
                  `${e.date},"${e.memo}",${l.account},${l.debit},${l.credit}`,
              ),
            ),
          ]
        : [
            "Account,Balance",
            ...Object.entries(bal).map(([k, v]) => `${k},${v}`),
          ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([rows.join("\n")], { type: "text/csv" }),
    );
    a.download = `munshi-${tab.toLowerCase()}.csv`;
    a.click();
  }

  const pl = [
    ["Sales revenue", m.revenue],
    ["Cost of goods sold", -m.cogs],
    ["Gross profit", m.profit],
    ["Operating expenses", -opex],
    ["Net income", netIncome],
  ] as const;
  const plMax = Math.max(m.revenue, 1);

  return (
    <>
      <Title
        kicker="Always in balance"
        title="Your books"
        sub="Munshi keeps your books daily. Your accountant reviews at year-end."
      />

      {/* Balance banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.15 }}
        className="card mb-4 !py-5 flex flex-wrap items-center gap-x-8 gap-y-4"
      >
        <div className="flex items-center gap-3">
          <motion.span
            className={
              "w-10 h-10 rounded-full inline-flex items-center justify-center " +
              (balanced ? "bg-accent text-[var(--on-accent)]" : "tag-warn")
            }
            initial={{ rotate: -20, scale: 0.6 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 14,
              delay: 0.5,
            }}
          >
            {balanced ? (
              <Check size={18} strokeWidth={3} />
            ) : (
              <Scale size={18} />
            )}
          </motion.span>
          <div>
            <div className="font-medium">
              {balanced ? "Books balanced" : "Books need review"}
            </div>
            <div className="text-xs muted">
              Every entry checked: debits equal credits
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 mono text-sm">
          <div>
            <div className="eyebrow !text-[10px]">Debits</div>
            <Counter value={debits} format={(n) => usd(Math.round(n))} />
          </div>
          <span className="text-xl muted">=</span>
          <div>
            <div className="eyebrow !text-[10px]">Credits</div>
            <Counter value={credits} format={(n) => usd(Math.round(n))} />
          </div>
        </div>
        <div className="flex gap-2 ml-auto">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Period"
            className="!rounded-full"
          >
            {["Week", "Month", "Quarter", "Custom"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <button className="btn2" onClick={csv}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn2" onClick={() => window.print()}>
            <Printer size={14} /> Export PDF
          </button>
        </div>
      </motion.div>

      <div className="mb-4 overflow-x-auto">
        <Segmented
          id="books-tab"
          options={tabs}
          value={tab}
          onChange={setTab}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease }}
          className="card"
        >
          {tab === "Journal" ? (
            <div className="tablewrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Memo</th>
                    <th>Account</th>
                    <th className="text-right">Debit</th>
                    <th className="text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.flatMap((e, ei) =>
                    e.lines.map((l, n) => (
                      <motion.tr
                        key={e.id + n}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(ei, 10) * 0.04 }}
                        className={
                          n === e.lines.length - 1
                            ? "[&>td]:border-b-[var(--line-strong)]"
                            : "[&>td]:border-b-transparent"
                        }
                      >
                        <td className="mono text-xs muted">
                          {n === 0 ? e.date : ""}
                        </td>
                        <td className="font-medium">{n === 0 ? e.memo : ""}</td>
                        <td className={l.credit ? "pl-8" : ""}>{l.account}</td>
                        <td className="num text-right">
                          {l.debit ? usd(l.debit) : ""}
                        </td>
                        <td className="num text-right">
                          {l.credit ? usd(l.credit) : ""}
                        </td>
                      </motion.tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          ) : tab === "Profit & Loss" ? (
            <>
              <h2>Profit & Loss</h2>
              <div className="mt-6 space-y-5">
                {pl.map(([x, v], n) => (
                  <div key={x}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{x}</span>
                      <Counter
                        value={Math.abs(v)}
                        format={(k) => (v < 0 ? "−" : "") + usd(Math.round(k))}
                        className={
                          v < 0 ? "negative" : n === 2 || n === 4 ? "positive" : ""
                        }
                      />
                    </div>
                    <div className="h-8 rounded-lg bg-surface-2 overflow-hidden">
                      <motion.div
                        className={
                          "h-full rounded-lg origin-left " +
                          (n === 0
                            ? "bg-[var(--brand)]"
                            : v < 0
                              ? "bg-[var(--neg)]"
                              : "bg-accent")
                        }
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: Math.abs(v) / plMax }}
                        transition={{
                          duration: 0.9,
                          delay: 0.15 + n * 0.15,
                          ease,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-baseline border-t border-line mt-8 pt-5">
                <span className="eyebrow">Gross margin</span>
                <Counter
                  value={Math.round(m.margin * 100)}
                  format={(n) => `${Math.round(n)}%`}
                  className="text-4xl font-medium"
                />
              </div>
            </>
          ) : tab === "Balance Sheet" ? (
            <>
              <h2>Balance Sheet</h2>
              <div className="mt-4">
                {[
                  ["Cash", bal.Cash || 0],
                  ["Card Clearing", bal["Card Clearing"] || 0],
                  ["Inventory", bal.Inventory || 0],
                  ["Accounts Payable", -(bal["Accounts Payable"] || 0)],
                  ["Owner Equity", -(bal["Owner Equity"] || 0)],
                  ["Retained earnings", netIncome],
                ].map(([x, v], i) => (
                  <motion.div
                    className="flex justify-between py-4 border-b border-line"
                    key={x}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <span>{x}</span>
                    <Counter
                      value={Number(v)}
                      format={(n) => usd(Math.round(n * 100) / 100)}
                    />
                  </motion.div>
                ))}
              </div>
            </>
          ) : tab === "Accounts Payable" ? (
            <>
              <div className="flex justify-between items-center">
                <h2>Supplier bills</h2>
              </div>
              <div className="tablewrap mt-3">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Date</th>
                      <th className="text-right">Amount</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.invoices.map((i) => (
                      <tr key={i.id}>
                        <td>{i.vendor}</td>
                        <td className="mono text-xs muted">{i.date}</td>
                        <td className="num text-right">{usd(i.total)}</td>
                        <td>
                          <span
                            className={
                              "tag " + (i.paid ? "tag-pos" : "tag-warn")
                            }
                          >
                            {i.paid ? "Paid" : "Due"}
                          </span>
                        </td>
                        <td className="text-right">
                          {!i.paid && (
                            <button
                              className="btn !h-8 !min-h-0 text-xs"
                              onClick={() =>
                                act(
                                  "pay",
                                  { id: i.id },
                                  `Paid ${i.vendor}. Cash and payables both decreased by ${usd(i.total)}.`,
                                )
                              }
                            >
                              Pay now
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-10 text-center">
              <h2>Accounts Receivable</h2>
              <p className="muted mt-3 max-w-md mx-auto">
                No unpaid customer invoices. Your next sale will appear here if
                you offer invoiced terms.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
