import{NextRequest,NextResponse}from'next/server';
import{auth}from'@/auth';
import{isConfigured,createCheckoutButtonConfig,FOUNDING_PLAN}from'@/lib/payments/amazonpay';

// POST /api/payments/checkout — prepare the Amazon Pay button for the founding
// plan. Returns a demo marker when credentials are missing so the app works
// with no env vars; the real signed config is never generated without keys.
export async function POST(req:NextRequest){
  if(!await auth())return NextResponse.json({error:'Sign in required'},{status:401});
  if(!isConfigured()){
    return NextResponse.json({mode:'demo',amount:FOUNDING_PLAN.amount,currencyCode:FOUNDING_PLAN.currencyCode});
  }
  try{
    const config=createCheckoutButtonConfig(req.nextUrl.origin);
    return NextResponse.json({mode:'live',amount:FOUNDING_PLAN.amount,currencyCode:FOUNDING_PLAN.currencyCode,config});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:'Unable to start checkout'},{status:502});
  }
}
