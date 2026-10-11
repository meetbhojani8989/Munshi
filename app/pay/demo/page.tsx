import Link from'next/link';
import{FOUNDING_PLAN}from'@/lib/payments/amazonpay';

// Shown when Amazon Pay credentials are not configured. Plainly a Munshi demo
// screen — it deliberately does not copy Amazon's look, branding, or hosted UI.
export default async function PayDemoPage(){
  return <div className="min-h-screen flex items-center justify-center p-5">
    <div className="card max-w-md w-full text-center">
      <span className="tag inline-block">Demo mode</span>
      <h1 className="mt-5">Demo mode: no payment taken</h1>
      <p className="muted mt-3">Amazon Pay isn’t configured on this environment, so nothing was charged. This is a Munshi demo screen, not an Amazon checkout.</p>
      <div className="text-left bg-paper rounded-xl p-4 mt-5 text-sm">
        <div className="flex justify-between"><span>{FOUNDING_PLAN.name}</span><b>${FOUNDING_PLAN.amount}/month</b></div>
        <p className="muted mt-2">With real credentials, this button opens Amazon’s own hosted page and charges the first month today.</p>
      </div>
      <Link href="/insights" className="btn inline-block mt-7">Back to Insights</Link>
    </div>
  </div>;
}
