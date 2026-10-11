# Munshi

Munshi is a demo AI back office for small businesses. Every sale and supplier bill updates inventory and balanced books.

## Run in a browser

```bash
npm install
npm run dev
```

Open http://localhost:3000/login and choose **Try demo account**.

## Run as a macOS desktop app

```bash
npm install
npm run tauri dev
```

The Tauri development app starts Munshi on `127.0.0.1:3417` and opens it in a desktop window. It needs the Rust toolchain and macOS Command Line Tools. The first run compiles Tauri and may take several minutes.

To build an app bundle, run `npm run tauri build`. The packaged desktop app starts a bundled Next.js server and requires Node.js to be installed on the computer. Its business data is saved under Munshi's macOS application data folder. In development, demo data is saved at `data/businesses.json`. Changes survive app restarts; `npm run seed` resets the development data.

## Two-minute demo

1. Try the demo account and inspect Today; switch between the café and retail shop.
2. Open Sales, add Chicken Wrap, complete a card sale, and observe the cascade.
3. Open Inventory and Books to see stock and balanced journal entries change.
4. Open Scan, use the sample invoice, edit the parsed lines, and confirm.
5. Open Insights, approve or test a suggestion, then visit Pricing Lab and Scorecard.
6. Toggle Event Day Mode on Today, quit and reopen, and see that the change remains.

## Configuration

Copy `.env.example` to `.env.local` for optional production integrations. The demo runs without API keys. Google and Apple buttons use demo login as a local fallback when OAuth is not configured. The demo's external OCR, AI, and payments are mock providers.
