export type Line={account:string;debit:number;credit:number};
export type Entry={id:string;date:string;memo:string;source:string;lines:Line[]};
export type Item={id:string;name:string;category:string;price:number;cost:number;stock:number;reorder:number;units:number};
export type Sale={id:string;date:string;time?:string;items:{id:string;name:string;qty:number;price:number;cost:number}[];total:number;channel:string;payment:string};
export type Invoice={id:string;date:string;vendor:string;items:{id:string;name:string;qty:number;cost:number}[];tax?:number;total:number;paid:boolean};
export type Suggestion={id:string;action:string;reason:string;impact:number;confidence:number;category:string;itemId?:string;newPrice?:number;status?:string};
export type Business={id:string;name:string;type:string;eventDay:boolean;cash:number;items:Item[];sales:Sale[];invoices:Invoice[];entries:Entry[];suggestions:Suggestion[];orders:{id:string;channel:string;customer:string;itemId:string;qty:number;status:string}[];experiments:{id:string;itemId:string;price:number;days:number;start:string;status:string}[];outcomes:{id:string;predicted:number;actual:number;lesson:string;action?:string;category?:string}[];arena?:import('./ai/arena').ArenaState};
const today=()=>new Date().toISOString().slice(0,10);
export function post(b:Business,memo:string,source:string,lines:Line[]){const debit=lines.reduce((s,l)=>s+l.debit,0),credit=lines.reduce((s,l)=>s+l.credit,0);if(Math.abs(debit-credit)>.001)throw Error('Unbalanced entry');b.entries.unshift({id:crypto.randomUUID(),date:today(),memo,source,lines});}
export function sell(b:Business,ids:{id:string;qty:number}[],payment='Card',channel='In store'){const items=ids.map(x=>{const i=b.items.find(i=>i.id===x.id);if(!i)throw Error('Item not found');if(x.qty<1||x.qty>i.stock)throw Error('Insufficient stock');return{id:i.id,name:i.name,qty:x.qty,price:i.price,cost:i.cost}});const total=items.reduce((s,i)=>s+i.qty*i.price,0),cogs=items.reduce((s,i)=>s+i.qty*i.cost,0);items.forEach(x=>{const i=b.items.find(i=>i.id===x.id)!;i.stock-=x.qty;i.units+=x.qty});b.cash+=total;const sale={id:crypto.randomUUID(),date:today(),time:new Date().toISOString(),items,total,channel,payment};b.sales.unshift(sale);post(b,`Sale ${sale.id.slice(0,6)}`,sale.id,[{account:payment==='Cash'?'Cash':'Card Clearing',debit:total,credit:0},{account:'Sales Revenue',debit:0,credit:total},{account:'Cost of Goods Sold',debit:cogs,credit:0},{account:'Inventory',debit:0,credit:cogs}]);return sale}
export function receive(b:Business,vendor:string,rows:{id:string;qty:number;cost:number}[]){const items=rows.map(x=>{const i=b.items.find(i=>i.id===x.id);if(!i)throw Error('Item not found');if(x.qty<1||x.cost<0)throw Error('Invalid invoice line');const old=i.stock;i.cost=(old*i.cost+x.qty*x.cost)/(old+x.qty);i.stock+=x.qty;return{id:i.id,name:i.name,qty:x.qty,cost:x.cost}});const total=items.reduce((s,x)=>x.qty*x.cost+s,0);const invoice={id:crypto.randomUUID(),date:today(),vendor,items,total,paid:false};b.invoices.unshift(invoice);post(b,`Invoice from ${vendor}`,invoice.id,[{account:'Inventory',debit:total,credit:0},{account:'Accounts Payable',debit:0,credit:total}]);return invoice}
export function pay(b:Business,id:string){const inv=b.invoices.find(x=>x.id===id);if(!inv||inv.paid)throw Error('Invoice unavailable');inv.paid=true;b.cash-=inv.total;post(b,`Paid ${inv.vendor}`,id,[{account:'Accounts Payable',debit:inv.total,credit:0},{account:'Cash',debit:0,credit:inv.total}]);}
export function balances(b:Business){const o:Record<string,number>={};for(const e of b.entries)for(const l of e.lines)o[l.account]=(o[l.account]||0)+l.debit-l.credit;return o}
export function metrics(b:Business){const book=balances(b);const revenue=-(book['Sales Revenue']||0),cogs=book['Cost of Goods Sold']||0,low=b.items.filter(i=>i.stock<=i.reorder).length;return{revenue,cogs,profit:revenue-cogs,margin:revenue?(revenue-cogs)/revenue:0,low,payables:-(book['Accounts Payable']||0),inventory:book.Inventory||0}}

