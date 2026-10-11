# Munshi — every bill updates everything

**A self-learning AI back office for local businesses.** Snap a supplier invoice or ring up a sale, and Munshi
instantly updates inventory, payables, the double-entry journal, the P&L and the balance sheet, then tells the owner,
in plain dollars, what to do next. Every suggestion is a prediction that Munshi later grades against real results, and
a team of AI agents keeps improving the forecasts underneath, on the owner's own books.

> Small business owners juggle ten apps, pay an accountant thousands a year, and still can't answer the simplest
> question: *which of my products actually makes me money, and where am I losing it?*

**Live demo: https://munshi-silk.vercel.app** → *Try demo account*

Built at **c0mpiled-15, Penn State, Oct 11 2026**.

| | |
|---|---|
| **Forecast error on unseen days** | **−59%** (28.5% → 11.6%) after the agent team trains on the café's books |
| **Money leak found** | ~$96/week: Tomato Soup sells out at 8 PM, the café closes at 10 PM |
| **Books** | Always balanced: every entry Dr = Cr, and Assets = Liabilities + Equity |
| **Price** | $5/month Founding Owner plan |

---

## Demo path

1. **Log in** → *Try demo account* → **Nittany Bean & Wrap**, a campus café with 90 days of realistic history:
   ~$1.1k/day in hourly POS batches, a 72% gross margin, weekly payroll, rent, utilities, daily card payouts and
   Penn State game-day spikes. That's $103k revenue and $35.8k net income over 90 days.
2. **Scan** → *Use sample invoice* → review the parsed lines → **Confirm invoice**.
3. **The Cascade**: inventory ↑ · accounts payable ↑ · journal entry posted · margins recalculated, animated live.
4. **Books**: the P&L (revenue, COGS, operating expenses, net income) and the balance sheet are computed from the journal,
   never stored. The **Books balanced ✓** badge shows only when every entry balances *and* Assets = Liabilities + Equity.
5. **Insights**: dollar-impact suggestions and the **Leak Finder**, measured from the café's own evening traffic.
   *Get fresh advice* has DeepSeek on Luminal re-read the live books and write new suggestions.
6. **Ask Munshi** (voice or text): "Which vendors do I owe?" is answered from the live books. "Raise the chicken wrap by
   a dollar" → approval card → price updates. Money never moves without the owner's tap.
7. **Scorecard**: past predictions graded against actual results, and the **Agent Arena** (below) training live.

Also in the app: Sales with a mock POS and live sales feed, Inventory, Payroll, Analytics, Pricing Lab, Vendors,
Online orders, Valuation, a command palette, and a Tauri desktop build.

---

## Agent Arena: a self-improving agent team (Transpose · Luminal)

**Problem (measurable):** forecast tomorrow's revenue from the sales history. Forecasts drive reorder points and the
Leak Finder, so lower error means fewer sell-outs and less waste. **Metric:** WAPE (Σ|error| / Σ actual) on
one-step-ahead daily forecasts.

**How it works** (`lib/ai/arena.ts`, `app/api/arena`, `components/pages/AgentArena.tsx`):

| Step | What happens |
|---|---|
| Baseline | "Tomorrow looks like today" (naive forecast) |
| Agents in parallel | **Seasonalist** (day-of-week), **Smoother** (noise, spikes), **Trend Scout** (momentum) each propose 2 forecasting strategies per round on `deepseek-ai/DeepSeek-V4.1-Flash` via Luminal Cloud |
| Back-test | Code, not the model, scores every proposal on the validation window, so no agent can grade itself |
| Critic | A critic agent reads the round's results and writes lessons into long-term memory, which the next round's agents read |
| Memory | Lessons and the champion strategy persist across runs (stored with the business), so the team compounds |
| Unseen test | After the last round, the champion is scored **once** on the final 14 days, which no agent ever saw |

**Results on the café's books** (5 rounds, live on DeepSeek V4.1 Flash via Luminal):

| | Validation error | Unseen 14 days |
|---|---|---|
| Baseline (tomorrow = today) | 31.1% | 28.5% |
| Champion after 5 rounds | 16.1% | **15.2%: 46.7% lower error** |
| Next run on the deployed app (starts from remembered lessons) | 14.5% | **11.6%: 59.1% lower error** |

A full 5-round run takes about 65–90 seconds (3 parallel agents plus a critic per round).

Real lessons the critic wrote during live runs:
- *"weekdayWeight 0.9 improved accuracy this round; prior lesson said skip it, but keep weighting."*
- *"trendWeight 0.05 hurt (0.1638); keep trendWeight 0 and avoid ewma."*
- *"Clip 3.25 remains best; 3.15 and 3.35 matched baseline, so avoid widening clip."*
- *"Keep trendWeight at or below 0.1; higher trend weights worsened WAPE."*

Reliability: low reasoning effort for ~2× faster rounds, retries on 503/429, 25 s timeouts, and a deterministic local
search when no LLM key is set, so the demo never breaks.

## The AI manager

- **Advisor** (`lib/ai/advisor.ts`, `lib/ai/context.ts`): builds an analytics context from the real journal, sales and
  stock (top sellers, margins, sell-out hours, cash, payables), asks DeepSeek for strict JSON suggestions (validated with
  zod), drops any suggestion that names an unknown item, and falls back to deterministic advice on failure.
