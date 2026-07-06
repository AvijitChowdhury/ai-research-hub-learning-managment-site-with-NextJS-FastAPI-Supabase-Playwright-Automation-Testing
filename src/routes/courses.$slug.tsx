import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import {
  fetchCourseBySlug,
  fetchCourses,
  formatDuration,
  enrollInCourse,
  isEnrolled,
  fetchMyProgressForCourse,
  toggleLessonComplete,
  type Course,
  type Module,
  type Lesson,
} from "@/lib/courses";
import { CourseCard } from "@/components/course-card";
import { ReviewsSection } from "@/components/reviews-section";
import { CheckCircle2, Circle, Lock, PlayCircle, Star } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { createUddoktapayCheckout } from "@/lib/checkout.functions";

export const Route = createFileRoute("/courses/$slug")({
  loader: async ({ params }) => {
    const [course, all] = await Promise.all([
      fetchCourseBySlug(params.slug),
      fetchCourses(),
    ]);
    if (!course) throw notFound();
    return { course, all };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Course not found — axiom/lab" }, { name: "robots", content: "noindex" }] };
    }
    const c = loaderData.course;
    return {
      meta: [
        { title: `${c.title} — axiom/lab` },
        { name: "description", content: c.subtitle },
        { property: "og:title", content: `${c.title} — axiom/lab` },
        { property: "og:description", content: c.subtitle },
      ],
    };
  },
  notFoundComponent: () => (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <div className="mono-label">404</div>
        <h1 className="mt-3 text-4xl">Course not found</h1>
        <p className="mt-3 text-muted-foreground">
          That slug doesn't match anything in the catalog.
        </p>
        <Link to="/courses" className="mono-label mt-6 inline-block hover:text-foreground">
          ← back to catalog
        </Link>
      </div>
      <SiteFooter />
    </>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-6 py-32 text-center text-muted-foreground">
      <div className="mono-label">error</div>
      <p className="mt-3">{(error as Error).message}</p>
    </div>
  ),
  component: CourseDetail,
});

