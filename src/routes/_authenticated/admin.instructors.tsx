import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useAuth, useRoles } from "@/hooks/use-auth";
import { fetchInstructors, updateInstructorAcrossCourses, type InstructorSummary } from "@/lib/instructors";
import { t } from "@/lib/i18n";
import { toast } from "sonner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/instructors")({
  head: () => ({ meta: [{ title: "Instructors — Admin — axiom/lab" }, { name: "robots", content: "noindex" }] }),
  component: AdminInstructorsPage,
});

function AdminInstructorsPage() {
  const { user } = useAuth();
  const { isAdmin } = useRoles(user?.id);
  const [rows, setRows] = useState<InstructorSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try { setRows(await fetchInstructors()); } finally { setLoading(false); }
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

  return (
    <>
      <SiteHeader />
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="mono-label mb-2">/ admin / instructors</div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl">{t("instructors.title")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Edit instructor metadata; changes apply to every course by that instructor.
              </p>
            </div>
            <Link to="/admin" className="rounded-md border border-border px-3 py-1.5 font-mono text-xs hover:bg-surface-2">← admin</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-4">
            {rows.map((ins) => (
              <InstructorCard key={ins.name} instructor={ins} onSaved={refresh} />
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </>
  );
}

function InstructorCard({ instructor, onSaved }: { instructor: InstructorSummary; onSaved: () => void }) {
  const [name, setName] = useState(instructor.name);
  const [title, setTitle] = useState(instructor.title ?? "");
  const [bio, setBio] = useState(instructor.bio ?? "");
  const [avatar, setAvatar] = useState(instructor.avatar ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateInstructorAcrossCourses(instructor.name, {
        name: name.trim(),
        title: title.trim() || null,
        bio: bio.trim() || null,
        avatar: avatar.trim() || null,
      });
      toast.success(`Updated ${instructor.courseCount} course${instructor.courseCount === 1 ? "" : "s"}.`);
      onSaved();
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="mono-label">
          {instructor.courseCount} course{instructor.courseCount === 1 ? "" : "s"}
        </div>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-md bg-signal px-3 py-1.5 font-mono text-xs text-signal-foreground disabled:opacity-50">
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="mono-label">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="mono-label">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="mono-label">Avatar URL</span>
          <input value={avatar} onChange={(e) => setAvatar(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="mono-label">Bio</span>
          <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        </label>
      </div>
    </div>
  );
}
