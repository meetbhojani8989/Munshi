"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type { Business } from "@/lib/core";
import { isAppPath } from "@/components/layout/nav";

type Ctx = {
  all: Business[];
  b: Business | undefined;
  ready: boolean;
  dark: boolean;
  setDark: (dark: boolean) => void;
  setBusiness: (id: string) => void;
  act: (action: string, payload?: unknown, message?: string) => Promise<void>;
  login: (provider?: string) => Promise<void>;
  cascade: { id: number; message: string } | null;
};

const MunshiContext = createContext<Ctx | null>(null);

export function useMunshi() {
  const ctx = useContext(MunshiContext);
  if (!ctx) throw new Error("useMunshi must be used inside MunshiProvider");
  return ctx;
}

// Lives in the root layout so business data, theme and the shell survive
// client-side navigation instead of refetching on every page.
export function MunshiProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [all, setAll] = useState<Business[]>([]),
    [bid, setBid] = useState("cafe"),
    [ready, setReady] = useState(false),
    [dark, setDarkState] = useState(false),
    [cascade, setCascade] = useState<Ctx["cascade"]>(null);
  const loading = useRef(false);
  const b = all.find((x) => x.id === bid) || all[0];

  useEffect(() => {
    setDarkState(localStorage.getItem("munshi_theme") === "dark");
    setBid(localStorage.getItem("munshi_business") || "cafe");
  }, []);

  useEffect(() => {
    if (!isAppPath(pathname) || all.length || loading.current) return;
    loading.current = true;
    fetch("/api/data")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAll(data);
        else throw new Error(data.error || "Unable to load business data");
      })
      .catch((error) => {
        console.error(error);
        router.replace("/login");
      })
      .finally(() => {
        loading.current = false;
        setReady(true);
      });
  }, [pathname, all.length, router]);

  function setDark(next: boolean) {
    setDarkState(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("munshi_theme", next ? "dark" : "light");
  }

  function setBusiness(id: string) {
    setBid(id);
    localStorage.setItem("munshi_business", id);
  }

  async function act(action: string, payload: unknown = {}, message = "") {
    if (!b) return;
    const r = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: b.id, action, payload }),
    });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error);
      return;
    }
    setAll(j.businesses);
    if (message) {
      const id = Date.now();
      setCascade({ id, message });
      setTimeout(() => setCascade((c) => (c?.id === id ? null : c)), 5200);
    }
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
    router.push("/dashboard");
  }

  return (
    <MunshiContext.Provider
      value={{
        all,
        b,
        ready,
        dark,
        setDark,
        setBusiness,
        act,
        login,
        cascade,
      }}
    >
      {children}
    </MunshiContext.Provider>
  );
}
