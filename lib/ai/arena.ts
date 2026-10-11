// Agent Arena: a team of forecasting agents that improves itself on the business's own books.
//
// Problem (measurable): forecast tomorrow's revenue from the sales history. Forecasts drive
// reorder points and the Leak Finder, so lower error means fewer sell-outs and less waste.
// Score: WAPE (sum |error| / sum actual) on one-step-ahead forecasts. Lower is better.
//
// Each round, three agents with different specialties propose forecasting strategies in parallel
// (on Luminal-hosted DeepSeek/GLM when LLM_* is set, otherwise a deterministic local search).
// Every strategy is back-tested by code, never by the model. A critic agent reads the round and
// writes lessons into memory; the next round's agents see the leaderboard and the lessons.
// After the last round the champion is scored once on the final 14 days, which no agent ever saw.
import{z}from'zod';
import type{Business}from'../core';
import{createLlmClient,parseJson,modelName,type LlmClient}from'./llm';

const DAY=86400000;
export const HOLDOUT_DAYS=14;
const MIN_HISTORY=28; // days of history before the first scored forecast

export const strategySchema=z.object({
  method:z.enum(['mean','median','ewma']),
  window:z.coerce.number().int().min(1).max(42),
  alpha:z.coerce.number().min(0.05).max(0.95).default(0.3),
  weekdayWeight:z.coerce.number().min(0).max(1).default(0),
  seasonWeeks:z.coerce.number().int().min(1).max(8).default(4),
  trendWeight:z.coerce.number().min(0).max(1).default(0),
  clip:z.coerce.number().min(0).max(5).default(0),
});
export type Strategy=z.infer<typeof strategySchema>;

export type AgentName='Seasonalist'|'Smoother'|'Trend Scout';
export type Proposal={agent:AgentName;strategy:Strategy;hypothesis:string;wape:number};
export type Round={n:number;proposals:Proposal[];best:Proposal;bestSoFar:number;lessons:string[];ms:number};
export type ArenaRun={
  id:string;startedAt:string;model:string;live:boolean;
  days:number;validationDays:number;holdoutDays:number;
  baseline:{strategy:Strategy;wape:number};
  rounds:Round[];
  champion?:Proposal;
  final?:{baselineWape:number;championWape:number;improvementPct:number;testedAt:string};
};
export type ArenaState={current?:ArenaRun;memory:string[];bestStrategy?:Strategy;history:{id:string;at:string;baseline:number;champion:number;holdoutImprovementPct:number}[]};

export const BASELINE:Strategy={method:'mean',window:1,alpha:0.3,weekdayWeight:0,seasonWeeks:4,trendWeight:0,clip:0};

const AGENTS:{name:AgentName;focus:string}[]=[
  {name:'Seasonalist',focus:'day-of-week patterns: weekdayWeight and seasonWeeks'},
  {name:'Smoother',focus:'noise and spikes: method, window, alpha and clip'},
  {name:'Trend Scout',focus:'momentum and recency: trendWeight, alpha and short windows'},
];

// ---------- data ----------

/** Daily revenue, oldest first, ending yesterday (today is still in progress). */
export function dailyRevenue(b:Business,days=90):{date:string;revenue:number}[]{
  const byDate=new Map<string,number>();
  for(const s of b.sales)byDate.set(s.date,(byDate.get(s.date)||0)+s.total);
  const out=[];
  for(let d=days;d>=1;d--){
    const date=new Date(Date.now()-d*DAY).toISOString().slice(0,10);
    out.push({date,revenue:Math.round((byDate.get(date)||0)*100)/100});
  }
  return out;
}

// ---------- the forecaster every strategy configures ----------

