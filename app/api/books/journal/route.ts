import { api } from '@/lib/api';

// GET /api/books/journal?from&to&limit&offset -> { total, entries, balanced } (newest first, 50 by default)
export const GET = api(({ ledger, businessId, query }) => ledger.journal(businessId, query));
