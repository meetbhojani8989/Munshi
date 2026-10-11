// Makes realistic café sales as Square-style payment events. No Node or browser APIs beyond `crypto`,
// so the terminal simulator (scripts/pos-simulate.ts) and the in-app "Go live" button share it.
import type { SquarePaymentEvent } from './types';

export type MenuItem = { id: string; name: string; price: number; stock?: number };
export type TicketLine = { item: MenuItem; qty: number };

const isDrink = (i: MenuItem) => /latte|cappuccino|espresso|brew|tea|lemonade|water/i.test(i.name);
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const id = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16);

/** One customer's order: usually a drink, often with food; mornings lean to drinks, midday to food. Sold-out items are skipped. */
export function randomTicket(menu: MenuItem[], hour = new Date().getHours(), skip: ReadonlySet<string> = new Set()): TicketLine[] {
  const left = (i: MenuItem) => (i.stock ?? Infinity) > 0 && !skip.has(i.id);
  const drinks = menu.filter(i => isDrink(i) && left(i)), food = menu.filter(i => !isDrink(i) && left(i));
  const lunch = hour >= 11 && hour < 15;
  const chosen = new Map<string, TicketLine>();
  const add = (list: MenuItem[]) => {
    if (!list.length) return;
    const item = pick(list), had = chosen.get(item.id)?.qty ?? 0;
    const qty = Math.min(had + (Math.random() < 0.15 ? 2 : 1), item.stock ?? Infinity);
    chosen.set(item.id, { item, qty });
  };
  if (Math.random() < (lunch ? 0.6 : 0.9)) add(drinks);
  if (Math.random() < (lunch ? 0.9 : 0.45) || !chosen.size) add(food);
  if (!chosen.size) add(drinks);
  if (Math.random() < 0.2) add(Math.random() < 0.5 ? drinks : food);
  return [...chosen.values()];
}

/** The payment event a Square point of sale would send for this order. About one sale in five is cash. */
export function squarePaymentEvent(lines: TicketLine[], cash = Math.random() < 0.2): SquarePaymentEvent {
  const cents = (n: number) => Math.round(n * 100);
  const total = lines.reduce((s, l) => s + cents(l.item.price) * l.qty, 0);
  const paymentId = id(), orderId = id(), now = new Date().toISOString();
  return {
    merchant_id: 'MUNSHI_DEMO_MERCHANT', type: 'payment.updated', event_id: crypto.randomUUID(), created_at: now,
    data: { type: 'payment', id: paymentId, object: {
      payment: {
        id: paymentId, status: 'COMPLETED', source_type: cash ? 'CASH' : 'CARD', order_id: orderId, location_id: 'MUNSHI_DEMO_LOCATION',
        amount_money: { amount: total, currency: 'USD' }, total_money: { amount: total, currency: 'USD' },
      },
      order: { id: orderId, line_items: lines.map(l => ({ uid: id(), name: l.item.name, quantity: String(l.qty), catalog_object_id: l.item.id, base_price_money: { amount: cents(l.item.price), currency: 'USD' } })) },
    } },
  };
}
