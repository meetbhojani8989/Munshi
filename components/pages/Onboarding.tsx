"use client";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Loader2,
  Plug,
  Upload,
  X,
} from "lucide-react";
import type { Business } from "@/lib/core";
import { PROFILE_KEY } from "@/lib/prefs";
import { Logo } from "@/components/layout/Header";
import { ease } from "@/components/layout/ui";

const steps = ["Business", "Hours", "Service", "Past bills", "Connections", "Review"];
const kinds = ["Restaurant", "Café", "Bakery", "Bar", "Food truck", "Cloud kitchen", "Retail shop"];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const styles = ["Dine-in", "Takeaway", "Delivery", "Catering"];
const rushes = ["Breakfast", "Lunch", "Dinner", "Late night"];
const posList = ["Square", "Toast", "Clover", "Lightspeed", "Shopify POS", "No POS yet"];
const apps = ["DoorDash", "Uber Eats", "Own website", "Stripe payments", "QuickBooks"];

type Profile = {
  name: string;
  kind: string;
  sells: string;
  city: string;
  days: string[];
  opens: string;
  closes: string;
  lastOrder: string;
  prep: number;
  cleanAt: string;
  cleanMins: number;
  styles: string[];
  seats: number;
  spend: number;
  rush: string;
  staff: number;
  tax: number;
  bills: string[];
  history: string;
  pos: string;
  apps: string[];
};

