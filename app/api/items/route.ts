import { api } from '@/lib/api';

// GET /api/items -> ItemDetail[]
export const GET = api(({ ledger, businessId }) => ledger.items(businessId));
