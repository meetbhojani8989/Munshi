import { describe, it, expect, beforeEach } from 'vitest';
import { balances, seed } from './core';
import { LedgerService, NotFoundError } from './ledger';
import { memoryStore, type BusinessStore } from './store';

let store: BusinessStore, ledger: LedgerService;
beforeEach(() => { store = memoryStore(seed()); ledger = new LedgerService(store); });
const cafe = async () => (await store.get('cafe'))!;
const stockAtCost = (b: Awaited<ReturnType<typeof cafe>>) => b.items.reduce((s, i) => s + i.stock * i.cost, 0);

describe('LedgerService', () => {
  it('seeds books that balance, with Inventory equal to stock at cost', async () => {
    const b = await cafe(), sheet = await ledger.balanceSheet('cafe');
    expect(sheet.balanced).toBe(true);
    expect(sheet.totalAssets).toBeCloseTo(sheet.totalLiabilities + sheet.totalEquity, 2);
    expect(balances(b).Inventory).toBeCloseTo(stockAtCost(b), 2);
    expect(b.cash).toBeCloseTo(balances(b).Cash + balances(b)['Card Clearing'], 2);
    expect((await ledger.journal('cafe')).balanced).toBe(true);
  });

  it('throws on an unbalanced entry and stores nothing', async () => {
    const count = (await cafe()).entries.length;
    await expect(ledger.postEntry('cafe', 'bad', [{ account: 'Cash', debit: 10, credit: 0 }])).rejects.toThrow('Unbalanced');
    expect((await cafe()).entries).toHaveLength(count);
    const entry = await ledger.postEntry('cafe', 'Rent', [{ account: 'Rent', debit: 500, credit: 0 }, { account: 'Cash', debit: 0, credit: 500 }]);
    expect(entry.sourceType).toBe('adjustment');
    expect((await ledger.pnl('cafe')).expenses).toEqual([{ account: 'Rent', amount: 500 }]);
    expect((await ledger.balanceSheet('cafe')).balanced).toBe(true);
  });

  it('posts an invoice through inventory, payables and average cost', async () => {
    const before = await cafe(), item = before.items[0], ap = -balances(before)['Accounts Payable'];
    const { invoice, changes } = await ledger.recordInvoice('cafe', { vendor: 'Keystone Produce', lines: [{ itemId: item.id, name: item.name, qty: 10, unitPrice: 3 }], tax: 1.5 });
    const after = await cafe(), now = after.items[0];

    expect(invoice).toMatchObject({ vendor: 'Keystone Produce', status: 'unpaid', tax: 1.5, total: 31.5 });
    expect(invoice.lines).toEqual([{ itemId: item.id, name: item.name, qty: 10, unitPrice: 3 }]);
    expect(now.stock).toBe(item.stock + 10);
    expect(now.cost).toBeCloseTo((item.stock * item.cost + 30) / (item.stock + 10), 6);
    expect(-balances(after)['Accounts Payable']).toBeCloseTo(ap + 31.5, 2);
    expect(balances(after).Inventory).toBeCloseTo(stockAtCost(after), 2);
    expect((await ledger.balanceSheet('cafe')).balanced).toBe(true);

    expect(changes.map(c => c.kind)).toEqual(['inventory', 'payable', 'journal', 'journal', 'margin']);
    expect(changes[0]).toMatchObject({ before: item.stock, after: item.stock + 10 });
    expect(changes[1]).toMatchObject({ before: ap, after: ap + 31.5 });
    expect(changes[4].after!).toBeLessThan(changes[4].before!); // cost went up, margin went down
  });

  it('matches invoice lines by name and adds products it has not seen', async () => {
    const before = await cafe();
    const { invoice } = await ledger.recordInvoice('cafe', { vendor: 'Fresh Supply', date: '2026-10-01', lines: [{ name: 'chicken wrap', qty: 2, unitPrice: 2 }, { name: 'Oat Milk', qty: 6, unitPrice: 2.4 }] });
    const after = await cafe(), added = after.items.at(-1)!;
    expect(invoice.date).toBe('2026-10-01');
    expect(invoice.lines[0].itemId).toBe(before.items[0].id);
    expect(after.items).toHaveLength(before.items.length + 1);
    expect(added).toMatchObject({ name: 'Oat Milk', stock: 6, cost: 2.4, price: 6 });
    await expect(ledger.recordInvoice('cafe', { vendor: 'X', lines: [{ itemId: 'nope', name: '', qty: 1, unitPrice: 1 }] })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('posts a sale through cash, revenue, cost of goods sold and stock', async () => {
    const before = await cafe(), item = before.items.find(i => i.stock >= 3)!, pnl = await ledger.pnl('cafe');
    const { sale, changes } = await ledger.recordSale('cafe', { lines: [{ itemId: item.id, qty: 1 }, { itemId: item.id, qty: 2 }], paymentMethod: 'cash' });
    const after = await cafe(), now = await ledger.pnl('cafe');

    expect(sale).toMatchObject({ channel: 'counter', paymentMethod: 'cash', total: Math.round(item.price * 300) / 100 });
    expect(sale.lines).toEqual([{ itemId: item.id, name: item.name, qty: 3, unitPrice: item.price }]);
    expect(after.items.find(i => i.id === item.id)!.stock).toBe(item.stock - 3);
    expect(now.revenue - pnl.revenue).toBeCloseTo(3 * item.price, 2);
    expect(now.cogs - pnl.cogs).toBeCloseTo(3 * item.cost, 2);
    expect(balances(after).Cash - balances(before).Cash).toBeCloseTo(3 * item.price, 2);
    expect(balances(after).Inventory).toBeCloseTo(stockAtCost(after), 2);
    expect(changes.map(c => c.kind)).toEqual(['inventory', 'cash', 'journal']);
    expect((await ledger.journal('cafe', { limit: 1 })).entries[0]).toMatchObject({ sourceType: 'sale', sourceId: sale._id });
  });

  it('rejects a sale beyond stock and leaves the business untouched', async () => {
    const before = structuredClone(await cafe()), item = before.items[0];
    await expect(ledger.recordSale('cafe', { lines: [{ itemId: item.id, qty: item.stock }, { itemId: item.id, qty: 1 }] })).rejects.toThrow('Insufficient stock');
    await expect(ledger.recordSale('cafe', { lines: [] })).rejects.toThrow();
    await expect(ledger.recordSale('nope', { lines: [{ itemId: item.id, qty: 1 }] })).rejects.toBeInstanceOf(NotFoundError);
    expect(await cafe()).toEqual(before);
  });

  it('pays an invoice once, out of cash', async () => {
    const before = await cafe(), unpaid = before.invoices.find(v => !v.paid)!;
    const { invoice, changes } = await ledger.payInvoice('cafe', unpaid.id);
    const after = await cafe();
    expect(invoice.status).toBe('paid');
    expect(balances(after).Cash).toBeCloseTo(balances(before).Cash - unpaid.total, 2);
    expect(balances(after)['Accounts Payable']).toBeCloseTo(balances(before)['Accounts Payable'] + unpaid.total, 2);
    expect(changes.map(c => c.kind)).toEqual(['payable', 'cash', 'journal']);
    expect((await ledger.journal('cafe', { limit: 1 })).entries[0].sourceType).toBe('payment');
    await expect(ledger.payInvoice('cafe', unpaid.id)).rejects.toThrow('already paid');
  });

  it('keeps simultaneous sales from overselling', async () => {
    const item = (await cafe()).items.find(i => i.stock >= 2)!;
    const results = await Promise.allSettled(Array.from({ length: item.stock + 2 }, () => ledger.recordSale('cafe', { lines: [{ itemId: item.id, qty: 1 }] })));
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(item.stock);
    expect((await ledger.item('cafe', item.id)).stockQty).toBe(0);
  });

  it('reports profit and loss for a date range from the journal', async () => {
    const b = await cafe(), day = b.sales[0].date;
    const expected = b.sales.filter(s => s.date === day).reduce((s, x) => s + x.total, 0);
    const pnl = await ledger.pnl('cafe', day, day);
    expect(pnl.revenue).toBeCloseTo(expected, 2);
    expect(pnl.grossProfit).toBeCloseTo(pnl.revenue - pnl.cogs, 2);
    expect((await ledger.pnl('cafe', '1999-01-01', '1999-12-31')).revenue).toBe(0);
    expect((await ledger.balanceSheet('cafe', '1999-12-31')).totalAssets).toBe(0);
  });

  it('changes a price and recalculates the margin', async () => {
    const item = (await ledger.items('cafe'))[0];
    const updated = await ledger.updateItem('cafe', item._id, { price: item.price + 1 });
    expect(updated.price).toBe(item.price + 1);
    expect(updated.margin).toBeCloseTo(item.margin + 1, 2);
    expect(updated.unitCost).toBe(item.unitCost);
    await expect(ledger.updateItem('cafe', item._id, {})).rejects.toThrow();
    await expect(ledger.updateItem('cafe', 'nope', { price: 2 })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('summarises analytics that agree with the books', async () => {
    const a = await ledger.analytics('cafe', 30), pnl = await ledger.pnl('cafe', a.from, a.to), inv = await ledger.inventory('cafe');
    expect(a.kpis.revenue).toBeCloseTo(pnl.revenue, 2);
    expect(a.kpis.grossProfit).toBeCloseTo(pnl.grossProfit, 2);
    expect(a.kpis.inventoryValue).toBeCloseTo(inv.totalValue, 1);
    expect(a.daily).toHaveLength(30);
    expect(a.daily.reduce((s, d) => s + d.revenue, 0)).toBeCloseTo(a.kpis.revenue, 2);
    expect(a.salesByHour.reduce((s, c) => s + c.orders, 0)).toBe(a.kpis.orders);
    expect(a.salesByHour.every(c => c.weekday >= 0 && c.weekday <= 6 && c.hour >= 0 && c.hour <= 23)).toBe(true);
    expect(a.itemMargins).toHaveLength(25);
    expect(a.channels.map(c => c.channel).sort()).toEqual(['counter', 'online']);
    expect((await ledger.business()).id).toBe('cafe');
  });
});
