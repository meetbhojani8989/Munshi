// Sends a realistic café sale to POST /api/pos/webhook every few seconds, as a Square-style payment event.
//   npm run pos:simulate
//   POS_URL=http://localhost:3000  POS_INTERVAL_MS=5000  POS_BUSINESS=cafe  POS_COUNT=0 (0 = until Ctrl-C)
import fs from 'node:fs';
import crypto from 'node:crypto';
import type { Item } from '../lib/core';
for (const f of ['.env.local', '.env']) if (fs.existsSync(f)) process.loadEnvFile(f);

const base = (process.env.POS_URL || 'http://localhost:3000').replace(/\/$/, '');
const interval = Number(process.env.POS_INTERVAL_MS) || 5000, limit = Number(process.env.POS_COUNT) || 0;
const businessId = process.env.POS_BUSINESS || 'cafe';
const url = `${base}/api/pos/webhook?businessId=${encodeURIComponent(businessId)}`;
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const id = () => crypto.randomBytes(11).toString('base64url');

async function main() {
  const { seed } = await import('../lib/core');
  const { squareSignature } = await import('../lib/pos');
  const found = seed().find(b => b.id === businessId);
  if (!found) throw Error(`Unknown business: ${businessId}`);
  const menu: Item[] = found.items;
  const isDrink = (i: Item) => /latte|cappuccino|espresso|brew|tea|lemonade|water/i.test(i.name);
  const drinks = menu.filter(isDrink), food = menu.filter(i => !isDrink(i));
  const soldOut = new Set<string>();

  // Most tickets are a drink, often with something to eat; mornings lean to drinks, midday to food.
  function ticket() {
    const hour = new Date().getHours(), lunch = hour >= 11 && hour < 15;
    const available = (list: Item[]) => { const left = list.filter(i => !soldOut.has(i.id)); return left.length ? left : list; };
    const chosen = new Map<string, { item: Item; qty: number }>();
    const add = (list: Item[]) => { const item = pick(available(list)); chosen.set(item.id, { item, qty: (chosen.get(item.id)?.qty || 0) + (Math.random() < 0.15 ? 2 : 1) }); };
    if (Math.random() < (lunch ? 0.6 : 0.9)) add(drinks);
    if (Math.random() < (lunch ? 0.9 : 0.45) || !chosen.size) add(food);
    if (Math.random() < 0.2) add(Math.random() < 0.5 ? drinks : food);
    return [...chosen.values()];
  }

  console.log(`Sending a sale to ${url} every ${interval / 1000}s. Ctrl-C to stop.`);
  for (let n = 1; !limit || n <= limit; n++) {
    const lines = ticket(), cash = Math.random() < 0.2;
    const total = lines.reduce((s, l) => s + Math.round(l.item.price * 100) * l.qty, 0);
    const paymentId = id(), orderId = id(), now = new Date().toISOString();
    const body = JSON.stringify({
      merchant_id: 'MUNSHI_DEMO_MERCHANT', type: 'payment.updated', event_id: crypto.randomUUID(), created_at: now,
      data: { type: 'payment', id: paymentId, object: {
        payment: {
          id: paymentId, status: 'COMPLETED', source_type: cash ? 'CASH' : 'CARD', order_id: orderId, location_id: 'MUNSHI_DEMO_LOCATION',
          amount_money: { amount: total, currency: 'USD' }, total_money: { amount: total, currency: 'USD' }, created_at: now, updated_at: now,
        },
        order: { id: orderId, line_items: lines.map(l => ({ uid: id(), name: l.item.name, quantity: String(l.qty), base_price_money: { amount: Math.round(l.item.price * 100), currency: 'USD' } })) },
      } },
    });
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
