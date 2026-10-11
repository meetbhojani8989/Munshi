// Small shared primitives for the AI views, mirroring the look of the main app
// (card / Title / money formatting) without importing from the shell.
import React from'react';

export const usd=(n:number)=>`$${n.toLocaleString('en-US',{maximumFractionDigits:2})}`;
export const money=(n:number)=>`${n<0?'-':'+'}$${Math.abs(n).toLocaleString('en-US',{maximumFractionDigits:0})}`;

export function Card({children,className=''}:{children:React.ReactNode;className?:string}){
  return <div className={'card '+className}>{children}</div>;
}

export function Title({kicker,title,sub}:{kicker:string;title:string;sub:string}){
  return <div className="mb-7">
    <div className="text-xs uppercase tracking-[.22em] font-bold positive mb-2">{kicker}</div>
    <h1>{title}</h1>
    <p className="muted mt-2">{sub}</p>
  </div>;
}