const median=(xs:number[])=>{const s=[...xs].sort((a,b)=>a-b),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
const mean=(xs:number[])=>xs.reduce((a,b)=>a+b,0)/xs.length;

function clipSpikes(xs:number[],k:number){
  if(!k||xs.length<3)return xs;
  const med=median(xs),mad=median(xs.map(x=>Math.abs(x-med)))||1;
  return xs.map(x=>Math.min(Math.max(x,med-k*mad*1.4826),med+k*mad*1.4826));
}

/** Forecast series[t] from series[0..t-1] only. */
export function forecast(series:number[],t:number,dows:number[],s:Strategy):number{
  const hist=series.slice(0,t);
  const recent=clipSpikes(hist.slice(-s.window),s.clip);
  let level:number;
  if(s.method==='median')level=median(recent);
  else if(s.method==='ewma'){level=recent[0];for(const x of recent.slice(1))level=s.alpha*x+(1-s.alpha)*level}
  else level=mean(recent);
  if(s.trendWeight>0&&recent.length>=4){
    const half=recent.length>>1,slope=(mean(recent.slice(half))-mean(recent.slice(0,half)))/half;
    level+=s.trendWeight*slope*(recent.length/2);
  }
  if(s.weekdayWeight>0){
    // Multiplicative weekday factor: same weekday over the last N weeks vs the overall average.
    const span=hist.slice(-7*s.seasonWeeks),spanDows=dows.slice(Math.max(0,t-7*s.seasonWeeks),t);
    const same=span.filter((_,i)=>spanDows[i]===dows[t]);
    const avg=mean(span);
    if(same.length&&avg>0){const factor=mean(clipSpikes(same,s.clip))/avg;level*=1+s.weekdayWeight*(factor-1)}
  }
  return Math.max(0,level);
}

/** Weighted absolute percentage error of one-step forecasts over [from, to). */
export function wape(series:number[],dows:number[],s:Strategy,from:number,to:number):number{
  let err=0,act=0;
  for(let t=from;t<to;t++){err+=Math.abs(forecast(series,t,dows,s)-series[t]);act+=series[t]}
  return act?Math.round(err/act*10000)/10000:1;
}

type Data={series:number[];dows:number[];valFrom:number;valTo:number;testTo:number};
function prepare(b:Business):Data{
  const rows=dailyRevenue(b);
  const series=rows.map(r=>r.revenue),dows=rows.map(r=>new Date(r.date+'T12:00:00Z').getUTCDay());
  return{series,dows,valFrom:MIN_HISTORY,valTo:series.length-HOLDOUT_DAYS,testTo:series.length};
}

// ---------- agents ----------

const pct=(w:number)=>`${(w*100).toFixed(1)}%`;
const describe=(s:Strategy)=>`${s.method}(${s.window}d${s.method==='ewma'?`, α ${s.alpha}`:''})${s.weekdayWeight?` + weekday ${s.weekdayWeight}×${s.seasonWeeks}wk`:''}${s.trendWeight?` + trend ${s.trendWeight}`:''}${s.clip?` + clip ${s.clip}σ`:''}`;
export{describe as describeStrategy};

// Deterministic PRNG so the offline arena is reproducible run to run.
function rng(seed:number){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
const round2=(n:number)=>Math.round(n*100)/100;

function mutate(base:Strategy,agent:AgentName,r:()=>number,step:number):Strategy{
  const s={...base};
  const scale=Math.max(0.25,1-step*0.15); // agents take smaller steps as they converge
  const nudge=(v:number,by:number,lo:number,hi:number)=>round2(Math.min(hi,Math.max(lo,v+(r()*2-1)*by*scale)));
  if(agent==='Seasonalist'){
    s.weekdayWeight=nudge(s.weekdayWeight||0.3,0.5,0,1);
    s.seasonWeeks=Math.round(nudge(s.seasonWeeks,3,1,8));
    if(r()<0.4)s.window=Math.round(nudge(s.window,7,1,42));
  }else if(agent==='Smoother'){
    if(r()<0.35)s.method=(['mean','median','ewma']as const)[Math.floor(r()*3)];
    s.window=Math.round(nudge(s.window<3?14:s.window,10,1,42));
    s.alpha=nudge(s.alpha,0.25,0.05,0.95);
    s.clip=nudge(s.clip||1.5,1.5,0,5);
  }else{
    s.trendWeight=nudge(s.trendWeight,0.4,0,1);
    s.alpha=nudge(s.alpha,0.2,0.05,0.95);
    if(r()<0.5)s.window=Math.round(nudge(s.window,6,2,42));
  }
  return strategySchema.parse(s);
}

const HYPOTHESES:Record<AgentName,string>={
  'Seasonalist':'Weekends and weekdays behave differently; scaling by the weekday factor should cut error.',
  'Smoother':'Single busy days distort the level; a robust, longer window should be steadier.',
  'Trend Scout':'Recent days carry signal about where demand is heading; weight them more.',
};

const SYSTEM=(agent:{name:AgentName;focus:string})=>`You are ${agent.name}, one of three forecasting agents improving a small café's revenue forecast.
You configure a fixed forecaster; code back-tests your config, so propose configs, not numbers.
Parameters: method "mean"|"median"|"ewma"; window 1-42 days; alpha 0.05-0.95 (ewma only); weekdayWeight 0-1 (blend of day-of-week factor);
seasonWeeks 1-8 (weeks used for the weekday factor); trendWeight 0-1; clip 0-5 (clip outliers at k robust std devs, 0 = off).
Score is WAPE on one-step-ahead daily forecasts (lower is better). Your specialty: ${agent.focus}.
Return ONLY JSON: {"proposals":[{"strategy":{...},"hypothesis":"one sentence"}]} with exactly 2 proposals that differ from configs already on the leaderboard.`;

const proposalsSchema=z.object({proposals:z.array(z.object({strategy:strategySchema,hypothesis:z.string().default('')})).min(1)});

async function agentPropose(client:LlmClient,agent:{name:AgentName;focus:string},ctx:{leaderboard:Proposal[];lessons:string[];stats:string;round:number},r:()=>number,best:Strategy){
  if(client.live){
    try{
      const user=JSON.stringify({
        round:ctx.round,data:ctx.stats,
        leaderboard:ctx.leaderboard.slice(0,6).map(p=>({agent:p.agent,strategy:p.strategy,wape:p.wape})),
        lessons:ctx.lessons.slice(-8),
      });
      const raw=await client.complete([{role:'system',content:SYSTEM(agent)},{role:'user',content:user}],{json:true,temperature:0.7,effort:'low'});
      const parsed=proposalsSchema.parse(parseJson(raw));
      return parsed.proposals.slice(0,2).map(p=>({strategy:p.strategy,hypothesis:p.hypothesis||HYPOTHESES[agent.name]}));
    }catch(e){console.error(`${agent.name} fell back to local search:`,e)}
  }
  return[0,1].map(()=>({strategy:mutate(best,agent.name,r,ctx.round),hypothesis:HYPOTHESES[agent.name]}));
}

function localLessons(proposals:Proposal[],prevBest:number):string[]{
  const sorted=[...proposals].sort((a,b)=>a.wape-b.wape),top=sorted[0],worst=sorted[sorted.length-1];
  const lessons=[];
  if(top.wape<prevBest)lessons.push(`${top.agent} cut error to ${pct(top.wape)} with ${describe(top.strategy)}.`);
  else lessons.push(`No proposal beat the champion (${pct(prevBest)}); search closer to it.`);
  const weekday=proposals.filter(p=>p.strategy.weekdayWeight>=0.5),flat=proposals.filter(p=>p.strategy.weekdayWeight<0.2);
  if(weekday.length&&flat.length){
    const w=mean(weekday.map(p=>p.wape)),f=mean(flat.map(p=>p.wape));
    lessons.push(w<f?`Strong weekday weighting beat flat forecasts by ${((f-w)*100).toFixed(1)} pts.`:`Weekday weighting did not help this round (${((w-f)*100).toFixed(1)} pts worse).`);
  }
  if(worst.wape-top.wape>0.05)lessons.push(`Avoid ${describe(worst.strategy)}: ${pct(worst.wape)} error.`);
  return lessons.slice(0,3);
}

async function critic(client:LlmClient,proposals:Proposal[],prevBest:number,memory:string[]):Promise<string[]>{
  if(client.live){
    try{
      const raw=await client.complete([
        {role:'system',content:'You are the critic of a forecasting agent team. Read this round\'s back-test results and write up to 3 short, specific lessons (each under 20 words) that will help the next round. Return ONLY JSON {"lessons":["..."]}.'},
        {role:'user',content:JSON.stringify({previousBestWape:prevBest,results:proposals.map(p=>({agent:p.agent,strategy:p.strategy,wape:p.wape})),existingLessons:memory.slice(-6)})},
      ],{json:true,temperature:0.3,effort:'low'});
      const lessons=z.object({lessons:z.array(z.string()).min(1)}).parse(parseJson(raw)).lessons;
      return lessons.slice(0,3).map(l=>l.slice(0,180));
    }catch(e){console.error('Critic fell back to local lessons:',e)}
  }
  return localLessons(proposals,prevBest);
}

// ---------- the arena loop (one step per request so serverless calls stay short) ----------

export function emptyArena():ArenaState{return{memory:[],history:[]}}

export function startRun(b:Business):ArenaRun{
  const d=prepare(b);
  const live=createLlmClient().live;
  return{
    id:`run-${Date.now().toString(36)}`,startedAt:new Date().toISOString(),model:modelName(),live,
    days:d.series.length,validationDays:d.valTo-d.valFrom,holdoutDays:HOLDOUT_DAYS,
    baseline:{strategy:BASELINE,wape:wape(d.series,d.dows,BASELINE,d.valFrom,d.valTo)},
    rounds:[],
  };
}

export async function runRound(b:Business,state:ArenaState,client:LlmClient=createLlmClient()):Promise<Round>{
  const run=state.current;
  if(!run)throw Error('Start a run first');
  if(run.final)throw Error('This run is finished; start a new one');
  const started=Date.now();
  const d=prepare(b);
  const n=run.rounds.length+1;
  const all=run.rounds.flatMap(r=>r.proposals);
  // A new run starts from the best strategy remembered from earlier runs, so the team compounds.
  const remembered=state.bestStrategy?{agent:'Smoother'as AgentName,strategy:state.bestStrategy,hypothesis:'Champion carried over from memory.',wape:wape(d.series,d.dows,state.bestStrategy,d.valFrom,d.valTo)}:null;
  const start={agent:'Smoother'as AgentName,strategy:run.baseline.strategy,hypothesis:'Baseline: tomorrow looks like today.',wape:run.baseline.wape};
  const champion=run.champion??(remembered&&remembered.wape<start.wape?remembered:start);
  const leaderboard=[champion,...all].sort((a,b)=>a.wape-b.wape);
  const stats=`${d.series.length} days of daily revenue, mean $${mean(d.series).toFixed(0)}, min $${Math.min(...d.series).toFixed(0)}, max $${Math.max(...d.series).toFixed(0)}; validation is the ${d.valTo-d.valFrom} days before the hidden final ${HOLDOUT_DAYS}.`;
  const r=rng(n*7919+d.series.length+state.history.length*104729);
  // The three agents work in parallel.
  const batches=await Promise.all(AGENTS.map(agent=>agentPropose(client,agent,{leaderboard,lessons:state.memory,stats,round:n},r,leaderboard[0].strategy)));
  const proposals:Proposal[]=batches.flatMap((batch,i)=>batch.map(p=>({agent:AGENTS[i].name,strategy:p.strategy,hypothesis:p.hypothesis,wape:wape(d.series,d.dows,p.strategy,d.valFrom,d.valTo)})));
  const best=[...proposals].sort((a,b)=>a.wape-b.wape)[0];
  if(best.wape<champion.wape)run.champion=best;
  else run.champion=champion;
  const lessons=await critic(client,proposals,champion.wape,state.memory);
  state.memory=[...state.memory,...lessons].slice(-24); // long-term memory carries into the next run
  const round:Round={n,proposals,best,bestSoFar:run.champion.wape,lessons,ms:Date.now()-started};
  run.rounds.push(round);
  return round;
}

/** Score the champion and the baseline once on the final days no agent ever saw. */
export function finalTest(b:Business,state:ArenaState){
  const run=state.current;
  if(!run?.champion)throw Error('Run at least one round first');
  const d=prepare(b);
  const baselineWape=wape(d.series,d.dows,run.baseline.strategy,d.valTo,d.testTo);
  const championWape=wape(d.series,d.dows,run.champion.strategy,d.valTo,d.testTo);
  run.final={baselineWape,championWape,improvementPct:baselineWape?Math.round((baselineWape-championWape)/baselineWape*1000)/10:0,testedAt:new Date().toISOString()};
  state.bestStrategy=run.champion.strategy;
  state.history=[...state.history,{id:run.id,at:run.final.testedAt,baseline:baselineWape,champion:championWape,holdoutImprovementPct:run.final.improvementPct}].slice(-10);
  return run.final;
}

/** The forecast for tomorrow from the current champion, for Inventory and the Leak Finder. */
export function tomorrowForecast(b:Business,state:ArenaState|undefined){
  const d=prepare(b);
  const s=state?.current?.champion?.strategy??BASELINE;
  const series=[...d.series,0],dows=[...d.dows,new Date().getUTCDay()];
  return Math.round(forecast(series,series.length-1,dows,s));
}
