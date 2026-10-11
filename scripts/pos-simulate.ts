// Sends a realistic café sale to POST /api/pos/webhook every few seconds, as a Square-style payment event.
//   npm run pos:simulate
//   POS_URL=http://localhost:3000  POS_INTERVAL_MS=5000  POS_BUSINESS=cafe  POS_COUNT=0 (0 = until Ctrl-C)
import fs from 'node:fs';
for (const f of ['.env.local', '.env']) if (fs.existsSync(f)) process.loadEnvFile(f);

const base = (process.env.POS_URL || 'http://localhost:3000').replace(/\/$/, '');
const interval = Number(process.env.POS_INTERVAL_MS) || 5000, limit = Number(process.env.POS_COUNT) || 0;
const businessId = process.env.POS_BUSINESS || 'cafe';
const url = `${base}/api/pos/webhook?businessId=${encodeURIComponent(businessId)}`;

async function main() {
  const { seed } = await import('../lib/core');
  const { squareSignature } = await import('../lib/pos');
  const { randomTicket, squarePaymentEvent } = await import('../lib/pos-ticket');
  const menu = seed().find(b => b.id === businessId)?.items;
  if (!menu) throw Error(`Unknown business: ${businessId}`);
  const soldOut = new Set<string>();

  console.log(`Sending a sale to ${url} every ${interval / 1000}s. Ctrl-C to stop.`);
  for (let n = 1; !limit || n <= limit; n++) {
    const lines = randomTicket(menu, new Date().getHours(), soldOut);
    if (!lines.length) { console.log('Everything is sold out. Run `npm run seed` to restock.'); return; }
    const event = squarePaymentEvent(lines), cash = event.data.object.payment.source_type === 'CASH';
    const total = event.data.object.payment.total_money!.amount, body = JSON.stringify(event);
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    if (key) headers['x-square-hmacsha256-signature'] = squareSignature(key, process.env.SQUARE_WEBHOOK_URL || url, body);
    const summary = lines.map(l => `${l.qty} x ${l.item.name}`).join(', ');
    const time = new Date().toLocaleTimeString();
    try {
      const res = await fetch(url, { method: 'POST', headers, body });
      const out = await res.json().catch(() => ({}));
      if (res.ok) console.log(`${time}  ${cash ? 'cash' : 'card'}  $${(out.sale?.total ?? total / 100).toFixed(2)}  ${summary}`);
      else {
        console.log(`${time}  not posted (${res.status}: ${out.error ?? 'no message'})  ${summary}`);
        if (res.status === 409) for (const l of lines) soldOut.add(l.item.id); // steer later tickets away from what ran out
      }
    } catch (e) {
      console.log(`${time}  could not reach ${base} (${e instanceof Error ? e.message : e}). Is the app running?`);
    }
    if (!limit || n < limit) await new Promise(r => setTimeout(r, interval));
  }
}
main().catch(e => { console.error(e); process.exit(1); });
