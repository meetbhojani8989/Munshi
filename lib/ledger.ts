// LedgerService: the books engine. Every invoice, sale and payment goes through here, posts balanced
// journal entries (lib/core.ts throws on an unbalanced one) and reports what changed as a cascade.
// P&L and balance sheet are always computed from the journal, never stored.
import { balances, pay, post, receive, sell } from './core';
import type { Business, Entry as StoredEntry, Invoice as StoredInvoice, Item as StoredItem, Line, Sale as StoredSale } from './core';
import { getStore, type BusinessStore } from './store';
import {
  ACCOUNTS, accountType, invoiceInputSchema, itemPatchSchema, saleInputSchema,
  type AnalyticsSummary, type BalanceSheet, type CascadeChange, type InventoryResponse, type Invoice, type InvoiceInput,
  type InvoiceResult, type Item, type ItemDetail, type ItemPatch, type JournalEntry, type JournalResponse,
  type ProfitAndLoss, type Sale, type SaleInput, type SaleResult,
} from './types';

export class NotFoundError extends Error {}

const TIME_ZONE = 'America/New_York'; // hour-of-day analytics are in the shop's local time
const cents = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const ratio = (n: number) => Math.round(n * 10000) / 10000;
const usd = (n: number) => `$${cents(n).toFixed(2)}`;
const today = () => new Date().toISOString().slice(0, 10);
const marginPct = (i: { price: number; cost: number }) => (i.price ? ratio((i.price - i.cost) / i.price) : 0);

// ---- Storage shape -> shared contract ----
export const toItem = (b: Business, i: StoredItem): Item => ({
  _id: i.id, businessId: b.id, name: i.name, category: i.category, price: cents(i.price), unitCost: cents(i.cost),
  unit: 'each', stockQty: i.stock, reorderPoint: i.reorder,
});
export const toItemDetail = (b: Business, i: StoredItem): ItemDetail => ({
  ...toItem(b, i), stockValue: cents(i.stock * i.cost), margin: cents(i.price - i.cost), marginPct: marginPct(i),
  unitsSold: i.units, status: i.stock <= 0 ? 'out' : i.stock <= i.reorder ? 'low' : 'ok',
});
export const toInvoice = (b: Business, v: StoredInvoice): Invoice => ({
  _id: v.id, businessId: b.id, vendor: v.vendor, date: v.date,
  lines: v.items.map(l => ({ itemId: l.id, name: l.name, qty: l.qty, unitPrice: cents(l.cost) })),
  tax: cents(v.tax ?? 0), total: cents(v.total), status: v.paid ? 'paid' : 'unpaid',
});
export const toSale = (b: Business, s: StoredSale): Sale => ({
  _id: s.id, businessId: b.id, timestamp: s.time ?? `${s.date}T12:00:00.000Z`,
  channel: s.channel === 'In store' ? 'counter' : 'online', paymentMethod: s.payment === 'Cash' ? 'cash' : 'card',
  lines: s.items.map(l => ({ itemId: l.id, name: l.name, qty: l.qty, unitPrice: cents(l.price) })), total: cents(s.total),
});
function toJournal(b: Business, entries: StoredEntry[]): JournalEntry[] {
  const invoices = new Set(b.invoices.map(v => v.id)), sales = new Set(b.sales.map(s => s.id));
  return entries.map(e => ({
    _id: e.id, businessId: b.id, date: e.date, memo: e.memo, sourceId: e.source,
    sourceType: sales.has(e.source) ? 'sale' : !invoices.has(e.source) ? 'adjustment' : e.memo.startsWith('Paid') ? 'payment' : 'invoice',
    lines: e.lines.map(l => ({ account: l.account, debit: cents(l.debit), credit: cents(l.credit) })),
  }));
}

// ---- Reports, computed from journal entries ----
const inRange = (date: string, from?: string, to?: string) => (!from || date >= from) && (!to || date <= to);
function accountTotals(entries: StoredEntry[]) {
  const totals: Record<string, number> = {}; // debit minus credit
  for (const e of entries) for (const l of e.lines) totals[l.account] = (totals[l.account] || 0) + l.debit - l.credit;
  return totals;
}
export const isBalanced = (entries: StoredEntry[]) =>
  entries.every(e => Math.abs(e.lines.reduce((s, l) => s + l.debit - l.credit, 0)) < 0.005);