const Label = ({ text, hint, children }: { text: string; hint?: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-sm font-bold">{text}</span>
    {hint && <span className="block text-xs muted mt-0.5">{hint}</span>}
    <div className="mt-2">{children}</div>
  </label>
);

// Pill choices: single or multi-select.
function Chips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | string[];
  onChange: (v: any) => void;
}) {
  const multi = Array.isArray(value);
  const has = (o: string) => (multi ? value.includes(o) : value === o);
  return (
    <div role={multi ? "group" : "radiogroup"} aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role={multi ? "checkbox" : "radio"}
          aria-checked={has(o)}
          onClick={() => onChange(multi ? (has(o) ? value.filter((x) => x !== o) : [...value, o]) : o)}
          className={
            "h-11 px-4 rounded-full text-sm font-semibold border transition-colors " +
            (has(o)
              ? "bg-[var(--brand)] text-[var(--on-brand)] border-transparent"
              : "bg-[var(--bg)] border-[var(--line-strong)] hover:border-[var(--brand)]")
          }
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// The answers so far, printed on a kitchen ticket that grows as you go.
function Ticket({ p, step }: { p: Profile; step: number }) {
  const rows: [string, string][] = [
    ["Business", p.name || "—"],
    ["Type", p.kind || "—"],
  ];
  if (step > 0) rows.push(["Open", `${p.days.length} days · ${p.opens}–${p.closes}`], ["Last order", p.lastOrder], ["Cleaning", `${p.cleanAt} · ${p.cleanMins} min`]);
  if (step > 1) rows.push(["Service", p.styles.join(", ") || "—"], ["Avg spend", `$${p.spend}`], ["Seats", String(p.seats)]);
  if (step > 2) rows.push(["Past bills", p.bills.length ? `${p.bills.length} files` : "Sample bills"]);
  if (step > 3) rows.push(["POS", p.pos || "—"], ["Apps", String(p.apps.length)]);
  return (
    <div className="relative mx-auto w-full max-w-[300px]" style={{ transformOrigin: "50% 0%" }}>
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 rounded-md bg-[var(--surface-3)] border border-line z-10" />
      <motion.div
        layout
        animate={{ rotate: [-1.5, 1.2, -1.5] }}
        transition={{ rotate: { duration: 7, repeat: Infinity, ease: "easeInOut" }, layout: { type: "spring", stiffness: 260, damping: 26 } }}
        style={{ transformOrigin: "50% 0%" }}
        className="bg-white text-[#16161a] mono text-[12px] pt-7 pb-6 px-5 shadow-[var(--shadow-lg)] [mask:radial-gradient(7px_at_7px_100%,#0000_98%,#000)_-7px_0/14px_100%_repeat-x]"
      >
        <div className="text-center font-bold tracking-[0.2em]">MUNSHI</div>
        <div className="text-center text-[10px] text-[#6b6b72] mt-1">SETUP TICKET · STEP {step + 1}/{steps.length}</div>
        <div className="border-t border-dashed border-[#c9c9cf] my-3" />
        <AnimatePresence initial={false}>
          {rows.map(([k, v]) => (
            <motion.div
              key={k}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between gap-4 py-1"
            >
              <span className="text-[#6b6b72] shrink-0">{k}</span>
              <span className="text-right truncate font-semibold">{v}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="border-t border-dashed border-[#c9c9cf] my-3" />
        <div className="text-center text-[10px] text-[#6b6b72]">THANK YOU · NOTHING IS CHARGED</div>
      </motion.div>
    </div>
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
    [linking, setLinking] = useState(""),
    [saving, setSaving] = useState(false);
  const [p, setP] = useState<Profile>({
    name: "",
    kind: "",
    sells: "",
    city: "",
    days: days.slice(0, 6),
    opens: "08:00",
    closes: "21:00",
    lastOrder: "20:30",
    prep: 45,
    cleanAt: "21:00",
    cleanMins: 45,
    styles: ["Dine-in", "Takeaway"],
    seats: 30,
    spend: 14,
    rush: "Lunch",
    staff: 5,
    tax: 6,
    bills: [],
    history: "3 months",
    pos: "",
    apps: [],
  });
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));
  const file = useRef<HTMLInputElement>(null);
  const last = step === steps.length - 1;
  const ok = step === 0 ? p.name.trim() && p.kind : step === 1 ? p.days.length > 0 : step === 4 ? !linking : true;

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };
  async function finish() {
    setSaving(true);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    await act("business", { name: p.name.trim() });
    done();
  }
  function connect(name: string) {
    if (name === "No POS yet") return set({ pos: name });
    setLinking(name);
    setTimeout(() => {
      set({ pos: name });
      setLinking("");
    }, 1400);
  }

  const time = (key: "opens" | "closes" | "lastOrder" | "cleanAt") => (
    <input type="time" className="w-full h-12" value={p[key]} onChange={(e) => set({ [key]: e.target.value })} />
  );
  const num = (key: "prep" | "seats" | "spend" | "staff" | "tax", min = 0) => (
    <input
      type="number"
      min={min}
      inputMode="numeric"
      className="w-full h-12"
      value={p[key]}
      onChange={(e) => set({ [key]: Math.max(min, Number(e.target.value)) })}
    />
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 md:px-10 h-20">
        <span className="flex items-center gap-3 text-xl font-extrabold tracking-tight">
          <Logo size={40} /> Munshi
        </span>
        <button className="btn2" onClick={done}>
          Skip, use the demo account <ArrowRight size={15} />
        </button>
      </header>

      <main className="flex-1 w-full max-w-[1120px] mx-auto px-5 md:px-10 pb-16 grid lg:grid-cols-[1fr_320px] gap-12 items-start">
        <div>
          {/* progress */}
          <ol className="flex gap-1.5 mb-8" aria-label="Setup progress">
            {steps.map((s, i) => (
              <li key={s} className="flex-1">
                <button
                  className="w-full text-left group"
                  disabled={i > step}
                  onClick={() => go(i)}
                  aria-current={i === step ? "step" : undefined}
                >
                  <span className="block h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                    <motion.span
                      className="block h-full bg-[var(--brand)] origin-left"
                      animate={{ scaleX: i <= step ? 1 : 0 }}
                      transition={{ duration: 0.5, ease }}
                    />
                  </span>
                  <span className={"desktop block text-xs font-bold mt-2 " + (i === step ? "text-[var(--accent-text)]" : "muted")}>
                    {s}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.35, ease }}
            >
              {step === 0 && (
                <>
                  <h1>Tell us about your <span className="serif">business</span></h1>
                  <p className="muted mt-3 mb-8">Munshi sets up your books, stock and advice around these answers.</p>
                  <div className="grid gap-6">
                    <Label text="What is it called?">
                      <input className="w-full h-12 !text-base" placeholder="e.g. Nittany Bean & Wrap" value={p.name} onChange={(e) => set({ name: e.target.value })} autoFocus />
                    </Label>
                    <Label text="What kind of business is it?">
                      <Chips label="Business type" options={kinds} value={p.kind} onChange={(v) => set({ kind: v })} />
                    </Label>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Label text="What do you mainly sell?">
                        <input className="w-full h-12" placeholder="Coffee, wraps, pastries" value={p.sells} onChange={(e) => set({ sells: e.target.value })} />
                      </Label>
                      <Label text="Where are you?">
                        <input className="w-full h-12" placeholder="City or neighbourhood" value={p.city} onChange={(e) => set({ city: e.target.value })} />
                      </Label>
                    </div>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <h1>When are you <span className="serif">open?</span></h1>
                  <p className="muted mt-3 mb-8">Used to spot slow hours, plan stock and time your daily brief.</p>
                  <div className="grid gap-6">
                    <Label text="Which days do you open?">
                      <Chips label="Open days" options={days} value={p.days} onChange={(v) => set({ days: v })} />
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <Label text="Doors open">{time("opens")}</Label>
                      <Label text="Last order">{time("lastOrder")}</Label>
                      <Label text="Doors close">{time("closes")}</Label>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <Label text="Prep before opening" hint="Minutes">{num("prep")}</Label>
                      <Label text="Cleaning starts">{time("cleanAt")}</Label>
                      <Label text="Cleaning takes" hint="Minutes">
                        <Chips label="Cleaning duration" options={["30", "45", "60", "90"]} value={String(p.cleanMins)} onChange={(v) => set({ cleanMins: Number(v) })} />
                      </Label>
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h1>How do you <span className="serif">serve?</span></h1>
                  <p className="muted mt-3 mb-8">This shapes pricing advice and how busy days are forecast.</p>
                  <div className="grid gap-6">
                    <Label text="How do customers get their order?">
                      <Chips label="Service styles" options={styles} value={p.styles} onChange={(v) => set({ styles: v })} />
                    </Label>
                    <Label text={`Average spend per customer: $${p.spend}`} hint="Roughly what one customer pays per visit">
                      <input type="range" min={3} max={120} value={p.spend} onChange={(e) => set({ spend: Number(e.target.value) })} className="w-full h-11" />
                    </Label>
                    <Label text="When is your rush?">
                      <Chips label="Busiest period" options={rushes} value={p.rush} onChange={(v) => set({ rush: v })} />
                    </Label>
                    <div className="grid grid-cols-3 gap-4">
                      <Label text="Seats">{num("seats")}</Label>
                      <Label text="Staff">{num("staff", 1)}</Label>
                      <Label text="Sales tax %">{num("tax")}</Label>
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h1>Bring your past <span className="serif">bills</span></h1>
                  <p className="muted mt-3 mb-8">Supplier invoices and sales exports give Munshi a history to learn from. You can add more later.</p>
                  <input
                    ref={file}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.csv"
                    className="sr-only"
                    aria-label="Upload past bills"
                    onChange={(e) => set({ bills: [...p.bills, ...Array.from(e.target.files || []).map((f) => f.name)] })}
                  />
                  <button
                    type="button"
                    onClick={() => file.current?.click()}
                    className="w-full rounded-[var(--r)] border-2 border-dashed border-[var(--line-strong)] hover:border-[var(--brand)] hover:bg-[var(--accent-soft)] transition-colors p-10 flex flex-col items-center gap-3"
                  >
                    <span className="w-14 h-14 rounded-full bg-[var(--brand)] text-[var(--on-brand)] inline-flex items-center justify-center">
                      <Upload size={22} />
                    </span>
                    <span className="font-bold">Choose invoices, receipts or a POS export</span>
                    <span className="text-xs muted">Photos, PDFs and CSV files</span>
                  </button>
                  {p.bills.length > 0 && (
                    <ul className="mt-4 grid gap-2">
                      {p.bills.map((name, i) => (
                        <motion.li key={name + i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card !py-3 !px-4 flex items-center gap-3 text-sm">
                          <FileText size={16} className="text-[var(--accent-text)]" />
                          <span className="truncate flex-1">{name}</span>
                          <button aria-label={"Remove " + name} className="w-9 h-9 rounded-full inline-flex items-center justify-center hover:bg-[var(--surface-3)]" onClick={() => set({ bills: p.bills.filter((_, j) => j !== i) })}>
                            <X size={15} />
                          </button>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-6">
                    <Label text="How far back should Munshi look?" hint="No files? Munshi starts with sample bills so the app is not empty.">
                      <Chips label="History length" options={["1 month", "3 months", "6 months", "1 year"]} value={p.history} onChange={(v) => set({ history: v })} />
                    </Label>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h1>Connect your <span className="serif">systems</span></h1>
                  <p className="muted mt-3 mb-8">Link your point of sale so bills arrive on their own. These are demo connections.</p>
                  <div className="grid gap-6">
                    <div>
                      <div className="text-sm font-bold mb-2">Point of sale</div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {posList.map((name) => {
                          const on = p.pos === name,
                            busy = linking === name;
                          return (
                            <button
                              key={name}
                              type="button"
                              disabled={!!linking}
                              onClick={() => connect(name)}
                              className={"card !py-3.5 !px-4 flex items-center gap-3 text-left transition-colors " + (on ? "!border-[var(--brand)] !bg-[var(--accent-soft)]" : "hover:!border-[var(--brand)]")}
                            >
                              <span className={"w-10 h-10 rounded-full inline-flex items-center justify-center " + (on ? "bg-[var(--brand)] text-[var(--on-brand)]" : "bg-[var(--surface-3)]")}>
                                {busy ? <Loader2 size={17} className="animate-spin" /> : on ? <Check size={17} strokeWidth={3} /> : <Plug size={17} />}
                              </span>
                              <span className="flex-1 font-bold text-sm">{name}</span>
                              <span className="text-xs muted">{busy ? "Connecting…" : on ? (name === "No POS yet" ? "Selected" : "Connected") : "Connect"}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <Label text="Anything else you use?">
                      <Chips label="Other apps" options={apps} value={p.apps} onChange={(v) => set({ apps: v })} />
                    </Label>
                  </div>
                </>
              )}

              {step === 5 && (
                <>
                  <h1>Ready when <span className="serif">you are</span></h1>
                  <p className="muted mt-3 mb-8">Check the ticket. You can change any of this later in Settings.</p>
                  <div className="grid sm:grid-cols-2 gap-[var(--gap)]">
                    {[
                      ["Business", `${p.name} · ${p.kind}`, 0],
                      ["Hours", `${p.days.length} days, ${p.opens}–${p.closes}`, 1],
                      ["Cleaning", `${p.cleanAt} for ${p.cleanMins} min`, 1],
                      ["Service", `${p.styles.join(", ") || "—"} · $${p.spend} avg`, 2],
                      ["Past bills", p.bills.length ? `${p.bills.length} files · ${p.history}` : `Sample bills · ${p.history}`, 3],
                      ["Connections", [p.pos || "No POS", ...p.apps].join(", "), 4],
                    ].map(([k, v, n]) => (
                      <button key={k as string} className="card lift text-left" onClick={() => go(n as number)}>
                        <div className="eyebrow">{k}</div>
                        <div className="font-bold mt-1.5">{v}</div>
                        <div className="text-xs text-[var(--accent-text)] font-bold mt-2">Edit</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-3 mt-10">
            {step > 0 && (
              <button className="btn2 !h-[52px]" onClick={() => go(step - 1)}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <button
              className="btn !h-[52px] !px-7 group"
              disabled={!ok || saving}
              onClick={() => (last ? finish() : go(step + 1))}
            >
              {last ? (saving ? "Opening your dashboard…" : "Open my dashboard") : "Continue"}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
            {step === 0 && !ok && <span className="text-xs muted">Add a name and pick a type to continue.</span>}
          </div>
        </div>

        <aside className="hidden lg:block sticky top-10 pt-6" aria-label="Your answers so far">
          <Ticket p={p} step={step} />
        </aside>
      </main>
    </div>
  );
}
