import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { courseBySlug, formatDuration, COURSES } from "@/lib/mock-data";
import { CourseCard } from "@/components/course-card";
import { CheckCircle2, Lock, PlayCircle, Star } from "lucide-react";

export const Route = createFileRoute("/courses/$slug")({
  loader: ({ params }) => {
    const course = courseBySlug(params.slug);
    if (!course) throw notFound();
    return { course };
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
  component: CourseDetail,
});

function CourseDetail() {
  const { course } = Route.useLoaderData();
  const related = COURSES.filter((c) => c.slug !== course.slug && c.category === course.category).slice(0, 3);
  const totalLessons = course.modules.reduce((n, m) => n + m.lessons.length, 0);
  const totalSecs = course.modules.reduce(
    (n, m) => n + m.lessons.reduce((s, l) => s + l.durationSecs, 0),
    0,
  );

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
              <span>/</span>
              <span className="text-signal">{course.tag}</span>
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
              <div className="text-muted-foreground">
                Updated <span className="text-foreground">{course.updated}</span>
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
              <div className={`relative h-48 bg-gradient-to-br ${course.thumbnailGradient} border-b border-border`}>
                <div className="grid-lines absolute inset-0 opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="h-16 w-16 text-foreground/80" />
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl">${course.price}</span>
                  <span className="mono-label">one-time · lifetime access</span>
                </div>
                <button className="mt-5 w-full rounded-md bg-signal py-3 font-mono text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90">
                  Enroll — pay with UdokktaPay
                </button>
                <button className="mt-2 w-full rounded-md border border-border-strong bg-background py-3 font-mono text-sm transition-colors hover:bg-surface-2">
                  Watch free preview
                </button>

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
                    {course.modules.length} modules · {totalLessons} lessons
                  </h2>
                </div>
              </div>
              <div className="divide-y divide-border rounded-lg border border-border bg-surface">
                {course.modules.map((m, mi) => (
                  <details key={m.id} className="group" open={mi === 0}>
                    <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm">
                      <span className="font-mono">{m.title}</span>
                      <span className="mono-label">{m.lessons.length} lessons</span>
                    </summary>
                    <ul className="border-t border-border">
                      {m.lessons.map((l) => (
                        <li key={l.id} className="flex items-center justify-between px-6 py-3 text-sm hover:bg-surface-2">
                          <div className="flex items-center gap-3">
                            {l.freePreview ? (
                              <PlayCircle className="h-4 w-4 text-signal" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span>{l.title}</span>
                            {l.freePreview && (
                              <span className="mono-label rounded-sm border border-signal/40 bg-signal/10 px-1.5 py-0.5 text-signal">
                                preview
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {formatDuration(l.durationSecs)}
                          </span>
                        </li>
                      ))}
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

          {/* Right column: rating breakdown */}
          <aside className="md:col-span-4">
            <div className="rounded-lg border border-border bg-surface p-6">
              <div className="mono-label mb-4">student reviews</div>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-5xl">{course.rating.toFixed(1)}</span>
                <span className="mono-label">/ 5.00</span>
              </div>
              <div className="mt-6 space-y-2">
                {[5, 4, 3, 2, 1].map((s) => {
                  const pct = s === 5 ? 78 : s === 4 ? 17 : s === 3 ? 3 : s === 2 ? 1 : 1;
                  return (
                    <div key={s} className="flex items-center gap-3 text-xs">
                      <span className="w-6 font-mono">{s}★</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full bg-signal" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 font-mono text-muted-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
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