- **Leak Finder** (`lib/ai/leak.ts`): finds steady sellers that stop selling before close and estimates the weekly
  revenue lost, scaled by the café's own late-evening traffic.
- **Ask Munshi** (`app/api/assistant/intent`): price changes are parsed by rules and always gated on approval. Open
  questions go to DeepSeek with the live books, read-only.
- **Scorecard / LearningService** (`lib/ai/learning.ts`): verdicts (right / partial / wrong), lessons, and per-category
  accuracy weights.

---

## Sponsor tracks

### Transpose (Challenge A: self-improving agent team) · Luminal
The Agent Arena above: parallel agents on Luminal-hosted DeepSeek V4.1 Flash, a measurable task, a baseline,
improvement across rounds, a critic with persistent memory, and a final test on unseen data.

### MongoDB
- `lib/models.ts`: Mongoose models with one document per business plus collections for items, invoices, sales and
  journal entries, compound indexes on `{businessId, id}` and `{businessId, seq}`, append-only inserts for the ledger,
  and bulk upserts for mutable rows.
- The UI and every API route go through one store (`lib/store.ts → getStore()`): **MongoDB Atlas** when `MONGODB_URI`
  is set, an in-memory MongoDB in tests, and a local file store with no configuration.
- Agent Arena runs, lessons memory and the champion strategy live on the business document, so learning survives
  restarts and deploys.

### AWS
- **Amazon Textract** `AnalyzeExpense` is integrated for reading supplier invoices (`lib/ocr.ts`).
- **AWS App Monetization** (private beta) for the **$5/month Founding Owner** plan: two tiers (Free and Founding Owner)
  metering 3 actions per owner (`invoice_scans`, `ai_requests`, `agent_runs`), with over-quota blocked. We designed the
  pricing with AWS's monetize skill, resolved the beta endpoint, and prepared the app, metrics and plans spec.
- **Amazon Pay** Checkout v2 for the founding plan (`lib/payments/amazonpay.ts`).
- **Status:** on our event AWS accounts, both Textract and App Monetization calls are rejected by an AWS Organizations
  service control policy, so the live demo reads invoices with the built-in sample and on-device OCR:
  ```
  User: arn:aws:iam::914820856665:user/MunshiMonetize is not authorized to perform: appmonetization:CreateApp
  with an explicit deny in a service control policy: …/service_control_policy/p-u7vc1s83
  ```
  Everything is in place to go live once that policy allows it.

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
- Sale: Dr Card Clearing (or Cash), Cr Sales Revenue **and** Dr Cost of Goods Sold, Cr Inventory (at average cost)
- Card payout: Dr Cash + Dr Card Processing Fees, Cr Card Clearing
- Payroll, rent and utilities: Dr the expense account, Cr Cash
- Every journal entry must balance or it throws. The P&L and balance sheet are always computed from the journal.

## Architecture

```
Next.js 15 (App Router) + TypeScript + Tailwind + Framer Motion + Recharts
├─ components/        shell, pages, Agent Arena, cascade animation, voice
├─ app/api/data       one action endpoint for the UI (sale, invoice, pay, price, insights, payroll…)
├─ app/api/*          books (P&L, balance sheet, journal), items, inventory, analytics, arena, assistant, insights
├─ lib/core.ts        ledger primitives + the 90-day demo café
├─ lib/ledger.ts      LedgerService: cascade, reports, average cost
├─ lib/store.ts       getStore(): MongoDB Atlas | in-memory MongoDB | file
├─ lib/ai/            llm client (Luminal), advisor, arena, leak finder, learning, assistant
└─ lib/ocr.ts         Textract AnalyzeExpense → on-device tesseract.js fallback
```

The browser receives a lighter view of the books (older sales merged per day, older journal entries folded into a
balanced "balances brought forward" entry) with identical account balances, about 1 MB instead of 2.8 MB per refresh.

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
| `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` | Live agents, advisor and assistant on Luminal (`https://flash.luminal.cloud/v1`, `deepseek-ai/DeepSeek-V4.1-Flash`) |
| `MONGODB_URI` | MongoDB Atlas storage |
| `MUNSHI_AWS_REGION`, `MUNSHI_AWS_ACCESS_KEY_ID`, `MUNSHI_AWS_SECRET_ACCESS_KEY` (or `AWS_*` locally) | Amazon Textract invoice reading (Vercel and Amplify reserve the `AWS_` prefix) |
| `AUTH_SECRET` | Session signing in production |

Deploy: Vercel (used for the live demo) or AWS Amplify (`amplify.yml` included). Desktop: `npm run tauri dev`
(needs Rust). `npm run seed` resets the demo data.

## Known limitations

- Photo uploads on the hosted demo: with Textract blocked on our AWS accounts, on-device OCR inside a serverless
  function is slow. Use *Use sample invoice*, or run locally where on-device OCR works.
- Without `MONGODB_URI`, the hosted demo keeps data per server instance.
- The demo login signs everyone in as one owner. Google sign-in gives each owner their own books.

## Team

Person A (books engine) · Person B (design & frontend) · Person C (AI, sales, pitch).
