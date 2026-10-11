import { useState } from "react";
import type { Business } from "@/lib/core";
import { balances, metrics } from "@/lib/core";
import { Title, Card, usd } from "@/components/layout/ui";

export function Books({ b, act }: { b: Business; act: any }) {
  const [tab, setTab] = useState("Journal"),
    [period, setPeriod] = useState("Month");
  const bal = balances(b),
    m = metrics(b),
    balanced = b.entries.every(
      (e) =>
        Math.abs(e.lines.reduce((s, l) => s + l.debit - l.credit, 0)) < 0.001,
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
  return (
    <>
      <Title
        kicker="Always in balance"
        title="Your books"
        sub="Munshi keeps your books daily. Your accountant reviews at year-end."
      />
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          "Journal",
          "Profit & Loss",
          "Balance Sheet",
          "Accounts Payable",
          "Accounts Receivable",
        ].map((x) => (
          <button
            key={x}
            className={x === tab ? "btn" : "btn2"}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </div>
      <div className="flex justify-between mb-5">
        <span className="tag">
          {balanced ? "✓ Books balanced" : "Books need review"}
        </span>
        <div className="flex gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {["Week", "Month", "Quarter", "Custom"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <button className="btn2" onClick={csv}>
            Export CSV
          </button>
          <button className="btn2" onClick={() => window.print()}>
            Export PDF
          </button>
        </div>
      </div>
      <Card>
        {tab === "Journal" ? (
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Memo</th>
                  <th>Account</th>
                  <th>Debit</th>
                  <th>Credit</th>
                </tr>
              </thead>
              <tbody>
                {b.entries.slice(0, 50).flatMap((e) =>
                  e.lines.map((l, n) => (
                    <tr key={e.id + n}>
                      <td>{e.date}</td>
                      <td>{n === 0 ? e.memo : ""}</td>
                      <td>{l.account}</td>
                      <td>{l.debit ? usd(l.debit) : ""}</td>
                      <td>{l.credit ? usd(l.credit) : ""}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        ) : tab === "Profit & Loss" ? (
          <>
            <h2>Profit & Loss</h2>
            {[
              ["Sales revenue", m.revenue],
              ["Cost of goods sold", -m.cogs],
              ["Gross profit", m.profit],
              ["Gross margin", Math.round(m.margin * 100)],
            ].map(([x, v], n) => (
              <div
                className="flex justify-between py-4 border-b border-line"
                key={x}
              >
                <span>{x}</span>
                <b className={n === 1 ? "negative" : "positive"}>
                  {n === 3 ? `${v}%` : usd(Number(v))}
                </b>
              </div>
            ))}
          </>
        ) : tab === "Balance Sheet" ? (
          <>
            <h2>Balance Sheet</h2>
            {[
              ["Cash", b.cash],
              ["Card Clearing", bal["Card Clearing"] || 0],
              ["Inventory", bal.Inventory || 0],
              ["Accounts Payable", -(bal["Accounts Payable"] || 0)],
              ["Owner Equity", -(bal["Owner Equity"] || 0)],
              ["Retained earnings", m.profit],
            ].map(([x, v]) => (
              <div
                className="flex justify-between py-4 border-b border-line"
                key={x}
              >
                <span>{x}</span>
                <b>{usd(Number(v))}</b>
              </div>
            ))}
          </>
        ) : tab === "Accounts Payable" ? (
          <>
            <h2>Supplier bills</h2>
            <div className="tablewrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {b.invoices.map((i) => (
                    <tr key={i.id}>
                      <td>{i.vendor}</td>
                      <td>{i.date}</td>
                      <td>{usd(i.total)}</td>
                      <td>{i.paid ? "Paid" : "Due"}</td>
                      <td>
                        {!i.paid && (
                          <button
                            className="positive"
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
          <>
            <h2>Accounts Receivable</h2>
            <p className="muted mt-3">
              No unpaid customer invoices. Your next sale will appear here if
              you offer invoiced terms.
            </p>
          </>
        )}
      </Card>
    </>
  );
}
