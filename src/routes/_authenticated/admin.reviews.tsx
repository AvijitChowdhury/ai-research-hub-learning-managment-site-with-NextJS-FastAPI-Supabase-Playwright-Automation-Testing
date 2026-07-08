import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useAdminAccess } from "@/hooks/use-auth";
import { adminFetchAllReviews, adminSetReviewHidden, adminDeleteReview, type AdminReviewRow } from "@/lib/reviews";
import { fmtDateTime, t } from "@/lib/i18n";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Admin — axiom/lab" }, { name: "robots", content: "noindex" }] }),
  component: AdminReviewsPage,
});

function AdminReviewsPage() {
  const { isAdmin, loading: accessLoading } = useAdminAccess();
  const [rows, setRows] = useState<AdminReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "hidden" | "visible">("all");

  async function refresh() {
    setLoading(true);
    try { setRows(await adminFetchAllReviews()); } finally { setLoading(false); }
  }
  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  if (accessLoading) {
    return <AdminLoading />;
  }

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

  const filtered = rows.filter((r) =>
    filter === "all" ? true : filter === "hidden" ? r.hidden : !r.hidden,
  );

  async function toggle(row: AdminReviewRow) {
    try {
      await adminSetReviewHidden(row.id, !row.hidden);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, hidden: !row.hidden } : r)));
      toast.success(row.hidden ? "Review shown." : "Review hidden.");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  }

  async function remove(row: AdminReviewRow) {
    if (!confirm("Delete this review permanently?")) return;
    try {
      await adminDeleteReview(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  }

  return (
    <>
      <SiteHeader />
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="mono-label mb-2">/ admin / reviews</div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl">{t("reviews.moderation")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Hide inappropriate reviews from the public catalog.</p>
            </div>
            <Link to="/admin" className="rounded-md border border-border px-3 py-1.5 font-mono text-xs hover:bg-surface-2">← admin</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex items-center gap-2">
          {(["all", "visible", "hidden"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase ${
                filter === f
                  ? "border-signal bg-signal/15 text-signal"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
            No reviews.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className={`rounded-lg border p-4 ${r.hidden ? "border-destructive/40 bg-destructive/5" : "border-border bg-surface"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono">{"★".repeat(r.rating)}<span className="text-muted-foreground">{"★".repeat(5 - r.rating)}</span></span>
                      <span className="text-muted-foreground">by {r.profiles?.display_name ?? "unknown"}</span>
                      <span className="text-muted-foreground">on {r.courses?.title ?? "—"}</span>
                      <span className="text-muted-foreground font-mono text-[10px]">{fmtDateTime(r.created_at)}</span>
                      {r.hidden && <span className="rounded-sm border border-destructive/30 bg-destructive/10 px-1.5 font-mono text-[10px] text-destructive">HIDDEN</span>}
                    </div>
                    <p className="mt-2 text-sm whitespace-pre-wrap">{r.body || <em className="text-muted-foreground">(no text)</em>}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggle(r)} title={r.hidden ? "Show" : "Hide"} className="rounded border border-border p-1.5 hover:bg-surface-2">
                      {r.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => remove(r)} title="Delete" className="rounded border border-border p-1.5 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </>
  );
}

function AdminLoading() {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">
        Checking admin access…
      </div>
      <SiteFooter />
    </>
  );
}
