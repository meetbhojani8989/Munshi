# Munshi Design System — MASTER

Source of truth for every page. Tokens live in `app/globals.css`, personalisation in `lib/prefs.ts`, shared components in `components/layout/ui.tsx`. Use tokens and components, never raw hex values.

## Direction
- **Idea:** a plain white (or plain black) canvas, one solid accent colour, and a 3D food object per section. No gradients, no coloured backdrops.
- **Informed by Apple's HIG:** motion is purposeful and optional (Motion), colour means one thing and works in light and dark (Color), controls float above content and detail is disclosed progressively (Layout).
- **Avoid:** gradients, fixed hex colours in components, a second navigation bar.

## Colour
- **Canvas:** `--bg` is `#ffffff` or `#000000` only. Cards are a neutral step off it (`--surface`), with `--surface-2` / `-3` for wells and tracks. Neutrals carry no tint.
- **Accent:** one hue, `--h`, chosen on the colour wheel in Settings (any hue 0–359; presets in `lib/prefs.ts`). `--brand` is that hue as a solid; `--accent-text` and `--accent-soft` are its text and tint forms. `.card-ink` is the accent as a surface with white text.
- `--pos` / `--neg` / `--warn` stay semantic and do not follow the accent.
- Charts use `useChartColors()` (brand, then `--chart-2` / `--chart-3`).
- Paper elements (order tickets, receipt tape, setup ticket) are always white with dark ink, in both themes.

## Typography
- **Plus Jakarta Sans** for UI and headings (h1 700, −0.045em), **Instrument Serif italic** for the emphasised last word of a heading (`.serif`, painted with the accent gradient), **JetBrains Mono** for figures and IDs (`.mono`).

## Layout
- **Landing (`/login`):** headline and sign-in on the left; on the right a dining table seen from directly above draws itself in grey line (table, chairs, place settings, then each dish one by one) while the view pushes in and levels off like a drone, then hovers. On phones it sits above the headline. No 3D here.
- **Onboarding (`/onboarding`):** six steps (business, hours, service, past bills, connections, review) with a live "setup ticket" on the right. "Skip, use the demo account" is always available. Answers are saved in `localStorage` under `munshi_profile`.
- **Header:** floating capsule with logo, business switcher, ⌘K search, theme toggle and settings.
- **Dock:** floating bottom capsule with five workspaces (Today · Service · Pantry · Money · Insight). The active one unfolds to show its pages. The pill at the end opens Ask Munshi.
- **Pantry:** invoice scanning is a banner at the top of the page that opens the scanner inline.
- **Ask Munshi:** full page, particle orb in the centre with one ask bar beneath it. The orb appears nowhere else.
- Page titles reserve 250px on the right for the 3D object. Content max-width 1240px.

## Personalisation (`Settings → Personalize`)
Accent hue (wheel plus quick picks), background (white/black), corners, density, motion and a 3D on/off switch. Stored in `localStorage` under `munshi_prefs` and applied to `<html>` before first paint. Log out lives in the Settings header and the Account tab.

## Motion
Motion tokens: `ease` in `components/layout/ui.tsx`, springs ≈ 400/32 for indicators, 0.2–0.45s for page-level moves. App-wide behaviour lives in `components/layout/Shell.tsx`.
- **Launch:** the 3D burger assembles while a counter runs to 100. Plays once per browser session; any click or key skips it; "Replay the launch intro" is in the command palette.
- **Page transitions:** View Transitions API. The outgoing page slides away in the direction of travel through the dock, then the new page assembles. Header, dock, 3D object, notifications and tour are separate layers and hold still. Falls back to a plain fade where the API is missing.
- **Command palette** (⌘K): fuzzy search over pages and real actions, recent commands, a side pane with live figures for the highlighted command, and "Ask Munshi …" for anything typed.
- **Notifications** (`Toaster`): a stacked pile that fans out on hover. Errors are `role="alert"` and stay until dismissed.
- **Pointer light:** one soft light follows the cursor across cards. `data-magnetic` controls lean toward the pointer.
- **Guided tour** (`Tour`): five stops, about 75 seconds, pause/back/next. It only navigates and explains.
- **3D objects** (`components/fx/Scene3D.tsx`, three.js): Today = burger, Service = cloche, Pantry = jar, Money = iced donut, Insight = pizza pie-chart. Textured, lit with a warm key and cool rim, with a soft ground shadow.
- **Paper:** order tickets sway on the rail, the latest bills print as a receipt, onboarding answers print onto a setup ticket.
- Reduced motion (the setting or the OS preference) stops loops, skips page transitions, the pointer light and magnetism, and shortens the rest.

## Accessibility
Skip link · visible focus ring · 44px minimum targets · `aria-current` on dock items · the hue wheel is a keyboard-operable `role="slider"` · switches and choice rows use `role="switch"` / `role="radio"` · charts carry legends.
