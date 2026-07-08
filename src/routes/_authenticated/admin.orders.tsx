import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useAdminAccess } from "@/hooks/use-auth";
import { adminFetchOrders, type OrderRow } from "@/lib/orders";
import { Search, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Admin — axiom/lab" },
      { name: "description", content: "All orders across the platform." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOrdersPage,
});

type StatusFilter = OrderRow["status"] | "all";

function AdminOrdersPage() {
  const { isAdmin, loading: accessLoading } = useAdminAccess();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const data = await adminFetchOrders({ status, search });
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, status]);

  const stats = useMemo(() => {
    const paid = rows.filter((r) => r.status === "paid");
    const revenueCents = paid.reduce((a, r) => a + (r.amount_cents ?? 0), 0);
    return {
      total: rows.length,
      paid: paid.length,
      pending: rows.filter((r) => r.status === "pending").length,
      failed: rows.filter((r) => r.status === "failed" || r.status === "cancelled").length,
      revenue: revenueCents / 100,
    };
  }, [rows]);

  if (accessLoading) {
    return <AdminLoading />;
  }

  if (!isAdmin) {
    return (
      <>
        <SiteHeader />
        <section className="mx-auto max-w-2xl px-6 py-24">
          <div className="mono-label mb-2">/ admin / orders</div>
          <h1 className="text-3xl">Restricted</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The orders console is available to admins.
          </p>
          <Link to="/admin" className="mt-6 inline-block font-mono text-xs text-signal underline">
            ← back to admin
          </Link>
        </section>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="mono-label mb-2">/ admin / orders</div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl">Orders</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                All payments across the platform.
              </p>
            </div>
            <Link
              to="/admin"
              className="rounded-md border border-border px-3 py-1.5 font-mono text-xs hover:bg-surface-2"
            >
              ← admin
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-5">
          <Stat label="Orders" value={String(stats.total)} />
          <Stat label="Paid" value={String(stats.paid)} accent />
          <Stat label="Pending" value={String(stats.pending)} />
          <Stat label="Failed" value={String(stats.failed)} />
          <Stat
            label="Revenue"
            value={`$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            accent
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="mono-label mr-2">filter</div>
          {(["all", "paid", "pending", "failed", "cancelled"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${
                status === s
                  ? "border-signal bg-signal/15 text-signal"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") refresh();
                }}
                placeholder="search buyer, course, txn id…"
                className="w-64 rounded-md border border-border bg-surface pl-7 pr-3 py-1.5 font-mono text-xs"
              />
            </div>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 font-mono text-xs hover:bg-surface-2"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" /> refresh
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-normal">Date</th>
                <th className="px-4 py-3 text-left font-normal">Buyer</th>
                <th className="px-4 py-3 text-left font-normal">Course</th>
                <th className="px-4 py-3 text-right font-normal">Amount</th>
                <th className="px-4 py-3 text-left font-normal">Status</th>
                <th className="px-4 py-3 text-left font-normal">Provider</th>
                <th className="px-4 py-3 text-left font-normal">Txn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No orders match.
                  </td>
                </tr>
              )}
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div>{o.profiles?.display_name || "—"}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {o.user_id.slice(0, 8)}…
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {o.courses ? (
                      <Link
                        to="/courses/$slug"
                        params={{ slug: o.courses.slug }}
                        className="hover:text-signal"
                      >
                        {o.courses.title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {(o.amount_cents / 100).toLocaleString(undefined, {
                      style: "currency",
                      currency: o.currency || "USD",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {o.provider}
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">
                    {o.provider_transaction_id || o.provider_invoice_id || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function AdminLoading() {
  return (
    <>
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">
        Checking admin access…
      </section>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-background p-5">
      <div className="mono-label">{label}</div>
      <div className={`mt-3 font-mono text-2xl ${accent ? "text-signal" : ""}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderRow["status"] }) {
  const cls =
    status === "paid"
      ? "bg-signal/15 text-signal border-signal/30"
      : status === "pending"
      ? "bg-surface-2 text-muted-foreground border-border"
      : "bg-destructive/10 text-destructive border-destructive/30";
  return (
    <span
      className={`inline-flex rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}
    >
      {status}
    </span>
  );
}
