# Munshi — every bill updates everything

**An AI back office for small businesses.** Snap a supplier invoice or ring up a sale, and Munshi instantly updates
inventory, payables, the double-entry journal, the P&L and the balance sheet, then tells the owner, in plain dollars,
what to do next. Every suggestion is a prediction that Munshi later grades against real results, and a team of agents
keeps improving the forecasts underneath, on the owner's own books.

> Small business owners juggle ten apps, pay an accountant thousands a year, and still can't answer the simplest
> question: *which of my products actually makes me money?*

Built at **c0mpiled-15, Penn State, Oct 11 2026**.

**Live demo: https://munshi-silk.vercel.app** → *Try demo account*

---

## 90-second demo path

1. **Log in** → *Try demo account* → **Nittany Bean & Wrap**, a campus café with 90 days of history
   (~$1.1k/day, hourly POS batches, payroll, rent, card payouts, Penn State game-day spikes).
2. **Scan** a supplier invoice → parsed lines (AWS Textract, or on-device OCR) → confirm.
3. **The Cascade**: inventory ↑ · accounts payable ↑ · journal entry posted · margins recalculated.
4. **Books**: P&L and balance sheet are computed from the journal, never stored. The **Books balanced ✓** badge only
   shows when every entry balances *and* Assets = Liabilities + Equity.
5. **Insights**: dollar-impact suggestions plus the **Leak Finder** ("Tomato Soup stops selling at 8 PM but you stay
   open until 10 PM: ~$96/week lost"), measured from the café's own evening traffic. *Get fresh advice* asks
   DeepSeek on Luminal to re-read the live books.
6. **Voice**: "Raise the chicken wrap by a dollar" → approval card → price updates. Money never moves without the owner's tap.
7. **Scorecard**: past predictions vs. actual results, and the **Agent Arena** below.

---

## Agent Arena: a self-improving agent team (Transpose · Luminal)

**Problem (measurable):** forecast tomorrow's revenue from the sales history. Forecasts drive reorder points and the
Leak Finder, so lower error means fewer sell-outs and less waste. **Metric:** WAPE (Σ|error| / Σ actual) on
one-step-ahead daily forecasts.

**How it works** (`lib/ai/arena.ts`, `app/api/arena`, `components/pages/AgentArena.tsx`):

| Step | What happens |
|---|---|
| Baseline | "Tomorrow looks like today" (naive forecast) |
| Agents in parallel | **Seasonalist** (day-of-week), **Smoother** (noise, spikes), **Trend Scout** (momentum) each propose 2 strategies per round on `deepseek-ai/DeepSeek-V4.1-Flash` via Luminal Cloud |
| Back-test | Code, not the model, scores every proposal on the validation window, so no agent can grade itself |
| Critic | A critic agent reads the round and writes lessons into long-term memory, which the next round's agents see |
| Memory | Lessons and the best strategy persist across runs (stored with the business in MongoDB), so the team compounds |
| Unseen test | After the last round, the champion is scored **once** on the final 14 days, which no agent ever saw |

**Results on the café's books** (5 rounds):

| Live run · DeepSeek V4.1 Flash on Luminal | Validation error | Unseen 14 days |
|---|---|---|
| Baseline (tomorrow = today) | 31.1% | 28.5% |
| Champion after 5 rounds | 16.1% | **15.2%: 46.7% lower error** |
| Second run on the deployed app (starts from remembered lessons) | 14.5% | **11.6%: 59.1% lower error** |

A full 5-round run takes about 90 seconds (3 parallel agents plus a critic per round).

Real lessons the critic wrote during live runs:
- *"weekdayWeight 0.9 improved accuracy this round; prior lesson said skip it, but keep weighting."*
- *"trendWeight 0.05 hurt (0.1638); keep trendWeight 0 and avoid ewma."*
- *"Clip 3.25 remains best; 3.15 and 3.35 matched baseline, so avoid widening clip."*
- *"Keep trendWeight at or below 0.1; higher trend weights worsened WAPE."*

With no LLM key, the same loop runs as a deterministic local search, so the demo never breaks.

---

## Sponsor tracks

### MongoDB
- `lib/models.ts`: Mongoose models with one document per business plus collections for items, invoices, sales and
  journal entries, compound indexes on `{businessId, id}` and `{businessId, seq}`, append-only inserts for the ledger,
  and bulk upserts for mutable rows.
- The UI and every API route go through one store (`lib/store.ts → getStore()`), on **MongoDB Atlas** when
  `MONGODB_URI` is set and an in-memory MongoDB in tests.
- The Agent Arena's runs, lessons memory and champion strategy are stored on the business document, so learning
  survives restarts and deploys.

### AWS
- **Amazon Textract** `AnalyzeExpense` reads supplier invoices (`lib/ocr.ts`), with on-device OCR as the fallback.
- **AWS App Monetization** (private beta) for the **$5/month Founding Owner** plan: two tiers (Free, Founding Owner) metering
  3 actions per owner (`invoice_scans`, `ai_requests`, `agent_runs`), over-quota blocked. Pricing, metrics and plans were drafted
  with the AWS monetize skill; creating them was blocked by an AWS Organizations service control policy on the event account, so
  the launch is pending that permission.
- **Amazon Pay** Checkout v2 for the founding plan (`lib/payments/amazonpay.ts`).

### AGI Inc: on-device intelligence
- Invoice OCR runs **on-device** with tesseract.js when the cloud is unavailable (`lib/ocr.ts`).
- Voice commands use the browser's on-device Web Speech API.
- A **Tauri desktop app** (`src-tauri/`) runs the whole back office locally.

### Engineering Entrepreneurship: sales
Pitch: *"Send me your last month of sales or one supplier invoice, and Munshi shows you which items actually make you
money and where you're losing it. Founding price: $5/month, first month today."*

| Business | Outcome | Proof |
|---|---|---|
| _to fill in_ | LOI / payment | photo link |

---

## Accounting rules (enforced in code)

- Supplier invoice: Dr Inventory, Cr Accounts Payable · Pay vendor: Dr Accounts Payable, Cr Cash
- Sale: Dr Card Clearing (or Cash), Cr Sales Revenue **and** Dr Cost of Goods Sold, Cr Inventory (average cost)
- Card payout: Dr Cash + Dr Card Processing Fees, Cr Card Clearing
- Every journal entry must balance or it throws. The P&L and balance sheet are always computed from the journal.

## Run it

```bash
npm install
npm run dev            # http://localhost:3000 → Try demo account
npm test               # 29 tests: ledger, store, Mongo models, OCR, POS
```

Runs with **no env vars** (local store, on-device OCR, deterministic AI). Copy `.env.example` to `.env.local` to
turn on the integrations:

| Variable | Turns on |
|---|---|
| `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` | Live agents and advisor on Luminal (`https://flash.luminal.cloud/v1`, `deepseek-ai/DeepSeek-V4.1-Flash`) |
| `MONGODB_URI` | MongoDB Atlas storage |
| `AWS_REGION` (or `MUNSHI_AWS_*` on Amplify) | Amazon Textract invoice reading |

Desktop app: `npm run tauri dev` (needs Rust). `npm run seed` resets the demo data.

## Team

Person A (books engine) · Person B (design & frontend) · Person C (AI, sales, pitch).
