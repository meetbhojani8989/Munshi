"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HandCoins, Plus, Trash2, Users, Check } from "lucide-react";
import type { Business, Staff } from "@/lib/core";
import { sampleStaff } from "@/lib/core";
import { Title, Stagger, Rise, Counter, usd, ease } from "@/components/layout/ui";

const cents = (n: number) => usd(Math.round(n * 100) / 100);

// Payroll: who is on the team, their hours for this period, and one button
// that pays everyone and posts it to the books. Gross pay only.
export function Payroll({ b, act }: { b: Business; act: any }) {
  const saved = b.staff || [];
  const [rows, setRows] = useState<Staff[]>(saved),
    [busy, setBusy] = useState(false),
    [draft, setDraft] = useState({ name: "", role: "", rate: "", hours: "" });
  // Follow the server copy whenever it changes (another business, a save).
  useEffect(() => setRows(b.staff || []), [b.staff, b.id]);

  const total = rows.reduce((s, x) => s + x.rate * x.hours, 0);
  const hours = rows.reduce((s, x) => s + x.hours, 0);
  const runs = b.payruns || [];
  const short = total > b.cash;
  const dirty = JSON.stringify(rows) !== JSON.stringify(saved);

  const save = (next: Staff[]) => {
    setRows(next);
    return act("staff", { staff: next });
  };
  const edit = (id: string, patch: Partial<Staff>) =>
    setRows(rows.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const add = () => {
    if (!draft.name.trim()) return;
    save([
      ...rows,
      {
        id: crypto.randomUUID(),
        name: draft.name.trim(),
        role: draft.role.trim() || "Team member",
        rate: Math.max(0, Number(draft.rate) || 0),
        hours: Math.max(0, Number(draft.hours) || 0),
      },
    ]);
    setDraft({ name: "", role: "", rate: "", hours: "" });
  };
  async function run() {
    setBusy(true);
    if (dirty) await act("staff", { staff: rows });
    await act(
      "payroll",
      {},
      `Payroll posted for ${rows.filter((x) => x.hours > 0).length} staff. Wages recorded and cash reduced by ${cents(total)}.`,
    );
    setBusy(false);
  }

  return (
    <>
      <Title
        kicker="Payroll"
        title="Pay your team"
        sub="Set this period’s hours, then pay everyone at once. The books update with the pay run."
      />

      {!rows.length ? (
        <div className="card text-center !py-14">
          <span className="w-16 h-16 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] inline-flex items-center justify-center">
            <Users size={26} />
          </span>
          <h2 className="!text-2xl mt-4">No team members yet</h2>
          <p className="muted mt-1">Start with a sample team, then edit it and add your own people.</p>
          <button className="btn mt-5" onClick={() => save(sampleStaff())}>
            <Plus size={16} /> Add a sample team
          </button>
        </div>
      ) : (
        <Stagger className="grid lg:grid-cols-12 gap-[var(--gap)] items-start">
          <Rise className="lg:col-span-8">
            <section className="card">
              <div className="flex items-center justify-between gap-3">
                <h2>Team and hours</h2>
                {dirty && (
                  <button className="btn2 !min-h-0 !h-9" onClick={() => save(rows)}>
                    <Check size={14} /> Save changes
                  </button>
                )}
              </div>
              <div className="tablewrap mt-3">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th className="w-28">Hourly rate</th>
                      <th className="w-24">Hours</th>
                      <th className="text-right">Gross pay</th>
                      <th className="w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {rows.map((x) => (
                        <motion.tr
                          key={x.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -24 }}
                          transition={{ duration: 0.25, ease }}
                        >
                          <td>
                            <span className="flex items-center gap-3 font-bold">
                              <span className="w-9 h-9 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] text-xs inline-flex items-center justify-center shrink-0">
                                {x.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                              </span>
                              {x.name}
                            </span>
                          </td>
                          <td className="muted">{x.role}</td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              inputMode="decimal"
                              aria-label={`Hourly rate for ${x.name}`}
                              className="w-24 h-10 num"
                              value={x.rate}
                              onChange={(e) => edit(x.id, { rate: Math.max(0, Number(e.target.value)) })}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              inputMode="decimal"
                              aria-label={`Hours for ${x.name}`}
                              className="w-20 h-10 num"
                              value={x.hours}
                              onChange={(e) => edit(x.id, { hours: Math.max(0, Number(e.target.value)) })}
                            />
                          </td>
                          <td className="text-right num font-bold">{cents(x.rate * x.hours)}</td>
                          <td>
                            <button
                              aria-label={`Remove ${x.name}`}
                              className="w-10 h-10 rounded-full inline-flex items-center justify-center muted hover:text-[var(--neg)] hover:bg-[var(--neg-soft)] transition-colors"
                              onClick={() => save(rows.filter((r) => r.id !== x.id))}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              <form
                className="grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_.7fr_.6fr_auto] gap-2 mt-4 pt-4 border-t border-line"
                onSubmit={(e) => {
                  e.preventDefault();
                  add();
                }}
              >
                <input aria-label="New team member name" placeholder="Name" className="h-11" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                <input aria-label="Role" placeholder="Role" className="h-11" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
                <input aria-label="Hourly rate" placeholder="Rate" type="number" min={0} step={0.5} className="h-11" value={draft.rate} onChange={(e) => setDraft({ ...draft, rate: e.target.value })} />
                <input aria-label="Hours this period" placeholder="Hours" type="number" min={0} className="h-11" value={draft.hours} onChange={(e) => setDraft({ ...draft, hours: e.target.value })} />
                <button className="btn2 !h-11 col-span-2 sm:col-span-1" disabled={!draft.name.trim()}>
                  <Plus size={15} /> Add
                </button>
              </form>
            </section>
          </Rise>

          <Rise className="lg:col-span-4 lg:sticky lg:top-24">
            <section className="card card-ink">
              <div className="eyebrow">This pay run</div>
              <div className="display text-[clamp(44px,5vw,60px)] leading-none font-extrabold tracking-[-0.05em] mt-2">
                <Counter value={total} format={(n) => cents(n)} />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                <div>
                  <div className="muted">Team</div>
                  <div className="font-bold num">{rows.filter((x) => x.hours > 0).length} paid</div>
                </div>
                <div>
                  <div className="muted">Hours</div>
                  <div className="font-bold num">{hours}</div>
                </div>
                <div>
                  <div className="muted">Cash now</div>
                  <div className="font-bold num">{cents(b.cash)}</div>
                </div>
                <div>
                  <div className="muted">Cash after</div>
                  <div className="font-bold num">{cents(b.cash - total)}</div>
                </div>
              </div>
              <button className="btn-accent w-full !h-[52px] mt-6" data-magnetic disabled={busy || short || total <= 0} onClick={run}>
                <HandCoins size={17} /> {busy ? "Paying…" : "Run payroll"}
              </button>
              <p className="text-xs muted mt-3" role={short ? "alert" : undefined}>
                {short
                  ? "There is not enough cash to cover this pay run."
                  : "Gross pay only. Taxes and deductions are not calculated."}
              </p>
            </section>
          </Rise>
        </Stagger>
      )}

      {/* Past pay runs, each printed as a slip */}
      {runs.length > 0 && (
        <section className="mt-10">
          <h2 className="!text-2xl">
            Past <span className="serif">pay runs</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-5">
            {runs.slice(0, 6).map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: -24, rotate: -4 }}
                animate={{ opacity: 1, y: 0, rotate: i % 2 ? 0.8 : -0.8 }}
                transition={{ type: "spring", stiffness: 220, damping: 18, delay: i * 0.06 }}
                className="bg-white text-[#16161a] mono text-[12px] pt-5 pb-6 px-5 shadow-[var(--shadow-lg)] [mask:radial-gradient(7px_at_7px_100%,#0000_98%,#000)_-7px_0/14px_100%_repeat-x]"
              >
                <div className="flex justify-between text-[10px] text-[#6b6b72]">
                  <span>PAY RUN</span>
                  <span>{r.date}</span>
                </div>
                <div className="border-t border-dashed border-[#c9c9cf] my-3" />
                {r.lines.map((l) => (
                  <div key={l.name} className="flex justify-between gap-3 py-1">
                    <span className="truncate font-sans text-[13px] font-semibold">{l.name}</span>
                    <span className="text-[#6b6b72] shrink-0">{l.hours}h</span>
                    <span className="num font-semibold w-20 text-right shrink-0">{cents(l.pay)}</span>
                  </div>
                ))}
                <div className="border-t border-dashed border-[#c9c9cf] my-3" />
                <div className="flex justify-between font-bold text-[13px]">
                  <span>TOTAL</span>
                  <span className="num">{cents(r.total)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