export function profitAndLoss(entries: StoredEntry[], from?: string, to?: string): ProfitAndLoss {
  const totals = accountTotals(entries.filter(e => inRange(e.date, from, to)));
  let revenue = 0, cogs = 0;
  const expenses: ProfitAndLoss['expenses'] = [];
  for (const [account, net] of Object.entries(totals)) {
    const type = accountType(account);
    if (type === 'revenue') revenue -= net;
    else if (account === ACCOUNTS.cogs) cogs += net;
    else if (type === 'expense' && Math.abs(net) >= 0.005) expenses.push({ account, amount: cents(net) });
  }
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  return {
    from: from ?? null, to: to ?? null, revenue: cents(revenue), cogs: cents(cogs), grossProfit: cents(revenue - cogs),
    grossMarginPct: revenue ? ratio((revenue - cogs) / revenue) : 0, expenses, totalExpenses: cents(totalExpenses),
    netIncome: cents(revenue - cogs - totalExpenses),
  };
}

export function balanceSheet(entries: StoredEntry[], asOf: string = today()): BalanceSheet {
  const totals = accountTotals(entries.filter(e => e.date <= asOf));
  const sheet: Pick<BalanceSheet, 'assets' | 'liabilities' | 'equity'> = { assets: [], liabilities: [], equity: [] };
  let retained = 0;
  for (const [account, net] of Object.entries(totals)) {
    const type = accountType(account);
    if (type === 'asset') sheet.assets.push({ account, balance: cents(net) });
    else if (type === 'liability') sheet.liabilities.push({ account, balance: cents(-net) });
    else if (type === 'equity') sheet.equity.push({ account, balance: cents(-net) });
    else retained -= net; // revenue and expense accounts roll up into retained earnings
  }
  sheet.equity.push({ account: 'Retained Earnings', balance: cents(retained) });
  const sum = (rows: { balance: number }[]) => cents(rows.reduce((s, r) => s + r.balance, 0));
  const totalAssets = sum(sheet.assets), totalLiabilities = sum(sheet.liabilities), totalEquity = sum(sheet.equity);
  return { asOf, ...sheet, totalAssets, totalLiabilities, totalEquity, balanced: Math.abs(totalAssets - totalLiabilities - totalEquity) < 0.01 && isBalanced(entries) };
}

// ---- Cascade: compare the business before and after an event ----
function cascade(before: Business, after: Business, touched: string[]): CascadeChange[] {
  const changes: CascadeChange[] = [];
  const was = new Map(before.items.map(i => [i.id, i]));
  const items = after.items.filter(i => touched.includes(i.id));
  for (const i of items) changes.push({ kind: 'inventory', label: `${i.name} in stock`, before: was.get(i.id)?.stock ?? 0, after: i.stock });
  const a = balances(before), z = balances(after);
  const moved = (account: string) => Math.abs((a[account] || 0) - (z[account] || 0)) >= 0.005;
  if (moved(ACCOUNTS.payables)) changes.push({ kind: 'payable', label: ACCOUNTS.payables, before: cents(-(a[ACCOUNTS.payables] || 0)), after: cents(-(z[ACCOUNTS.payables] || 0)) });
  for (const account of [ACCOUNTS.cash, ACCOUNTS.cardClearing])
    if (moved(account)) changes.push({ kind: 'cash', label: account, before: cents(a[account] || 0), after: cents(z[account] || 0) });
  const known = new Set(before.entries.map(e => e.id));
  for (const e of after.entries.filter(e => !known.has(e.id)).reverse()) {
    const side = (pick: (l: Line) => number) => e.lines.filter(l => pick(l) > 0).map(l => `${l.account} ${usd(pick(l))}`).join(', ');
    changes.push({ kind: 'journal', label: `${e.memo}: Dr ${side(l => l.debit)} / Cr ${side(l => l.credit)}` });
  }
  for (const i of items) {
    const old = was.get(i.id);
    if (!old || marginPct(old) !== marginPct(i)) changes.push({ kind: 'margin', label: `${i.name} margin %`, before: old ? cents(marginPct(old) * 100) : undefined, after: cents(marginPct(i) * 100) });
  }
  return changes;
}

