import Link from'next/link';

export default async function PayCancelPage(){
  return <div className="min-h-screen flex items-center justify-center p-5">
    <div className="card max-w-md w-full text-center">
      <div className="w-14 h-14 rounded-full bg-paper text-amber flex items-center justify-center text-2xl mx-auto">—</div>
      <h1 className="mt-5">Checkout canceled</h1>
      <p className="muted mt-2">No payment was taken. You can start the founding plan whenever you’re ready.</p>
      <Link href="/insights" className="btn inline-block mt-7">Back to Insights</Link>
    </div>
  </div>;
}
