// Point-of-sale integration: turns a Square-style payment event into a sale and posts it through
// LedgerService.recordSale, the same cascade as POST /api/sales.
import crypto from 'node:crypto';
import type { LedgerService } from './ledger';
import { matchItem } from './ocr';
import { squarePaymentEventSchema, type PosWebhookResult } from './types';

/** Square signs each delivery: base64 HMAC-SHA256 of the notification URL followed by the raw body. */
export const squareSignature = (key: string, url: string, body: string) =>
  crypto.createHmac('sha256', key).update(url + body).digest('base64');
export function validSquareSignature(key: string, url: string, body: string, signature: string | null) {
  const expected = Buffer.from(squareSignature(key, url, body)), given = Buffer.from(signature ?? '');
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

export async function handleSquareEvent(ledger: LedgerService, businessId: string | null, payload: unknown): Promise<PosWebhookResult> {
  const event = squarePaymentEventSchema.parse(payload);
  const { payment, order } = event.data.object;
  if (!event.type.startsWith('payment.')) return { ok: true, ignored: `Event type ${event.type} is not a payment` };
  if (payment.status !== 'COMPLETED') return { ok: true, ignored: `Payment is ${payment.status}, not COMPLETED` };

  const items = await ledger.items(businessId);
  const lines: { itemId: string; qty: number }[] = [], unmapped: string[] = [];
  for (const l of order.line_items) {
    const item = items.find(i => i._id === l.catalog_object_id) ?? matchItem(items, l.name);
    const qty = Math.round(Number(l.quantity));
    if (item && qty > 0) lines.push({ itemId: item._id, qty });
    else unmapped.push(l.name || l.catalog_object_id || 'Unnamed line');
  }
  if (!lines.length) throw new UnmappedError(`None of the line items match an item here: ${unmapped.join(', ')}`);

  const charged = payment.total_money ?? payment.amount_money;
  const result = await ledger.recordSale(businessId, { lines, paymentMethod: payment.source_type === 'CASH' ? 'cash' : 'card', channel: 'counter' }, `sq-${payment.id}`);
  return { ok: true, ...result, unmapped, posTotal: charged ? charged.amount / 100 : null };
}
export class UnmappedError extends Error {}
