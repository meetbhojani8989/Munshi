// Local analytics fixture used until Person A's analytics API exists.
// Item ids mirror the seeded café (lib/core.ts seed: `${businessId}-${index}`,
// so Chicken Wrap is cafe-0 and Tomato Soup is cafe-10) so an approved price
// change can PATCH /api/items/:id against the real business.
import type{AnalyticsContext}from'./types';

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
