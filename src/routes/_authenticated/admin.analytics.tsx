import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useAuth, useRoles } from "@/hooks/use-auth";
import { fetchAnalytics, toCSV, downloadFile, type Analytics } from "@/lib/orders";
import { fmtCurrency, t } from "@/lib/i18n";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Admin — axiom/lab" }, { name: "robots", content: "noindex" }] }),
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const { user } = useAuth();
  const { isAdmin } = useRoles(user?.id);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  async function refresh() {
    setLoading(true);
    try {
      setData(await fetchAnalytics({
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to + "T23:59:59").toISOString() : undefined,
      }));
    } finally { setLoading(false); }
  }

  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  if (!isAdmin) {
    return (
      <>
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">
          Admin access required. <Link to="/admin" className="text-signal">Go to admin gate</Link>.
        </div>
        <SiteFooter />
      </>
    );
  }

  function exportCSV() {
    if (!data) return;
    const rows = data.topCourses.map((c) => ({
      course: c.title,
      slug: c.slug,
      sales: c.sales,
      revenue: (c.revenueCents / 100).toFixed(2),
    }));
    downloadFile(`top-courses-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows));
  }

  return (
    <>
      <SiteHeader />
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="mono-label mb-2">/ admin / analytics</div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl">{t("analytics.title")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Revenue, orders, and top-performing courses.</p>
            </div>
            <Link to="/admin" className="rounded-md border border-border px-3 py-1.5 font-mono text-xs hover:bg-surface-2">← admin</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="mono-label">from</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="mono-label">to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs" />
          </label>
          <button onClick={refresh} className="rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-xs hover:bg-surface-2">
            Apply
          </button>
          <button onClick={exportCSV} disabled={!data} className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-signal px-3 py-1.5 font-mono text-xs text-signal-foreground disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> Export top-courses CSV
          </button>
        </div>

        {loading || !data ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : (
          <>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3 lg:grid-cols-6">
              <Stat label="Revenue" value={fmtCurrency(data.totalRevenueCents / 100)} accent />
              <Stat label="Orders" value={String(data.totalOrders)} />
              <Stat label="Students" value={String(data.totalStudents)} />
              <Stat label="Today · enrollments" value={String(data.todayEnrollments)} />
              <Stat label="Today · revenue" value={fmtCurrency(data.todayRevenueCents / 100)} accent />
              <Stat label="Today · incomplete" value={String(data.todayIncompleteOrders)} />
            </div>

            <div className="mt-8">
              <div className="mono-label mb-3">top courses</div>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-surface font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-normal">Course</th>
                      <th className="px-4 py-3 text-right font-normal">Sales</th>
                      <th className="px-4 py-3 text-right font-normal">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {data.topCourses.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No sales in this range.</td></tr>
                    )}
                    {data.topCourses.map((c) => (
                      <tr key={c.courseId} className="hover:bg-surface">
                        <td className="px-4 py-3">
                          {c.slug ? (
                            <Link to="/courses/$slug" params={{ slug: c.slug }} className="hover:text-signal">{c.title}</Link>
                          ) : c.title}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{c.sales}</td>
                        <td className="px-4 py-3 text-right font-mono">{fmtCurrency(c.revenueCents / 100)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-background p-5">
      <div className="mono-label">{label}</div>
      <div className={`mt-2 font-mono text-2xl ${accent ? "text-signal" : ""}`}>{value}</div>
    </div>
  );
}
