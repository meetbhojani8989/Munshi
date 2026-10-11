export type Line={account:string;debit:number;credit:number};
export type Entry={id:string;date:string;memo:string;source:string;lines:Line[]};
export type Item={id:string;name:string;category:string;price:number;cost:number;stock:number;reorder:number;units:number};
export type Sale={id:string;date:string;time?:string;items:{id:string;name:string;qty:number;price:number;cost:number}[];total:number;channel:string;payment:string};
export type Invoice={id:string;date:string;vendor:string;items:{id:string;name:string;qty:number;cost:number}[];tax?:number;total:number;paid:boolean};
export type Suggestion={id:string;action:string;reason:string;impact:number;confidence:number;category:string;itemId?:string;newPrice?:number;status?:string};
export type Business={id:string;name:string;type:string;eventDay:boolean;cash:number;items:Item[];sales:Sale[];invoices:Invoice[];entries:Entry[];suggestions:Suggestion[];orders:{id:string;channel:string;customer:string;itemId:string;qty:number;status:string}[];experiments:{id:string;itemId:string;price:number;days:number;start:string;status:string}[];outcomes:{id:string;predicted:number;actual:number;lesson:string}[]};
const today=()=>new Date().toISOString().slice(0,10);
export function post(b:Business,memo:string,source:string,lines:Line[]){const debit=lines.reduce((s,l)=>s+l.debit,0),credit=lines.reduce((s,l)=>s+l.credit,0);if(Math.abs(debit-credit)>.001)throw Error('Unbalanced entry');b.entries.unshift({id:crypto.randomUUID(),date:today(),memo,source,lines});}
export function sell(b:Business,ids:{id:string;qty:number}[],payment='Card',channel='In store'){const items=ids.map(x=>{const i=b.items.find(i=>i.id===x.id);if(!i)throw Error('Item not found');if(x.qty<1||x.qty>i.stock)throw Error('Insufficient stock');return{id:i.id,name:i.name,qty:x.qty,price:i.price,cost:i.cost}});const total=items.reduce((s,i)=>s+i.qty*i.price,0),cogs=items.reduce((s,i)=>s+i.qty*i.cost,0);items.forEach(x=>{const i=b.items.find(i=>i.id===x.id)!;i.stock-=x.qty;i.units+=x.qty});b.cash+=total;const sale={id:crypto.randomUUID(),date:today(),time:new Date().toISOString(),items,total,channel,payment};b.sales.unshift(sale);post(b,`Sale ${sale.id.slice(0,6)}`,sale.id,[{account:payment==='Cash'?'Cash':'Card Clearing',debit:total,credit:0},{account:'Sales Revenue',debit:0,credit:total},{account:'Cost of Goods Sold',debit:cogs,credit:0},{account:'Inventory',debit:0,credit:cogs}]);return sale}
export function receive(b:Business,vendor:string,rows:{id:string;qty:number;cost:number}[]){const items=rows.map(x=>{const i=b.items.find(i=>i.id===x.id);if(!i)throw Error('Item not found');if(x.qty<1||x.cost<0)throw Error('Invalid invoice line');const old=i.stock;i.cost=(old*i.cost+x.qty*x.cost)/(old+x.qty);i.stock+=x.qty;return{id:i.id,name:i.name,qty:x.qty,cost:x.cost}});const total=items.reduce((s,x)=>x.qty*x.cost+s,0);const invoice={id:crypto.randomUUID(),date:today(),vendor,items,total,paid:false};b.invoices.unshift(invoice);post(b,`Invoice from ${vendor}`,invoice.id,[{account:'Inventory',debit:total,credit:0},{account:'Accounts Payable',debit:0,credit:total}]);return invoice}
export function pay(b:Business,id:string){const inv=b.invoices.find(x=>x.id===id);if(!inv||inv.paid)throw Error('Invoice unavailable');inv.paid=true;b.cash-=inv.total;post(b,`Paid ${inv.vendor}`,id,[{account:'Accounts Payable',debit:inv.total,credit:0},{account:'Cash',debit:0,credit:inv.total}]);}
export function balances(b:Business){const o:Record<string,number>={};for(const e of b.entries)for(const l of e.lines)o[l.account]=(o[l.account]||0)+l.debit-l.credit;return o}
export function metrics(b:Business){const book=balances(b);const revenue=-(book['Sales Revenue']||0),cogs=book['Cost of Goods Sold']||0,low=b.items.filter(i=>i.stock<=i.reorder).length;return{revenue,cogs,profit:revenue-cogs,margin:revenue?(revenue-cogs)/revenue:0,low,payables:-(book['Accounts Payable']||0),inventory:book.Inventory||0}}

