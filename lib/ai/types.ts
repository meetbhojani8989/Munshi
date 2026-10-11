// Temporary local copies of the shared AI contracts.
// PLAN.md / Person A's shared types file are not on main yet, so these are
// defined here to match the spec and the existing repo contracts
// (lib/core.ts Suggestion and lib/providers.ts adviceSchema). Swap to the
// shared import once Person A merges it.
import{z}from'zod';

export const suggestionCategories=['pricing','inventory','hours','menu','staffing','promotions','vendors']as const;
export type SuggestionCategory=typeof suggestionCategories[number];

// A single number is one item in the analytics context the advisor reasons over.
export const itemAnalyticsSchema=z.object({
  id:z.string(),
  name:z.string(),
  category:z.string(),
  price:z.number(),
  cost:z.number(),
  unitsSold:z.number(),
  stock:z.number(),
  reorder:z.number(),
  // When demand regularly exhausts stock before closing, the hour it runs out.
  sellsOutBy:z.string().optional(),
});
export type ItemAnalytics=z.infer<typeof itemAnalyticsSchema>;

export const analyticsContextSchema=z.object({
  businessId:z.string(),
  businessName:z.string(),
  businessType:z.string(),
  currency:z.string().default('USD'),
  periodDays:z.number().int().positive(),
  metrics:z.object({
    revenue:z.number(),
    cogs:z.number(),
    profit:z.number(),
    margin:z.number(),
    cash:z.number(),
    payables:z.number(),
    inventory:z.number(),
    lowStockCount:z.number(),
  }),
  hours:z.object({open:z.string(),close:z.string()}),
  eventDay:z.boolean().default(false),
  items:z.array(itemAnalyticsSchema),
});
export type AnalyticsContext=z.infer<typeof analyticsContextSchema>;

// Dollar impact every suggestion must carry. Some leaks are framed per week,
// some lifts per month, so the period travels with the amount.
export const impactSchema=z.object({
  amount:z.number(),
  period:z.enum(['week','month']),
  direction:z.enum(['gain','loss']).default('gain'),
});
export type Impact=z.infer<typeof impactSchema>;

export const suggestionStatuses=['pending','approved','testing','dismissed']as const;
export type SuggestionStatus=typeof suggestionStatuses[number];

export const suggestionSchema=z.object({
  id:z.string(),
  category:z.enum(suggestionCategories),
  action:z.string(),
  reason:z.string(),
  impact:impactSchema,
  confidence:z.number().min(0).max(1),
  itemId:z.string().optional(),
  newPrice:z.number().positive().optional(),
  requiresApproval:z.literal(true),
  status:z.enum(suggestionStatuses).default('pending'),
});
export type Suggestion=z.infer<typeof suggestionSchema>;

// The strict shape the LLM is asked to return, before we attach ids/approval.
export const rawSuggestionSchema=z.object({
  category:z.enum(suggestionCategories),
  action:z.string().min(1),
  reason:z.string().min(1),
  impact:impactSchema,
  confidence:z.number().min(0).max(1),
  itemId:z.string().optional(),
  newPrice:z.number().positive().optional(),
});
export type RawSuggestion=z.infer<typeof rawSuggestionSchema>;
export const rawSuggestionListSchema=z.object({suggestions:z.array(rawSuggestionSchema)});

// --- Learning / scorecard ---
export const verdicts=['right','wrong','partial']as const;
export type Verdict=typeof verdicts[number];

export const predictionSchema=z.object({
  id:z.string(),
  suggestionId:z.string().optional(),
  action:z.string(),
  category:z.enum(suggestionCategories),
  predicted:z.number(),
  confidence:z.number().min(0).max(1),
});
export type Prediction=z.infer<typeof predictionSchema>;

export const learningResultSchema=z.object({
  predictionId:z.string(),
  verdict:z.enum(verdicts),
  lesson:z.string(),
  predicted:z.number(),
  actual:z.number(),
  error:z.number(),
});
export type LearningResult=z.infer<typeof learningResultSchema>;

export type AccuracyWeights=Record<SuggestionCategory,number>;

export type ScorecardRow={
  prediction:string;
  category:SuggestionCategory;
  predicted:number;
  actual:number;
  verdict:Verdict;
  lesson:string;
};
export type ScorecardData={
  overallAccuracy:number;
  trendingUp:boolean;
  trend:{label:string;accuracy:number}[];
  weights:AccuracyWeights;
  rows:ScorecardRow[];
};

// --- Assistant ---
export const assistantIntents=['explain','price_change','reorder','unknown']as const;
export type AssistantIntentKind=typeof assistantIntents[number];

export type AssistantProposal={
  action:string;
  itemId:string;
  currentPrice:number;
  newPrice:number;
};
export type AssistantReply={
  kind:AssistantIntentKind;
  answer:string;
  // Present only when the intent changes money; the UI must gate it on approval.
  proposal?:AssistantProposal;
};
