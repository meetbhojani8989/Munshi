import{NextRequest,NextResponse}from'next/server';
import{z}from'zod';
import{auth}from'@/auth';
import{interpret}from'@/lib/ai/assistant';
import{getAnalyticsContext}from'@/lib/ai/mock-data';

const bodySchema=z.object({message:z.string().min(1)});

// POST /api/assistant/intent — interpret a plain-language message into an
// answer, plus an approval-gated proposal when it would change money.
export async function POST(req:NextRequest){
  if(!await auth())return NextResponse.json({error:'Sign in required'},{status:401});
  try{
    const{message}=bodySchema.parse(await req.json());
    const reply=interpret(message,getAnalyticsContext());
    return NextResponse.json(reply);
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:'Invalid request'},{status:400});
  }
}
