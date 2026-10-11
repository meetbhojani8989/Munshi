import { motion } from "framer-motion";
import { Card } from "@/components/layout/ui";

export function Login({ login }: { login: (provider?: string) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-[#edf2ec]">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="flex items-center gap-3 mb-14 text-2xl font-bold">
            <span className="rounded-2xl bg-[#154635] text-white p-3">M</span>{" "}
            Munshi
          </div>
          <div className="text-xs uppercase tracking-[.2em] positive font-bold mb-4">
            Your business, clearly
          </div>
          <h1 className="text-5xl md:text-6xl leading-tight">
            Every bill updates everything.
          </h1>
          <p className="text-xl muted mt-5 mb-8">
            Sales, stock, books, and useful advice in one quiet place.
          </p>
          <div className="flex flex-col gap-3 max-w-sm">
            <button className="btn2" onClick={() => login("apple")}>
              Continue with Apple
            </button>
            <button className="btn2" onClick={() => login("google")}>
              Continue with Google
            </button>
            <button className="btn" onClick={() => login()}>
              Try demo account →
            </button>
          </div>
          <p className="text-xs muted mt-5">
            Demo opens a café and retail shop with 90 days of activity.
          </p>
        </div>
        <Card className="min-h-96 flex flex-col justify-center">
          <div className="text-xs uppercase tracking-widest muted mb-8">
            One invoice, everything in sync
          </div>
          {[
            "Supplier invoice captured",
            "Inventory updated +24 units",
            "Accounts payable updated +$182",
            "Your books balanced ✓",
          ].map((x, i) => (
            <motion.div
              key={x}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.45 }}
              className="flex gap-4 items-center p-4 border-b border-line"
            >
              <span className="w-8 h-8 rounded-full bg-[#dff3e9] flex items-center justify-center positive">
                {i + 1}
              </span>
              {x}
            </motion.div>
          ))}
        </Card>
      </div>
    </div>
  );
}
