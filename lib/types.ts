// Shared types for the Munshi backend and frontend.
// Domain shapes are what the stores persist; the zod schemas validate API input;
// the report types are what the API routes return.
import { z } from 'zod';

// ---- Domain ----
export type Line = { account: string; debit: number; credit: number };
export type Entry = { id: string; date: string; memo: string; source: string; lines: Line[] };
export type Item = { id: string; name: string; category: string; price: number; cost: number; stock: number; reorder: number; units: number };
export type SaleLine = { id: string; name: string; qty: number; price: number; cost: number };
export type Sale = { id: string; date: string; items: SaleLine[]; total: number; channel: string; payment: string };
export type InvoiceLine = { id: string; name: string; qty: number; cost: number };
export type Invoice = { id: string; date: string; vendor: string; items: InvoiceLine[]; total: number; paid: boolean };
export type Suggestion = { id: string; action: string; reason: string; impact: number; confidence: number; category: string; itemId?: string; newPrice?: number; status?: string };
export type Order = { id: string; channel: string; customer: string; itemId: string; qty: number; status: string };
export type Experiment = { id: string; itemId: string; price: number; days: number; start: string; status: string };
export type Outcome = { id: string; predicted: number; actual: number; lesson: string };
export type Business = {
  id: string; name: string; type: string; eventDay: boolean; cash: number;
  items: Item[]; sales: Sale[]; invoices: Invoice[]; entries: Entry[];
  suggestions: Suggestion[]; orders: Order[]; experiments: Experiment[]; outcomes: Outcome[];
};

// ---- Chart of accounts ----
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export const ACCOUNTS = {
  cash: 'Cash',
  cardClearing: 'Card Clearing',
  inventory: 'Inventory',
  payables: 'Accounts Payable',
  equity: 'Owner Equity',
  revenue: 'Sales Revenue',
  cogs: 'Cost of Goods Sold',
  shrinkage: 'Inventory Shrinkage',
} as const;
export const ACCOUNT_TYPES: Record<string, AccountType> = {
  [ACCOUNTS.cash]: 'asset',
  [ACCOUNTS.cardClearing]: 'asset',
  [ACCOUNTS.inventory]: 'asset',
  [ACCOUNTS.payables]: 'liability',
  [ACCOUNTS.equity]: 'equity',
  [ACCOUNTS.revenue]: 'revenue',
  [ACCOUNTS.cogs]: 'expense',
  [ACCOUNTS.shrinkage]: 'expense',
};
// Accounts posted by hand that are not in the chart are treated as expenses.
export const accountType = (account: string): AccountType => ACCOUNT_TYPES[account] ?? 'expense';

// ---- API input ----
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
export const saleInputSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), qty: z.number().int().positive() })).min(1),
  payment: z.string().min(1).default('Card'),
  channel: z.string().min(1).default('In store'),
});
export const invoiceInputSchema = z.object({
  vendor: z.string().trim().min(1),
  items: z.array(z.object({ id: z.string().min(1), qty: z.number().positive(), cost: z.number().nonnegative() })).min(1),
});
export const itemInputSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1).default('General'),
  price: z.number().positive(),
  cost: z.number().nonnegative(),
  reorder: z.number().int().nonnegative().default(0),
});
export const itemPatchSchema = itemInputSchema.pick({ name: true, category: true, price: true, reorder: true }).partial()
  .refine(p => Object.keys(p).length > 0, 'Nothing to update');
export const stockAdjustmentSchema = z.object({
  delta: z.number().int().refine(n => n !== 0, 'Delta cannot be zero'),
  reason: z.string().trim().min(1).default('Stock count'),
});
export const dateRangeSchema = z.object({ from: isoDate.optional(), to: isoDate.optional() });

// z.input: callers may omit fields that have defaults.
export type SaleInput = z.input<typeof saleInputSchema>;
export type InvoiceInput = z.input<typeof invoiceInputSchema>;
export type ItemInput = z.input<typeof itemInputSchema>;
export type ItemPatch = z.input<typeof itemPatchSchema>;
export type StockAdjustment = z.input<typeof stockAdjustmentSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;

// ---- API output ----
export type ApiError = { error: string };
export type Page<T> = { total: number; rows: T[] };

export type AccountBalance = {
  account: string; type: AccountType; debit: number; credit: number;
  balance: number; // in the account's normal direction: debit-positive for assets and expenses, credit-positive otherwise
};
export type ProfitAndLoss = { from: string | null; to: string | null; revenue: number; cogs: number; grossProfit: number; otherExpenses: number; netIncome: number; margin: number };
export type BalanceSheet = {
  asOf: string | null;
  assets: { account: string; balance: number }[];
  liabilities: { account: string; balance: number }[];
  equity: { account: string; balance: number }[]; // includes a "Retained Earnings" row
  totalAssets: number; totalLiabilities: number; totalEquity: number; balanced: boolean;
};
export type Books = { trialBalance: AccountBalance[]; totalDebit: number; totalCredit: number; balanced: boolean; profitAndLoss: ProfitAndLoss; balanceSheet: BalanceSheet; entries: Page<Entry> };

export type StockStatus = 'out' | 'low' | 'ok';
export type InventoryRow = Item & { value: number; margin: number; status: StockStatus };
export type Inventory = { items: InventoryRow[]; totalValue: number; totalUnits: number; low: number; out: number };

export type Analytics = {
  days: number; from: string; to: string;
  summary: {
    revenue: number; cogs: number; grossProfit: number; margin: number;
    orders: number; units: number; averageTicket: number;
    previousRevenue: number; revenueChange: number | null; // vs the preceding window; null when that window had no sales
    cash: number; inventoryValue: number; payables: number; unpaidInvoices: number; lowStock: number;
  };
  daily: { date: string; revenue: number; profit: number; orders: number }[];
  topItems: { id: string; name: string; units: number; revenue: number; profit: number }[];
  channels: { channel: string; revenue: number; orders: number }[];
  payments: { payment: string; revenue: number; orders: number }[];
  lowStock: { id: string; name: string; stock: number; reorder: number; daysOfCover: number | null }[];
};
