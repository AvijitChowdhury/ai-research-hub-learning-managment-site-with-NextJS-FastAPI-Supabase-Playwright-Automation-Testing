import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { CourseCard } from "@/components/course-card";
import { fetchCourses, CATEGORIES, type Course } from "@/lib/courses";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export const Route = createFileRoute("/courses")({
  head: ({ loaderData }) => {
    const url = "https://teach-research-ai-avi.lovable.app/courses";
    const items = (loaderData ?? []) as Course[];
    return {
      meta: [
        { title: "Catalog — axiom/lab" },
        {
          name: "description",
          content:
            "Every course in the axiom/lab catalog: transformers, RLHF, diffusion, RL, ML systems, and research methods.",
        },
        { property: "og:title", content: "Catalog — axiom/lab" },
        { property: "og:description", content: "Every course in the axiom/lab catalog." },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "axiom/lab course catalog",
            url,
            hasPart: items.slice(0, 25).map((c) => ({
              "@type": "Course",
              name: c.title,
              description: c.subtitle,
              provider: { "@type": "Organization", name: "axiom/lab" },
              url: `https://teach-research-ai-avi.lovable.app/courses/${c.slug}`,
            })),
          }),
        },
      ],
    };
  },
  loader: () => fetchCourses(),
  component: Catalog,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-6 py-32 text-center text-muted-foreground">
      <div className="mono-label">error</div>
      <p className="mt-3">Couldn't load courses: {(error as Error).message}</p>
    </div>
  ),
});


function Catalog() {
  const courses = Route.useLoaderData() as Course[];
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (cat && c.category !== cat) return false;
      if (level && c.level !== level) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.instructor.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [courses, query, cat, level]);

  return (
    <>
      <SiteHeader />

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mono-label mb-4">/ catalog</div>
          <h1 className="text-4xl md:text-5xl tracking-tight">
            {courses.length} courses. Every one taught by a working AI researcher.
          </h1>

          <div className="mt-10 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses, topics, instructors…"
                className="h-11 w-full rounded-md border border-border bg-surface pl-9 pr-3 font-mono text-sm placeholder:text-muted-foreground focus:border-signal focus:outline-none"
              />
            </div>
            <select
              value={level ?? ""}
              onChange={(e) => setLevel(e.target.value || null)}
              className="h-11 rounded-md border border-border bg-surface px-3 font-mono text-sm"
            >
              <option value="">All levels</option>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>All Levels</option>
            </select>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <FilterChip label="All" active={cat === null} onClick={() => setCat(null)} />
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c}
                label={c}
                active={cat === c}
                onClick={() => setCat(cat === c ? null : c)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mono-label mb-6">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-16 text-center text-muted-foreground">
            No courses match those filters yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full border px-3 py-1 font-mono text-xs transition-colors " +
        (active
          ? "border-signal bg-signal/10 text-signal"
          : "border-border bg-surface text-muted-foreground hover:text-foreground")
      }
    >
      {label}
    </button>
  );
}
