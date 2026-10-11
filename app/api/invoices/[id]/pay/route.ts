import { api } from '@/lib/api';

// POST /api/invoices/:id/pay -> { invoice, changes[] }
export const POST = api(({ ledger, businessId, params }) => ledger.payInvoice(businessId, params.id));
