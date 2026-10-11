"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Users,
  Plug,
  Database,
  Download,
  RotateCcw,
  Palette,
  LogOut,
  Check,
  Lock,
  Server,
  ArrowRight,
  CircleAlert,
  X,
  Receipt,
} from "lucide-react";
import type { Business } from "@/lib/core";
import { useMunshi } from "@/components/MunshiProvider";
import { PRESETS, DEFAULT_PREFS, type Prefs } from "@/lib/prefs";
import { Title, Segmented, Counter, usd, ease } from "@/components/layout/ui";

// AWS endpoint (API Gateway → Lambda) that creates a hosted subscription checkout.
// Contract: POST JSON { businessId, plan, interval, amount (cents), currency,
// successUrl, cancelUrl }  →  200 { url }. The browser is redirected to url.
const PAYMENT_API = process.env.NEXT_PUBLIC_PAYMENT_API_URL || "";

const plans = [
  {
    id: "starter",
    name: "Starter",
    monthly: 0,
    blurb: "For trying Munshi with one location.",
    features: [
      "1 business",
      "POS sync",
      "Invoice scanning · 50/mo",
      "Daily books",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 29,
    blurb: "Everything a busy café or shop needs.",
    features: [
      "3 businesses",
      "Unlimited scanning",
      "AI insights & Pricing Lab",
      "Accountant export",
    ],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    monthly: 79,
    blurb: "Multi-site teams and accountants.",
    features: [
      "Unlimited businesses",
      "Team roles",
      "Priority support",
      "Custom integrations",
    ],
  },
];
const tabs = ["Personalize", "Business", "Team", "Integrations", "Billing", "Data", "Account"];
const flow = [
  "Create secure session",
  "Hand off to AWS checkout",
  "Activate plan",
];

function Switch({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={
        "relative w-12 h-7 rounded-full transition-colors shrink-0 " +
        (on ? "bg-[var(--brand)]" : "bg-[var(--surface-3)]")
      }
    >
      <motion.span
        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow"
        animate={{ left: on ? 24 : 4 }}
        transition={{ type: "spring", stiffness: 600, damping: 32 }}
      />
    </button>
  );
}

const Head = ({
  icon: Icon,
  title,
  sub,
}: {
  icon: any;
  title: string;
  sub?: string;
}) => (
  <div className="flex items-center gap-3">
    <span className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)] inline-flex items-center justify-center">
      <Icon size={17} />
    </span>
    <div>
      <h2>{title}</h2>
      {sub && <p className="text-xs muted mt-0.5">{sub}</p>}
    </div>
  </div>
);

