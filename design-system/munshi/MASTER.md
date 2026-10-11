# Munshi Design System — MASTER

Source of truth for every page. Tokens live in `app/globals.css`; shared components in `components/layout/ui.tsx`. Use tokens and components rather than raw hex values.

## Direction
- **Style:** Data-Dense Dashboard (UI Pro Max `style` match): KPI cards, tables, charts, grid layout.
- **Mood:** formal, trustworthy, calm. White canvas by day, pure black by night, emerald as the only brand colour.
- **Avoid:** blobs, ornamental gradients, emoji icons, serif/italic display type.

## Colour tokens
| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#ffffff` | `#000000` | Page canvas |
| `--surface` / `-2` / `-3` | `#ffffff` / `#f6f8f7` / `#e9efec` | `#0a0c0b` / `#111513` / `#1a201d` | Cards, wells, tracks |
| `--ink` | `#0b1411` | `#f2f7f5` | Primary text |
| `--muted` | `#64716c` | `#8b9893` | Secondary text |
| `--line` / `--line-strong` | `#e6ebe9` / `#d3dbd8` | `#1c2220` / `#2a332f` | Borders |
| `--brand` / `--on-brand` | `#047857` / `#fff` | `#10b981` / `#02140d` | Primary buttons |
| `--accent` / `--on-accent` | `#059669` / `#fff` | `#34d399` / `#02140d` | Fills, bars, active states |
| `--accent-text` | `#047857` | `#34d399` | Green text |
| `--accent-soft` | `#e8f8f1` | `#072a1e` | Tinted chips/backgrounds |
| `--hero` / `--hero-ink` | `#053d2e` / `#ecfdf5` | `#062a20` / `#ecfdf5` | Deep-green feature panels (`.card-ink`) |
| `--pos` / `--neg` / `--warn` | `#047857` / `#d92d3a` / `#b45309` | `#34d399` / `#ff6b74` / `#fbbf24` | Money up / down / caution |

Emerald `#059669` is the UI Pro Max colour database's contrast-adjusted value for `#10B981`.
**Measured contrast (WCAG):** every text pair is ≥ 4.5:1 in both themes (body 18.7 / 19.4, muted 5.1 / 7.0, button 5.5 / 7.5, accent-text 5.5 / 10.9). Icons on accent: 3.8 / 9.9 (≥ 3:1).

## Typography
- **IBM Plex Sans** for everything, plus **IBM Plex Mono** only for invoice/receipt figures and IDs. This is the "Financial Trust" pairing (UI Pro Max typography match for fintech/banking). Loaded via `next/font` with `display: swap`.
- h1: clamp(30–44px), 700, −0.03em. h2: 17px, 650. Body 14–15px. Numbers: `.num` (tabular figures).
- In a multi-word page title, the last word renders in `--accent-text` (`.serif` class, kept for compatibility).

## Layout
- **Rail (84px, deep green)** holds 5 workspaces: Overview · Sales · Stock · Finance · Intelligence, plus Search and Settings.
- **Header** shows the workspace name, its page tabs (sliding underline), ⌘K search, business switcher, theme toggle and avatar.
- **Mobile:** the rail becomes a 5-item bottom bar and the tabs scroll under the header. No horizontal scroll at 375px (verified on every route).
- Content max-width 1360px; cards 16px radius; 16px grid gaps.

## Components (`components/layout/ui.tsx`)
`Title` (kicker chip + word-reveal h1) · `Card` (`lift` for hover) · `Stat` + `Counter` (count-up numbers) · `Stagger`/`Rise` (entrance cascade) · `Segmented` (pill tabs) · `Sheet` (right drawer, Esc to close) · `Bar` · `ChartTooltip` · `useChartColors()`.

## Motion
- Entrances: 0.4–0.6s, ease `[0.2, 0.8, 0.2, 1]`, stagger 55ms (UI Pro Max "Stagger List" preset).
- Springs for indicators (rail, tabs, toggles): stiffness ≈ 500, damping ≈ 38.
- The signature motion is the **Cascade** (`CascadeDiagram`): one document fans out into four ledgers.
- `MotionConfig reducedMotion="user"` plus a CSS reduced-motion override; looping/marquee motion stops under reduced motion and pauses on hover/focus.

## Accessibility checklist (applied)
Skip-to-content link · visible focus ring (`--accent`) · `scroll-padding-top` so focus isn't hidden under the sticky header · `touch-action: manipulation` · icon-only buttons have `aria-label` · switches use `role="switch"`/`aria-checked` · charts have a legend and don't rely on hue alone · cascade toast is an `aria-live` region.

## Payments
App subscription only (Settings → Billing). Checkout is created by the AWS endpoint in `NEXT_PUBLIC_PAYMENT_API_URL`:
`POST { businessId, plan, interval, amount (cents), currency, successUrl, cancelUrl } → { url }`.
