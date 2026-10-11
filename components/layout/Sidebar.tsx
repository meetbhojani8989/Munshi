import Link from "next/link";
import { nav } from "@/components/layout/nav";

export function Sidebar({ page }: { page: string }) {
  return (
    <aside
      className={
        "desktop fixed inset-y-0 left-0 w-60 bg-surface border-r border-line p-5 flex flex-col z-20"
      }
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-3 text-xl font-extrabold mb-10"
      >
        <span className="w-9 h-9 flex items-center justify-center rounded-xl text-white bg-[#154635]">
          M
        </span>
        Munshi
      </Link>
      <nav className="flex-1 overflow-y-auto">
        {nav.map(([path, label, Icon]) => (
          <Link
            key={path}
            href={"/" + path}
            className={"navlink " + (page === path ? "active" : "")}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="text-xs muted p-3 border-t border-line">
        Every bill updates everything.
      </div>
    </aside>
  );
}
