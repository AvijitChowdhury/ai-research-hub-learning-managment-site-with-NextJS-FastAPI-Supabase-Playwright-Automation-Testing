import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useAuth, useRoles } from "@/hooks/use-auth";
import {
  adminFetchCourses,
  createCourse,
  deleteCourse,
  togglePublish,
  claimFirstAdmin,
  type CourseInput,
} from "@/lib/admin";
import { DollarSign, ShoppingCart, Users, TrendingUp, Plus, Trash2, Pencil, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — axiom/lab" },
      { name: "description", content: "Admin dashboard for axiom/lab." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const { isAdmin, roles } = useRoles(user?.id);
  const rolesLoaded = !!user; // roles resolve quickly after user
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const router = useRouter();

  async function refresh() {
    setLoading(true);
    try {
      const data = await adminFetchCourses();
      setCourses(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  async function onClaim() {
    setClaiming(true);
    setClaimMsg(null);
    try {
      const ok = await claimFirstAdmin();
      if (ok) {
        setClaimMsg("You are now the admin. Reloading…");
        router.invalidate();
        setTimeout(() => window.location.reload(), 600);
      } else {
        setClaimMsg("An admin already exists. Ask them to promote you.");
      }
    } catch (e: any) {
      setClaimMsg(e.message ?? "Failed");
    } finally {
      setClaiming(false);
    }
  }

  if (!isAdmin) {
    return (
      <>
        <SiteHeader />
        <section className="mx-auto max-w-2xl px-6 py-24">
          <div className="mono-label mb-2">/ admin / gate</div>
          <h1 className="text-3xl">Restricted</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your roles: <span className="font-mono text-foreground">{roles.join(", ") || "—"}</span>. The admin console is
            available to users with the <span className="font-mono">admin</span> role.
          </p>
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <div className="mono-label mb-2">bootstrap</div>
            <p className="text-sm text-muted-foreground">
              If no admin exists yet, you can claim the role for this instance.
            </p>
            <button
              onClick={onClaim}
              disabled={claiming}
              className="mt-4 rounded-md bg-signal px-3 py-1.5 font-mono text-xs text-signal-foreground disabled:opacity-50"
            >
              {claiming ? "Claiming…" : "Claim admin role"}
            </button>
            {claimMsg && <div className="mt-3 font-mono text-xs text-muted-foreground">{claimMsg}</div>}
          </div>
        </section>
        <SiteFooter />
      </>
    );
  }

  const stats = [
    { icon: DollarSign, label: "Courses", value: String(courses.length), delta: `${courses.filter((c) => c.is_published).length} live` },
    { icon: ShoppingCart, label: "Drafts", value: String(courses.filter((c) => !c.is_published).length), delta: "unpublished" },
    { icon: Users, label: "Students (aggregate)", value: courses.reduce((a, c) => a + (c.students_count ?? 0), 0).toLocaleString(), delta: "" },
    { icon: TrendingUp, label: "Avg rating", value: courses.length ? (courses.reduce((a, c) => a + Number(c.rating ?? 0), 0) / courses.length).toFixed(2) : "—", delta: "" },
  ];

  return (
    <>
      <SiteHeader />
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="mono-label mb-2">/ admin</div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl">Content management</h1>
              <p className="mt-1 text-sm text-muted-foreground">Create, edit, and publish courses.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/admin/orders"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-xs hover:bg-surface-2"
              >
                <ShoppingCart className="h-3.5 w-3.5" /> Orders
              </Link>
              <button
                onClick={() => setShowNew(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-signal px-3 py-1.5 font-mono text-xs text-signal-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> New course
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-background p-5">
              <div className="flex items-center justify-between">
                <div className="mono-label">{s.label}</div>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 font-mono text-2xl">{s.value}</div>
              {s.delta && <div className="mono-label mt-1 text-signal">{s.delta}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-4 mono-label">courses</div>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-normal">Title</th>
                <th className="px-4 py-3 text-left font-normal">Category</th>
                <th className="px-4 py-3 text-left font-normal">Level</th>
                <th className="px-4 py-3 text-right font-normal">Price</th>
                <th className="px-4 py-3 text-left font-normal">Status</th>
                <th className="px-4 py-3 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {loading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!loading && courses.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No courses yet.</td></tr>
              )}
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-surface">
                  <td className="px-4 py-3">
                    <div>{c.title}</div>
                    <div className="font-mono text-xs text-muted-foreground">{c.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.level}</td>
                  <td className="px-4 py-3 text-right font-mono">${((c.price_cents ?? 0) / 100).toFixed(0)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                        c.is_published
                          ? "bg-signal/15 text-signal border-signal/30"
                          : "bg-surface-2 text-muted-foreground border-border"
                      }`}
                    >
                      {c.is_published ? "PUBLISHED" : "DRAFT"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={async () => {
                          await togglePublish(c.id, !c.is_published);
                          refresh();
                        }}
                        title={c.is_published ? "Unpublish" : "Publish"}
                        className="rounded border border-border p-1.5 hover:bg-surface-2"
                      >
                        {c.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <Link
                        to="/admin/courses/$id"
                        params={{ id: c.id }}
                        className="rounded border border-border p-1.5 hover:bg-surface-2"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete "${c.title}"? This removes modules, lessons, and enrollments.`)) return;
                          await deleteCourse(c.id);
                          refresh();
                        }}
                        title="Delete"
                        className="rounded border border-border p-1.5 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showNew && (
        <NewCourseModal
          onClose={() => setShowNew(false)}
          onCreated={(id) => {
            setShowNew(false);
            router.navigate({ to: "/admin/courses/$id", params: { id } });
          }}
        />
      )}

      <SiteFooter />
    </>
  );
}

function NewCourseModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState<CourseInput>({
    slug: "",
    title: "",
    subtitle: "",
    description: "",
    category: "Foundations",
    level: "Beginner",
    price: 0,
    instructor_name: "",
    is_published: false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const id = await createCourse(form);
      onCreated(id);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg border border-border bg-background p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mono-label mb-2">/ new course</div>
        <h2 className="text-xl">Create a course</h2>
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Field label="Slug" mono value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} required />
          <Field label="Subtitle" value={form.subtitle} onChange={(v) => setForm({ ...form, subtitle: v })} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
            <Field label="Level" value={form.level} onChange={(v) => setForm({ ...form, level: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (USD)" type="number" value={String(form.price)} onChange={(v) => setForm({ ...form, price: Number(v) || 0 })} />
            <Field label="Instructor" value={form.instructor_name} onChange={(v) => setForm({ ...form, instructor_name: v })} required />
          </div>
          <label className="block">
            <div className="mono-label mb-1">Description</div>
            <textarea
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </label>
          {err && <div className="font-mono text-xs text-destructive">{err}</div>}
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-1.5 font-mono text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-signal px-3 py-1.5 font-mono text-xs text-signal-foreground disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create + edit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", mono, required,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; mono?: boolean; required?: boolean }) {
  return (
    <label className="block">
      <div className="mono-label mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}