function Billing({ b }: { b: Business }) {
  const router = useRouter();
  const params = useSearchParams();
  const [yearly, setYearly] = useState(false),
    [current, setCurrent] = useState("starter"),
    [chosen, setChosen] = useState("pro"),
    [stage, setStage] = useState(-1),
    [error, setError] = useState(""),
    [result, setResult] = useState<"success" | "cancel" | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    try {
      setCurrent(localStorage.getItem("munshi_plan") || "starter");
    } catch {}
  }, []);
  // Returning from AWS checkout.
  useEffect(() => {
    const status = params.get("billing");
    if (handled.current || (status !== "success" && status !== "cancel"))
      return;
    handled.current = true;
    setResult(status);
    const plan = params.get("plan");
    if (status === "success" && plan) activate(plan);
    router.replace("/settings?tab=Billing");
  }, [params, router]);

  function activate(id: string) {
    setCurrent(id);
    try {
      localStorage.setItem("munshi_plan", id);
    } catch {}
  }

  const plan = plans.find((p) => p.id === chosen)!;
  const price = (p: (typeof plans)[number]) =>
    yearly ? Math.round(p.monthly * 12 * 0.8) : p.monthly;
  const busy = stage >= 0;

  async function checkout() {
    setError("");
    setStage(0);
    const origin = window.location.origin;
    try {
      const r = await fetch(PAYMENT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: b.id,
          plan: plan.id,
          interval: yearly ? "year" : "month",
          amount: price(plan) * 100,
          currency: "usd",
          successUrl: `${origin}/settings?tab=Billing&billing=success&plan=${plan.id}`,
          cancelUrl: `${origin}/settings?tab=Billing&billing=cancel`,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.url)
        throw new Error(j.error || `Payment service responded ${r.status}`);
      setStage(1);
      await new Promise((res) => setTimeout(res, 700));
      window.location.href = j.url;
    } catch (e: any) {
      setStage(-1);
      setError(e.message || "Could not reach the payment service.");
    }
  }

  // Demo path when no AWS endpoint is configured.
  async function simulate() {
    setError("");
    for (let i = 0; i < flow.length; i++) {
      setStage(i);
      await new Promise((res) => setTimeout(res, 750));
    }
    activate(plan.id);
    setStage(-1);
    setResult("success");
  }

  return (
    <div className="grid gap-4">
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card flex items-center gap-4">
              <motion.span
                className={
                  "w-11 h-11 rounded-full inline-flex items-center justify-center shrink-0 " +
                  (result === "success"
                    ? "bg-[var(--brand)] text-[var(--on-brand)]"
                    : "tag-warn")
                }
                initial={{ scale: 0, rotate: -60 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 16 }}
              >
                {result === "success" ? (
                  <Check size={20} strokeWidth={3} />
                ) : (
                  <CircleAlert size={20} />
                )}
              </motion.span>
              <div className="flex-1">
                <b>
                  {result === "success"
                    ? `You’re on ${plans.find((p) => p.id === current)?.name}`
                    : "Checkout cancelled"}
                </b>
                <p className="text-sm muted">
                  {result === "success"
                    ? "Your subscription is active. A receipt is on its way."
                    : "Nothing was charged."}
                </p>
              </div>
              <button
                className="btn2 !px-0 w-10"
                aria-label="Dismiss"
                onClick={() => setResult(null)}
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-xl">Choose your plan</h2>
          <p className="text-sm muted mt-1">
            Current plan:{" "}
            <b className="positive">
              {plans.find((p) => p.id === current)?.name}
            </b>
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className={!yearly ? "font-semibold" : "muted"}>Monthly</span>
          <Switch
            on={yearly}
            onClick={() => setYearly(!yearly)}
            label="Bill yearly"
          />
          <span className={yearly ? "font-semibold" : "muted"}>Yearly</span>
          <span className="tag tag-accent">Save 20%</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr_1fr_1.05fr] gap-4 items-stretch">
        {plans.map((p, i) => {
          const on = chosen === p.id;
          const isCurrent = current === p.id;
          return (
            <motion.button
              key={p.id}
              onClick={() => setChosen(p.id)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, ease }}
              whileHover={{ y: -4 }}
              aria-pressed={on}
              className={
                "relative text-left card !p-6 flex flex-col transition-colors " +
                (on ? "!border-[var(--accent)] shadow-[var(--shadow)]" : "")
              }
            >
              {on && (
                <motion.span
                  layoutId="plan-ring"
                  className="absolute -inset-px rounded-[16px] border-2 border-[var(--accent)] pointer-events-none"
                />
              )}
              <div className="flex justify-between items-center">
                <b className="text-lg">{p.name}</b>
                {p.popular && <span className="tag tag-accent">Popular</span>}
                {isCurrent && !p.popular && (
                  <span className="tag">Current</span>
                )}
              </div>
              <p className="text-sm muted mt-1">{p.blurb}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  <Counter
                    value={price(p)}
                    format={(n) => usd(Math.round(n))}
                  />
                </span>
                <span className="muted text-sm">/{yearly ? "yr" : "mo"}</span>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 items-start">
                    <span className="w-4 h-4 mt-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] inline-flex items-center justify-center shrink-0">
                      <Check size={10} strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </motion.button>
          );
        })}

        {/* Checkout summary */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, ease }}
          className="card card-ink !p-6 flex flex-col"
        >
          <div className="flex items-center justify-between">
            <span className="eyebrow">Checkout</span>
            <span className="tag tag-accent">
              <Lock size={11} /> Secure
            </span>
          </div>
          <div className="mt-4 text-sm opacity-75">
            Munshi {plan.name} · billed {yearly ? "yearly" : "monthly"}
          </div>
          <div className="text-4xl font-bold mt-1">
            <Counter value={price(plan)} format={(n) => usd(Math.round(n))} />
          </div>
          <div className="mt-6 space-y-3">
            {flow.map((s, i) => (
              <div key={s} className="flex items-center gap-3 text-sm">
                <span
                  className={
                    "relative w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-bold border transition-colors " +
                    (stage > i
                      ? "bg-[var(--hl)] text-[var(--hl-ink)] border-transparent"
                      : stage === i
                        ? "border-[var(--hl)]"
                        : "ink-track border-transparent")
                  }
                >
                  {stage > i ? <Check size={12} strokeWidth={3} /> : i + 1}
                  {stage === i && (
                    <motion.span
                      className="absolute inset-[-4px] rounded-full border-2 border-transparent border-t-[var(--hl)]"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  )}
                </span>
                <span className={stage >= i ? "" : "opacity-60"}>{s}</span>
              </div>
            ))}
          </div>
          {error && (
            <p className="text-sm mt-4 text-[#ffb4b8]" role="alert">
              {error}
            </p>
          )}
          <button
            className="btn-accent w-full !h-12 mt-auto group"
            style={{ marginTop: 28 }}
            disabled={busy || current === plan.id || plan.monthly === 0}
            onClick={PAYMENT_API ? checkout : simulate}
          >
            {busy
              ? "Processing…"
              : current === plan.id
                ? "Current plan"
                : plan.monthly === 0
                  ? "Free plan"
                  : `Upgrade to ${plan.name}`}
            {!busy && current !== plan.id && plan.monthly > 0 && (
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            )}
          </button>
          <div className="mt-4 flex items-start gap-2 text-xs opacity-65 leading-relaxed">
            <Server size={14} className="shrink-0 mt-px" />
            {PAYMENT_API
              ? "Payment completes on the AWS-hosted checkout. Card details never touch Munshi."
              : "AWS endpoint not configured (NEXT_PUBLIC_PAYMENT_API_URL). Demo mode activates the plan without charging."}
          </div>
        </motion.div>
      </div>

      <div className="card">
        <Head icon={Receipt} title="Billing history" />
        <div className="tablewrap mt-4">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-sm">
                  {new Date().toISOString().slice(0, 10)}
                </td>
                <td>
                  Munshi {plans.find((p) => p.id === current)?.name} · demo
                </td>
                <td className="num">
                  {usd(plans.find((p) => p.id === current)?.monthly || 0)}
                </td>
                <td>
                  <span className="tag tag-pos">Paid</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// One row of mutually exclusive choices with a sliding thumb.
