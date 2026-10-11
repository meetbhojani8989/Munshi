import { api } from '@/lib/api';

// GET /api/books/pnl?from&to -> ProfitAndLoss
export const GET = api(({ ledger, businessId, query }) => ledger.pnl(businessId, query.from, query.to));
