import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { COURSES, ENROLLMENTS, courseBySlug } from "@/lib/mock-data";
import { ArrowRight, Clock, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — axiom/lab" },
      { name: "description", content: "Your enrolled courses and progress." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const enrolled = ENROLLMENTS.map((e) => ({
    ...e,
    course: courseBySlug(e.courseSlug)!,
  }));
  const inProgress = enrolled.filter((e) => e.progress < 100);
  const completed = enrolled.filter((e) => e.progress === 100);

  const totalMinutes = enrolled.reduce((n, e) => n + e.course.durationHours * 60 * (e.progress / 100), 0);

  return (
    <>
      <SiteHeader />

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="mono-label mb-3">/ dashboard</div>
          <h1 className="text-4xl">Welcome back, Ada.</h1>
          <p className="mt-2 text-muted-foreground">You're 62% through Transformers From Scratch. Nice pace.</p>

          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
            <StatBlock label="Enrolled" value={enrolled.length.toString()} />
            <StatBlock label="Completed" value={completed.length.toString()} />
            <StatBlock label="Learning time" value={`${Math.round(totalMinutes / 60)}h`} />
            <StatBlock label="Cohort" value="026" />
          </div>
        </div>
      </section>

      {/* Continue learning */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mono-label mb-4">continue learning</div>
        <div className="space-y-3">
          {inProgress.map(({ course, progress, lastLesson }) => (
            <div
              key={course.id}
              className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-5 md:flex-row md:items-center"
            >
              <div className={`h-24 w-full shrink-0 rounded-md bg-gradient-to-br md:w-40 ${course.thumbnailGradient} border border-border`} />
              <div className="flex-1">
                <div className="mono-label">{course.category}</div>
                <h3 className="mt-1 text-lg">{course.title}</h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  next: <span className="text-foreground">{lastLesson}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full bg-signal" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="font-mono text-xs">{progress}%</span>
                </div>
              </div>
              <Link
                to="/courses/$slug"
                params={{ slug: course.slug }}
                className="inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2 font-mono text-sm text-signal-foreground"
              >
                Resume <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Completed */}
      {completed.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mono-label mb-4">completed</div>
          <div className="grid gap-3 md:grid-cols-2">
            {completed.map(({ course }) => (
              <div key={course.id} className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4">
                <Trophy className="h-5 w-5 text-signal" />
                <div className="flex-1">
                  <div className="text-sm">{course.title}</div>
                  <div className="mono-label mt-0.5">completed · certificate issued</div>
                </div>
                <Link to="/courses/$slug" params={{ slug: course.slug }} className="mono-label hover:text-foreground">
                  view →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommended */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mono-label mb-4">recommended for you</div>
        <div className="grid gap-3 md:grid-cols-3">
          {COURSES.filter((c) => !ENROLLMENTS.some((e) => e.courseSlug === c.slug))
            .slice(0, 3)
            .map((c) => (
              <Link
                key={c.id}
                to="/courses/$slug"
                params={{ slug: c.slug }}
                className="rounded-lg border border-border bg-surface p-4 hover:border-border-strong"
              >
                <div className="mono-label">{c.category}</div>
                <div className="mt-1 text-sm">{c.title}</div>
                <div className="mt-3 font-mono text-xs text-muted-foreground">
                  ${c.price} · {c.durationHours}h
                </div>
              </Link>
            ))}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-5">
      <div className="mono-label">{label}</div>
      <div className="mt-2 font-mono text-3xl">{value}</div>
    </div>
  );
}