const names=['Chicken Wrap','Iced Latte','Classic Latte','Cappuccino','Espresso','Cold Brew','Blueberry Muffin','Almond Croissant','Turkey Panini','Veggie Wrap','Tomato Soup','French Fries','Chai Latte','Matcha Latte','Greek Salad','Breakfast Sandwich','Chocolate Cookie','Banana Bread','Avocado Toast','Lemonade','Sparkling Water','Brownie','Bagel','Fruit Cup','Herbal Tea'];
const vendors=['Keystone Produce','Centre Dairy','Happy Valley Bakery','Mountain Coffee','Fresh Supply','Paper & Co'];
const cents=(n:number)=>Math.round(n*100)/100;
const hours=[7,8,8,9,9,12,12,13,13,15,17,18];
// Ninety days of history for two demo businesses. Every stock change has a matching journal entry, so the
// Inventory account equals stock at cost and b.cash equals Cash plus Card Clearing. Lists are newest first.
export function seed():Business[]{
  const now=Date.now(),dayAgo=(d:number)=>new Date(now-d*86400000).toISOString().slice(0,10);
  function make(id:string,name:string,type:string):Business{
    const retail=type==='Retail shop';
    const items=names.map((n,j)=>({id:`${id}-${j}`,name:retail?['Canvas Tote','Soy Candle','Notebook','Ceramic Mug','Gift Card',...names][j]:n,category:j<6?'Drinks':j<16?'Food':'Bakery',price:cents(4+j%8*1.7),cost:cents(1+j%5*.45),stock:8+j%11*4,reorder:12,units:0}));
    const b:Business={id,name,type,eventDay:false,cash:12400,items,sales:[],invoices:[],entries:[],suggestions:[],orders:[],experiments:[],outcomes:[]};
    const journal=(id:string,date:string,memo:string,source:string,lines:Line[])=>b.entries.unshift({id,date,memo,source,lines});
    const opening=cents(items.reduce((s,i)=>s+i.stock*i.cost,0));
    journal(`j-${id}-open`,dayAgo(89),'Opening balance','opening',[{account:'Cash',debit:12400,credit:0},{account:'Inventory',debit:opening,credit:0},{account:'Owner Equity',debit:0,credit:12400+opening}]);
    for(let d=89;d>=0;d--){
      const date=dayAgo(d),n=d/4;
      if(d%4===0&&n<20){ // a delivery every fourth day; all but the four most recent are paid
        const i=items[n%items.length],total=cents(20*i.cost),paid=n>3,inv=`inv-${id}-${n}`;
        i.stock+=20;
        b.invoices.unshift({id:inv,date,vendor:vendors[n%vendors.length],items:[{id:i.id,name:i.name,qty:20,cost:i.cost}],total,paid});
        journal(`ji-${id}-${n}`,date,`Invoice from ${vendors[n%vendors.length]}`,inv,[{account:'Inventory',debit:total,credit:0},{account:'Accounts Payable',debit:0,credit:total}]);
        if(paid){b.cash=cents(b.cash-total);journal(`jp-${id}-${n}`,date,`Paid ${vendors[n%vendors.length]}`,inv,[{account:'Accounts Payable',debit:total,credit:0},{account:'Cash',debit:0,credit:total}])}
      }
      let num=retail?2:4;if(new Date(date).getUTCDay()===6)num+=2;if(d%17===0)num+=5;
      for(let k=0;k<num;k++){
        const i=items[(d*7+k*3)%items.length],qty=Math.min(1+(k%3===0?1:0),i.stock);
        if(!qty)continue; // sold out
        const total=cents(i.price*qty),cogs=cents(i.cost*qty),sale=`s-${id}-${d}-${k}`;
        i.stock-=qty;i.units+=qty;b.cash=cents(b.cash+total);
        const at=new Date(`${date}T${String(hours[(d*3+k*5)%hours.length]).padStart(2,'0')}:${String((d*13+k*17)%60).padStart(2,'0')}:00-04:00`).getTime(),time=new Date(Math.min(at,now-(num-k)*240000)).toISOString(); // never in the future
        b.sales.unshift({id:sale,date,time,items:[{id:i.id,name:i.name,qty,price:i.price,cost:i.cost}],total,channel:k%5===0?'DoorDash':'In store',payment:'Card'});
        journal(`j-${id}-${d}-${k}`,date,`Sale of ${i.name}`,sale,[{account:'Card Clearing',debit:total,credit:0},{account:'Sales Revenue',debit:0,credit:total},{account:'Cost of Goods Sold',debit:cogs,credit:0},{account:'Inventory',debit:0,credit:cogs}]);
      }
    }
    b.suggestions=[{id:'p1',action:`Raise ${items[0].name} by $0.50`,reason:'Demand has held steady while ingredient costs rose.',impact:185,confidence:82,category:'Pricing',itemId:items[0].id,newPrice:items[0].price+.5},{id:'p2',action:`Reorder ${items[11].name} before event days`,reason:'You sold out early on three busy days.',impact:240,confidence:76,category:'Inventory',itemId:items[11].id},{id:'p3',action:'Trim the last open hour on Tuesdays',reason:'Sales rarely cover labor in that hour.',impact:110,confidence:68,category:'Hours'},{id:'p4',action:'Try a seasonal wrap special',reason:'Lunch customers often pair wraps with drinks.',impact:165,confidence:64,category:'Menu'}];
    b.outcomes=Array.from({length:12},(_,n)=>({id:`o${n}`,predicted:80+n*16,actual:Math.round((80+n*16)*(n%4===0?.72:1.1)),lesson:n%4===0?'Demand was softer than expected.':'Customer response matched the forecast.'}));
    b.orders=[{id:'ord1',channel:'DoorDash',customer:'Jordan M.',itemId:items[0].id,qty:2,status:'New'},{id:'ord2',channel:'Uber Eats',customer:'Alex R.',itemId:items[1].id,qty:1,status:'Preparing'},{id:'ord3',channel:'Website',customer:'Taylor S.',itemId:items[2].id,qty:3,status:'Ready'}];
    return b;
  }
  return[make('cafe','Nittany Bean & Wrap','Café'),make('retail','Hearth & Pine Market','Retail shop')];
}