function Choice<T extends string>({
  id,
  label,
  hint,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-t border-line first:border-0">
      <div>
        <div className="font-bold text-sm">{label}</div>
        <div className="text-xs muted mt-0.5">{hint}</div>
      </div>
      <div role="radiogroup" aria-label={label} className="inline-flex p-1 rounded-full bg-[var(--surface-3)]">
        {options.map(([v, text]) => (
          <button
            key={v}
            role="radio"
            aria-checked={v === value}
            onClick={() => onChange(v)}
            className={
              "relative h-9 px-4 rounded-full text-sm font-semibold transition-colors " +
              (v === value ? "text-[var(--ink)]" : "muted hover:text-[var(--ink)]")
            }
          >
            {v === value && (
              <motion.span
                layoutId={"choice-" + id}
                className="absolute inset-0 rounded-full bg-[var(--surface)] shadow-[var(--shadow)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const wheel = `conic-gradient(${Array.from({ length: 37 }, (_, i) => `oklch(0.66 0.2 ${i * 10}) ${i * 10}deg`).join(",")})`;

// Colour wheel: drag (or use arrow keys) around the ring to pick any hue.
function HueWheel({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
  const ring = useRef<HTMLDivElement>(null);
  const pick = (e: React.PointerEvent) => {
    const r = ring.current!.getBoundingClientRect();
    const deg = (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
    onChange(Math.round((deg + 360) % 360));
  };
  return (
    <div
      ref={ring}
      role="slider"
      tabIndex={0}
      aria-label="Accent colour"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={hue}
      aria-valuetext={`Hue ${hue} degrees`}
      className="relative w-56 h-56 rounded-full shrink-0 touch-none cursor-grab active:cursor-grabbing select-none"
      style={{
        background: wheel,
        mask: "radial-gradient(closest-side, transparent 67%, #000 68%)",
        WebkitMask: "radial-gradient(closest-side, transparent 67%, #000 68%)",
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pick(e);
      }}
      onPointerMove={(e) => e.buttons === 1 && pick(e)}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 15 : 3;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange((hue + step) % 360);
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange((hue - step + 360) % 360);
        else return;
        e.preventDefault();
      }}
    >
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 w-0 h-0"
        style={{ transform: `rotate(${hue}deg)` }}
      >
        <span className="absolute -left-[15px] -top-[109px] w-[30px] h-[30px] rounded-full border-[4px] border-white shadow-[0_2px_10px_rgba(0,0,0,.45)] bg-[var(--brand)]" />
      </span>
    </div>
  );
}

// Personalisation: accent colour (any hue), white or black canvas, shape,
// density, motion and the 3D object. Every change applies instantly and is
// remembered.
function Personalize() {
  const { prefs, setPrefs } = useMunshi();
  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setPrefs({ [k]: v } as Partial<Prefs>);
  return (
    <div className="grid lg:grid-cols-[1.25fr_1fr] gap-[var(--gap)] items-start">
      <div className="card">
        <Head icon={Palette} title="Accent colour" sub="Drag around the wheel to pick any colour" />
        <div className="flex flex-wrap items-center gap-8 mt-6">
          <div className="relative">
            <HueWheel hue={prefs.hue} onChange={(h) => set("hue", h)} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="w-20 h-20 rounded-full bg-[var(--brand)]" />
              <span className="mono text-xs muted mt-2">{prefs.hue}°</span>
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="eyebrow mb-3">Quick picks</div>
            <div role="radiogroup" aria-label="Accent presets" className="flex flex-wrap gap-2.5">
              {PRESETS.map((p) => {
                const on = prefs.hue === p.hue;
                return (
                  <button
                    key={p.label}
                    role="radio"
                    aria-checked={on}
                    aria-label={p.label}
                    title={p.label}
                    onClick={() => set("hue", p.hue)}
                    className="w-11 h-11 rounded-full inline-flex items-center justify-center text-white transition-transform hover:scale-110"
                    style={{
                      background: `oklch(0.6 0.2 ${p.hue})`,
                      boxShadow: on ? `0 0 0 3px var(--surface), 0 0 0 5px oklch(0.6 0.2 ${p.hue})` : "none",
                    }}
                  >
                    {on && <Check size={17} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
            <p className="text-xs muted mt-4">
              The accent colours buttons, charts, highlights and one part of each 3D object.
            </p>
          </div>
        </div>

        <div className="mt-7">
          <Choice id="theme" label="Background" hint="Plain white or plain black" value={prefs.theme}
            options={[["light", "White"], ["dark", "Black"]]} onChange={(v) => set("theme", v)} />
          <Choice id="radius" label="Corners" hint="Shape of cards and inputs" value={prefs.radius}
            options={[["sharp", "Sharp"], ["soft", "Soft"], ["round", "Round"]]} onChange={(v) => set("radius", v)} />
          <Choice id="density" label="Density" hint="How much fits on screen" value={prefs.density}
            options={[["comfy", "Comfortable"], ["compact", "Compact"]]} onChange={(v) => set("density", v)} />
          <Choice id="motion" label="Motion" hint="Reduce if animation is distracting" value={prefs.motion}
            options={[["full", "Full"], ["reduced", "Reduced"]]} onChange={(v) => set("motion", v)} />
          <div className="flex items-center justify-between gap-3 py-4 border-t border-line">
            <div>
              <div className="font-bold text-sm">3D objects</div>
              <div className="text-xs muted mt-0.5">The food model beside each page title</div>
            </div>
            <Switch on={prefs.object3d} onClick={() => set("object3d", !prefs.object3d)} label="3D objects" />
          </div>
        </div>
        <button className="btn2 mt-4" onClick={() => setPrefs(DEFAULT_PREFS)}>
          <RotateCcw size={14} /> Reset to default look
        </button>
      </div>

      <div className="lg:sticky lg:top-24 grid gap-[var(--gap)]">
        <div className="card card-ink">
          <div className="eyebrow">Live preview</div>
          <div className="display text-5xl font-extrabold tracking-[-0.05em] mt-3">$1,284</div>
          <p className="text-sm muted mt-1">Taken today · 42 bills</p>
          <div className="flex gap-2 mt-5">
            <span className="btn-accent">Primary</span>
            <span className="btn2">Secondary</span>
          </div>
        </div>
        <div className="card">
          <div className="eyebrow">Sample card</div>
          <p className="display text-2xl font-extrabold tracking-[-0.03em] mt-2">
            This is how <span className="serif">Munshi</span> looks.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="tag tag-accent">Accent</span>
            <span className="tag tag-pos">Money in</span>
            <span className="tag tag-neg">Money out</span>
            <span className="tag tag-warn">Heads up</span>
          </div>
          <div className="flex gap-2 mt-5">
            <span className="btn">Approve</span>
            <span className="btn2">Dismiss</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoutButton() {
  const { logout } = useMunshi();
  return (
    <button className="btn2" onClick={() => logout()}>
      <LogOut size={15} /> Log out
    </button>
  );
}

// Signing out, and wiping what this browser remembers about the business.
function Account() {
  const { logout } = useMunshi();
  return (
    <div className="card max-w-xl">
      <Head icon={LogOut} title="Account" sub="Signed in as Demo Owner" />
      <div className="flex flex-wrap gap-2 mt-5">
        <button className="btn" onClick={() => logout()}>
          <LogOut size={15} /> Log out
        </button>
        <button
          className="btn2 !text-[var(--neg)] hover:!border-[var(--neg)]"
          onClick={() => {
            if (!confirm("Log out and remove your setup answers and look from this browser?")) return;
            localStorage.removeItem("munshi_profile");
            localStorage.removeItem("munshi_prefs");
            logout();
          }}
        >
          Log out and forget this device
        </button>
      </div>
    </div>
  );
}

export function SettingsPage({
  b,
  act,
  dark,
  setDark,
}: {
  b: Business;
  act: any;
  dark: boolean;
  setDark: (x: boolean) => void;
}) {
  const params = useSearchParams();
  const [tab, setTab] = useState(() =>
    tabs.includes(params.get("tab") || "") ? params.get("tab")! : "Personalize",
  );
  const [name, setName] = useState(b.name);
  return (
    <>
      <Title
        kicker="Settings"
        title="Make it yours"
        sub="Choose how Munshi looks and moves, then manage the business behind it."
        action={<LogoutButton />}
      />
      <div className="mb-5 overflow-x-auto">
        <Segmented
          id="settings-tab"
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
          transition={{ duration: 0.25, ease }}
        >
          {tab === "Personalize" && <Personalize />}
          {tab === "Business" && (
            <div className="card max-w-xl">
              <Head
                icon={Building2}
                title="Business profile"
                sub="Shown on reports and exports"
              />
              <label className="block text-xs font-semibold muted mt-5">
                Business name
                <input
                  className="w-full mt-1.5 text-[var(--ink)]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <button
                className="btn mt-4"
                onClick={() => act("business", { name })}
              >
                Save changes
              </button>
            </div>
          )}
          {tab === "Team" && (
            <div className="card max-w-3xl">
              <Head icon={Users} title="Team members" />
              <div className="flex justify-between items-center py-4 mt-2">
                <span className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-[var(--brand)] text-[var(--on-brand)] text-xs font-bold inline-flex items-center justify-center">
                    DO
                  </span>
                  Demo Owner
                </span>
                <span className="tag tag-accent">Owner</span>
              </div>
              {["Manager role", "Staff role"].map((r) => (
                <div
                  key={r}
                  className="flex justify-between py-4 border-t border-line text-sm"
                >
                  <span>{r}</span>
                  <span className="muted">Available on Business plan</span>
                </div>
              ))}
            </div>
          )}
          {tab === "Integrations" && (
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ["POS terminal", "Mock connected", "Bills sync automatically"],
                ["OCR", "Mock active", "Reads supplier invoices"],
                ["AI", "Deterministic mock", "Insights and the assistant"],
                [
                  "Payments",
                  PAYMENT_API ? "AWS checkout" : "Demo mode",
                  "Subscription billing",
                ],
              ].map(([x, v, d], i) => (
                <motion.div
                  key={x}
                  className="card lift"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="flex justify-between items-start">
                    <Head icon={Plug} title={x} sub={d} />
                    <span className="tag tag-pos">
                      <span className="live-dot" /> {v}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {tab === "Billing" && <Billing b={b} />}
          {tab === "Account" && <Account />}
          {tab === "Data" && (
            <div className="card max-w-3xl">
              <Head
                icon={Database}
                title="Your data"
                sub="Export everything, any time"
              />
              <div className="flex flex-wrap gap-2 mt-5">
                <button
                  className="btn2"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(
                      new Blob([JSON.stringify(b, null, 2)], {
                        type: "application/json",
                      }),
                    );
                    a.download = "munshi-export.json";
                    a.click();
                  }}
                >
                  <Download size={14} /> Export business data
                </button>
                <button
                  className="btn2 !text-[var(--neg)] hover:!border-[var(--neg)]"
                  onClick={() => {
                    if (confirm("Reset all demo data?")) act("reset");
                  }}
                >
                  <RotateCcw size={14} /> Reset demo account
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
