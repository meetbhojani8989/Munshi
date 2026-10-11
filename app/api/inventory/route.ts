import { api } from '@/lib/api';

// GET /api/inventory -> { items, totalValue, totalUnits, lowStock, outOfStock }
export const GET = api(({ ledger, businessId }) => ledger.inventory(businessId));
