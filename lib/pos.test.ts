import { describe, it, expect, beforeEach } from 'vitest';
import { seed } from './core';
import { LedgerService } from './ledger';
import { handleSquareEvent, squareSignature, UnmappedError, validSquareSignature } from './pos';
import { memoryStore, type BusinessStore } from './store';

let store: BusinessStore, ledger: LedgerService;
beforeEach(() => { store = memoryStore(seed()); ledger = new LedgerService(store); });
const event = (lines: { name?: string; quantity?: string; catalog_object_id?: string }[], payment: Record<string, unknown> = {}) => ({
  merchant_id: 'M1', type: 'payment.updated', event_id: 'e1',
  data: { type: 'payment', id: 'pay_1', object: {
    payment: { id: 'pay_1', status: 'COMPLETED', source_type: 'CARD', total_money: { amount: 1234, currency: 'USD' }, ...payment },
    order: { id: 'ord_1', line_items: lines },
  } },
});

describe('Square payment webhook', () => {
  it('posts the payment through the sale cascade, matching items by name or id', async () => {
    const before = (await store.get('cafe'))!, [a, b] = before.items.filter(i => i.stock >= 2);
    const result = await handleSquareEvent(ledger, 'cafe', event([{ name: a.name.toUpperCase(), quantity: '2' }, { name: 'whatever', catalog_object_id: b.id, quantity: '1' }, { name: 'Gift Wrap', quantity: '1' }]));
    if (!('sale' in result)) throw Error('expected a sale');
    const after = (await store.get('cafe'))!;

    expect(result).toMatchObject({ ok: true, duplicate: false, unmapped: ['Gift Wrap'], posTotal: 12.34 });
    expect(result.sale).toMatchObject({ _id: 'sq-pay_1', channel: 'counter', paymentMethod: 'card', total: Math.round((2 * a.price + b.price) * 100) / 100 });
    expect(result.changes.map(c => c.kind)).toEqual(['inventory', 'inventory', 'cash', 'journal']);
    expect(after.items.find(i => i.id === a.id)!.stock).toBe(a.stock - 2);
    expect(after.entries[0]).toMatchObject({ source: 'sq-pay_1' });
    expect((await ledger.journal('cafe', { limit: 1 })).entries[0].sourceType).toBe('sale');
    expect((await ledger.balanceSheet('cafe')).balanced).toBe(true);
  });

  it('posts a redelivered payment only once', async () => {
    const item = (await store.get('cafe'))!.items.find(i => i.stock >= 2)!;
    await handleSquareEvent(ledger, 'cafe', event([{ name: item.name }], { source_type: 'CASH' }));
    const again = await handleSquareEvent(ledger, 'cafe', event([{ name: item.name }], { source_type: 'CASH' }));
    expect(again).toMatchObject({ duplicate: true, changes: [], sale: { paymentMethod: 'cash' } });
    expect((await store.get('cafe'))!.items.find(i => i.id === item.id)!.stock).toBe(item.stock - 1);
  });

  it('ignores payments that are not completed and rejects ones it cannot map', async () => {
    const sales = (await store.get('cafe'))!.sales.length;
    expect(await handleSquareEvent(ledger, 'cafe', event([{ name: 'Chicken Wrap' }], { status: 'PENDING' }))).toMatchObject({ ok: true, ignored: expect.stringContaining('PENDING') });
    expect(await handleSquareEvent(ledger, 'cafe', { ...event([{ name: 'Chicken Wrap' }]), type: 'refund.created' })).toHaveProperty('ignored');
    await expect(handleSquareEvent(ledger, 'cafe', event([{ name: 'Gift Wrap' }]))).rejects.toBeInstanceOf(UnmappedError);
    await expect(handleSquareEvent(ledger, 'cafe', { type: 'payment.updated' })).rejects.toThrow();
    await expect(handleSquareEvent(ledger, 'cafe', event([{ name: 'Chicken Wrap', quantity: '9999' }]))).rejects.toThrow('Insufficient stock');
    expect((await store.get('cafe'))!.sales).toHaveLength(sales);
  });

  it('verifies Square signatures', () => {
    const signature = squareSignature('key', 'https://x.test/api/pos/webhook', '{"a":1}');
    expect(validSquareSignature('key', 'https://x.test/api/pos/webhook', '{"a":1}', signature)).toBe(true);
    expect(validSquareSignature('key', 'https://x.test/api/pos/webhook', '{"a":2}', signature)).toBe(false);
    expect(validSquareSignature('other', 'https://x.test/api/pos/webhook', '{"a":1}', signature)).toBe(false);
    expect(validSquareSignature('key', 'https://x.test/api/pos/webhook', '{"a":1}', null)).toBe(false);
  });
});
