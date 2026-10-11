"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, MotionConfig, useAnimationControls } from "framer-motion";
import { useMunshi } from "@/components/MunshiProvider";
import { isAppPath, pageFromPath, workspaceOf } from "@/components/layout/nav";
import { IntelHero } from "@/components/fx/IntelHero";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileBar } from "@/components/layout/MobileBar";
import { CascadeToast } from "@/components/layout/CascadeToast";
import { VoiceButton, VoiceModal } from "@/components/layout/Voice";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { ease } from "@/components/layout/ui";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <MotionConfig reducedMotion="user">
      {isAppPath(pathname) ? (
        <AppFrame pathname={pathname}>{children}</AppFrame>
      ) : (
        children
      )}
    </MotionConfig>
  );
}

function AppFrame({
  pathname,
  children,
}: {
  pathname: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { cascade } = useMunshi();
  const [voice, setVoice] = useState(false),
    [voiceText, setVoiceText] = useState(""),
    [palette, setPalette] = useState(false);
  const page = pageFromPath(pathname);

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
    <div className="min-h-screen bg-[var(--bg)]">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[80] btn"
      >
        Skip to content
      </a>
      <RouteProgress pathname={pathname} />
      <Sidebar page={page} onSearch={() => setPalette(true)} />
      <div className="md:ml-[84px]">
        <TopBar page={page} onSearch={() => setPalette(true)} />
        <main
          id="content"
          tabIndex={-1}
          className="main outline-none px-6 py-9 md:px-10 md:py-10 max-w-[1360px] mx-auto"
        >
          {workspaceOf(page)?.key === "intel" && <IntelHero page={page} key={"intel-" + page} />}
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 24, scale: 0.985, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease }}
          >
            {children}
          </motion.div>
        </main>
      </div>
      <MobileBar page={page} />
      <VoiceButton onClick={() => setVoice(true)} />
      <CascadeToast cascade={cascade} />
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <VoiceModal
        open={voice}
        text={voiceText}
        setText={setVoiceText}
        onClose={() => setVoice(false)}
        onSubmit={() => {
          setVoice(false);
          router.push("/assistant?voice=" + encodeURIComponent(voiceText));
        }}
      />
    </div>
  );
}

// Thin ink line that sweeps across the top on every route change.
function RouteProgress({ pathname }: { pathname: string }) {
  const controls = useAnimationControls();
  useEffect(() => {
    controls.set({ scaleX: 0, opacity: 1 });
    controls
      .start({ scaleX: 1, transition: { duration: 0.6, ease } })
      .then(() =>
        controls.start({ opacity: 0, transition: { duration: 0.3 } }),
      );
  }, [pathname, controls]);
  return (
    <motion.div
      aria-hidden
      animate={controls}
      className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left bg-[var(--brand)]"
    />
  );
}
