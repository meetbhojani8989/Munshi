import Link from'next/link';
import{FOUNDING_PLAN}from'@/lib/payments/amazonpay';

export default async function PaySuccessPage({searchParams}:{searchParams:Promise<{amount?:string}>}){
  const{amount}=await searchParams;
  const charged=amount||FOUNDING_PLAN.amount;
  return <div className="min-h-screen flex items-center justify-center p-5">
    <div className="card max-w-md w-full text-center">
      <div className="w-14 h-14 rounded-full bg-[#dff3e9] text-[#146448] flex items-center justify-center text-2xl mx-auto">✓</div>
      <h1 className="mt-5">You’re in</h1>
      <p className="muted mt-2">Welcome to the {FOUNDING_PLAN.name}.</p>
      <div className="text-4xl font-bold positive mt-5">${charged}<span className="text-base muted"> charged today</span></div>
      <p className="text-sm muted mt-3">You’ll be billed ${FOUNDING_PLAN.amount} each month. Cancel anytime.</p>
      <Link href="/insights" className="btn inline-block mt-7">Back to Insights</Link>
    </div>
  </div>;
}
