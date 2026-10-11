'use client';
import{useEffect,useRef,useState}from'react';
import{useRouter}from'next/navigation';
import{Card}from'./ui';

const CHECKOUT_JS='https://static-na.payments-amazon.com/checkout.js';
const CONTAINER_ID='munshi-amazonpay-button';

type CheckoutResponse={
  mode:'demo'|'live';
  amount:string;
  currencyCode:string;
  config?:any;
};

function loadCheckoutJs():Promise<void>{
  return new Promise((resolve,reject)=>{
    if((window as any).amazon?.Pay)return resolve();
    const existing=document.getElementById('amazon-pay-checkout-js')as HTMLScriptElement|null;
    if(existing){existing.addEventListener('load',()=>resolve());existing.addEventListener('error',()=>reject(new Error('load failed')));return;}
    const s=document.createElement('script');
    s.id='amazon-pay-checkout-js';
    s.src=CHECKOUT_JS;
    s.async=true;
    s.onload=()=>resolve();
    s.onerror=()=>reject(new Error('Unable to load Amazon Pay'));
    document.body.appendChild(s);
  });
}

export default function PayButton(){
  const router=useRouter();
  const[status,setStatus]=useState<'loading'|'demo'|'live'|'error'>('loading');
  const[amount,setAmount]=useState('5.00');
  const configRef=useRef<any>(null);
  const rendered=useRef(false);

  useEffect(()=>{
    let active=true;
    fetch('/api/payments/checkout',{method:'POST'})
      .then(r=>r.json().then(d=>({ok:r.ok,d})))
      .then(({ok,d}:{ok:boolean;d:CheckoutResponse&{error?:string}})=>{
        if(!active)return;
        if(!ok)throw new Error(d.error||'Checkout unavailable');
        setAmount(d.amount);
        if(d.mode==='live'&&d.config){configRef.current=d.config;setStatus('live');}
        else setStatus('demo');
      })
      .catch(()=>active&&setStatus('error'));
    return()=>{active=false;};
  },[]);

  // In live mode, mount Amazon's own hosted button. Clicking it takes the buyer
  // to Amazon's page; we never render or imitate that page ourselves.
  useEffect(()=>{
    if(status!=='live'||rendered.current)return;
    rendered.current=true;
    loadCheckoutJs()
      .then(()=>{(window as any).amazon.Pay.renderButton(`#${CONTAINER_ID}`,configRef.current);})
      .catch(()=>setStatus('error'));
  },[status]);

  return <Card className="mt-5">
    <div className="text-xs uppercase tracking-widest text-amber font-bold">Founding plan</div>
    <h2 className="mt-2">Back Munshi for ${amount}/month</h2>
    <p className="muted text-sm mt-2">First month charged today, then ${amount} monthly. Cancel anytime.</p>
    <div className="mt-4">
      {status==='loading'&&<p className="muted text-sm">Preparing checkout…</p>}
      {status==='error'&&<p className="muted text-sm">Checkout is unavailable right now. Please try again later.</p>}
      {status==='demo'&&<>
        <button className="btn" onClick={()=>router.push('/pay/demo')}>Start founding plan · ${amount}/month</button>
        <p className="text-xs muted mt-2">Demo mode — no payment is taken.</p>
      </>}
      {status==='live'&&<div id={CONTAINER_ID} className="max-w-xs"/>}
    </div>
  </Card>;
}
