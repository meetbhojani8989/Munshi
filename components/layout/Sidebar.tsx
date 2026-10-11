import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Settings } from "lucide-react";
import { workspaces, workspaceOf } from "@/components/layout/nav";

export function Logo({
  size = 32,
  light = false,
}: {
  size?: number;
  light?: boolean;
}) {
  return (
    <span
      className={
        "inline-flex items-center justify-center rounded-[10px] font-semibold relative overflow-hidden " +
        (light
          ? "bg-gradient-to-br from-[#fb923c] to-[#c2410c] text-white"
          : "bg-gradient-to-br from-[#fb923c] to-[#c2410c] text-white")
      }
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width="62%" height="62%" aria-hidden>
        <path
          d="M4 18V7l4 5 4-5 4 5 4-5v11"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function RailButton({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href?: string;
  label: string;
  icon: any;
  active: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <>
      {active && (
        <motion.span
          layoutId="rail-active"
          className="absolute inset-0 rounded-2xl bg-white shadow-[0_6px_20px_-6px_rgba(0,0,0,.45)]"
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        />
      )}
      <Icon
        size={19}
        strokeWidth={active ? 2.3 : 1.8}
        className={
          "relative transition-colors " + (active ? "text-[#c2410c]" : "")
        }
      />
      <span
        className={
          "relative text-[10px] font-semibold tracking-wide " +
          (active ? "text-[#1c120c]" : "")
        }
      >
        {label}
      </span>
    </>
  );
  const cls =
    "group relative w-[64px] h-[58px] rounded-2xl flex flex-col items-center justify-center gap-1 text-[#e7cdb8] hover:text-white hover:bg-white/5 transition-colors";
  return href ? (
    <Link
      href={href}
      className={cls}
      aria-current={active ? "page" : undefined}
    >
      {inner}
    </Link>
  ) : (
    <button className={cls} onClick={onClick} aria-label={label}>
      {inner}
    </button>
  );
}

// Slim workspace rail. Deep green in both themes so the brand anchors the layout.
export function Sidebar({
  page,
  onSearch,
}: {
  page: string;
  onSearch: () => void;
}) {
  const current = workspaceOf(page)?.key;
  return (
    <aside className="desktop fixed inset-y-0 left-0 w-[84px] z-30 flex flex-col items-center py-4 rail">
      <Link href="/dashboard" aria-label="Munshi home" className="mb-6">
        <Logo size={40} light />
      </Link>
      <nav className="flex flex-col gap-1.5" aria-label="Workspaces">
        {workspaces.map((w) => (
          <RailButton
            key={w.key}
            href={"/" + w.pages[0]}
            label={w.label}
            icon={w.icon}
            active={current === w.key}
          />
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-1.5 items-center">
        <RailButton
          label="Search"
          icon={Search}
          active={false}
          onClick={onSearch}
        />
        <RailButton
          href="/settings"
          label="Settings"
          icon={Settings}
          active={page === "settings"}
        />
      </div>
    </aside>
  );
}