/** The stock item with this name, or a new one (first time this product is bought) priced at a 60% margin for the owner to adjust. */
export function findOrCreateItem(b: Business, name: string, unitCost: number): StoredItem {
  const wanted = name.trim().toLowerCase();
  if (!wanted) throw Error('Invoice line needs an item or a name');
  let item = b.items.find(i => i.name.toLowerCase() === wanted);
  if (!item) {
    item = { id: `${b.id}-${crypto.randomUUID().slice(0, 8)}`, name: name.trim(), category: 'Uncategorized', price: cents(unitCost * 2.5) || 1, cost: unitCost, stock: 0, reorder: 0, units: 0 };
    b.items.push(item);
  }
  return item;
}

export class LedgerService {
  // Shared across Next.js route bundles, so two routes cannot change one business at the same moment.
  private queues: Map<string, Promise<unknown>> = ((globalThis as { __munshiQueues?: Map<string, Promise<unknown>> }).__munshiQueues ??= new Map());
  constructor(private store: BusinessStore = getStore()) {}

  /** The business with this id, or the first one (the demo café) when no id is given. */
  async business(id?: string | null): Promise<Business> {
    const b = id ? await this.store.get(id) : (await this.store.list())[0];
    if (!b) throw new NotFoundError('Business not found');
    return b;
  }

  // Applies a change to a private copy and saves only if it succeeds, so a rejected event leaves nothing
  // half-applied. Changes to one business run one at a time within this process.
  private change<T>(businessId: string | null | undefined, apply: (draft: Business, before: Business) => T): Promise<T> {
    const key = businessId || '';
    const run = (this.queues.get(key) ?? Promise.resolve()).catch(() => {}).then(async () => {
      const before = await this.business(businessId);
      const draft = structuredClone(before);
      const result = apply(draft, before);
      await this.store.save(draft);
      return result;
    });
    this.queues.set(key, run);
    return run;
  }

  // ---- Events ----
  /** Supplier invoice: Dr Inventory / Cr Accounts Payable; stock goes up at weighted average cost. */
  async recordInvoice(businessId: string | null | undefined, input: InvoiceInput): Promise<InvoiceResult> {
    const { vendor, date, lines, tax } = invoiceInputSchema.parse(input);
    return this.change(businessId, (b, before) => {
      const rows = lines.map(l => {
        const item = l.itemId ? b.items.find(i => i.id === l.itemId) : findOrCreateItem(b, l.name, l.unitPrice);
        if (!item) throw new NotFoundError(`Item not found: ${l.itemId}`);
        return { id: item.id, qty: l.qty, cost: l.unitPrice };
      });
      const invoice: StoredInvoice = receive(b, vendor, rows);
      if (date) { invoice.date = date; b.entries[0].date = date; }
      if (tax > 0) {
        post(b, `Tax on invoice from ${vendor}`, invoice.id, [{ account: ACCOUNTS.purchaseTax, debit: tax, credit: 0 }, { account: ACCOUNTS.payables, debit: 0, credit: tax }]);
        if (date) b.entries[0].date = date;
        invoice.tax = tax;
      }
      invoice.total = cents(invoice.total + tax);
      return { invoice: toInvoice(b, invoice), changes: cascade(before, b, rows.map(r => r.id)) };
    });
  }

  /** Sale: Dr Cash or Card Clearing / Cr Sales Revenue, and Dr Cost of Goods Sold / Cr Inventory at average cost. */
  async recordSale(businessId: string | null | undefined, input: SaleInput): Promise<SaleResult> {
    const { lines, paymentMethod, channel } = saleInputSchema.parse(input);
    const qty = new Map<string, number>(); // the same item on two lines is one stock check
    for (const l of lines) qty.set(l.itemId, (qty.get(l.itemId) || 0) + l.qty);
    return this.change(businessId, (b, before) => {
      const sale = sell(b, [...qty].map(([id, qty]) => ({ id, qty })), paymentMethod === 'cash' ? 'Cash' : 'Card', channel === 'counter' ? 'In store' : 'Online');
      return { sale: toSale(b, sale), changes: cascade(before, b, [...qty.keys()]) };
    });
  }

