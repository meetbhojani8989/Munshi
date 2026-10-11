import {
  LayoutDashboard,
  ScanLine,
  ReceiptText,
  Boxes,
  BookOpen,
  ChartNoAxesCombined,
  Sparkles,
  FlaskConical,
  Target,
  ShoppingBag,
  Truck,
  MessageCircle,
  ChartColumnIncreasing,
  Settings,
  Landmark,
  Gauge,
  ConciergeBell,
  Refrigerator,
  ChefHat,
  HandCoins,
} from "lucide-react";

// Every routable page: [path, label, icon].
export const nav = [
  ["dashboard", "Today", LayoutDashboard],
  ["sales", "Sales", ReceiptText],
  ["orders", "Online orders", ShoppingBag],
  ["inventory", "Stock", Boxes],
  ["scan", "Scan invoice", ScanLine],
  ["vendors", "Vendors", Truck],
  ["books", "Books", BookOpen],
  ["valuation", "Valuation", ChartColumnIncreasing],
  ["payroll", "Payroll", HandCoins],
  ["analytics", "Analytics", ChartNoAxesCombined],
  ["insights", "Insights", Sparkles],
  ["lab", "Pricing Lab", FlaskConical],
  ["scorecard", "Scorecard", Target],
  ["assistant", "Ask Munshi", MessageCircle],
  ["settings", "Settings", Settings],
] as const;

// The dock shows four workspaces; the active one unfolds into its pages.
// Scanning lives at the top of Pantry and Ask Munshi is the dock's orb, so
// neither appears as a tab.
export const workspaces = [
  { key: "overview", label: "Today", icon: Gauge, pages: ["dashboard"] },
  { key: "sales", label: "Service", icon: ConciergeBell, pages: ["sales", "orders"] },
  { key: "stock", label: "Pantry", icon: Refrigerator, pages: ["inventory", "vendors"] },
  { key: "finance", label: "Money", icon: Landmark, pages: ["books", "payroll", "valuation"] },
  { key: "intel", label: "Insight", icon: ChefHat, pages: ["insights", "analytics", "lab", "scorecard"] },
] as const;

export function workspaceOf(page: string) {
  if (page === "item" || page === "scan") return workspaces[2];
  return workspaces.find((w) => (w.pages as readonly string[]).includes(page));
}

export const labelOf = (page: string) =>
  nav.find((n) => n[0] === page)?.[1] || "";

// Routes that render inside the app shell (everything except login / 404).
export function isAppPath(pathname: string | null) {
  if (!pathname) return false;
  const first = pathname.split("/")[1];
  return (
    first === "items" ||
    first === "onboarding" ||
    nav.some((n) => n[0] === first)
  );
}

export function pageFromPath(pathname: string | null) {
  const first = (pathname || "").split("/")[1];
  return first === "items" ? "item" : first;
}
