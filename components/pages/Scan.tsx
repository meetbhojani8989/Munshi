import { useState } from "react";
import { Camera } from "lucide-react";
import type { Business } from "@/lib/core";
import { Title, Card, usd } from "@/components/layout/ui";

export function Scan({ b, act }: { b: Business; act: any }) {
  const [file, setFile] = useState(""),
    [vendor, setVendor] = useState("Keystone Produce"),
    [date, setDate] = useState(new Date().toISOString().slice(0, 10)),
    [rows, setRows] = useState([
      { id: b.items[0].id, qty: 12, cost: b.items[0].cost },
    ]),
    [step, setStep] = useState(0);
  return (
    <>
      <Title
        kicker="The cascade"
        title="Scan a supplier invoice"
        sub="Capture, review, then confirm. One bill updates stock, payables, and books."
      />
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <h2>Invoice image</h2>
          <label className="mt-4 border-2 border-dashed border-line rounded-2xl h-64 flex flex-col justify-center items-center cursor-pointer bg-paper">
            <Camera className="positive" size={36} />
            <span className="mt-3 font-semibold">
              Take a photo or upload a file
            </span>
            <span className="text-xs muted">Images and PDFs supported</span>
            <input
              className="hidden"
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f.name);
                  setStep(1);
                }
              }}
            />
          </label>
          <button
            className="btn2 mt-4"
            onClick={() => {
              setFile("sample-invoice.jpg");
              setStep(1);
            }}
          >
            Use sample invoice
          </button>
          {file && (
            <p className="text-sm positive mt-3">{file} ready for review</p>
          )}
        </Card>
        <Card>
          <h2>Review parsed fields</h2>
          <p className="text-sm muted mt-1 mb-4">
            Mock OCR found these details. Edit any field before posting.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Vendor
              <input
                className="w-full mt-1"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
              />
            </label>
            <label className="text-sm">
              Date
              <input
                className="w-full mt-1"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
          </div>
          {rows.map((r, n) => (
            <div className="grid grid-cols-3 gap-2 mt-4" key={n}>
              <select
                value={r.id}
                onChange={(e) =>
                  setRows(
                    rows.map((x, j) =>
                      j === n ? { ...x, id: e.target.value } : x,
                    ),
                  )
                }
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
                value={r.qty}
                onChange={(e) =>
                  setRows(
                    rows.map((x, j) =>
                      j === n ? { ...x, qty: Number(e.target.value) } : x,
                    ),
                  )
                }
              />
              <input
                type="number"
                min="0"
                step=".01"
                aria-label="Unit cost"
                value={r.cost}
                onChange={(e) =>
                  setRows(
                    rows.map((x, j) =>
                      j === n ? { ...x, cost: Number(e.target.value) } : x,
                    ),
                  )
                }
              />
            </div>
          ))}
          <button
            className="positive mt-3 text-sm"
            onClick={() =>
              setRows([
                ...rows,
                { id: b.items[1].id, qty: 5, cost: b.items[1].cost },
              ])
            }
          >
            + Add line
          </button>
          <div className="flex justify-between border-t border-line mt-5 pt-4">
            <b>Total</b>
            <b>{usd(rows.reduce((s, x) => s + x.qty * x.cost, 0))}</b>
          </div>
          <button
            className="btn w-full mt-4"
            onClick={async () => {
              await act(
                "invoice",
                { vendor, items: rows },
                `Invoice posted from ${vendor}. Inventory and payables increased by ${usd(rows.reduce((s, x) => s + x.qty * x.cost, 0))}.`,
              );
              setStep(2);
            }}
          >
            Confirm invoice
          </button>
        </Card>
      </div>
      {step === 2 && (
        <Card className="mt-5">
          <h2 className="positive">Cascade complete ✓</h2>
          <div className="gridstats mt-4">
            {[
              "Inventory increased",
              "Accounts payable increased",
              "Journal entry posted",
              "Item costs recalculated",
            ].map((x) => (
              <div className="bg-paper rounded-xl p-4 text-sm" key={x}>
                {x}
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
