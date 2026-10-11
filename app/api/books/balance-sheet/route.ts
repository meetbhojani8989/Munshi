import { api } from '@/lib/api';

// GET /api/books/balance-sheet?asOf -> BalanceSheet (today when asOf is omitted)
export const GET = api(({ ledger, businessId, query }) => ledger.balanceSheet(businessId, query.asOf));
