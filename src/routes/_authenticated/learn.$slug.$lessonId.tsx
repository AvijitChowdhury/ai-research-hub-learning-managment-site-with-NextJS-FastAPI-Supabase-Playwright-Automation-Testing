import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCourseBySlug,
  fetchMyProgressForCourse,
  isEnrolled,
  toggleLessonComplete,
  formatDuration,
  type Course,
  type Module,
  type Lesson,
} from "@/lib/courses";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/learn/$slug/$lessonId")({
  head: () => ({
    meta: [{ title: "Lesson — axiom/lab" }, { name: "robots", content: "noindex" }],
  }),
  loader: async ({ params }) => {
    const course = await fetchCourseBySlug(params.slug);
    if (!course) throw notFound();
    return { course };
  },
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center text-center text-muted-foreground">
      <div>
        <div className="mono-label">404</div>
        <h1 className="mt-3 text-3xl">Lesson not found</h1>
        <Link to="/courses" className="mono-label mt-4 inline-block">← back to catalog</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center px-6 text-center text-muted-foreground">
      {(error as Error).message}
    </div>
  ),
  component: LearnPage,
});

type FlatLesson = Lesson & { moduleTitle: string; moduleIndex: number; lessonIndex: number };

function LearnPage() {
  const { course } = Route.useLoaderData() as { course: Course };
  const { slug, lessonId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<"overview" | "notes" | "transcript">("overview");
  const [notes, setNotes] = useState("");

  const modules: Module[] = course.modules ?? [];
  const flat: FlatLesson[] = useMemo(() => {
    const out: FlatLesson[] = [];
    modules.forEach((m, mi) =>
      m.lessons.forEach((l, li) =>
        out.push({ ...l, moduleTitle: m.title, moduleIndex: mi, lessonIndex: li }),
      ),
    );
    return out;
  }, [modules]);

  const currentIdx = flat.findIndex((l) => l.id === lessonId);
  const current = currentIdx >= 0 ? flat[currentIdx] : null;
  const prev = currentIdx > 0 ? flat[currentIdx - 1] : null;
  const next = currentIdx >= 0 && currentIdx < flat.length - 1 ? flat[currentIdx + 1] : null;

  const enrolledQuery = useQuery({
    queryKey: ["enrolled", course.id, user?.id],
    queryFn: () => isEnrolled(course.id),
    enabled: !!user,
  });
  const progressQuery = useQuery({
    queryKey: ["progress", course.id, user?.id],
    queryFn: () => fetchMyProgressForCourse(course.id),
    enabled: !!user && !!enrolledQuery.data,
  });
  const completedIds = progressQuery.data ?? new Set<string>();
  const done = current ? completedIds.has(current.id) : false;
  const totalLessons = flat.length;
  const pct = totalLessons ? Math.round((completedIds.size / totalLessons) * 100) : 0;

  const toggleMut = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      toggleLessonComplete(course.id, id, completed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress", course.id] });
      qc.invalidateQueries({ queryKey: ["all-progress"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Load notes from localStorage per lesson.
  useEffect(() => {
    if (!current) return;
    const k = `notes:${course.id}:${current.id}`;
    setNotes(localStorage.getItem(k) ?? "");
  }, [course.id, current?.id]);

  useEffect(() => {
    if (!current) return;
    const k = `notes:${course.id}:${current.id}`;
    const t = setTimeout(() => localStorage.setItem(k, notes), 400);
    return () => clearTimeout(t);
  }, [notes, course.id, current?.id]);

  // Redirect non-enrolled to course page (only free-preview lessons allowed otherwise).
  useEffect(() => {
    if (authLoading || !user) return;
    if (enrolledQuery.isLoading) return;
    if (enrolledQuery.data) return;
    if (current?.freePreview) return;
    navigate({ to: "/courses/$slug", params: { slug } });
  }, [authLoading, user, enrolledQuery.data, enrolledQuery.isLoading, current?.freePreview, navigate, slug]);

  // Auto-redirect to the first lesson when the ID is unknown.
  useEffect(() => {
    if (current) return;
    if (flat[0]) navigate({ to: "/learn/$slug/$lessonId", params: { slug, lessonId: flat[0].id }, replace: true });
  }, [current, flat, navigate, slug]);

  if (!current) return null;

  async function markCompleteAndNext() {
    if (!done) await toggleMut.mutateAsync({ id: current!.id, completed: true });
    if (next) navigate({ to: "/learn/$slug/$lessonId", params: { slug, lessonId: next.id } });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            className="rounded border border-border p-1.5 md:hidden"
            onClick={() => setSidebarOpen((s) => !s)}
            aria-label="Toggle curriculum"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <Link
            to="/courses/$slug"
            params={{ slug }}
            className="mono-label inline-flex items-center gap-1 hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> course
          </Link>
          <div className="hidden truncate text-sm md:block">{course.title}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <div className="mono-label">{pct}% complete</div>
            <div className="h-1 w-32 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full bg-signal transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 md:grid-cols-[1fr_320px]">
        {/* Main */}
        <main className="min-w-0 px-4 py-6 md:px-8">
          <div className="mono-label mb-2">
            Module {String(current.moduleIndex + 1).padStart(2, "0")} · Lesson {String(current.lessonIndex + 1).padStart(2, "0")}
          </div>
          <h1 className="text-2xl md:text-3xl">{current.title}</h1>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {current.type.toUpperCase()} · {formatDuration(current.durationSecs)}
          </div>

          {/* Player area */}
          <div className="mt-6 aspect-video overflow-hidden rounded-lg border border-border bg-surface">
            <div className="relative grid h-full place-items-center">
              <div className="grid-lines absolute inset-0 opacity-20" />
              <div className="relative z-10 text-center">
                <PlayCircle className="mx-auto h-16 w-16 text-foreground/70" />
                <div className="mono-label mt-3">video placeholder</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  hook up an mp4 / hls / youtube embed here
                </div>
              </div>
            </div>
          </div>

          {/* Action row */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleMut.mutate({ id: current.id, completed: !done })}
                disabled={toggleMut.isPending}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-xs transition-colors ${
                  done
                    ? "border-signal/40 bg-signal/10 text-signal"
                    : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                {done ? "Completed" : "Mark complete"}
              </button>
              {next && (
                <button
                  onClick={markCompleteAndNext}
                  className="inline-flex items-center gap-1.5 rounded-md bg-signal px-3 py-1.5 font-mono text-xs text-signal-foreground"
                >
                  Complete & next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  prev && navigate({ to: "/learn/$slug/$lessonId", params: { slug, lessonId: prev.id } })
                }
                disabled={!prev}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 font-mono text-xs disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                onClick={() =>
                  next && navigate({ to: "/learn/$slug/$lessonId", params: { slug, lessonId: next.id } })
                }
                disabled={!next}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 font-mono text-xs disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8">
            <div className="flex gap-1 border-b border-border">
              {(["overview", "notes", "transcript"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                    tab === t
                      ? "border-b-2 border-signal text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="py-6 text-sm leading-relaxed">
              {tab === "overview" && (
                <div className="max-w-2xl space-y-3 text-muted-foreground">
                  <p>
                    <span className="text-foreground">{current.moduleTitle}</span> — this lesson covers "{current.title}".
                  </p>
                  <p>{course.subtitle}</p>
                </div>
              )}
              {tab === "notes" && (
                <div className="max-w-2xl">
                  <div className="mono-label mb-2">your notes (autosaved locally)</div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={10}
                    placeholder="Write notes for this lesson…"
                    className="w-full rounded-md border border-border bg-surface p-3 font-mono text-sm"
                  />
                </div>
              )}
              {tab === "transcript" && (
                <div className="max-w-2xl text-muted-foreground">
                  <p>
                    Transcripts are not attached to this lesson yet. Once you connect a video source, paste
                    or auto-generate a transcript here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 right-0 z-40 w-80 max-w-[85vw] transform overflow-y-auto border-l border-border bg-background transition-transform md:static md:z-0 md:h-[calc(100vh-57px)] md:max-w-none md:transform-none md:sticky md:top-[57px] ${
            sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
          }`}
        >
          <div className="border-b border-border px-4 py-3">
            <div className="mono-label">curriculum</div>
            <div className="mt-1 truncate text-sm">{course.title}</div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              {completedIds.size} / {totalLessons} lessons
            </div>
          </div>
          <div className="divide-y divide-border">
            {modules.map((m, mi) => (
              <div key={m.id}>
                <div className="bg-surface px-4 py-2 font-mono text-xs">
                  <span className="text-muted-foreground">M{String(mi + 1).padStart(2, "0")} · </span>
                  {m.title}
                </div>
                <ul>
                  {m.lessons.map((l, li) => {
                    const isDone = completedIds.has(l.id);
                    const isCurrent = l.id === current.id;
                    return (
                      <li key={l.id}>
                        <Link
                          to="/learn/$slug/$lessonId"
                          params={{ slug, lessonId: l.id }}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-start gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isCurrent ? "bg-signal/10 text-foreground" : "hover:bg-surface-2"
                          }`}
                        >
                          <span className="mt-0.5 shrink-0">
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-signal" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {String(mi + 1).padStart(2, "0")}.{String(li + 1).padStart(2, "0")}
                            </span>
                            <span className={`block truncate ${isDone ? "text-muted-foreground" : ""}`}>{l.title}</span>
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                            {formatDuration(l.durationSecs)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
