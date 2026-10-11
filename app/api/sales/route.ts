import { api } from '@/lib/api';

// GET /api/sales?from&to&limit -> Sale[] (newest first, 100 by default)
export const GET = api(({ ledger, businessId, query }) => ledger.sales(businessId, query));
// POST /api/sales { lines: [{ itemId, qty }], paymentMethod?, channel? } -> { sale, changes[] }
export const POST = api(({ ledger, businessId, body }) => ledger.recordSale(businessId, body ?? {}), 201);