// Café menu: [name, category, price, unit cost, popularity, when it sells]. Order fixes the item ids (cafe-0 is Chicken Wrap, cafe-10 Tomato Soup).
type Slot='am'|'mid'|'all';
const menu:[string,string,number,number,number,Slot][]=[
  ['Chicken Wrap','Food',9.5,3.1,9,'mid'],['Iced Latte','Drinks',5.25,1.2,10,'all'],['Classic Latte','Drinks',4.95,1.1,9,'am'],['Cappuccino','Drinks',4.75,1.05,6,'am'],
  ['Espresso','Drinks',3.25,.6,4,'am'],['Cold Brew','Drinks',4.95,.95,7,'all'],['Blueberry Muffin','Bakery',3.75,1.05,6,'am'],['Almond Croissant','Bakery',4.25,1.45,5,'am'],
  ['Turkey Panini','Food',10.25,3.6,6,'mid'],['Veggie Wrap','Food',8.75,2.7,4,'mid'],['Tomato Soup','Food',6.5,1.6,6,'mid'],['French Fries','Food',4.5,.9,5,'mid'],
  ['Chai Latte','Drinks',5.25,1.25,5,'all'],['Matcha Latte','Drinks',5.75,1.7,4,'all'],['Greek Salad','Food',9.75,3.4,3,'mid'],['Breakfast Sandwich','Food',7.25,2.2,8,'am'],
  ['Chocolate Cookie','Bakery',2.75,.65,6,'all'],['Banana Bread','Bakery',3.5,.9,3,'all'],['Avocado Toast','Food',8.5,2.9,4,'am'],['Lemonade','Drinks',3.95,.7,3,'mid'],
  ['Sparkling Water','Drinks',2.75,.85,2,'all'],['Brownie','Bakery',3.25,.8,3,'all'],['Bagel','Bakery',3.5,.75,4,'am'],['Fruit Cup','Food',4.75,1.9,1,'all'],['Herbal Tea','Drinks',3.25,.45,1,'all'],
];
const retailMenu:[string,string,number,number][]=[['Canvas Tote','Goods',18,6.5],['Soy Candle','Home',24,8],['Notebook','Paper',12,3.8],['Ceramic Mug','Home',16,5.2],['Gift Card','Gifts',25,25]];
const vendors=['Keystone Produce','Centre Dairy','Happy Valley Bakery','Mountain Coffee','Fresh Supply','Paper & Co'];
const vendorFor=(category:string)=>category==='Drinks'?'Mountain Coffee':category==='Bakery'?'Happy Valley Bakery':category==='Food'?'Keystone Produce':'Paper & Co';
const cents=(n:number)=>Math.round(n*100)/100;
// Hourly POS batches (one sale record per open hour, like a Z-report), so 90 days stay light enough to sync live.
const openHours=[7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
const hourWeight=[.55,1,.95,.6,.65,1.25,1.15,.6,.55,.6,.65,.7,.5,.35,.25];
const weekdayWeight=[.9,.72,.82,.9,.98,1.14,1.32]; // Sun..Sat
// Ninety days of history for two demo businesses. Every stock change has a matching journal entry, so the
// Inventory account equals stock at cost and b.cash equals Cash plus Card Clearing. Lists are newest first.
export function seed():Business[]{
  const now=Date.now(),dayAgo=(d:number)=>new Date(now-d*86400000).toISOString().slice(0,10);
  function make(id:string,name:string,type:string,scale:number):Business{
    const retail=type==='Retail shop';
    let r=retail?7:3;const rand=()=>{r=(r*1664525+1013904223)>>>0;return r/4294967296};
    const rows=menu.map(([n,category,price,cost,pop,slot],j):[string,string,number,number,number,Slot]=>retail&&j<5?[retailMenu[j][0],retailMenu[j][1],retailMenu[j][2],retailMenu[j][3],pop,'all']:[n,category,price,cost,pop,slot]);
    const items:Item[]=rows.map(([n,category,price,cost],j)=>({id:`${id}-${j}`,name:n,category,price,cost,stock:0,reorder:12,units:0}));
    const daily=rows.map(r=>r[4]*scale*1.3); // expected units per day per item
    items.forEach((i,j)=>{i.stock=Math.round(daily[j]*6)+10;i.reorder=Math.max(8,Math.round(daily[j]*2))});
    const b:Business={id,name,type,eventDay:false,cash:12400,items,sales:[],invoices:[],entries:[],suggestions:[],orders:[],experiments:[],outcomes:[]};
    const journal=(id:string,date:string,memo:string,source:string,lines:Line[])=>b.entries.unshift({id,date,memo,source,lines});
    const opening=cents(items.reduce((s,i)=>s+i.stock*i.cost,0));
    journal(`j-${id}-open`,dayAgo(90),'Opening balance','opening',[{account:'Cash',debit:12400,credit:0},{account:'Inventory',debit:opening,credit:0},{account:'Owner Equity',debit:0,credit:12400+opening}]);
    let invoiceNo=0;
    for(let d=89;d>=0;d--){
      const date=dayAgo(d),dow=new Date(date+'T12:00:00Z').getUTCDay();
      // Restock every third day: one invoice per vendor whose items are below a week of demand.
      if(d%3===0){
        for(const vendor of vendors){
          const due=items.map((i,j)=>({i,j})).filter(({i,j})=>vendorFor(i.category)===vendor&&i.stock<daily[j]*7);
          if(!due.length)continue;
          const lines=due.map(({i,j})=>{const qty=Math.max(10,Math.round(daily[j]*8-i.stock));i.stock+=qty;return{id:i.id,name:i.name,qty,cost:i.cost}});
          const total=cents(lines.reduce((s,x)=>s+x.qty*x.cost,0)),inv=`inv-${id}-${invoiceNo++}`,paid=d>8;
          b.invoices.unshift({id:inv,date,vendor,items:lines,total,paid});
          journal(`ji-${inv}`,date,`Invoice from ${vendor}`,inv,[{account:'Inventory',debit:total,credit:0},{account:'Accounts Payable',debit:0,credit:total}]);
          if(paid){b.cash=cents(b.cash-total);journal(`jp-${inv}`,date,`Paid ${vendor}`,inv,[{account:'Accounts Payable',debit:total,credit:0},{account:'Cash',debit:0,credit:total}])}
        }
      }
      // Demand: weekday rhythm, slow growth, and Penn State home-game Saturdays (every other week).
      const gameDay=dow===6&&Math.floor(d/7)%2===0;
      const dayFactor=weekdayWeight[dow]*(1+(89-d)*.002)*(gameDay?1.7:1)*(.88+rand()*.24);
      openHours.forEach((hour,h)=>{
        const at=new Date(`${date}T${String(hour).padStart(2,'0')}:${String(5+Math.floor(rand()*50)).padStart(2,'0')}:00-04:00`).getTime();
        if(at>now-60000)return; // never in the future
        const lines:{id:string;name:string;qty:number;price:number;cost:number}[]=[];
        items.forEach((i,j)=>{
          const slot=rows[j][5],fit=slot==='am'?(hour<11?1.8:hour<14?.6:.25):slot==='mid'?(hour>=11&&hour<15?2:hour<11?.2:.7):1;
          if(!retail&&i.name==='Tomato Soup'&&hour>=20)return; // soup is prepped to run out by 8 PM
          const qty=Math.min(Math.floor(daily[j]*dayFactor*hourWeight[h]*fit/9.5+rand()),i.stock);
          if(qty>0)lines.push({id:i.id,name:i.name,qty,price:i.price,cost:i.cost});
        });
        if(!lines.length)return;
        const total=cents(lines.reduce((s,l)=>s+l.qty*l.price,0)),cogs=cents(lines.reduce((s,l)=>s+l.qty*l.cost,0)),sale=`s-${id}-${d}-${hour}`;
        for(const l of lines){const i=items.find(x=>x.id===l.id)!;i.stock-=l.qty;i.units+=l.qty}
        b.cash=cents(b.cash+total);
        const channel=hour>=17&&h%2===0?'DoorDash':'In store';
        b.sales.unshift({id:sale,date,time:new Date(at).toISOString(),items:lines,total,channel,payment:'Card'});
        journal(`j-${sale}`,date,`POS batch ${String(hour).padStart(2,'0')}:00 · ${lines.reduce((s,l)=>s+l.qty,0)} items`,sale,[{account:'Card Clearing',debit:total,credit:0},{account:'Sales Revenue',debit:0,credit:total},{account:'Cost of Goods Sold',debit:cogs,credit:0},{account:'Inventory',debit:0,credit:cogs}]);
      });
    }
    const wrap=items[0],fries=items[11];
    b.suggestions=[{id:'p1',action:`Raise ${wrap.name} by $1`,reason:'Wrap demand held steady through two cost increases; a $1 rise keeps it below the panini.',impact:340,confidence:82,category:'Pricing',itemId:wrap.id,newPrice:cents(wrap.price+1)},{id:'p2',action:`Reorder ${fries.name} before game days`,reason:'You sold out early on the last three Penn State home-game Saturdays.',impact:240,confidence:76,category:'Inventory',itemId:fries.id},{id:'p3',action:'Trim the last open hour on Mondays',reason:'Monday 9–10 PM sales rarely cover the labor for that hour.',impact:110,confidence:68,category:'Hours'},{id:'p4',action:'Try a soup and half-wrap lunch combo',reason:'Lunch guests who buy wraps often add a drink; a combo lifts the average ticket.',impact:165,confidence:64,category:'Menu'}];
    // Graded past advice, oldest first: early calls miss, later ones land as Munshi learns.
    b.outcomes=([['Raise the iced latte by $0.75','Pricing',120,70],['Stock extra muffins for the weekend','Inventory',150,110],['Run a mid-week discount','Promotion',200,120],['Extend evening hours on Thursdays','Hours',180,230],['Bundle a cookie with every wrap','Menu',160,165],['Add a seasonal soup special','Menu',140,150],['Reorder cold brew before the heatwave','Inventory',220,210],['Raise the cappuccino by $0.50','Pricing',190,250],['Raise the chicken wrap by $1','Pricing',300,290],['Trim the last open hour on Tuesdays','Hours',120,118],['Raise the chicken wrap by $1 again','Pricing',340,355],['Keep soup available until close','Inventory',160,158]] as [string,string,number,number][]).map(([action,category,predicted,actual],n)=>{const off=Math.abs(actual-predicted)/predicted;return{id:`o${n}`,action,category,predicted,actual,lesson:off<.15?'The forecast matched the result; trust this kind of advice more.':actual<predicted?'Demand came in softer than predicted; discount this pattern next time.':'The upside beat the forecast; the model was too cautious here.'}});
    b.orders=[{id:'ord1',channel:'DoorDash',customer:'Jordan M.',itemId:items[0].id,qty:2,status:'New'},{id:'ord2',channel:'Uber Eats',customer:'Alex R.',itemId:items[1].id,qty:1,status:'Preparing'},{id:'ord3',channel:'Website',customer:'Taylor S.',itemId:items[2].id,qty:3,status:'Ready'}];
    return b;
  }
  return[make('cafe','Nittany Bean & Wrap','Café',1),make('retail','Hearth & Pine Market','Retail shop',.3)];
}

