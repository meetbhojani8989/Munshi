import { Sun, Moon, Menu } from "lucide-react";
import type { Business } from "@/lib/core";

export function TopBar({
  title,
  b,
  all,
  dark,
  onMenu,
  onBusiness,
  onToggleTheme,
}: {
  title: string;
  b: Business;
  all: Business[];
  dark: boolean;
  onMenu: () => void;
  onBusiness: (id: string) => void;
  onToggleTheme: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur border-b border-line px-5 md:px-10 h-17 py-3 flex items-center gap-3 justify-between">
      <div className="flex items-center gap-3">
        <button className="md:hidden" onClick={onMenu}>
          <Menu />
        </button>
        <span className="font-semibold">{title}</span>
        <span className="tag desktop">Live demo</span>
      </div>
      <div className="flex gap-2 items-center">
        <select
          aria-label="Business"
          value={b.id}
          onChange={(e) => onBusiness(e.target.value)}
          className="max-w-44 text-sm"
        >
          {all.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <button
          className="btn2 px-2"
          aria-label="Toggle theme"
          onClick={onToggleTheme}
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
