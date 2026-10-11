// Local analytics fixture used until Person A's analytics API exists.
// Item ids mirror the seeded café (lib/core.ts seed: `${businessId}-${index}`,
// so Chicken Wrap is cafe-0 and Tomato Soup is cafe-10) so an approved price
// change can PATCH /api/items/:id against the real business.
import type{AnalyticsContext,Prediction,SuggestionCategory}from'./types';

export const mockAnalyticsContext:AnalyticsContext={
  businessId:'cafe',
  businessName:'Nittany Bean & Wrap',
  businessType:'Café',
  currency:'USD',
  periodDays:90,
  metrics:{
    revenue:48250,
    cogs:16890,
    profit:31360,
    margin:0.65,
    cash:12400,
    payables:1840,
    inventory:5920,
    lowStockCount:3,
  },
  hours:{open:'07:00',close:'22:00'},
  eventDay:false,
  items:[
    {id:'cafe-0',name:'Chicken Wrap',category:'Food',price:7.5,cost:2.35,unitsSold:412,stock:18,reorder:12},
    {id:'cafe-1',name:'Iced Latte',category:'Drinks',price:5.2,cost:1.45,unitsSold:388,stock:40,reorder:12},
    {id:'cafe-10',name:'Tomato Soup',category:'Food',price:6.0,cost:1.8,unitsSold:196,stock:4,reorder:12,sellsOutBy:'20:00'},
    {id:'cafe-6',name:'Blueberry Muffin',category:'Bakery',price:3.75,cost:1.1,unitsSold:134,stock:52,reorder:12},
    {id:'cafe-14',name:'Matcha Latte',category:'Drinks',price:5.8,cost:1.6,unitsSold:88,stock:60,reorder:12},
  ],
};

export function getAnalyticsContext():AnalyticsContext{
  // A function (not just the constant) so the route layer can later swap this
  // for a real fetch without changing its callers.
  return mockAnalyticsContext;
}

// Past predictions paired with what actually happened, oldest first. Early
// calls miss and later ones land, so the scorecard trend climbs as Munshi learns.
const history:[string,SuggestionCategory,number,number,number][]=[
  // action, category, predicted, actual, confidence
  ['Raise the iced latte by $0.75','pricing',120,70,0.6],
  ['Stock extra muffins for the weekend','inventory',150,110,0.62],
  ['Run a mid-week discount','promotions',200,120,0.55],
  ['Extend evening hours on Thursdays','hours',180,230,0.6],
  ['Bundle a cookie with every wrap','menu',160,165,0.66],
  ['Add a seasonal soup special','menu',140,150,0.68],
  ['Reorder cold brew before the heatwave','inventory',220,210,0.72],
  ['Raise the cappuccino by $0.50','pricing',190,250,0.7],
  ['Raise the chicken wrap by $1','pricing',300,290,0.82],
  ['Trim the last open hour on Tuesdays','hours',120,118,0.68],
  ['Raise the chicken wrap by $1 again','pricing',340,355,0.8],
  ['Keep soup available until close','inventory',160,158,0.74],
];

export function getPredictionHistory():{prediction:Prediction;actual:number}[]{
  return history.map(([action,category,predicted,actual,confidence],i)=>({
    prediction:{id:`pred-${i+1}`,action,category,predicted,confidence},
    actual,
  }));
}
