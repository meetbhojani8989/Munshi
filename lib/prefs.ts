// Personalisation the owner controls in Settings → Personalize. Stored in
// localStorage and applied to <html> before first paint (see app/layout.tsx).
export type Prefs = {
  hue: number; // accent hue on the OKLCH colour wheel, 0–359
  theme: "light" | "dark";
  radius: "sharp" | "soft" | "round";
  density: "comfy" | "compact";
  motion: "full" | "reduced";
  object3d: boolean;
};

export const PRESETS = [
  { label: "Tomato", hue: 28 },
  { label: "Saffron", hue: 70 },
  { label: "Basil", hue: 150 },
  { label: "Lagoon", hue: 205 },
  { label: "Blueberry", hue: 262 },
  { label: "Grape", hue: 300 },
  { label: "Beet", hue: 350 },
] as const;

export const DEFAULT_PREFS: Prefs = {
  hue: 262,
  theme: "light",
  radius: "soft",
  density: "comfy",
  motion: "full",
  object3d: true,
};

export const PREFS_KEY = "munshi_prefs";
export const PROFILE_KEY = "munshi_profile";

// OKLCH → sRGB hex, for places CSS variables cannot reach (WebGL, canvas).
export function oklchHex(l: number, c: number, h: number) {
  const a = c * Math.cos((h * Math.PI) / 180),
    b = c * Math.sin((h * Math.PI) / 180);
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
  return (
    "#" +
    lin
      .map((v) => {
        const x = Math.max(0, Math.min(1, v));
        const s = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
        return Math.round(s * 255).toString(16).padStart(2, "0");
      })
      .join("")
  );
}

export const accentHex = (hue: number) => oklchHex(0.58, 0.21, hue);

export function loadPrefs(): Prefs {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
    if (saved && typeof saved === "object") {
      const next = { ...DEFAULT_PREFS, ...saved };
      if (typeof next.hue !== "number") next.hue = DEFAULT_PREFS.hue;
      if (next.theme !== "dark") next.theme = "light";
      return next;
    }
  } catch {}
  return DEFAULT_PREFS;
}

export function applyPrefs(p: Prefs) {
  const el = document.documentElement;
  el.style.setProperty("--h", String(p.hue));
  el.classList.toggle("dark", p.theme === "dark");
  el.dataset.radius = p.radius;
  el.dataset.density = p.density;
  el.dataset.motion = p.motion;
}

// Inlined into <head> so the saved look is applied before first paint.
export const prefsBootScript = `try{var p=JSON.parse(localStorage.getItem("${PREFS_KEY}")||"null")||{};var e=document.documentElement;e.style.setProperty("--h",typeof p.hue==="number"?p.hue:${DEFAULT_PREFS.hue});if(p.theme==="dark")e.classList.add("dark");e.dataset.radius=p.radius||"soft";e.dataset.density=p.density||"comfy";e.dataset.motion=p.motion||"full";if(sessionStorage.getItem("munshi_booted"))e.dataset.booted="1"}catch(e){}`;
