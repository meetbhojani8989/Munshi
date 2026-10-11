"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, MotionConfig } from "framer-motion";
import { useMunshi } from "@/components/MunshiProvider";
import { isAppPath, nav, pageFromPath } from "@/components/layout/nav";
import { Scene3D } from "@/components/fx/Scene3D";
import { Header } from "@/components/layout/Header";
import { Dock } from "@/components/layout/Dock";
import { Splash } from "@/components/layout/Splash";
import { Toaster } from "@/components/layout/Toaster";
import { Tour } from "@/components/layout/Tour";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { ease } from "@/components/layout/ui";

const BOOT_MS = 1900;
const order = (path: string) => {
  const i = nav.findIndex((n) => "/" + n[0] === "/" + path.split("/")[1]);
  return i < 0 ? 99 : i;
};

// Everything that persists across pages: the 3D object, the launch curtain,
// notifications, and (inside the app) the header and dock. It also owns the
// app-wide motion: page-to-page transitions, the pointer light on cards and
// the slight pull of magnetic controls.
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { prefs, ready } = useMunshi();
  const app = isAppPath(pathname);
  const page = app ? pageFromPath(pathname) : "login";
  const still = prefs.motion === "reduced";

  // Launch curtain: once per browser session, and any click or key skips it.
  const [timeUp, setTimeUp] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem("munshi_booted")) return setTimeUp(true);
    const end = () => {
      sessionStorage.setItem("munshi_booted", "1");
      setTimeUp(true);
    };
    const t = setTimeout(end, BOOT_MS);
    window.addEventListener("pointerdown", end);
    window.addEventListener("keydown", end);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", end);
      window.removeEventListener("keydown", end);
    };
  }, []);
  const boot = !timeUp;

  // Page transitions: the outgoing page slides away in the direction of
  // travel through the dock before the new one assembles. Header, dock, 3D
  // object and notifications are separate layers, so they hold still.
  const settle = useRef<null | (() => void)>(null);
  useEffect(() => {
    const done = settle.current;
    settle.current = null;
    if (done) requestAnimationFrame(() => done());
  }, [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const start = (document as any).startViewTransition?.bind(document);
      if (!start || still || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target || a.origin !== location.origin || a.pathname === location.pathname) return;
      if (!isAppPath(a.pathname) || !isAppPath(location.pathname)) return;
      e.preventDefault();
      document.documentElement.dataset.dir = order(a.pathname) >= order(location.pathname) ? "forward" : "back";
      const vt = start(
        () =>
          new Promise<void>((resolve) => {
            settle.current = resolve;
            setTimeout(resolve, 900);
            router.push(a.pathname + a.search);
          }),
      );
      // If the browser abandons the animation (tab hidden, window resized)
      // the navigation has still happened, so there is nothing to recover.
      vt.ready?.catch(() => {});
      vt.finished?.catch(() => {});
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router, still]);

  // Pointer light and magnetic pull. Only the card or control actually under
  // the cursor is touched, so a mouse move never restyles the whole page.
  useEffect(() => {
    if (still) return;
    let raf = 0,
      ev: PointerEvent | null = null,
      pulled: HTMLElement | null = null;
    const apply = () => {
      raf = 0;
      const e = ev!;
      const t = e.target as Element;
      const card = t.closest?.<HTMLElement>(".card");
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      }
      const mag = t.closest?.<HTMLElement>("[data-magnetic]") || null;
      if (pulled && pulled !== mag) pulled.style.translate = "";
      if (mag) {
        const r = mag.getBoundingClientRect();
        mag.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.2}px ${(e.clientY - r.top - r.height / 2) * 0.25}px`;
      }
      pulled = mag;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      ev = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [still]);

  return (
    <MotionConfig reducedMotion={still ? "always" : "user"}>
      <Scene3D page={page} boot={boot} />
      <div className="relative z-10">
        {app && page !== "onboarding" ? (
          <AppFrame pathname={pathname!} page={page} ready={ready}>
            {children}
          </AppFrame>
        ) : (
          children
        )}
      </div>
      <Toaster />
      <Splash open={boot} duration={BOOT_MS} />
    </MotionConfig>
  );
}

function AppFrame({
  pathname,
  page,
  children,
}: {
  pathname: string;
  page: string;
  ready: boolean;
  children: React.ReactNode;
}) {
  const [palette, setPalette] = useState(false),
    [tour, setTour] = useState(false);
  const startTour = useCallback(() => setTour(true), []);
  const endTour = useCallback(() => setTour(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[80] btn"
      >
        Skip to content
      </a>
      <Header onSearch={() => setPalette(true)} onTour={startTour} />
      <main
        id="content"
        tabIndex={-1}
        className="outline-none max-w-[1240px] mx-auto px-4 md:px-8 pt-8 md:pt-10 pb-44"
        style={{ viewTransitionName: "page" }}
      >
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
        >
          {children}
        </motion.div>
      </main>
      <Dock page={page} />
      <Tour open={tour} onClose={endTour} />
      <CommandPalette open={palette} onClose={() => setPalette(false)} onTour={startTour} />
    </div>
  );
}
