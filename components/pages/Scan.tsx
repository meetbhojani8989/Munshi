"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  FileImage,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import type { Business } from "@/lib/core";
import { Title, Stagger, Rise, usd, ease } from "@/components/layout/ui";
import { CascadeDiagram } from "@/components/layout/CascadeDiagram";

type Row = { id: string; qty: number; cost: number };

// Paper invoice with a scan beam and OCR boxes that lock onto each field.
function InvoicePaper({
  vendor,
  rows,
  names,
  scanning,
  found,
}: {
  vendor: string;
  rows: Row[];
  names: (id: string) => string;
  scanning: boolean;
  found: number;
}) {
  const Box = ({
    show,
    children,
    className = "",
  }: {
    show: boolean;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={"relative " + className}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.span
            className="absolute -inset-1 rounded-[4px] border-[1.5px] border-[var(--accent)] pointer-events-none"
            style={{
              background: "color-mix(in srgb, var(--accent) 22%, transparent)",
            }}
            initial={{ opacity: 0, scale: 1.15 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease }}
          />
        )}
      </AnimatePresence>
    </div>
  );
  return (
    <div className="relative mx-auto w-full max-w-[270px] aspect-[3/4] rounded-xl bg-white text-[#0b1411] shadow-[var(--shadow-lg)] border border-[#e8e8e6] p-6 overflow-hidden rotate-[-1.2deg]">
      <div className="flex justify-between items-start">
        <Box show={found > 0}>
          <div className="font-semibold text-[15px] tracking-tight">
            {vendor || "Vendor"}
          </div>
          <div className="text-[10px] text-[#6b6b6b] font-mono">
            142 Market St · State College
          </div>
        </Box>
        <Box show={found > 1}>
          <div className="text-right font-mono text-[10px] text-[#6b6b6b]">
            INVOICE
            <br />
            #4471
          </div>
        </Box>
      </div>
      <div className="mt-6 border-t border-dashed border-[#d4d4d2]" />
      <div className="mt-3 space-y-2">
        {rows.map((r, i) => (
          <Box key={i} show={found > 2 + i}>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="truncate pr-2">
                {r.qty} × {names(r.id)}
              </span>
              <span>{usd(r.qty * r.cost)}</span>
            </div>
          </Box>
        ))}
        {[0, 1, 2].map((i) => (
          <div
            key={"f" + i}
            className="h-2 rounded bg-[#f0f0ee]"
            style={{ width: `${70 - i * 18}%` }}
          />
        ))}
      </div>
      <div className="absolute left-6 right-6 bottom-6">
        <div className="border-t border-dashed border-[#d4d4d2] mb-3" />
        <Box show={found > 2 + rows.length}>
          <div className="flex justify-between font-mono text-sm font-semibold">
            <span>TOTAL</span>
            <span>{usd(rows.reduce((s, x) => s + x.qty * x.cost, 0))}</span>
          </div>
        </Box>
      </div>
      {scanning && (
        <motion.div
          className="absolute left-0 right-0 h-16 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent, color-mix(in oklch, var(--brand) 30%, transparent) 85%, var(--brand) 86%, transparent 88%)",
          }}
          initial={{ top: "-15%" }}
          animate={{ top: ["-15%", "100%", "-15%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

export function Scan({
  b,
  act,
  embedded = false,
}: {
  b: Business;
  act: any;
  embedded?: boolean;
}) {
  const [file, setFile] = useState(""),
    [vendor, setVendor] = useState("Keystone Produce"),
    [date, setDate] = useState(new Date().toISOString().slice(0, 10)),
    [rows, setRows] = useState<Row[]>([
      { id: b.items[0].id, qty: 12, cost: b.items[0].cost },
    ]),
    [step, setStep] = useState(0),
    [scanning, setScanning] = useState(false),
    [found, setFound] = useState(0),
    [posting, setPosting] = useState(false),
    [snapshot, setSnapshot] = useState<{ vendor: string; rows: Row[] } | null>(
      null,
    );
  const names = (id: string) =>
    b.items.find((i) => i.id === id)?.name || "Item";
  const total = rows.reduce((s, x) => s + x.qty * x.cost, 0);
  const fieldCount = 3 + rows.length;

  // Simulated OCR: lock boxes onto fields one by one, then hand over to review.
  function startScan(name: string) {
    setFile(name);
    setStep(1);
    setScanning(true);
    setFound(0);
  }
  useEffect(() => {
    if (!scanning) return;
    if (found >= fieldCount) {
      const t = setTimeout(() => setScanning(false), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setFound((f) => f + 1), found === 0 ? 700 : 380);
    return () => clearTimeout(t);
  }, [scanning, found, fieldCount]);

  async function confirm() {
    setPosting(true);
    const snap = { vendor, rows };
    await act(
      "invoice",
      { vendor, items: rows },
      `Invoice posted from ${vendor}. Inventory and payables increased by ${usd(total)}.`,
    );
    setSnapshot(snap);
    setPosting(false);
    setStep(2);
  }

  const update = (n: number, patch: Partial<Row>) =>
    setRows(rows.map((x, j) => (j === n ? { ...x, ...patch } : x)));
  const steps = ["Capture", "Review", "Cascade"];

  return (
    <>
      <Title
        compact={embedded}
        kicker="The cascade"
        title="Scan a supplier invoice"
        sub="Capture, review, then confirm. One bill updates stock, payables, and books."
        action={
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={
                    "h-8 px-3 rounded-full inline-flex items-center gap-2 text-xs border transition-colors " +
                    (step >= i
                      ? "bg-[var(--brand)] text-[var(--on-brand)] border-[var(--accent)]"
                      : "border-line muted")
                  }
                >
                  <span className="mono">{String(i + 1).padStart(2, "0")}</span>{" "}
                  {s}
                </span>
                {i < 2 && (
                  <span
                    className={
                      "w-5 h-px " +
                      (step > i
                        ? "bg-[var(--brand)]"
                        : "bg-[var(--line-strong)]")
                    }
                  />
                )}
              </div>
            ))}
          </div>
        }
      />

      <AnimatePresence mode="wait">
        {step < 2 ? (
          <motion.div
            key="capture"
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <Stagger className="grid lg:grid-cols-[1fr_1.1fr] gap-4">
              <Rise>
                <div className="card h-full">
                  <div className="flex justify-between items-center">
                    <h2>Invoice image</h2>
                    {file && (
                      <span className="tag">
                        <FileImage size={12} /> {file}
                      </span>
                    )}
                  </div>
                  {!file ? (
                    <label className="group mt-5 relative rounded-2xl h-[400px] flex flex-col justify-center items-center cursor-pointer gridlines border border-line overflow-hidden">
                      {/* corner brackets */}
                      {[
                        "top-4 left-4 border-t-2 border-l-2",
                        "top-4 right-4 border-t-2 border-r-2",
                        "bottom-4 left-4 border-b-2 border-l-2",
                        "bottom-4 right-4 border-b-2 border-r-2",
                      ].map((c) => (
                        <span
                          key={c}
                          className={
                            "absolute w-8 h-8 border-[var(--accent)] rounded-sm transition-all duration-300 group-hover:scale-90 " +
                            c
                          }
                        />
                      ))}
                      <motion.span
                        className="w-16 h-16 rounded-2xl bg-[var(--brand)] text-[var(--on-brand)] inline-flex items-center justify-center"
                        whileHover={{ scale: 1.06, rotate: -4 }}
                      >
                        <Camera size={26} />
                      </motion.span>
                      <span className="mt-5 font-medium">
                        Take a photo or upload a file
                      </span>
                      <span className="text-xs muted mt-1">
                        Images and PDFs supported
                      </span>
                      <input
                        className="hidden"
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) startScan(f.name);
                        }}
                      />
                    </label>
                  ) : (
                    <div className="mt-5 rounded-2xl h-[400px] flex items-center justify-center bg-surface-2 border border-line overflow-hidden">
                      <InvoicePaper
                        vendor={vendor}
                        rows={rows}
                        names={names}
                        scanning={scanning}
                        found={found}
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    {!file ? (
                      <button
                        className="btn"
                        onClick={() => startScan("sample-invoice.jpg")}
                      >
                        <Sparkles size={15} /> Use sample invoice
                      </button>
                    ) : (
                      <button
                        className="btn2"
                        onClick={() => {
                          setFile("");
                          setStep(0);
                          setFound(0);
                          setScanning(false);
                        }}
                      >
                        <RotateCcw size={14} /> Rescan
                      </button>
                    )}
                    <span className="text-sm muted flex items-center gap-2">
                      {scanning ? (
                        <>
                          <span className="live-dot" /> Reading fields ·{" "}
                          {Math.min(found, fieldCount)}/{fieldCount}
                        </>
                      ) : file ? (
                        <span className="positive">
                          {file} ready for review
                        </span>
                      ) : null}
                    </span>
                  </div>
                </div>
              </Rise>

              <Rise>
                <div
                  className={
                    "card h-full transition-opacity " +
                    (step === 0 ? "opacity-60" : "")
                  }
                >
                  <div className="flex justify-between items-center">
                    <h2>Review parsed fields</h2>
                    <span className="tag">Mock OCR</span>
                  </div>
                  <p className="text-sm muted mt-1 mb-5">
                    Edit any field before posting.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs muted">
                      Vendor
                      <input
                        className="w-full mt-1.5 text-[var(--ink)]"
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                      />
                    </label>
                    <label className="text-xs muted">
                      Date
                      <input
                        className="w-full mt-1.5 text-[var(--ink)]"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-[1fr_80px_100px_36px] gap-2 mt-5 eyebrow !text-[10px]">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Unit cost</span>
                    <span />
                  </div>
                  <AnimatePresence initial={false}>
                    {rows.map((r, n) => (
                      <motion.div
                        key={n}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-[1fr_80px_100px_36px] gap-2 mt-2"
                      >
                        <select
                          value={r.id}
                          onChange={(e) => update(n, { id: e.target.value })}
                          aria-label="Item"
                        >
                          {b.items.map((i) => (
                            <option value={i.id} key={i.id}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          aria-label="Quantity"
                          className="num"
                          value={r.qty}
                          onChange={(e) =>
                            update(n, { qty: Number(e.target.value) })
                          }
                        />
                        <input
                          type="number"
                          min="0"
                          step=".01"
                          aria-label="Unit cost"
                          className="num"
                          value={r.cost}
                          onChange={(e) =>
                            update(n, { cost: Number(e.target.value) })
                          }
                        />
                        <button
                          className="btn2 !px-0 !min-h-0 h-[38px]"
                          aria-label="Remove line"
                          disabled={rows.length === 1}
                          onClick={() =>
                            setRows(rows.filter((_, j) => j !== n))
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <button
                    className="btn2 !h-9 mt-3 text-sm"
                    onClick={() =>
                      setRows([
                        ...rows,
                        { id: b.items[1].id, qty: 5, cost: b.items[1].cost },
                      ])
                    }
                  >
                    <Plus size={14} /> Add line
                  </button>
                  <div className="flex justify-between items-baseline border-t border-line mt-6 pt-5">
                    <span className="eyebrow">Total</span>
                    <span className="num text-3xl font-medium">
                      {usd(total)}
                    </span>
                  </div>
                  <button
                    className="btn w-full !h-12 mt-5 group"
                    disabled={posting || step === 0 || scanning}
                    onClick={confirm}
                  >
                    {posting ? "Posting…" : "Confirm invoice"}
                    {!posting && (
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    )}
                  </button>
                </div>
              </Rise>
            </Stagger>
          </motion.div>
        ) : (
          <motion.div
            key="cascade"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="card !p-6 md:!p-10"
          >
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <span className="eyebrow">Cascade complete</span>
                <h2 className="text-3xl md:text-4xl mt-3 tracking-tight">
                  One bill. <span className="serif">Four</span> ledgers. Zero
                  typing.
                </h2>
              </div>
              <button
                className="btn2"
                onClick={() => {
                  setStep(0);
                  setFile("");
                  setFound(0);
                }}
              >
                <RotateCcw size={14} /> Scan another
              </button>
            </div>
            <div className="max-w-4xl mx-auto">
              <CascadeDiagram
                title={snapshot?.vendor || vendor}
                lines={(snapshot?.rows || rows)
                  .slice(0, 3)
                  .map((r) => [
                    `${names(r.id)} ×${r.qty}`,
                    usd(r.qty * r.cost),
                  ])}
                total={usd(
                  (snapshot?.rows || rows).reduce(
                    (s, x) => s + x.qty * x.cost,
                    0,
                  ),
                )}
                targets={[
                  {
                    label: "Inventory increased",
                    value: `+${(snapshot?.rows || rows).reduce((s, x) => s + x.qty, 0)} units`,
                  },
                  {
                    label: "Accounts payable increased",
                    value: `+${usd((snapshot?.rows || rows).reduce((s, x) => s + x.qty * x.cost, 0))}`,
                  },
                  { label: "Journal entry posted", value: "Dr = Cr ✓" },
                  {
                    label: "Item costs recalculated",
                    value: "margins updated",
                  },
                ]}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
