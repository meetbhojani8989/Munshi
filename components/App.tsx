"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { metrics } from "@/lib/core";
import { findLeak } from "@/lib/ai/leak";
import { useMunshi } from "@/components/MunshiProvider";
import { useChartColors } from "@/components/layout/ui";
import { Login } from "@/components/pages/Login";
import { Dashboard } from "@/components/pages/Dashboard";
import { Sales } from "@/components/pages/Sales";
import { Inventory } from "@/components/pages/Inventory";
import { Books } from "@/components/pages/Books";
import { Analytics } from "@/components/pages/Analytics";
import { ItemPage } from "@/components/pages/Item";
import { Insights } from "@/components/pages/Insights";
import { Lab } from "@/components/pages/Lab";
import { Scorecard } from "@/components/pages/Scorecard";
import { Orders } from "@/components/pages/Orders";
import { Vendors } from "@/components/pages/Vendors";
import { Assistant } from "@/components/pages/Assistant";
import { Valuation } from "@/components/pages/Valuation";
import { Payroll } from "@/components/pages/Payroll";
import { SettingsPage } from "@/components/pages/Settings";
import { Onboarding } from "@/components/pages/Onboarding";

// Page content only. Shell (sidebar, top bar, overlays) and data live in the
// root layout via MunshiProvider, so they persist across navigation.
export default function App({
  page,
  itemId,
}: {
  page: string;
  itemId?: string;
}) {
  const router = useRouter();
  const { b, ready, act, live, login, dark, setDark } = useMunshi();
  const chartColors = useChartColors().series;
  if (page === "login") return <Login login={login} />;
  if (!ready || !b) return <Loading />;
  const m = metrics(b);
  const dSales = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(Date.now() - (13 - i) * 86400000)
      .toISOString()
      .slice(0, 10);
    return {
      name: date.slice(5),
      sales: Math.round(
        b.sales.filter((s) => s.date === date).reduce((a, s) => a + s.total, 0),
      ),
      profit: Math.round(
        b.sales
          .filter((s) => s.date === date)
          .reduce(
            (a, s) =>
              a + s.total - s.items.reduce((v, z) => v + z.cost * z.qty, 0),
            0,
          ),
      ),
    };
  });
  // Weekly revenue lost to an item that stops selling before close, computed from the sales history.
  const leak = findLeak(b)?.perWeek ?? 0;
  return (
    <>
      {page === "dashboard" && (
        <Dashboard b={b} m={m} leak={leak} act={act} data={dSales} live={live} />
      )}
      {page === "sales" && <Sales b={b} act={act} />}
      {page === "scan" && <Inventory b={b} m={m} event={b.eventDay} act={act} />}
      {page === "inventory" && <Inventory b={b} m={m} event={b.eventDay} act={act} />}
      {page === "books" && <Books b={b} act={act} />}
      {page === "analytics" && (
        <Analytics b={b} data={dSales} colors={chartColors} />
      )}
      {page === "item" && (
        <ItemPage
          b={b}
          item={b.items.find((x) => x.id === itemId) || b.items[0]}
          act={act}
        />
      )}
      {page === "insights" && <Insights b={b} act={act} leak={leak} />}
      {page === "lab" && <Lab b={b} act={act} />}
      {page === "scorecard" && <Scorecard b={b} />}
      {page === "orders" && <Orders b={b} act={act} />}
      {page === "vendors" && <Vendors b={b} act={act} />}
      {page === "assistant" && <Assistant b={b} act={act} />}
      {page === "valuation" && <Valuation b={b} m={m} />}
      {page === "payroll" && <Payroll b={b} act={act} />}
      {page === "settings" && (
        <SettingsPage b={b} act={act} dark={dark} setDark={setDark} />
      )}
      {page === "onboarding" && (
        <Onboarding b={b} act={act} done={() => router.push("/dashboard")} />
      )}
    </>
  );
}

// Skeleton that mirrors the page grid while data loads.
function Loading() {
  return (
    <div aria-busy aria-label="Loading Munshi">
      <div className="h-3 w-28 rounded bg-surface-2 mb-5" />
      <div className="h-12 w-[min(520px,90%)] rounded-lg bg-surface-2 mb-10" />
      <div className="gridstats">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-32 rounded-[var(--r)] bg-surface-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
      </div>
    </div>
  );
}