  /** Pay a vendor: Dr Accounts Payable / Cr Cash. */
  payInvoice(businessId: string | null | undefined, invoiceId: string): Promise<InvoiceResult> {
    return this.change(businessId, (b, before) => {
      const invoice = b.invoices.find(v => v.id === invoiceId);
      if (!invoice) throw new NotFoundError('Invoice not found');
      if (invoice.paid) throw Error('Invoice is already paid');
      pay(b, invoiceId);
      return { invoice: toInvoice(b, invoice), changes: cascade(before, b, []) };
    });
  }

  /** A manual journal entry. Throws "Unbalanced entry" unless debits equal credits. */
  postEntry(businessId: string | null | undefined, memo: string, lines: Line[]): Promise<JournalEntry> {
    return this.change(businessId, b => {
      post(b, memo, 'manual', lines);
      return toJournal(b, [b.entries[0]])[0];
    });
  }

  /** Price, name, category or reorder point. Cost and stock only change through invoices and sales. */
  async updateItem(businessId: string | null | undefined, itemId: string, patch: ItemPatch): Promise<ItemDetail> {
    const { reorderPoint, ...fields } = itemPatchSchema.parse(patch);
    return this.change(businessId, b => {
      const item = b.items.find(i => i.id === itemId);
      if (!item) throw new NotFoundError('Item not found');
      Object.assign(item, fields, reorderPoint === undefined ? {} : { reorder: reorderPoint });
      return toItemDetail(b, item);
    });
  }

  // ---- Reads ----
  async items(businessId?: string | null): Promise<ItemDetail[]> {
    const b = await this.business(businessId);
    return b.items.map(i => toItemDetail(b, i));
  }
  async item(businessId: string | null | undefined, itemId: string): Promise<ItemDetail> {
    const b = await this.business(businessId);
    const item = b.items.find(i => i.id === itemId);
    if (!item) throw new NotFoundError('Item not found');
    return toItemDetail(b, item);
  }
  async inventory(businessId?: string | null): Promise<InventoryResponse> {
    const items = await this.items(businessId);
    return {
      items, totalValue: cents(items.reduce((s, i) => s + i.stockValue, 0)), totalUnits: items.reduce((s, i) => s + i.stockQty, 0),
      lowStock: items.filter(i => i.status === 'low').length, outOfStock: items.filter(i => i.status === 'out').length,
    };
  }
  async invoices(businessId?: string | null, status?: string | null): Promise<Invoice[]> {
    const b = await this.business(businessId);
    return b.invoices.map(v => toInvoice(b, v)).filter(v => !status || v.status === status);
  }
  async sales(businessId?: string | null, q: { from?: string; to?: string; limit?: number } = {}): Promise<Sale[]> {
    const b = await this.business(businessId);
    return b.sales.filter(s => inRange(s.date, q.from, q.to)).slice(0, q.limit ?? 100).map(s => toSale(b, s));
  }
  async pnl(businessId?: string | null, from?: string, to?: string) {
    return profitAndLoss((await this.business(businessId)).entries, from, to);
  }
  async balanceSheet(businessId?: string | null, asOf?: string) {
    return balanceSheet((await this.business(businessId)).entries, asOf);
  }
  async journal(businessId?: string | null, q: { from?: string; to?: string; limit?: number; offset?: number } = {}): Promise<JournalResponse> {
    const b = await this.business(businessId);
    const entries = b.entries.filter(e => inRange(e.date, q.from, q.to));
    const offset = q.offset ?? 0;
    return { total: entries.length, entries: toJournal(b, entries.slice(offset, offset + (q.limit ?? 50))), balanced: isBalanced(b.entries) };
  }

