import { api } from '@/lib/api';

// GET /api/invoices?status=paid|unpaid -> Invoice[] (newest first)
export const GET = api(({ ledger, businessId, query }) => ledger.invoices(businessId, query.status));
// POST /api/invoices { vendor, lines, tax?, date? } -> { invoice, changes[] }
export const POST = api(({ ledger, businessId, body }) => ledger.recordInvoice(businessId, body ?? {}), 201);
