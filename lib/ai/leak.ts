// Leak Finder: revenue lost each week because an item stops selling before closing time.
// Pure and client-safe. Uses the café's own evening traffic to estimate what the missing hours would sell.
import type{Business}from'../core';

const CLOSE=22;

export type Leak={itemId:string;name:string;stopsAt:number;perWeek:number};

export function findLeak(b:Business,days=28):Leak|null{
  const since=new Date(Date.now()-days*86400000).toISOString().slice(0,10);
  const recent=b.sales.filter(s=>s.date>=since&&s.time);
  const hourOf=(t:string)=>Number(new Date(t).toLocaleString('en-US',{hour:'numeric',hour12:false,timeZone:'America/New_York'}))%24;
  const units=new Map<string,number[]>(); // item -> units by hour
  const traffic=Array(24).fill(0); // all units by hour
  for(const s of recent){
    const h=hourOf(s.time!);
    for(const l of s.items){
      if(!units.has(l.id))units.set(l.id,Array(24).fill(0));
      units.get(l.id)![h]+=l.qty;traffic[h]+=l.qty;
    }
  }
  let best:Leak|null=null;
  for(const i of b.items){
    const byHour=units.get(i.id);
    if(!byHour)continue;
    const total=byHour.reduce((a,x)=>a+x,0);
    if(total/days<5)continue; // only steady sellers
    let last=-1;byHour.forEach((u,h)=>{if(u>0)last=h});
    const stopsAt=last+1,missing=CLOSE-stopsAt;
    if(missing<2||stopsAt<12)continue; // morning-only items are not leaks
    // The item's rate in the three hours before it stops, scaled by how busy the missing hours are.
    const before=[stopsAt-3,stopsAt-2,stopsAt-1];
    const rate=before.reduce((a,h)=>a+byHour[h],0)/3/days;
    const busy=before.reduce((a,h)=>a+traffic[h],0)/3;
    let after=0;for(let h=stopsAt;h<CLOSE;h++)after+=traffic[h];
    const lostPerDay=busy?rate*(after/busy):0;
    const perWeek=Math.round(lostPerDay*7*i.price*(b.eventDay?1.4:1));
    if(perWeek>0&&(!best||perWeek>best.perWeek))best={itemId:i.id,name:i.name,stopsAt,perWeek};
  }
  return best;
}
