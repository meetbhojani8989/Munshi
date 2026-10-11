import{NextRequest,NextResponse}from'next/server';
import{auth}from'@/auth';
import{completeCheckout,FOUNDING_PLAN}from'@/lib/payments/amazonpay';

// GET /api/payments/complete — Amazon redirects the buyer here after they
// confirm. We complete the session (authorize + capture the first month) and
// send the buyer to the success or cancel page.
export async function GET(req:NextRequest){
  if(!await auth())return NextResponse.json({error:'Sign in required'},{status:401});
  const origin=req.nextUrl.origin;
  const sessionId=req.nextUrl.searchParams.get('amazonCheckoutSessionId');
  if(!sessionId)return NextResponse.redirect(new URL('/pay/cancel',origin));
  const result=await completeCheckout(sessionId);
  if(result.state==='completed'){
    return NextResponse.redirect(new URL(`/pay/success?amount=${FOUNDING_PLAN.amount}`,origin));
  }
  return NextResponse.redirect(new URL(`/pay/cancel?reason=${result.state}`,origin));
}
