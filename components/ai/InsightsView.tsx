'use client';
import{useEffect,useState}from'react';
import type{Suggestion,Impact}from'@/lib/ai/types';
import{Card,Title,usd}from'./ui';

function impactLabel(i:Impact){
  const sign=i.direction==='loss'?'-':'+';
  return `${sign}${usd(i.amount)} / ${i.period}`;
}

export default function InsightsView(){
  const[suggestions,setSuggestions]=useState<Suggestion[]>([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');
  const[busy,setBusy]=useState('');
  const[approved,setApproved]=useState<Record<string,boolean>>({});

  useEffect(()=>{
    fetch('/api/insights')
      .then(r=>r.json().then(d=>({ok:r.ok,d})))
      .then(({ok,d})=>{if(!ok)throw new Error(d.error||'Unable to load insights');setSuggestions(d.suggestions)})
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  },[]);

  async function approve(s:Suggestion){
    setBusy(s.id);
    try{
      const r=await fetch(`/api/insights/${s.id}/approve`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({suggestion:s}),
      });
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||'Approval failed');
      // Owner approved a price change: apply it via Person A's items route.
      if(d.priceChange){
        await fetch(`/api/items/${d.priceChange.itemId}`,{
          method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({price:d.priceChange.newPrice}),
        }).catch(()=>{});
      }
      setApproved(a=>({...a,[s.id]:true}));
    }catch(e){
      setError(e instanceof Error?e.message:'Approval failed');
    }finally{
      setBusy('');
    }
  }

  function dismiss(id:string){setSuggestions(list=>list.filter(s=>s.id!==id));}

  const leak=suggestions.find(s=>s.impact.direction==='loss');
  const open=suggestions.filter(s=>!approved[s.id]);

  if(loading)return <div className="muted">Loading today’s advice…</div>;

  return <>
    <Title kicker="The AI manager" title="Good decisions, in dollars" sub="Every recommendation has a reason, a prediction, and your approval gate."/>
    {error&&<Card className="mb-5 border-red"><p className="negative text-sm">{error}</p></Card>}
    {leak&&<Card className="mb-5 bg-[#fff9e8]">
      <div className="text-xs uppercase tracking-widest text-amber font-bold">Leak Finder</div>
      <h2 className="mt-2">{usd(leak.impact.amount)} a {leak.impact.period} is slipping away</h2>
      <p className="mt-2 text-sm">{leak.reason}</p>
    </Card>}
    <div className="grid md:grid-cols-2 gap-5">
      {open.length?open.map(s=>
        <Card key={s.id}>
          <div className="flex justify-between">
            <span className="tag">{s.category}</span>
            <span className="text-xs muted">{Math.round(s.confidence*100)}% confidence</span>
          </div>
          <h2 className="mt-5">{s.action}</h2>
          <p className="muted text-sm mt-2">{s.reason}</p>
          <div className={'mt-5 text-2xl font-bold '+(s.impact.direction==='loss'?'negative':'positive')}>
            {impactLabel(s.impact)} <span className="text-sm muted">predicted</span>
          </div>
          <div className="flex gap-2 mt-5 flex-wrap">
            <button className="btn" disabled={busy===s.id} onClick={()=>approve(s)}>{busy===s.id?'Approving…':'Approve'}</button>
            <button className="btn2" onClick={()=>dismiss(s.id)}>Dismiss</button>
          </div>
        </Card>
      ):<Card><h2>You’re all caught up</h2><p className="muted mt-2">New recommendations will appear as fresh sales arrive.</p></Card>}
    </div>
    {Object.keys(approved).length>0&&<p className="muted text-sm mt-5">✓ {Object.keys(approved).length} suggestion(s) approved. Munshi will check the outcome and grade itself on the Scorecard.</p>}
  </>;
}
