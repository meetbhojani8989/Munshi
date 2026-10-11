import{NextRequest,NextResponse}from'next/server';
import{z}from'zod';
import{auth}from'@/auth';
import{interpret}from'@/lib/ai/assistant';
import{contextFromBusiness}from'@/lib/ai/context';
import{findLeak}from'@/lib/ai/leak';
import{createLlmClient}from'@/lib/ai/llm';
import{getStore}from'@/lib/store';
import{profitAndLoss}from'@/lib/ledger';

export const dynamic='force-dynamic';
export const maxDuration=30;

const bodySchema=z.object({message:z.string().min(1).max(500),businessId:z.string().default('cafe')});

const SYSTEM=`You are Munshi, the back-office assistant for a small business. Answer the owner's question in at most
three short sentences, in plain dollars, using ONLY the numbers in the JSON context. If the context cannot answer it,
say what you would need. You never change prices, stock or books yourself: if the owner asks for a change, tell them
to say it as "raise <item> by $X" so they can approve it.`;

// POST /api/assistant/intent { message, businessId } -> { kind, answer, proposal? }
// Money-changing intents stay rule-based and approval-gated; open questions go to the LLM with the live books.
export async function POST(req:NextRequest){
  if(!await auth())return NextResponse.json({error:'Sign in required'},{status:401});
  try{
    const{message,businessId}=bodySchema.parse(await req.json());
    const b=await getStore().get(businessId);
    if(!b)return NextResponse.json({error:'Business not found'},{status:404});
    const ctx=contextFromBusiness(b,30,15);
    const rule=interpret(message,ctx);
    const client=createLlmClient();
    if(rule.kind==='price_change'||!client.live)return NextResponse.json(rule);
    const since=new Date(Date.now()-30*86400000).toISOString().slice(0,10);
    const pl=profitAndLoss(b.entries,since);
    const context={...ctx,last30DaysPnL:pl,leakFinder:(l=>l&&{item:l.name,stopsSellingAt:`${l.stopsAt}:00`,closesAt:'22:00',lostRevenueDollarsPerWeek:l.perWeek})(findLeak(b)),unpaidInvoices:b.invoices.filter(i=>!i.paid).map(i=>({vendor:i.vendor,total:i.total,date:i.date}))};
    try{
      const answer=await client.complete([
        {role:'system',content:SYSTEM},
        {role:'user',content:`Context: ${JSON.stringify(context)}\n\nQuestion: ${message}`},
      ],{effort:'low',temperature:0.3,timeoutMs:20000});
      return NextResponse.json({kind:'explain',answer:answer.trim()});
    }catch{
      return NextResponse.json(rule);
    }
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:'Invalid request'},{status:400});
  }
}
