import Link from "next/link";
import { X } from "lucide-react";
import { nav } from "@/components/layout/nav";

export function MobileDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="md:hidden fixed inset-0 z-30 bg-black/40" onClick={onClose}>
      <div
        className="w-64 h-full bg-surface p-5 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="mb-5" onClick={onClose}>
          <X />
        </button>
        {nav.map(([path, label, Icon]) => (
          <Link
            onClick={onClose}
            key={path}
            className="navlink"
            href={"/" + path}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
