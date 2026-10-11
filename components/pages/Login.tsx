"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Apple,
  Coffee,
  Croissant,
  Pizza,
  Soup,
  Salad,
  Sandwich,
  IceCreamCone,
  CupSoda,
  ReceiptText,
  Boxes,
  BookOpen,
  TrendingUp,
  ChefHat,
} from "lucide-react";
import { Logo } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/TopBar";
import { ease } from "@/components/layout/ui";
import { BorderBeam, FloatingFood, OrbitingCircles, Steam, TicketBurst } from "@/components/fx";

const ticker = [
  ["SALE", "Iced Latte", "+$5.70"],
  ["INVOICE", "Centre Dairy", "−$182.40"],
  ["JOURNAL", "Balanced", "Dr = Cr"],
  ["SALE", "Chicken Wrap ×2", "+$8.00"],
  ["STOCK", "Blueberry Muffin", "+24 units"],
  ["PAYABLE", "Keystone Produce", "−$96.00"],
  ["SALE", "Matcha Latte", "+$12.50"],
  ["MARGIN", "Café", "80.2%"],
];
const tickets = [
  { label: "Iced Latte", amount: "+$5.70" },
  { label: "Chicken Wrap ×2", amount: "+$8.00" },
  { label: "Tomato Soup", amount: "+$7.40" },
  { label: "Almond Croissant", amount: "+$15.90" },
  { label: "Greek Salad", amount: "+$14.20" },
  { label: "Lemonade", amount: "+$9.10" },
];
const headline = ["Every", "bill", "updates", "everything."];

function GoogleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.7 3.72 14.56 2.8 12 2.8 6.95 2.8 2.87 6.88 2.87 11.93S6.95 21.06 12 21.06c6.93 0 9.53-4.87 9.53-7.4 0-.5-.05-.88-.18-1.26z"
      />
    </svg>
  );
}

function OrbitDish({ Icon }: { Icon: any }) {
  return (
    <span className="w-full h-full rounded-2xl bg-surface border border-line shadow-[var(--shadow)] text-[var(--accent)] inline-flex items-center justify-center">
      <Icon size={22} strokeWidth={1.8} />
    </span>
  );
}

