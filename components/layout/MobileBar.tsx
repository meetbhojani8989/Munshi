import Link from "next/link";
import { motion } from "framer-motion";
import { workspaces, workspaceOf } from "@/components/layout/nav";

export function MobileBar({ page }: { page: string }) {
  const current = workspaceOf(page)?.key;
  return (
    <nav className="mobilebar fixed bottom-3 left-3 right-3 z-30 justify-around rounded-2xl rail px-1 py-1.5 shadow-[var(--shadow-lg)]">
      {workspaces.map((w) => {
        const active = current === w.key;
        const Icon = w.icon;
        return (
          <Link
            key={w.key}
            href={"/" + w.pages[0]}
            className={
              "relative flex flex-col items-center text-[10px] font-semibold gap-1 px-2 py-1.5 rounded-xl min-w-14 " +
              (active ? "text-[#1c120c]" : "text-[#e7cdb8]")
            }
          >
            {active && (
              <motion.span
                layoutId="mobile-active"
                className="absolute inset-0 rounded-xl bg-white"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <Icon
              size={18}
              className={"relative " + (active ? "text-[#c2410c]" : "")}
            />
            <span className="relative">{w.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
