import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useAuth, useRoles } from "@/hooks/use-auth";
import {
  adminFetchCourseById,
  updateCourse,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  bulkImportLessons,
} from "@/lib/admin";
import { LESSON_CSV_TEMPLATE } from "@/lib/csv";
import { downloadFile } from "@/lib/orders";
import type { Module, Lesson } from "@/lib/courses";
import { ArrowLeft, Plus, Trash2, Save, Upload, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/courses/$id")({
  head: () => ({ meta: [{ title: "Edit course — axiom/lab" }, { name: "robots", content: "noindex" }] }),
  component: EditCoursePage,
});

function EditCoursePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { isAdmin } = useRoles(user?.id);
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const r = await adminFetchCourseById(id);
    if (r) {
      setCourse(r.course);
      setModules(r.modules);
    }
    setLoading(false);
  }
  useEffect(() => { if (isAdmin) refresh(); }, [id, isAdmin]);

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

  if (loading || !course) {
    return (
      <>
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-6 py-24 text-center text-muted-foreground">Loading…</div>
        <SiteFooter />
      </>
    );
  }

  async function saveCourse() {
    setSaving(true);
    setMsg(null);
    try {
      await updateCourse(id, {
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        category: course.category,
        level: course.level,
        price: (course.price_cents ?? 0) / 100,
        instructor_name: course.instructor_name,
        instructor_title: course.instructor_title,
        instructor_bio: course.instructor_bio,
        tag: course.tag,
        language: course.language,
        duration_hours: course.duration_hours,
        lessons_count: course.lessons_count,
        what_you_will_learn: course.what_you_will_learn,
        requirements: course.requirements,
        is_published: course.is_published,
      });
      setMsg("Saved.");
    } catch (e: any) {
      setMsg(e.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Link to="/admin" className="mono-label inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> back to admin
          </Link>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <div className="mono-label">/ course / {course.slug}</div>
              <h1 className="mt-1 text-3xl">{course.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              {msg && <span className="font-mono text-xs text-muted-foreground">{msg}</span>}
              <label className="flex items-center gap-2 font-mono text-xs">
                <input
                  type="checkbox"
                  checked={course.is_published}
                  onChange={(e) => setCourse({ ...course, is_published: e.target.checked })}
                />
                Published
              </label>
              <button
                onClick={saveCourse}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-md bg-signal px-3 py-1.5 font-mono text-xs text-signal-foreground disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save course"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Course fields */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mono-label mb-3">details</div>
        <div className="grid gap-4 rounded-lg border border-border bg-surface p-5 md:grid-cols-2">
          <TxtField label="Title" value={course.title} onChange={(v) => setCourse({ ...course, title: v })} />
          <TxtField label="Subtitle" value={course.subtitle} onChange={(v) => setCourse({ ...course, subtitle: v })} />
          <TxtField label="Category" value={course.category} onChange={(v) => setCourse({ ...course, category: v })} />
          <TxtField label="Level" value={course.level} onChange={(v) => setCourse({ ...course, level: v })} />
          <TxtField
            label="Price (USD)"
            type="number"
            value={String((course.price_cents ?? 0) / 100)}
            onChange={(v) => setCourse({ ...course, price_cents: Math.round(Number(v) * 100) })}
          />
          <TxtField label="Tag" value={course.tag ?? ""} onChange={(v) => setCourse({ ...course, tag: v || null })} />
          <TxtField label="Instructor name" value={course.instructor_name} onChange={(v) => setCourse({ ...course, instructor_name: v })} />
          <TxtField label="Instructor title" value={course.instructor_title ?? ""} onChange={(v) => setCourse({ ...course, instructor_title: v || null })} />
          <TxtField label="Duration (hours)" type="number" value={String(course.duration_hours)} onChange={(v) => setCourse({ ...course, duration_hours: Number(v) || 0 })} />
          <TxtField label="Lessons count" type="number" value={String(course.lessons_count)} onChange={(v) => setCourse({ ...course, lessons_count: Number(v) || 0 })} />
          <label className="md:col-span-2 block">
            <div className="mono-label mb-1">Description</div>
            <textarea
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={course.description}
              onChange={(e) => setCourse({ ...course, description: e.target.value })}
            />
          </label>
          <ListField
            label="What you will learn"
            value={course.what_you_will_learn ?? []}
            onChange={(v) => setCourse({ ...course, what_you_will_learn: v })}
          />
          <ListField
            label="Requirements"
            value={course.requirements ?? []}
            onChange={(v) => setCourse({ ...course, requirements: v })}
          />
        </div>
      </section>

      {/* Modules & lessons */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="mono-label">curriculum</div>
          <button
            onClick={async () => {
              const title = prompt("Module title");
              if (!title) return;
              await createModule(id, title, modules.length);
              refresh();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 py-1.5 font-mono text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Add module
          </button>
        </div>

        <div className="space-y-4">
          {modules.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No modules yet.
            </div>
          )}
          {modules.map((m, mi) => (
            <ModuleBlock key={m.id} index={mi} module={m} onChange={refresh} />
          ))}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function ModuleBlock({ index, module: mod, onChange }: { index: number; module: Module; onChange: () => void }) {
  const [title, setTitle] = useState(mod.title);
  const [adding, setAdding] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="font-mono text-xs text-muted-foreground">M{String(index + 1).padStart(2, "0")}</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={async () => {
            if (title !== mod.title) {
              await updateModule(mod.id, { title });
              onChange();
            }
          }}
          className="flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm hover:border-border focus:border-border focus:bg-background"
        />
        <button
          onClick={async () => {
            if (!confirm(`Delete module "${mod.title}" and its lessons?`)) return;
            await deleteModule(mod.id);
            onChange();
          }}
          className="rounded border border-border p-1.5 text-destructive hover:bg-destructive/10"
          title="Delete module"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="divide-y divide-border">
        {mod.lessons.map((l, li) => (
          <LessonRow key={l.id} moduleIndex={index} index={li} lesson={l} onChange={onChange} />
        ))}
        {mod.lessons.length === 0 && (
          <div className="px-4 py-3 text-xs text-muted-foreground">No lessons yet.</div>
        )}
      </div>
      <div className="border-t border-border px-4 py-2">
        <button
          onClick={async () => {
            if (adding) return;
            setAdding(true);
            try {
              await createLesson(mod.id, {
                title: "New lesson",
                duration_secs: 600,
                type: "video",
                free_preview: false,
                sort_order: mod.lessons.length,
              });
              onChange();
            } finally { setAdding(false); }
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs hover:bg-surface-2"
        >
          <Plus className="h-3 w-3" /> Add lesson
        </button>
      </div>
    </div>
  );
}

function LessonRow({
  moduleIndex, index, lesson, onChange,
}: { moduleIndex: number; index: number; lesson: Lesson; onChange: () => void }) {
  const [title, setTitle] = useState(lesson.title);
  const [dur, setDur] = useState(lesson.durationSecs);
  const [type, setType] = useState<Lesson["type"]>(lesson.type);
  const [free, setFree] = useState(lesson.freePreview);
  const dirty =
    title !== lesson.title || dur !== lesson.durationSecs || type !== lesson.type || free !== lesson.freePreview;

  async function save() {
    await updateLesson(lesson.id, { title, duration_secs: dur, type, free_preview: free });
    onChange();
  }

  return (
    <div className="grid grid-cols-12 items-center gap-2 px-4 py-2 text-sm hover:bg-background">
      <span className="col-span-1 font-mono text-xs text-muted-foreground">
        {String(moduleIndex + 1).padStart(2, "0")}.{String(index + 1).padStart(2, "0")}
      </span>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="col-span-5 rounded-md border border-transparent bg-transparent px-2 py-1 hover:border-border focus:border-border focus:bg-surface"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as Lesson["type"])}
        className="col-span-2 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
      >
        <option value="video">video</option>
        <option value="text">text</option>
        <option value="quiz">quiz</option>
      </select>
      <input
        type="number"
        value={dur}
        onChange={(e) => setDur(Number(e.target.value) || 0)}
        className="col-span-2 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
        title="Duration (seconds)"
      />
      <label className="col-span-1 flex items-center gap-1 font-mono text-xs text-muted-foreground">
        <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} /> free
      </label>
      <div className="col-span-1 flex items-center justify-end gap-1">
        {dirty && (
          <button
            onClick={save}
            className="rounded border border-border p-1.5 hover:bg-surface-2"
            title="Save"
          >
            <Save className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={async () => {
            if (!confirm("Delete this lesson?")) return;
            await deleteLesson(lesson.id);
            onChange();
          }}
          className="rounded border border-border p-1.5 text-destructive hover:bg-destructive/10"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function TxtField({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <div className="mono-label mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

function ListField({
  label, value, onChange,
}: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <label className="md:col-span-2 block">
      <div className="mono-label mb-1">{label} <span className="text-muted-foreground">(one per line)</span></div>
      <textarea
        rows={4}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        value={value.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
      />
    </label>
  );
}
