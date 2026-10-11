import Link from "next/link";
import { nav } from "@/components/layout/nav";

export function MobileBar({ page }: { page: string }) {
  return (
    <nav className="mobilebar fixed bottom-0 left-0 right-0 bg-surface border-t border-line z-20 justify-around px-2 py-2">
      {nav
        .filter((n) =>
          ["dashboard", "sales", "scan", "insights", "books"].includes(n[0]),
        )
        .map(([path, label, Icon]) => (
          <Link
            key={path}
            href={"/" + path}
            className={
              "flex flex-col items-center text-[10px] gap-1 " +
              (page === path ? "positive" : "muted")
            }
          >
            <Icon size={21} />
            {label}
          </Link>
        ))}
    </nav>
  );
}
