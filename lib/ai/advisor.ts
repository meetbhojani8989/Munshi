// AdvisorService: turns an analytics context into owner-ready suggestions.
// Output is strict JSON validated with zod. Every suggestion carries a dollar
// impact and requires owner approval before anything changes.
import{createLlmClient,parseJson,type LlmClient,type ChatMessage}from'./llm';
import{
  type AnalyticsContext,
  type Suggestion,
  suggestionSchema,
  rawSuggestionListSchema,
  type RawSuggestion,
}from'./types';

const SYSTEM_PROMPT=`You are Munshi, a careful back-office advisor for a small business.
Given an analytics context as JSON, propose up to 4 concrete, high-value actions.
Return ONLY JSON of the form {"suggestions":[{...}]} where each suggestion has:
- category: one of pricing, inventory, hours, menu, staffing, promotions, vendors
- action: a short imperative sentence
- reason: one sentence of evidence from the data
- impact: {amount: number (USD), period: "week"|"month", direction: "gain"|"loss"}
- confidence: a number between 0 and 1
- itemId: the affected item id, only when the action targets one item
- newPrice: the proposed new price, only for a pricing change
Do not invent item ids. Prefer actions the owner can approve in one tap.`;

let counter=0;
function makeId(){return `sug-${Date.now().toString(36)}-${(counter++).toString(36)}`;}

function finalize(raw:RawSuggestion):Suggestion{
  return suggestionSchema.parse({...raw,id:makeId(),requiresApproval:true,status:'pending'});
}

// Deterministic fixtures used when no live LLM is configured. These are the
// suggestions the demo must always show, with explicit dollar impact.
function mockSuggestions(ctx:AnalyticsContext):Suggestion[]{
  const wrap=ctx.items.find(i=>i.name==='Chicken Wrap');
  const soup=ctx.items.find(i=>i.name==='Tomato Soup');
  const raw:RawSuggestion[]=[
    {
      category:'hours',
      action:`Keep ${soup?.name??'the soup'} available until close`,
      reason:`${soup?.name??'Soup'} sells out around ${soup?.sellsOutBy??'8 PM'} but you stay open until ${ctx.hours.close}, so evening demand walks out the door.`,
      impact:{amount:210,period:'week',direction:'loss'},
      confidence:0.78,
      itemId:soup?.id,
    },
    {
      category:'pricing',
      action:`Raise the ${wrap?.name??'chicken wrap'} by $1`,
      reason:'Demand has held steady while ingredient costs rose, so a small increase barely dents volume.',
      impact:{amount:340,period:'month',direction:'gain'},
      confidence:0.82,
      itemId:wrap?.id,
      newPrice:wrap?Math.round((wrap.price+1)*100)/100:undefined,
    },
    {
      category:'inventory',
      action:`Raise the par level for ${soup?.name??'soup'} to cover the evening`,
      reason:'A higher prep target closes the 8–10 PM gap without over-ordering on slow days.',
      impact:{amount:160,period:'month',direction:'gain'},
      confidence:0.7,
      itemId:soup?.id,
    },
    {
      category:'menu',
      action:'Offer a soup and half-wrap lunch combo',
      reason:'Lunch guests who buy wraps often add a side, and the pairing lifts average ticket.',
      impact:{amount:145,period:'month',direction:'gain'},
      confidence:0.64,
    },
  ];
  return raw.map(finalize);
}

export class AdvisorService{
  constructor(private client:LlmClient=createLlmClient()){}

  async suggest(context:AnalyticsContext):Promise<Suggestion[]>{
    if(!this.client.live)return mockSuggestions(context);
    const messages:ChatMessage[]=[
      {role:'system',content:SYSTEM_PROMPT},
      {role:'user',content:JSON.stringify(context)},
    ];
    let parsed;
    try{
      const content=await this.client.complete(messages,{json:true});
      parsed=rawSuggestionListSchema.parse(parseJson(content));
    }catch(e){
      // Never leave the owner with an empty screen: fall back to the deterministic advisor.
      console.error('Advisor LLM failed, using deterministic advice:',e);
      return mockSuggestions(context);
    }
    const known=new Set(context.items.map(i=>i.id));
    return parsed.suggestions
      // Drop hallucinated item ids so approvals never target a missing item.
      .filter(s=>!s.itemId||known.has(s.itemId))
      .slice(0,4)
      .map(finalize);
  }
}

export const advisor=new AdvisorService();
