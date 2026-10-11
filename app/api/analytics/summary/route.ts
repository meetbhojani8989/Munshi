import { api } from '@/lib/api';

// GET /api/analytics/summary?days=30 -> AnalyticsSummary
export const GET = api(({ ledger, businessId, query }) => ledger.analytics(businessId, query.days));
