// A lighter copy of a business for the browser, which polls it every few seconds. The server keeps full
// history (agents, Leak Finder, reports); the client gets exact totals with less detail for older days:
// - sales older than 30 days merge into one record per day (daily and per-item totals are unchanged);
// - journal entries older than 14 days fold into one balanced "Balances brought forward" entry, so every
//   account balance, the P&L to date and the balance sheet are identical.
import type{Business,Entry,Sale}from'./core';

const DAY=86400000;
const cents=(n:number)=>Math.round(n*100)/100;
const daysAgo=(d:number)=>new Date(Date.now()-d*DAY).toISOString().slice(0,10);

function mergeDays(sales:Sale[]):Sale[]{
  const byDay=new Map<string,Sale>();
  for(const s of sales){
    const day=byDay.get(s.date)??{id:`day-${s.date}`,date:s.date,time:`${s.date}T16:00:00.000Z`,items:[],total:0,channel:'In store',payment:s.payment};
    for(const l of s.items){
      const line=day.items.find(x=>x.id===l.id&&x.price===l.price);
      if(line)line.qty+=l.qty;else day.items.push({...l});
    }
    day.total=cents(day.total+s.total);
    byDay.set(s.date,day);
  }
  return[...byDay.values()]; // input is newest first, and so is the map's insertion order
}

function foldEntries(entries:Entry[],before:string):Entry[]{
  const recent=entries.filter(e=>e.date>=before),old=entries.filter(e=>e.date<before);
  if(old.length<2)return entries;
  const net=new Map<string,number>();
  for(const e of old)for(const l of e.lines)net.set(l.account,(net.get(l.account)||0)+l.debit-l.credit);
  const lines=[...net].filter(([,v])=>Math.abs(v)>=0.005).map(([account,v])=>({account,debit:v>0?cents(v):0,credit:v<0?cents(-v):0}));
  // Rounding each account to cents can leave a sub-cent gap; book it to the largest line so the entry balances.
  const gap=cents(lines.reduce((s,l)=>s+l.debit-l.credit,0));
  if(gap&&lines.length){const big=lines.reduce((a,l)=>Math.max(a.debit,a.credit)>=Math.max(l.debit,l.credit)?a:l);if(big.credit)big.credit=cents(big.credit+gap);else big.debit=cents(big.debit-gap)}
  const date=old[0].date;
  return[...recent,{id:`bf-${date}`,date,memo:`Balances brought forward (${old.length} entries through ${date})`,source:'opening',lines}];
}

export function forClient(b:Business):Business{
  const cut=daysAgo(30);
  return{
    ...b,
    sales:[...b.sales.filter(s=>s.date>=cut),...mergeDays(b.sales.filter(s=>s.date<cut))],
    entries:foldEntries(b.entries,daysAgo(14)),
  };
}
