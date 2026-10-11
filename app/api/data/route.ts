import{auth}from'@/auth';
import{NextRequest,NextResponse}from'next/server';
import{z,ZodError}from'zod';
import{sell,receive,pay,type Business}from'@/lib/core';
import{findOrCreateItem}from'@/lib/ledger';
import{getStore}from'@/lib/store';
import{refreshSuggestions}from'@/lib/ai/context';

export const dynamic='force-dynamic';
export const maxDuration=60;

const schema=z.object({businessId:z.string(),action:z.string(),payload:z.unknown().optional()});
const invoiceLines=z.array(z.object({id:z.string().optional(),name:z.string().optional(),qty:z.number({invalid_type_error:'Enter a quantity'}).int('Quantity must be a whole number').positive('Quantity must be at least 1'),cost:z.number({invalid_type_error:'Enter a unit cost'}).nonnegative('Unit cost cannot be negative')})).min(1,'Add at least one line');
// A line with no id names a product that is not stocked yet; it is added to the item list.
function postInvoice(b:Business,p:any){const vendor=z.string().trim().min(1,'Enter a vendor').parse(p.vendor),date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/,'Enter a valid date').optional().parse(p.date||undefined),lines=invoiceLines.parse(p.items);for(const l of lines)if(l.id?!b.items.some(i=>i.id===l.id):!l.name?.trim())throw Error('Choose an item for every line');const invoice=receive(b,vendor,lines.map(l=>({id:l.id||findOrCreateItem(b,l.name!,l.cost).id,qty:l.qty,cost:l.cost})));if(date){invoice.date=date;b.entries[0].date=date}return invoice}

// Goes through getStore(): MongoDB when MONGODB_URI is set, otherwise the local file store.
export async function GET(){
  if(!await auth())return NextResponse.json({error:'Sign in required'},{status:401});
  return NextResponse.json(await getStore().list());
}

export async function POST(req:NextRequest){
  if(!await auth())return NextResponse.json({error:'Sign in required'},{status:401});
  try{
    const store=getStore();
    const{businessId,action,payload}=schema.parse(await req.json());
    if(action==='reset')return NextResponse.json({businesses:await store.reset()});
    const b=await store.get(businessId);
    if(!b)throw Error('Business not found');
    let result:unknown=b;
    const p=(payload??{})as any;
    if(action==='sale')result=sell(b,z.array(z.object({id:z.string(),qty:z.number().int().positive()})).parse(p.items),z.string().parse(p.payment),p.channel||'In store');
    else if(action==='invoice')result=postInvoice(b,p);
    else if(action==='pay')pay(b,z.string().parse(p.id));
    else if(action==='event')b.eventDay=!!p.value;
    else if(action==='price'){const i=b.items.find(x=>x.id===p.id);if(i)i.price=z.number().positive().parse(p.price)}
    else if(action==='suggestion'){const s=b.suggestions.find(x=>x.id===p.id);if(s){s.status=p.status;if(p.status==='Approved'&&s.itemId&&s.newPrice){const i=b.items.find(x=>x.id===s.itemId);if(i)i.price=s.newPrice}if(p.status==='Testing'&&s.itemId&&s.newPrice)b.experiments.push({id:crypto.randomUUID(),itemId:s.itemId,price:s.newPrice,days:14,start:new Date().toISOString(),status:'Active'})}}
    else if(action==='insights')result=await refreshSuggestions(b);
    else if(action==='experiment')b.experiments.push({id:crypto.randomUUID(),itemId:z.string().parse(p.itemId),price:z.number().positive().parse(p.price),days:z.number().int().positive().parse(p.days),start:new Date().toISOString(),status:'Active'});
    else if(action==='order'){const o=b.orders.find(x=>x.id===p.id);if(o){o.status=p.status;if(p.status==='Done')result=sell(b,[{id:o.itemId,qty:o.qty}],'Card',o.channel)}}
    else if(action==='business'){b.name=z.string().min(1).parse(p.name)}
    else throw Error('Unknown action');
    await store.save(b);
    return NextResponse.json({businesses:await store.list(),result});
  }catch(e){
    return NextResponse.json({error:e instanceof ZodError?e.issues[0]?.message||'Invalid request':e instanceof Error?e.message:'Invalid request'},{status:400});
  }
}
