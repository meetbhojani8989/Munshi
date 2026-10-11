import { describe, it, expect, afterAll } from 'vitest';
import { sell, receive, pay } from './core';
import { MongoBusinessStore, disconnectDatabase } from './models';

// Runs against the in-memory MongoDB that connectDatabase falls back to when MONGODB_URI is unset.
describe('MongoBusinessStore', { timeout: 120_000 }, () => {
  const store = new MongoBusinessStore();
  afterAll(disconnectDatabase);

  it('seeds an empty database and reads the businesses back unchanged', async () => {
    const listed = await store.list();
    expect(listed.map(b => b.id)).toEqual(['cafe', 'retail']);
    const seeded = await store.reset();
    expect(await store.list()).toEqual(seeded);
    expect(await store.get('nope')).toBeNull();
  });

  it('persists sales, invoices and payments, keeping newest-first order', async () => {
    const b = (await store.get('cafe'))!;
    const item = b.items.find(i => i.stock >= 2)!;
    const sale = sell(b, [{ id: item.id, qty: 2 }], 'Cash');
    const invoice = receive(b, 'Test vendor', [{ id: item.id, qty: 5, cost: 1.25 }]);
    pay(b, invoice.id);
    b.eventDay = true;
    await store.save(b);

    const again = (await store.get('cafe'))!;
    expect(again).toEqual(b);
    expect(again.sales[0].id).toBe(sale.id);
    expect(again.invoices[0]).toMatchObject({ id: invoice.id, paid: true });
    expect(again.entries.slice(0, 3).map(e => e.source)).toEqual([invoice.id, invoice.id, sale.id]);

    // Saving again must not duplicate the append-only collections.
    await store.save(again);
    expect((await store.get('cafe'))!.entries).toHaveLength(b.entries.length);
    expect((await store.get('retail'))!.sales.some(s => s.id === sale.id)).toBe(false);
  });
});
