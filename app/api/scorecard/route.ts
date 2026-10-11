import{NextResponse}from'next/server';
import{auth}from'@/auth';
import{learning}from'@/lib/ai/learning';
import{getPredictionHistory}from'@/lib/ai/mock-data';

// GET /api/scorecard — Munshi's accuracy graded against actual outcomes.
export async function GET(){
  if(!await auth())return NextResponse.json({error:'Sign in required'},{status:401});
  const scorecard=learning.scorecard(getPredictionHistory());
  return NextResponse.json(scorecard);
}
