import{auth}from'@/auth';
import{NextRequest,NextResponse}from'next/server';
import{z,ZodError}from'zod';
import{getStore}from'@/lib/store';
import{emptyArena,finalTest,runRound,startRun,dailyRevenue,tomorrowForecast}from'@/lib/ai/arena';

export const dynamic='force-dynamic';
export const maxDuration=60; // one round = 3 parallel agent calls + 1 critic call

const bodySchema=z.object({businessId:z.string().default('cafe'),step:z.enum(['start','round','final'])});

// GET /api/arena?businessId=cafe -> { arena, series, forecast }
export async function GET(req:NextRequest){
  if(!await auth())return NextResponse.json({error:'Sign in required'},{status:401});
  const b=await getStore().get(req.nextUrl.searchParams.get('businessId')||'cafe');
  if(!b)return NextResponse.json({error:'Business not found'},{status:404});
  return NextResponse.json({arena:b.arena??emptyArena(),series:dailyRevenue(b),forecast:tomorrowForecast(b,b.arena)});
}

// POST /api/arena { businessId, step: start | round | final } -> { arena }
// The client drives the loop one step per request so each call stays short on serverless hosts.
export async function POST(req:NextRequest){
  if(!await auth())return NextResponse.json({error:'Sign in required'},{status:401});
  try{
    const{businessId,step}=bodySchema.parse(await req.json());
    const store=getStore();
    const b=await store.get(businessId);
    if(!b)return NextResponse.json({error:'Business not found'},{status:404});
    const arena=b.arena??emptyArena();
    if(step==='start')arena.current=startRun(b);
    else if(step==='round')await runRound(b,arena);
    else finalTest(b,arena);
    b.arena=arena;
    await store.save(b);
    return NextResponse.json({arena,forecast:tomorrowForecast(b,arena)});
  }catch(e){
    return NextResponse.json({error:e instanceof ZodError?e.issues[0]?.message:e instanceof Error?e.message:'Arena step failed'},{status:400});
  }
}
