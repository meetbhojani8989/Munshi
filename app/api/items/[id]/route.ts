import { api } from '@/lib/api';

// GET /api/items/:id -> ItemDetail
export const GET = api(({ ledger, businessId, params }) => ledger.item(businessId, params.id));
// PATCH /api/items/:id { price?, name?, category?, reorderPoint? } -> ItemDetail
export const PATCH = api(({ ledger, businessId, params, body }) => ledger.updateItem(businessId, params.id, body ?? {}));
