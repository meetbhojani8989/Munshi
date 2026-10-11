"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type { Business } from "@/lib/core";
import { metrics } from "@/lib/core";
import { nav } from "@/components/layout/nav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { MobileBar } from "@/components/layout/MobileBar";
import { CascadeToast } from "@/components/layout/CascadeToast";
import { VoiceButton, VoiceModal } from "@/components/layout/Voice";
import { Login } from "@/components/pages/Login";
import { Dashboard } from "@/components/pages/Dashboard";
import { useLiveSales } from "@/components/pages/LiveSales";
import { Sales } from "@/components/pages/Sales";
import { Scan } from "@/components/pages/Scan";
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
import { SettingsPage } from "@/components/pages/Settings";
import { Onboarding } from "@/components/pages/Onboarding";

export default function App({
  page,
  itemId,
}: {
  page: string;
  itemId?: string;
}) {
  const router = useRouter();
  const [all, setAll] = useState<Business[]>([]),
    [bid, setBid] = useState("cafe"),
    [ready, setReady] = useState(false),
    [demo, setDemo] = useState(false),
    [dark, setDark] = useState(false),
    [sidebar, setSidebar] = useState(false),
    [voice, setVoice] = useState(false),
    [voiceText, setVoiceText] = useState(""),
    [cascade, setCascade] = useState("");
  const b = all.find((x) => x.id === bid) || all[0];
  useEffect(() => {
    setDemo(localStorage.getItem("munshi_demo") === "1");
    setDark(localStorage.getItem("munshi_theme") === "dark");
    setBid(localStorage.getItem("munshi_business") || "cafe");
    page === "login"
      ? setReady(true)
      : fetch("/api/data")
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data)) setAll(data);
            else throw new Error(data.error || "Unable to load business data");
          })
          .catch((error) => {
            console.error(error);
            router.replace("/login");
          })
          .finally(() => setReady(true));
  }, []);
  // Keep the numbers live: sales can arrive from the point of sale while a page is open.
  const edits = useRef(0); // bumped by act(), so a refresh that started before an edit never overwrites it
  async function refresh() {
    const started = edits.current;
    try {
      const r = await fetch("/api/data");
      const data = r.ok ? await r.json() : null;
      if (Array.isArray(data) && edits.current === started) setAll(data);
    } catch {}
  }
  useEffect(() => {
    if (page === "login") return;
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 5000);
    return () => clearInterval(timer);
  }, [page]);
  const live = useLiveSales(page === "login" ? undefined : b, refresh);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("munshi_theme", dark ? "dark" : "light");
  }, [dark]);
  // Resolves to true when the server accepted the action.
  async function act(action: string, payload: unknown = {}, message = "") {
    if (!b) return false;
    edits.current++;
    const r = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: b.id, action, payload }),
    });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error);
      return false;
    }
    edits.current++;
    setAll(j.businesses);
    if (message) {
      setCascade(message);
      setTimeout(() => setCascade(""), 4500);
    }
    return true;
  }
  async function login(provider = "credentials") {
    const selected =
      process.env.NEXT_PUBLIC_OAUTH_ENABLED === "true"
        ? provider
        : "credentials";
    const result = await signIn(selected, { redirect: false, demo: "yes" });
    if (result?.error) {
      alert("Sign-in failed. Please try again.");
      return;
    }
    localStorage.setItem("munshi_demo", "1");
    setDemo(true);
    router.push("/dashboard");
  }
  if (page === "login") return <Login login={login} />;
  if (!ready || !b)
    return (
      <div className="min-h-screen flex items-center justify-center muted">
        Loading Munshi…
      </div>
    );
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
  const chartColors = ["#1e805f", "#d0a44a", "#7195a4", "#c87868", "#8e7db7"];
  const leak = 240 + (b.eventDay ? 125 : 0);
  const pageTitle = nav.find((n) => n[0] === page)?.[1] || "Item";
  return (
    <div className="min-h-screen">
      <Sidebar page={page} />
      <div className="md:ml-60">
        <TopBar
          title={pageTitle}
          b={b}
          all={all}
          dark={dark}
          onMenu={() => setSidebar(!sidebar)}
          onBusiness={(id) => {
            setBid(id);
            localStorage.setItem("munshi_business", id);
          }}
          onToggleTheme={() => setDark(!dark)}
        />
        {sidebar && <MobileDrawer onClose={() => setSidebar(false)} />}
        <main className="main p-8 md:p-10 max-w-7xl mx-auto">
          {page === "dashboard" && (
            <Dashboard b={b} m={m} leak={leak} act={act} live={live} />
          )}
          {page === "sales" && <Sales b={b} act={act} />}
          {page === "scan" && <Scan b={b} act={act} />}
          {page === "inventory" && <Inventory b={b} m={m} event={b.eventDay} />}
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
          {page === "settings" && (
            <SettingsPage b={b} act={act} dark={dark} setDark={setDark} />
          )}
          {page === "onboarding" && (
            <Onboarding
              b={b}
              act={act}
              done={() => router.push("/dashboard")}
            />
          )}
        </main>
      </div>
      <MobileBar page={page} />
      <VoiceButton onClick={() => setVoice(true)} />
      <CascadeToast message={cascade} />
      {voice && (
        <VoiceModal
          text={voiceText}
          setText={setVoiceText}
          onClose={() => setVoice(false)}
          onSubmit={() => {
            setVoice(false);
            router.push("/assistant?voice=" + encodeURIComponent(voiceText));
          }}
        />
      )}
    </div>
  );
}
