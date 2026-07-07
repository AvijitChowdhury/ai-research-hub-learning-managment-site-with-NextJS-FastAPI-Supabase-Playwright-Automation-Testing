import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { fetchMyOrders } from "@/lib/orders";
import { fmtCurrency, fmtDateTime, t } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "Order history — axiom/lab" },
      { name: "description", content: "Your past orders and receipts." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { data: rows, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: fetchMyOrders,
  });

  return (
    <>
      <SiteHeader />
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="mono-label mb-2">/ dashboard / orders</div>
          <h1 className="text-3xl">{t("orders.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every purchase you've made on axiom/lab.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-8">
        {isLoading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : !rows || rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">{t("orders.empty")}</p>
            <Link
              to="/courses"
              className="mt-4 inline-block rounded-md bg-signal px-4 py-2 font-mono text-xs text-signal-foreground"
            >
              Browse the catalog →
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface font-mono text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-normal">Date</th>
                  <th className="px-4 py-3 text-left font-normal">Course</th>
                  <th className="px-4 py-3 text-right font-normal">Amount</th>
                  <th className="px-4 py-3 text-left font-normal">Status</th>
                  <th className="px-4 py-3 text-left font-normal">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {rows.map((o) => (
                  <tr key={o.id} className="hover:bg-surface">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {fmtDateTime(o.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {o.courses ? (
                        <Link to="/courses/$slug" params={{ slug: o.courses.slug }} className="hover:text-signal">
                          {o.courses.title}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {fmtCurrency((o.amount_cents ?? 0) / 100, o.currency || "USD")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase ${
                        o.status === "paid"
                          ? "border-signal/30 bg-signal/15 text-signal"
                          : o.status === "pending"
                          ? "border-border bg-surface-2 text-muted-foreground"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      }`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">
                      {o.provider_transaction_id || o.provider_invoice_id || o.id.slice(0, 8) + "…"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <SiteFooter />
    </>
  );
}
