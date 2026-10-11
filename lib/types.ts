// Shared contracts between backend, frontend and AI code (team plan, section 5).
// Only Person A changes this file. Everything the /api routes accept or return is typed here.
// (lib/core.ts keeps the storage shapes; lib/ledger.ts converts between the two.)
import { z } from 'zod';

export type Money = number; // dollars, 2 decimals

export interface Item { _id: string; businessId: string; name: string; category: string;
  price: Money; unitCost: Money; unit: string; stockQty: number; reorderPoint: number; }

export interface LineItem { itemId?: string; name: string; qty: number; unitPrice: Money; }

export interface Invoice { _id: string; businessId: string; vendor: string; date: string;
  lines: LineItem[]; tax: Money; total: Money; status: 'unpaid' | 'paid'; imageUrl?: string; }

export interface Sale { _id: string; businessId: string; timestamp: string; channel: 'counter' | 'online';
  paymentMethod: 'cash' | 'card'; lines: LineItem[]; total: Money; }

export interface JournalLine { account: string; debit: Money; credit: Money; }
export interface JournalEntry { _id: string; businessId: string; date: string; memo: string;
  sourceType: 'invoice' | 'sale' | 'payment' | 'adjustment'; sourceId: string; lines: JournalLine[]; }

export interface CascadeChange { kind: 'inventory' | 'payable' | 'journal' | 'margin' | 'cash';
  label: string; before?: number; after?: number; }

export interface Suggestion { _id: string; businessId: string; category:
  'pricing' | 'inventory' | 'hours' | 'menu' | 'promotion' | 'vendor';
  action: string; reason: string; predictedMonthlyImpact: Money; confidence: 'low' | 'medium' | 'high';
  status: 'open' | 'approved' | 'dismissed'; createdAt: string; checkAfter: string; }

export interface Outcome { suggestionId: string; actualMonthlyImpact: Money;
  verdict: 'right' | 'wrong' | 'partial'; lesson: string; }

// ---- Chart of accounts ----
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export const ACCOUNTS = {
  cash: 'Cash', cardClearing: 'Card Clearing', inventory: 'Inventory', payables: 'Accounts Payable',
  equity: 'Owner Equity', revenue: 'Sales Revenue', cogs: 'Cost of Goods Sold', purchaseTax: 'Purchase Tax',
} as const;
export const ACCOUNT_TYPES: Record<string, AccountType> = {
  [ACCOUNTS.cash]: 'asset', [ACCOUNTS.cardClearing]: 'asset', [ACCOUNTS.inventory]: 'asset',
  [ACCOUNTS.payables]: 'liability', [ACCOUNTS.equity]: 'equity', [ACCOUNTS.revenue]: 'revenue',
  [ACCOUNTS.cogs]: 'expense', [ACCOUNTS.purchaseTax]: 'expense',
};
// Accounts that are not in the chart are treated as expenses.
export const accountType = (account: string): AccountType => ACCOUNT_TYPES[account] ?? 'expense';

// ---- Request bodies (every route also takes an optional businessId; default is the demo café) ----
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
/** POST /api/invoices. A line without itemId is matched to an item by name, or creates a new item. */
export const invoiceInputSchema = z.object({
  vendor: z.string().trim().min(1),
  date: isoDate.optional(),
  lines: z.array(z.object({ itemId: z.string().optional(), name: z.string().trim().default(''), qty: z.number().positive(), unitPrice: z.number().nonnegative() })).min(1),
  tax: z.number().nonnegative().default(0),
  imageUrl: z.string().optional(),
});
/** POST /api/sales. Price comes from the item, not the request. */
export const saleInputSchema = z.object({
  lines: z.array(z.object({ itemId: z.string().min(1), qty: z.number().int().positive() })).min(1),
  paymentMethod: z.enum(['cash', 'card']).default('card'),
  channel: z.enum(['counter', 'online']).default('counter'),
});
/** PATCH /api/items/:id */
export const itemPatchSchema = z.object({
  price: z.number().positive(), name: z.string().trim().min(1), category: z.string().trim().min(1), reorderPoint: z.number().int().nonnegative(),
}).partial().refine(p => Object.keys(p).length > 0, 'Nothing to update');
export type InvoiceInput = z.input<typeof invoiceInputSchema>;
export type SaleInput = z.input<typeof saleInputSchema>;
export type ItemPatch = z.input<typeof itemPatchSchema>;

// ---- Responses ----
export type ApiError = { error: string };
/** POST /api/invoices, POST /api/invoices/:id/pay */
export type InvoiceResult = { invoice: Invoice; changes: CascadeChange[] };
/** POST /api/sales */
export type SaleResult = { sale: Sale; changes: CascadeChange[] };

/** POST /api/invoices/parse: what OCR read from an uploaded invoice, for the owner to review and send to POST /api/invoices. */
export type InvoiceDraft = {
  vendor: string; date: string; lines: LineItem[]; tax: Money; total: Money; // a line without itemId is a product not stocked yet
  source: 'textract' | 'ocr' | 'sample'; // AWS Textract, on-device OCR, or the built-in sample (no file sent)
  warnings: string[]; // plain-language notes to show above the form
};

/** GET /api/inventory, GET /api/items, GET /api/items/:id, PATCH /api/items/:id */
export interface ItemDetail extends Item {
  stockValue: Money;  // stockQty x unitCost
  margin: Money;      // price - unitCost
  marginPct: number;  // 0..1
  unitsSold: number;  // all time
  status: 'out' | 'low' | 'ok';
}
export type InventoryResponse = { items: ItemDetail[]; totalValue: Money; totalUnits: number; lowStock: number; outOfStock: number };

/** GET /api/books/pnl?from&to */
export type ProfitAndLoss = {
  from: string | null; to: string | null;
  revenue: Money; cogs: Money; grossProfit: Money; grossMarginPct: number;
  expenses: { account: string; amount: Money }[]; // operating expenses other than COGS
  totalExpenses: Money; netIncome: Money;
};
/** GET /api/books/balance-sheet?asOf */
export type BalanceSheet = {
  asOf: string;
  assets: { account: string; balance: Money }[];
  liabilities: { account: string; balance: Money }[];
  equity: { account: string; balance: Money }[]; // includes "Retained Earnings"
  totalAssets: Money; totalLiabilities: Money; totalEquity: Money;
  balanced: boolean; // show "Books balanced" only when true
};
/** GET /api/books/journal?from&to&limit&offset (newest first) */
export type JournalResponse = { total: number; entries: JournalEntry[]; balanced: boolean };

/** GET /api/analytics/summary?days */
export type AnalyticsSummary = {
  days: number; from: string; to: string;
  kpis: {
    revenue: Money; cogs: Money; grossProfit: Money; grossMarginPct: number;
    orders: number; unitsSold: number; averageTicket: Money;
    revenueChangePct: number | null; // vs the preceding window of the same length; null when that window had no sales
    cash: Money; inventoryValue: Money; payables: Money; unpaidInvoices: number; lowStock: number;
  };
  daily: { date: string; revenue: Money; profit: Money; orders: number }[]; // one row per day, zero-filled
  salesByHour: { weekday: number; hour: number; revenue: Money; orders: number }[]; // weekday 0 = Sunday; only non-empty cells
  itemMargins: { itemId: string; name: string; price: Money; unitCost: Money; margin: Money; marginPct: number; unitsSold: number; revenue: Money; profit: Money }[]; // by profit, highest first
  channels: { channel: Sale['channel']; revenue: Money; orders: number }[];
};
