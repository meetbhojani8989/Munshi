import{NextResponse}from'next/server';
import{auth}from'@/auth';
import{advisor}from'@/lib/ai/advisor';
import{getAnalyticsContext}from'@/lib/ai/mock-data';

// GET /api/insights — current AI suggestions for the owner to review.
export async function GET(){
  if(!await auth())return NextResponse.json({error:'Sign in required'},{status:401});
  try{
    const context=getAnalyticsContext();
    const suggestions=await advisor.suggest(context);
    return NextResponse.json({suggestions});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:'Unable to generate insights'},{status:502});
  }
}
