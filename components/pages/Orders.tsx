"use client";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowRight, Bike, Car, Globe, CheckCheck, Flame, Clock } from "lucide-react";
import type { Business } from "@/lib/core";
import { Title } from "@/components/layout/ui";
import { DishBadge, Steam } from "@/components/fx";

const channelIcon: Record<string, any> = { DoorDash: Bike, "Uber Eats": Car, Website: Globe };
const lanes: Record<string, { sub: string; dot: string }> = {
  New: { sub: "Just fired", dot: "bg-[var(--accent)]" },
  Preparing: { sub: "On the line", dot: "bg-[var(--gold)]" },
  Ready: { sub: "At the pass", dot: "bg-[var(--pos)]" },
  Done: { sub: "Picked up", dot: "bg-[var(--muted)]" },
};

// Kitchen ticket rail: each order is a paper ticket clipped to the pass.
export function Orders({ b, act }: { b: Business; act: any }) {
  const statuses = ["New", "Preparing", "Ready", "Done"];
  return (
    <>
      <Title kicker="All channels, one pass" title="Kitchen tickets" sub="DoorDash, Uber Eats and your website print to one rail. Move a ticket and the books follow." />
      <LayoutGroup>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {statuses.map((status, col) => {
            const list = b.orders.filter((o) => o.status === status);
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + col * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
                className="min-h-[340px]"
              >
                <div className="flex items-center justify-between px-1 mb-3">
                  <div>
                    <h2 className="flex items-center gap-2">
                      <span className={"w-2.5 h-2.5 rounded-full " + lanes[status].dot} />
                      {status}
                    </h2>
                    <div className="text-xs muted mt-0.5">{lanes[status].sub}</div>
                  </div>
                  <motion.span key={list.length} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="tag num">
                    {list.length}
                  </motion.span>
                </div>
                {/* the steel rail */}
                <div className="relative h-3 rounded-full bg-gradient-to-b from-[#e7e2dc] to-[#bdb4aa] dark:from-[#3a332e] dark:to-[#1f1a17] shadow-inner mb-1" />
                <div className="space-y-4 pt-1">
                  <AnimatePresence>
                    {list.map((o, i) => {
                      const Icon = channelIcon[o.channel] || Globe;
                      const item = b.items.find((x) => x.id === o.itemId)?.name || "Item";
                      const next = statuses[statuses.indexOf(status) + 1];
                      return (
                        <motion.div
                          key={o.id}
                          layoutId={"ticket-" + o.id}
                          initial={{ rotate: -14, y: -30, opacity: 0 }}
                          animate={{ rotate: i % 2 ? 1.5 : -1.5, y: 0, opacity: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ rotate: 0, y: -4 }}
                          transition={{ type: "spring", stiffness: 260, damping: 14 }}
                          style={{ transformOrigin: "50% 0%" }}
                          className="relative"
                        >
                          {/* clip */}
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-5 rounded-md bg-gradient-to-b from-[#d6cfc7] to-[#9d948a] dark:from-[#4a413a] dark:to-[#2a231f] z-10 shadow" />
                          <div className="relative bg-white text-[#1c1410] rounded-b-md shadow-[var(--shadow-lg)] pt-5 pb-4 px-4 mono text-[12px] [mask:radial-gradient(6px_at_6px_100%,#0000_98%,#000)_-6px_0/12px_100%_repeat-x]">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">#{o.id.slice(-4).toUpperCase()}</span>
                              <span className="inline-flex items-center gap-1 text-[#6b5d53]">
                                <Icon size={12} /> {o.channel}
                              </span>
                            </div>
                            <div className="border-t border-dashed border-[#ddd2c7] my-3" />
                            <div className="flex items-center gap-3">
                              <span className="relative text-[#c2410c]">
                                {status === "Preparing" && <Steam className="-top-5 left-1/2 -translate-x-1/2" />}
                                <DishBadge name={item} size={36} className="!bg-[#fff1e7] !text-[#c2410c]" />
                              </span>
                              <div className="min-w-0">
                                <div className="font-sans text-sm font-semibold truncate">
                                  {o.qty} × {item}
                                </div>
                                <div className="text-[#6b5d53] truncate">for {o.customer}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[#6b5d53]">
                              {status === "Preparing" ? <Flame size={12} className="text-[#ea580c]" /> : <Clock size={12} />}
                              {status === "New" ? "Fired just now" : status === "Preparing" ? "On the grill" : status === "Ready" ? "Waiting at the pass" : "Handed over"}
                            </div>
                            {status !== "Done" ? (
                              <button
                                className="font-sans mt-3 w-full h-9 rounded-lg bg-[#c2410c] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#9a3412] transition-colors group"
                                onClick={() =>
                                  act(
                                    "order",
                                    { id: o.id, status: next },
                                    status === "Ready" ? `Order completed. Sale posted and stock reduced.` : "Order moved to " + next,
                                  )
                                }
                              >
                                {status === "New" ? "Start cooking" : status === "Preparing" ? "Send to pass" : "Hand over"}
                                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                              </button>
                            ) : (
                              <div className="font-sans text-xs text-[#15803d] mt-3 flex items-center gap-1.5 font-semibold">
                                <CheckCheck size={14} /> Posted to books
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {!list.length && (
                    <div className="text-xs muted text-center py-10 border border-dashed border-line rounded-xl">Rail is clear</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </LayoutGroup>
    </>
  );
}
