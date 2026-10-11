import React from "react";

export const money = (n: number) =>
  `${n < 0 ? "-" : "+"}$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
export const usd = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
export const signed = (n: number) => (
  <span className={n < 0 ? "negative" : "positive"}>{money(n)}</span>
);
export const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={"card " + className}>{children}</div>;
export const Title = ({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub: string;
}) => (
  <div className="mb-7">
    <div className="text-xs uppercase tracking-[.22em] font-bold positive mb-2">
      {kicker}
    </div>
    <h1>{title}</h1>
    <p className="muted mt-2">{sub}</p>
  </div>
);