// The plate: Munshi at the centre, dishes orbiting, the books orbiting
// further out, and sales tickets floating off the top.
function KitchenOrbit() {
  return (
    <div className="relative w-full aspect-square max-w-[560px] mx-auto flex items-center justify-center">
      <TicketBurst items={tickets} every={1600} className="!inset-x-[10%] !bottom-[40%] !top-0" />
      <OrbitingCircles radius={130} duration={22} delay={0} className="size-[52px]">
        <OrbitDish Icon={Coffee} />
      </OrbitingCircles>
      <OrbitingCircles radius={130} duration={22} delay={7.3} className="size-[52px]" path={false}>
        <OrbitDish Icon={Croissant} />
      </OrbitingCircles>
      <OrbitingCircles radius={130} duration={22} delay={14.6} className="size-[52px]" path={false}>
        <OrbitDish Icon={Soup} />
      </OrbitingCircles>
      <OrbitingCircles radius={225} duration={34} reverse delay={0} className="size-[58px]">
        <OrbitDish Icon={Pizza} />
      </OrbitingCircles>
      <OrbitingCircles radius={225} duration={34} reverse delay={8.5} className="size-[58px]" path={false}>
        <OrbitDish Icon={Salad} />
      </OrbitingCircles>
      <OrbitingCircles radius={225} duration={34} reverse delay={17} className="size-[58px]" path={false}>
        <OrbitDish Icon={Sandwich} />
      </OrbitingCircles>
      <OrbitingCircles radius={225} duration={34} reverse delay={25.5} className="size-[58px]" path={false}>
        <OrbitDish Icon={IceCreamCone} />
      </OrbitingCircles>
      <OrbitingCircles radius={130} duration={22} delay={3.6} className="size-[40px]" path={false}>
        <span className="w-full h-full rounded-full bg-gold text-white inline-flex items-center justify-center shadow-[var(--shadow)]">
          <CupSoda size={17} />
        </span>
      </OrbitingCircles>

      {/* the plate */}
      <motion.div
        className="absolute inset-0 m-auto w-[180px] h-[180px] rounded-full flex items-center justify-center"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 14, delay: 0.3 }}
      >
        <span className="absolute inset-0 rounded-full bg-surface border border-line shadow-[var(--shadow-lg)]" />
        <span className="absolute inset-[14px] rounded-full border border-dashed border-line-strong" />
        <motion.span
          className="absolute inset-[-14px] rounded-full border-2 border-[var(--accent)] border-t-transparent border-l-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        <span className="relative flex flex-col items-center text-[var(--accent)]">
          <Steam className="-top-7 text-[var(--accent)] opacity-70" />
          <ChefHat size={46} strokeWidth={1.6} />
          <span className="display font-bold text-[var(--ink)] mt-1">Munshi</span>
        </span>
      </motion.div>

      {/* books the plate feeds, floating at the corners */}
      {[
        { Icon: Boxes, label: "Pantry", value: "+44 units", cls: "left-0 top-[14%]" },
        { Icon: ReceiptText, label: "Payables", value: "+$182.40", cls: "right-0 top-[24%]" },
        { Icon: BookOpen, label: "Journal", value: "Dr = Cr ✓", cls: "left-[2%] bottom-[14%]" },
        { Icon: TrendingUp, label: "Margin", value: "80.2%", cls: "right-[2%] bottom-[8%]" },
      ].map((c, i) => (
        <motion.div
          key={c.label}
          className={"absolute " + c.cls}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.8 + i * 0.15, type: "spring", stiffness: 200, damping: 16 }}
        >
          <div
            className="animate-float card !p-3 !rounded-2xl flex items-center gap-3 shadow-[var(--shadow-lg)]"
            style={{ "--dur": 5 + i, "--rot": `${i % 2 ? 2 : -2}deg` } as React.CSSProperties}
          >
            <span className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)] inline-flex items-center justify-center">
              <c.Icon size={16} />
            </span>
            <div>
              <div className="text-[11px] muted">{c.label}</div>
              <div className="mono text-[13px] font-medium">{c.value}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function Login({ login }: { login: (provider?: string) => void }) {
  const [busy, setBusy] = useState("");
  const go = async (p?: string) => {
    setBusy(p || "demo");
    try {
      await login(p);
    } finally {
      setBusy("");
    }
  };
  return (
    <div className="relative min-h-screen bg-[var(--bg)] flex flex-col overflow-hidden">
      <FloatingFood dim className="opacity-60 lg:opacity-100" />
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 h-20">
        <span className="flex items-center gap-3 text-lg font-bold display tracking-tight">
          <Logo /> Munshi
        </span>
        <div className="flex items-center gap-3">
          <span className="tag desktop">
            <span className="live-dot" /> Built for restaurants & cafés
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 flex-1 grid lg:grid-cols-[1fr_1fr] gap-6 items-center px-6 md:px-12 pb-10 max-w-[1440px] w-full mx-auto">
        <div>
          <motion.div className="tag tag-accent mb-7" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ChefHat size={13} /> The back office for food businesses
          </motion.div>
          <h1 aria-label="Every bill updates everything." className="!text-[clamp(48px,7vw,104px)] !leading-[0.95] !tracking-[-0.045em] !font-extrabold">
            {headline.map((w, i) => (
              <span key={w} aria-hidden className="inline-block overflow-hidden align-bottom pb-[0.1em] -mb-[0.1em] mr-[0.22em]">
                <motion.span
                  className={"inline-block " + (w === "updates" ? "text-[var(--accent)]" : "")}
                  initial={{ y: "110%", rotate: 6 }}
                  animate={{ y: 0, rotate: 0 }}
                  transition={{ duration: 0.9, ease, delay: 0.15 + i * 0.09 }}
                >
                  {w === "updates" ? (
                    <span className="relative">
                      updates
                      <motion.svg
                        className="absolute left-0 -bottom-[0.12em] w-full h-[0.3em] text-[var(--gold)]"
                        viewBox="0 0 300 20"
                        preserveAspectRatio="none"
                        aria-hidden
                      >
                        <motion.path
                          d="M2 14 C 60 2, 120 20, 180 10 S 280 4, 298 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="5"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.9, delay: 1.1, ease }}
                        />
                      </motion.svg>
                    </span>
                  ) : (
                    w
                  )}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            className="text-lg md:text-xl muted mt-7 max-w-md leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease }}
          >
            Your till, your pantry and your books in one calm kitchen. Snap a supplier bill and the whole restaurant updates itself.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-3 mt-10 max-w-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75, ease }}
          >
            <button className="btn !h-12 !px-6 group flex-1 relative overflow-hidden" disabled={!!busy} onClick={() => go()}>
              <BorderBeam size={80} duration={4} colorFrom="#fff7ed" colorTo="#facc15" />
              {busy === "demo" ? "Opening the kitchen…" : "Try the demo café"}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button className="btn2 !h-12" disabled={!!busy} onClick={() => go("apple")} aria-label="Continue with Apple">
              <Apple size={16} /> Apple
            </button>
            <button className="btn2 !h-12" disabled={!!busy} onClick={() => go("google")} aria-label="Continue with Google">
              <GoogleMark /> Google
            </button>
          </motion.div>
          <motion.p className="text-xs muted mt-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            Demo opens a café and a retail shop with 90 days of service.
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease, delay: 0.2 }}>
          <KitchenOrbit />
        </motion.div>
      </main>

      <div className="relative z-10 border-t border-line overflow-hidden py-3 bg-[var(--bg)]" aria-hidden>
        <div className="marquee flex w-max gap-10 mono text-xs">
          {[...ticker, ...ticker].map(([k, a, v], i) => (
            <span key={i} className="flex items-center gap-3 whitespace-nowrap">
              <span className="tag tag-accent !py-0 !px-2 !text-[10px]">{k}</span>
              <span className="muted">{a}</span>
              <span>{v}</span>
              <span className="muted">/</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
