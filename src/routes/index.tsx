import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { CourseCard } from "@/components/course-card";
import { COURSES } from "@/lib/mock-data";
import { ArrowRight, Cpu, FlaskConical, GitBranch, Sigma } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const featured = COURSES.slice(0, 3);

  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.08]" />
        <div className="relative mx-auto grid max-w-7xl gap-16 px-6 py-24 md:grid-cols-12 md:py-32">
          <div className="md:col-span-8">
            <div className="mono-label mb-6 flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              cohort · 026 · now enrolling
            </div>
            <h1 className="text-5xl leading-[1.05] tracking-tight md:text-7xl">
              A learning platform{" "}
              <span className="font-serif italic text-muted-foreground">for people doing</span>{" "}
              research in{" "}
              <span className="relative inline-block">
                <span className="relative z-10">artificial intelligence</span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-signal/40" />
              </span>
              .
            </h1>
            <p className="mt-8 max-w-2xl text-lg text-muted-foreground">
              Rigorous, code-forward courses on transformers, diffusion, RLHF, and ML systems.
              Taught by researchers who publish in the venues you read.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                to="/courses"
                className="group inline-flex items-center gap-2 rounded-md bg-signal px-5 py-3 font-mono text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90"
              >
                Browse the catalog
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/courses/$slug"
                params={{ slug: "reading-ai-papers" }}
                className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-surface px-5 py-3 font-mono text-sm transition-colors hover:bg-surface-2"
              >
                Watch a free lesson →
              </Link>
            </div>
          </div>

          <aside className="md:col-span-4">
            <div className="rounded-lg border border-border bg-surface p-5 font-mono text-xs">
              <div className="mono-label mb-4">what's inside</div>
              <ul className="space-y-3">
                {[
                  ["48", "lessons in Transformers From Scratch"],
                  ["1.2k", "students in cohort 026"],
                  ["6", "instructors, all publishing researchers"],
                  ["4.8", "avg rating across every course"],
                ].map(([n, l]) => (
                  <li key={l} className="flex items-baseline gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
                    <span className="text-lg text-signal">{n}</span>
                    <span className="text-muted-foreground">{l}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-surface-2 p-5">
              <div className="mono-label mb-2">latest</div>
              <p className="text-sm">
                <span className="text-signal">New:</span> "How To Read AI Papers" · a 6-hour
                short course from Elena Marchetti.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* PILLARS */}
      <section className="border-b border-border bg-surface/40">
        <div className="mx-auto grid max-w-7xl gap-px bg-border md:grid-cols-4">
          {[
            [Sigma, "Derived, not hand-waved", "Every technique starts from the math on paper before touching code."],
            [Cpu, "Runs on your hardware", "Notebooks target a single 24GB GPU. Nothing requires a cluster."],
            [GitBranch, "Papers as the syllabus", "Each module ships with the arXiv IDs it reimplements."],
            [FlaskConical, "Reproducible labs", "Docker + seeded environments so your run matches the video."],
          ].map(([Icon, title, body]) => {
            const IconComp = Icon as typeof Sigma;
            return (
              <div key={title as string} className="bg-background p-8">
                <IconComp className="h-5 w-5 text-signal" />
                <h3 className="mt-4 text-sm font-medium">{title as string}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex items-end justify-between">
          <div>
            <div className="mono-label mb-3">featured / cohort 026</div>
            <h2 className="text-3xl md:text-4xl">Start here.</h2>
          </div>
          <Link to="/courses" className="mono-label hover:text-foreground">
            view all →
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {featured.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="font-serif text-3xl italic leading-relaxed md:text-4xl">
            "I've paid for a lot of ML courses. This is the first one that made me feel like I
            was in a research group instead of a bootcamp."
          </p>
          <div className="mt-8 font-mono text-xs text-muted-foreground">
            — PhD candidate, University of Toronto · student in "Transformers From Scratch"
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-12 md:p-16">
          <div className="grid-lines absolute inset-0 opacity-[0.08]" />
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <div className="mono-label mb-3">$ start</div>
              <h2 className="text-3xl md:text-4xl">Enroll in cohort 026.</h2>
              <p className="mt-3 text-muted-foreground">
                One-time payment. Lifetime access. New cohorts every two months with live office
                hours.
              </p>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-md bg-signal px-6 py-3 font-mono text-sm font-medium text-signal-foreground"
            >
              See all courses <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
