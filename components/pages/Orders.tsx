import type { Business } from "@/lib/core";
import { Title, Card } from "@/components/layout/ui";

export function Orders({ b, act }: { b: Business; act: any }) {
  const statuses = ["New", "Preparing", "Ready", "Done"];
  return (
    <>
      <Title
        kicker="All channels together"
        title="Online orders"
        sub="DoorDash, Uber Eats, and your website in one simple queue."
      />
      <div className="grid md:grid-cols-4 gap-4">
        {statuses.map((status) => (
          <Card key={status}>
            <h2>
              {status}{" "}
              <span className="muted text-sm">
                {b.orders.filter((o) => o.status === status).length}
              </span>
            </h2>
            <div className="space-y-3 mt-4">
              {b.orders
                .filter((o) => o.status === status)
                .map((o) => (
                  <div className="bg-paper rounded-xl p-3" key={o.id}>
                    <b className="text-sm">{o.customer}</b>
                    <p className="text-xs muted">
                      {o.channel} · {o.qty} ×{" "}
                      {b.items.find((i) => i.id === o.itemId)?.name}
                    </p>
                    {status !== "Done" && (
                      <button
                        className="text-xs positive font-bold mt-3"
                        onClick={() =>
                          act(
                            "order",
                            {
                              id: o.id,
                              status: statuses[statuses.indexOf(status) + 1],
                            },
                            status === "Ready"
                              ? `Order completed. Sale posted and stock reduced.`
                              : "Order moved to " +
                                  statuses[statuses.indexOf(status) + 1],
                          )
                        }
                      >
                        Move to {statuses[statuses.indexOf(status) + 1]} →
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