  async analytics(businessId?: string | null, days = 30): Promise<AnalyticsSummary> {
    const b = await this.business(businessId);
    const day = (back: number) => new Date(Date.now() - back * 86400000).toISOString().slice(0, 10);
    const to = day(0), from = day(days - 1), previousFrom = day(2 * days - 1);
    const sales = b.sales.filter(s => inRange(s.date, from, to));
    const profitOf = (s: StoredSale) => s.items.reduce((p, l) => p + l.qty * (l.price - l.cost), 0);
    const revenue = sales.reduce((s, x) => s + x.total, 0), profit = sales.reduce((s, x) => s + profitOf(x), 0);
    const previous = b.sales.filter(s => s.date >= previousFrom && s.date < from).reduce((s, x) => s + x.total, 0);
    const book = balances(b);

    const daily = new Map(Array.from({ length: days }, (_, n) => [day(days - 1 - n), { revenue: 0, profit: 0, orders: 0 }]));
    const hours = new Map<string, { weekday: number; hour: number; revenue: number; orders: number }>();
    const perItem = new Map<string, { unitsSold: number; revenue: number; profit: number }>();
    const channels = new Map<Sale['channel'], { revenue: number; orders: number }>();
    const clock = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, weekday: 'short', hour: 'numeric', hourCycle: 'h23' });
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const s of sales) {
      const d = daily.get(s.date);
      if (d) { d.revenue += s.total; d.profit += profitOf(s); d.orders++; }
      if (s.time) {
        const parts = clock.formatToParts(new Date(s.time));
        const weekday = weekdays.indexOf(parts.find(p => p.type === 'weekday')!.value), hour = Number(parts.find(p => p.type === 'hour')!.value);
        const cell = hours.get(`${weekday}-${hour}`) ?? { weekday, hour, revenue: 0, orders: 0 };
        cell.revenue += s.total; cell.orders++;
        hours.set(`${weekday}-${hour}`, cell);
      }
      for (const l of s.items) {
        const row = perItem.get(l.id) ?? { unitsSold: 0, revenue: 0, profit: 0 };
        row.unitsSold += l.qty; row.revenue += l.qty * l.price; row.profit += l.qty * (l.price - l.cost);
        perItem.set(l.id, row);
      }
      const channel = toSale(b, s).channel, c = channels.get(channel) ?? { revenue: 0, orders: 0 };
      c.revenue += s.total; c.orders++;
      channels.set(channel, c);
    }
    return {
      days, from, to,
      kpis: {
        revenue: cents(revenue), cogs: cents(revenue - profit), grossProfit: cents(profit), grossMarginPct: revenue ? ratio(profit / revenue) : 0,
        orders: sales.length, unitsSold: sales.reduce((s, x) => s + x.items.reduce((n, l) => n + l.qty, 0), 0),
        averageTicket: sales.length ? cents(revenue / sales.length) : 0,
        revenueChangePct: previous ? ratio((revenue - previous) / previous) : null,
        cash: cents((book[ACCOUNTS.cash] || 0) + (book[ACCOUNTS.cardClearing] || 0)),
        inventoryValue: cents(b.items.reduce((s, i) => s + i.stock * i.cost, 0)), payables: cents(-(book[ACCOUNTS.payables] || 0)),
        unpaidInvoices: b.invoices.filter(v => !v.paid).length, lowStock: b.items.filter(i => i.stock <= i.reorder).length,
      },
      daily: [...daily].map(([date, d]) => ({ date, revenue: cents(d.revenue), profit: cents(d.profit), orders: d.orders })),
      salesByHour: [...hours.values()].map(c => ({ ...c, revenue: cents(c.revenue) })).sort((x, y) => x.weekday - y.weekday || x.hour - y.hour),
      itemMargins: b.items.map(i => {
        const sold = perItem.get(i.id) ?? { unitsSold: 0, revenue: 0, profit: 0 };
        return { itemId: i.id, name: i.name, price: cents(i.price), unitCost: cents(i.cost), margin: cents(i.price - i.cost), marginPct: marginPct(i), unitsSold: sold.unitsSold, revenue: cents(sold.revenue), profit: cents(sold.profit) };
      }).sort((x, y) => y.profit - x.profit),
      channels: [...channels].map(([channel, c]) => ({ channel, revenue: cents(c.revenue), orders: c.orders })),
    };
  }
}
