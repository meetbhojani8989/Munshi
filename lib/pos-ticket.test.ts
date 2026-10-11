import { describe, it, expect } from 'vitest';
import { seed } from './core';
import { LedgerService } from './ledger';
import { handleSquareEvent } from './pos';
import { randomTicket, squarePaymentEvent } from './pos-ticket';
import { memoryStore } from './store';
import { squarePaymentEventSchema } from './types';

describe('simulated café tickets', () => {
  const menu = seed()[0].items;

  it('never sells more than is in stock, and skips sold-out items', () => {
    const stocked = menu.map((i, n) => ({ ...i, stock: n % 2 ? 0 : 1 }));
    for (let n = 0; n < 300; n++) {
      const lines = randomTicket(stocked, n % 24);
      expect(lines.length).toBeGreaterThan(0);
      for (const l of lines) { expect(l.item.stock).toBe(1); expect(l.qty).toBe(1); }
    }
    expect(randomTicket(menu.map(i => ({ ...i, stock: 0 })))).toEqual([]);
    expect(randomTicket(menu, 9, new Set(menu.slice(1).map(i => i.id))).map(l => l.item.id)).toEqual([menu[0].id]);
  });

  it('builds an event the webhook accepts and posts in full', async () => {
    const ledger = new LedgerService(memoryStore(seed()));
    const lines = [{ item: menu[1], qty: 2 }, { item: menu[6], qty: 1 }];
    const event = squarePaymentEvent(lines, true);
    expect(() => squarePaymentEventSchema.parse(event)).not.toThrow();
    const result = await handleSquareEvent(ledger, 'cafe', event);
    if (!('sale' in result)) throw Error('expected a sale');
    expect(result.unmapped).toEqual([]);
    expect(result.sale.paymentMethod).toBe('cash');
    expect(result.sale.total).toBe(result.posTotal);
    expect(result.sale.lines.map(l => [l.itemId, l.qty])).toEqual([[menu[1].id, 2], [menu[6].id, 1]]);
  });
});
