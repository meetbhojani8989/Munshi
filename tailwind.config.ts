import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        paper: "var(--surface-2)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        gold: "var(--gold)",
        green: "var(--pos)",
        red: "var(--neg)",
        amber: "var(--warn)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace"],
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      keyframes: {
        // Magic UI (21st.dev) Border Beam
        "border-beam": { "100%": { "offset-distance": "100%" } },
        // Magic UI (21st.dev) Orbiting Circles
        orbit: {
          "0%": { transform: "rotate(0deg) translateY(calc(var(--radius) * 1px)) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateY(calc(var(--radius) * 1px)) rotate(-360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(var(--rot, 0deg))" },
          "50%": { transform: "translateY(calc(var(--float, 12) * -1px)) rotate(calc(var(--rot, 0deg) * -1))" },
        },
        steam: {
          "0%": { transform: "translateY(6px) scaleX(1)", opacity: "0" },
          "30%": { opacity: "0.7" },
          "100%": { transform: "translateY(-22px) scaleX(1.4)", opacity: "0" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
        orbit: "orbit calc(var(--duration)*1s) linear infinite",
        float: "float calc(var(--dur, 6) * 1s) ease-in-out infinite",
        steam: "steam 2.4s ease-out infinite",
        shimmer: "shimmer 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
