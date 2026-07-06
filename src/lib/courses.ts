import { supabase } from "@/integrations/supabase/client";

export type Lesson = {
  id: string;
  title: string;
  durationSecs: number;
  type: "video" | "text" | "quiz";
  freePreview: boolean;
  sortOrder: number;
};

export type Module = {
  id: string;
  title: string;
  sortOrder: number;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  price: number; // dollars
  currency: string;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  durationHours: number;
  lessonsCount: number;
  language: string;
  tag: string | null;
  thumbnailGradient: string | null;
  instructor: { name: string; title: string | null; bio: string | null; avatar: string | null };
  whatYouWillLearn: string[];
  requirements: string[];
  modules?: Module[];
};

export const CATEGORIES = [
  "Foundations",
  "LLMs & NLP",
  "Alignment & Safety",
  "Reinforcement Learning",
  "Computer Vision",
  "ML Systems",
  "Research Methods",
];

function rowToCourse(row: any, modules?: Module[]): Course {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    category: row.category,
    level: row.level,
    price: (row.price_cents ?? 0) / 100,
    currency: row.currency,
    rating: Number(row.rating ?? 0),
    reviewsCount: row.reviews_count,
    studentsCount: row.students_count,
    durationHours: row.duration_hours,
    lessonsCount: row.lessons_count,
    language: row.language,
    tag: row.tag,
    thumbnailGradient: row.thumbnail_gradient,
    instructor: {
      name: row.instructor_name,
      title: row.instructor_title,
      bio: row.instructor_bio,
      avatar: row.instructor_avatar,
    },
    whatYouWillLearn: row.what_you_will_learn ?? [],
    requirements: row.requirements ?? [],
    modules,
  };
}

export async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => rowToCourse(r));
}

export async function fetchCourseBySlug(slug: string): Promise<Course | null> {
  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  if (!course) return null;

  const { data: mods, error: modErr } = await supabase
    .from("modules")
    .select("id,title,sort_order")
    .eq("course_id", course.id)
    .order("sort_order", { ascending: true });
  if (modErr) throw modErr;

  const modIds = (mods ?? []).map((m) => m.id);
  const { data: lessons, error: lessErr } = modIds.length
    ? await supabase
        .from("lessons")
        .select("id,module_id,title,duration_secs,type,free_preview,sort_order")
        .in("module_id", modIds)
        .order("sort_order", { ascending: true })
    : { data: [], error: null };
  if (lessErr) throw lessErr;

  const modules: Module[] = (mods ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    sortOrder: m.sort_order,
    lessons: (lessons ?? [])
      .filter((l: any) => l.module_id === m.id)
      .map((l: any) => ({
        id: l.id,
        title: l.title,
        durationSecs: l.duration_secs,
        type: l.type,
        freePreview: l.free_preview,
        sortOrder: l.sort_order,
      })),
  }));

  return rowToCourse(course, modules);
}

export function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Enrollments ─────────────────────────────────────────────

export type Enrollment = {
  id: string;
  courseId: string;
  enrolledAt: string;
  completedAt: string | null;
};

export async function fetchMyEnrollments(): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id,course_id,enrolled_at,completed_at");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    courseId: r.course_id,
    enrolledAt: r.enrolled_at,
    completedAt: r.completed_at,
  }));
}

export async function enrollInCourse(courseId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("enrollments")
    .insert({ user_id: user.id, course_id: courseId });
  if (error && error.code !== "23505") throw error; // ignore duplicate
}

export async function isEnrolled(courseId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

// ── Progress ────────────────────────────────────────────────

export async function fetchMyProgressForCourse(courseId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id,completed")
    .eq("course_id", courseId)
    .eq("completed", true);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.lesson_id));
}

export async function fetchAllMyProgress(): Promise<Array<{ courseId: string; completedLessons: number }>> {
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("course_id,lesson_id,completed")
    .eq("completed", true);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const r of data ?? []) {
    counts.set(r.course_id, (counts.get(r.course_id) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([courseId, completedLessons]) => ({ courseId, completedLessons }));
}

export async function toggleLessonComplete(courseId: string, lessonId: string, completed: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("lesson_progress")
    .upsert(
      { user_id: user.id, course_id: courseId, lesson_id: lessonId, completed },
      { onConflict: "user_id,lesson_id" },
    );
  if (error) throw error;
}