function CourseDetail() {
  const { course, all } = Route.useLoaderData() as { course: Course; all: Course[] };
  const modules = course.modules ?? [];
  const related = all.filter((c) => c.slug !== course.slug && c.category === course.category).slice(0, 3);
  const totalLessons = modules.reduce((n: number, m: Module) => n + m.lessons.length, 0);
  const totalSecs = modules.reduce(
    (n: number, m: Module) => n + m.lessons.reduce((s: number, l: Lesson) => s + l.durationSecs, 0),
    0,
  );

  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

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

  const enrollMut = useMutation({
    mutationFn: async () => {
      const res = await createUddoktapayCheckout({ data: { courseId: course.id } });
      return res;
    },
    onSuccess: (res) => {
      if (res.payment_url) {
        toast.message("Redirecting to secure checkout…");
        window.location.href = res.payment_url;
        return;
      }
      // free course or already enrolled
      toast.success("You're enrolled. Start learning below.");
      qc.invalidateQueries({ queryKey: ["enrolled", course.id] });
      qc.invalidateQueries({ queryKey: ["my-enrollments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: ({ lessonId, completed }: { lessonId: string; completed: boolean }) =>
      toggleLessonComplete(course.id, lessonId, completed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress", course.id] });
      qc.invalidateQueries({ queryKey: ["all-progress"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const enrolled = !!enrolledQuery.data;
  const completedIds = progressQuery.data ?? new Set<string>();
  const progressPct = enrolled && totalLessons > 0 ? Math.round((completedIds.size / totalLessons) * 100) : 0;

  function handleEnroll() {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    enrollMut.mutate();
  }

  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-12">
          <div className="md:col-span-8">
            <div className="mono-label mb-4 flex items-center gap-3">
              <Link to="/courses" className="hover:text-foreground">catalog</Link>
              <span>/</span>
              <span>{course.category}</span>
              {course.tag && (<><span>/</span><span className="text-signal">{course.tag}</span></>)}
            </div>
            <h1 className="text-4xl leading-tight tracking-tight md:text-5xl">{course.title}</h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{course.subtitle}</p>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-signal text-signal" />
                <span className="font-mono">{course.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({course.reviewsCount.toLocaleString()} reviews)
                </span>
              </div>
              <div className="text-muted-foreground">
                <span className="font-mono text-foreground">{course.studentsCount.toLocaleString()}</span> students
              </div>
              <div className="text-muted-foreground">{course.language}</div>
            </div>

            <div className="mt-8 flex items-center gap-3 rounded-md border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-signal/20 font-mono text-sm text-signal">
                {course.instructor.avatar}
              </div>
              <div>
                <div className="text-sm">{course.instructor.name}</div>
                <div className="mono-label mt-0.5">{course.instructor.title}</div>
              </div>
            </div>
          </div>

          {/* Buy card */}
          <aside className="md:col-span-4">
            <div className="sticky top-20 overflow-hidden rounded-lg border border-border bg-surface">
              <div className={`relative h-48 bg-gradient-to-br ${course.thumbnailGradient ?? ""} border-b border-border`}>
                <div className="grid-lines absolute inset-0 opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="h-16 w-16 text-foreground/80" />
                </div>
              </div>
              <div className="p-6">
                {enrolled ? (
                  <>
                    <div className="mono-label mb-2 text-signal">✓ enrolled</div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-2xl">{progressPct}%</span>
                      <span className="mono-label">complete · {completedIds.size} / {totalLessons} lessons</span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full bg-signal transition-all" style={{ width: `${progressPct}%` }} />
                    </div>
                    {(() => {
                      const flat = modules.flatMap((m) => m.lessons);
                      const nextLesson = flat.find((l) => !completedIds.has(l.id)) ?? flat[0];
                      return nextLesson ? (
                        <Link
                          to="/learn/$slug/$lessonId"
                          params={{ slug: course.slug, lessonId: nextLesson.id }}
                          className="mt-5 flex w-full items-center justify-center rounded-md bg-signal py-3 font-mono text-sm text-signal-foreground transition-opacity hover:opacity-90"
                        >
                          {completedIds.size === 0 ? "Start learning →" : "Continue learning →"}
                        </Link>
                      ) : null;
                    })()}
                    <Link
                      to="/dashboard"
                      className="mt-2 flex w-full items-center justify-center rounded-md border border-border-strong bg-background py-2 font-mono text-xs transition-colors hover:bg-surface-2"
                    >
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-3xl">${course.price}</span>
                      <span className="mono-label">one-time · lifetime access</span>
                    </div>
                    <button
                      onClick={handleEnroll}
                      disabled={enrollMut.isPending}
                      className="mt-5 w-full rounded-md bg-signal py-3 font-mono text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {enrollMut.isPending ? "Enrolling…" : user ? "Enroll — free preview access" : "Sign in to enroll"}
                    </button>
                    <p className="mt-2 text-center text-[10px] font-mono text-muted-foreground">
                      payments via UdokktaPay coming soon
                    </p>
                  </>
                )}

                <ul className="mt-6 space-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
                  <StatRow label="Lessons" value={String(totalLessons)} />
                  <StatRow label="Total video" value={`${Math.round(totalSecs / 3600)}h ${Math.round((totalSecs % 3600) / 60)}m`} />
                  <StatRow label="Level" value={course.level} />
                  <StatRow label="Certificate" value="On completion" />
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* What you'll learn */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-8">
            <div className="mono-label mb-4">what you'll learn</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {course.whatYouWillLearn.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-md border border-border bg-surface p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>

            {/* Curriculum */}
            <div className="mt-16">
              <div className="mb-6 flex items-baseline justify-between">
                <div>
                  <div className="mono-label">curriculum</div>
                  <h2 className="mt-1 text-2xl">
                    {modules.length} modules · {totalLessons} lessons
                  </h2>
                </div>
              </div>
              <div className="divide-y divide-border rounded-lg border border-border bg-surface">
                {modules.map((m, mi) => (
                  <details key={m.id} className="group" open={mi === 0}>
                    <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm">
                      <span className="font-mono">{m.title}</span>
                      <span className="mono-label">{m.lessons.length} lessons</span>
                    </summary>
                    <ul className="border-t border-border">
                      {m.lessons.map((l) => {
                        const done = completedIds.has(l.id);
                        const canToggle = enrolled;
                        return (
                          <li key={l.id} className="flex items-center justify-between px-6 py-3 text-sm hover:bg-surface-2">
                            <div className="flex items-center gap-3">
                              {canToggle ? (
                                <button
                                  onClick={() => toggleMut.mutate({ lessonId: l.id, completed: !done })}
                                  className="text-signal transition-transform hover:scale-110"
                                  title={done ? "Mark incomplete" : "Mark complete"}
                                >
                                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                                </button>
                              ) : l.freePreview ? (
                                <PlayCircle className="h-4 w-4 text-signal" />
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className={done ? "text-muted-foreground line-through" : ""}>{l.title}</span>
                              {l.freePreview && !enrolled && (
                                <span className="mono-label rounded-sm border border-signal/40 bg-signal/10 px-1.5 py-0.5 text-signal">
                                  preview
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-xs text-muted-foreground">
                              {formatDuration(l.durationSecs)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="mt-16">
              <div className="mono-label mb-4">requirements</div>
              <ul className="space-y-2 text-sm">
                {course.requirements.map((r) => (
                  <li key={r} className="flex items-start gap-3">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-signal" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Description */}
            <div className="mt-16">
              <div className="mono-label mb-4">description</div>
              <p className="text-base leading-relaxed text-muted-foreground">{course.description}</p>
            </div>

            {/* Instructor */}
            <div className="mt-16 rounded-lg border border-border bg-surface p-6">
              <div className="mono-label mb-4">instructor</div>
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-signal/20 font-mono text-lg text-signal">
                  {course.instructor.avatar}
                </div>
                <div>
                  <div className="text-lg">{course.instructor.name}</div>
                  <div className="mono-label mt-1">{course.instructor.title}</div>
                  <p className="mt-3 text-sm text-muted-foreground">{course.instructor.bio}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: reviews */}
          <aside className="md:col-span-4">
            <ReviewsSection
              courseId={course.id}
              courseTitle={course.title}
              enrolled={enrolled}
              fallbackRating={course.rating}
              fallbackReviewsCount={course.reviewsCount}
            />
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mono-label mb-6">related in {course.category}</div>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
    </>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="mono-label">{label}</span>
      <span className="font-mono text-sm text-foreground">{value}</span>
    </li>
  );
}
