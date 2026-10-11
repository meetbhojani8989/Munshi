// Builds the advisor's analytics context from a real business (its journal, sales and stock),
// replacing the static fixture in mock-data.ts, and stores fresh suggestions on the business.
import{metrics,type Business,type Suggestion as StoredSuggestion}from'../core';
import{advisor}from'./advisor';
import type{AnalyticsContext}from'./types';

const DAY=86400000;
const cents=(n:number)=>Math.round(n*100)/100;

export function contextFromBusiness(b:Business,periodDays=30):AnalyticsContext{
  const since=new Date(Date.now()-periodDays*DAY).toISOString().slice(0,10);
  const recent=b.sales.filter(s=>s.date>=since);
  const units=new Map<string,number>();
  const lastHour=new Map<string,number>(); // latest hour of day each item has sold
  for(const s of recent)for(const l of s.items){
    units.set(l.id,(units.get(l.id)||0)+l.qty);
    if(s.time){const h=new Date(s.time).getHours();lastHour.set(l.id,Math.max(lastHour.get(l.id)??0,h))}
  }
  const m=metrics(b);
  const cash=b.cash;
  return{
    businessId:b.id,businessName:b.name,businessType:b.type,currency:'USD',periodDays,
    metrics:{revenue:cents(m.revenue),cogs:cents(m.cogs),profit:cents(m.profit),margin:Math.round(m.margin*1000)/1000,cash:cents(cash),payables:cents(m.payables),inventory:cents(m.inventory),lowStockCount:m.low},
    hours:{open:'07:00',close:'22:00'},
    eventDay:b.eventDay,
    items:b.items.map(i=>{
      const sold=units.get(i.id)||0;
      // A selling item that is out of stock (or nearly) ran out before close: flag the last hour it sold.
      const sellsOut=sold>0&&i.stock<=Math.max(2,i.reorder/3)&&lastHour.has(i.id);
      return{id:i.id,name:i.name,category:i.category,price:cents(i.price),cost:cents(i.cost),unitsSold:sold,stock:i.stock,reorder:i.reorder,
        ...(sellsOut?{sellsOutBy:`${String(lastHour.get(i.id)).padStart(2,'0')}:00`}:{})};
    }),
  };
}

const title=(s:string)=>s.charAt(0).toUpperCase()+s.slice(1);

/** Ask the advisor for fresh suggestions from the live books. Keeps decided ones; replaces open ones. */
export async function refreshSuggestions(b:Business):Promise<StoredSuggestion[]>{
  const fresh=await advisor.suggest(contextFromBusiness(b));
  const decided=b.suggestions.filter(s=>s.status);
  const next:StoredSuggestion[]=fresh.map(s=>({
    id:s.id,action:s.action,reason:s.reason,
    // The Insights page shows monthly dollars; weekly leaks are scaled to a month.
    impact:Math.round(s.impact.amount*(s.impact.period==='week'?4.33:1)), // a fixed leak is money recovered
    confidence:Math.round(s.confidence*100),category:title(s.category),itemId:s.itemId,newPrice:s.newPrice,
  }));
  b.suggestions=[...next,...decided];
  return next;
}
