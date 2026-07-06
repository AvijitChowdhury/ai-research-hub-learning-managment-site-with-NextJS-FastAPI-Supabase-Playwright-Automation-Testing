import type { Course } from "@/lib/mock-data";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className="card-hover group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface"
    >
      <div
        className={`relative h-40 overflow-hidden bg-gradient-to-br ${course.thumbnailGradient} border-b border-border`}
      >
        <div className="grid-lines absolute inset-0 opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-end justify-between p-4">
          <span className="mono-label rounded-sm border border-border-strong bg-background/70 px-2 py-1 text-foreground/80 backdrop-blur">
            {course.tag}
          </span>
          <span className="mono-label rounded-sm border border-signal/40 bg-signal/10 px-2 py-1 text-signal backdrop-blur">
            {course.level}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mono-label mb-2">{course.category}</div>
        <h3 className="text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-signal">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{course.subtitle}</p>

        <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-signal text-signal" />
            <span className="text-foreground font-mono">{course.rating.toFixed(1)}</span>
            <span>({course.reviewsCount.toLocaleString()})</span>
          </div>
          <span>{course.durationHours}h</span>
          <span>{course.lessonsCount} lessons</span>
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
          <div>
            <div className="mono-label">Instructor</div>
            <div className="mt-1 text-sm">{course.instructor.name}</div>
          </div>
          <div className="text-right">
            <div className="mono-label">Price</div>
            <div className="mt-1 font-mono text-base text-ember">${course.price}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
