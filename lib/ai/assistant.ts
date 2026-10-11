// Assistant interpreter: turns a plain-language message into an answer, and,
// when the message asks to change money, a proposal the UI must gate on
// owner approval. Deterministic and rule-based (text chat first); a live LLM
// can enrich the explain path later without changing this contract.
import type{AnalyticsContext,AssistantReply}from'./types';

const usd=(n:number)=>`$${n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;

function findItem(ctx:AnalyticsContext,text:string){
  return ctx.items.find(i=>text.includes(i.name.toLowerCase()));
}

export function interpret(message:string,ctx:AnalyticsContext):AssistantReply{
  const q=message.toLowerCase().trim();

  // Money-changing intent: propose, never apply.
  if(/\b(raise|lower|increase|decrease|change|set)\b/.test(q)&&/price|\$|\bby\b/.test(q)){
    const item=findItem(ctx,q)??ctx.items[0];
    const amount=Number(q.match(/\$?\s*(\d+(?:\.\d+)?)/)?.[1]??1);
    const down=/\b(lower|decrease|drop|cut)\b/.test(q);
    const newPrice=Math.round((item.price+(down?-amount:amount))*100)/100;
    return{
      kind:'price_change',
      answer:`I can change ${item.name} from ${usd(item.price)} to ${usd(newPrice)}. Review the action below before anything changes.`,
      proposal:{action:`Change ${item.name} to ${usd(newPrice)}`,itemId:item.id,currentPrice:item.price,newPrice},
    };
  }

  if(/\bbest|top|popular\b/.test(q)){
    const top=[...ctx.items].sort((a,b)=>b.unitsSold-a.unitsSold)[0];
    return{kind:'explain',answer:`${top.name} led unit sales over the last ${ctx.periodDays} days with ${top.unitsSold} sold.`};
  }
  if(/\bprofit|margin\b/.test(q)){
    return{kind:'explain',answer:`Gross profit is ${usd(ctx.metrics.profit)} at a ${Math.round(ctx.metrics.margin*100)}% margin across the last ${ctx.periodDays} days.`};
  }
  if(/\bstock|inventory|reorder|low\b/.test(q)){
    return{kind:'reorder',answer:`${ctx.metrics.lowStockCount} item(s) are at or below their reorder point. Open Inventory for suggested quantities.`};
  }
  if(/\bcash|payable|owe\b/.test(q)){
    return{kind:'explain',answer:`You have ${usd(ctx.metrics.cash)} cash on hand and ${usd(ctx.metrics.payables)} in payables due.`};
  }

  return{
    kind:'unknown',
    answer:'Your books and inventory are current. Try asking about your best item, profit, low stock, or a price change.',
  };
}
