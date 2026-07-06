import { supabase } from "@/integrations/supabase/client";
import type { Course, Module, Lesson } from "./courses";

export type CourseInput = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  price: number; // dollars
  currency?: string;
  instructor_name: string;
  instructor_title?: string | null;
  instructor_bio?: string | null;
  tag?: string | null;
  thumbnail_gradient?: string | null;
  language?: string;
  duration_hours?: number;
  lessons_count?: number;
  what_you_will_learn?: string[];
  requirements?: string[];
  is_published?: boolean;
  sort_order?: number;
};

function toRow(input: Partial<CourseInput>) {
  const row: Record<string, unknown> = { ...input };
  if (input.price !== undefined) {
    row.price_cents = Math.round(input.price * 100);
    delete row.price;
  }
  return row;
}

export async function createCourse(input: CourseInput): Promise<string> {
  const { data, error } = await supabase
    .from("courses")
    .insert(toRow(input) as any)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateCourse(id: string, patch: Partial<CourseInput>) {
  const { error } = await supabase.from("courses").update(toRow(patch) as any).eq("id", id);
  if (error) throw error;
}

export async function deleteCourse(id: string) {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
}

export async function togglePublish(id: string, is_published: boolean) {
  const { error } = await supabase.from("courses").update({ is_published }).eq("id", id);
  if (error) throw error;
}

// ── Course fetch (incl. unpublished) ──────────────────────────
export async function adminFetchCourses() {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function adminFetchCourseById(id: string) {
  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!course) return null;

  const { data: mods, error: mErr } = await supabase
    .from("modules")
    .select("id,title,sort_order")
    .eq("course_id", id)
    .order("sort_order", { ascending: true });
  if (mErr) throw mErr;

  const modIds = (mods ?? []).map((m) => m.id);
  const { data: lessons, error: lErr } = modIds.length
    ? await supabase
        .from("lessons")
        .select("id,module_id,title,duration_secs,type,free_preview,sort_order")
        .in("module_id", modIds)
        .order("sort_order", { ascending: true })
    : { data: [], error: null };
  if (lErr) throw lErr;

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
        type: l.type as Lesson["type"],
        freePreview: l.free_preview,
        sortOrder: l.sort_order,
      })),
  }));

  return { course, modules };
}

// ── Modules ───────────────────────────────────────────────────
export async function createModule(courseId: string, title: string, sortOrder: number) {
  const { data, error } = await supabase
    .from("modules")
    .insert({ course_id: courseId, title, sort_order: sortOrder })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateModule(id: string, patch: { title?: string; sort_order?: number }) {
  const { error } = await supabase.from("modules").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteModule(id: string) {
  const { error } = await supabase.from("modules").delete().eq("id", id);
  if (error) throw error;
}

// ── Lessons ───────────────────────────────────────────────────
export async function createLesson(
  moduleId: string,
  input: { title: string; duration_secs: number; type: Lesson["type"]; free_preview: boolean; sort_order: number },
) {
  const { data, error } = await supabase
    .from("lessons")
    .insert({ module_id: moduleId, ...input })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateLesson(
  id: string,
  patch: Partial<{ title: string; duration_secs: number; type: Lesson["type"]; free_preview: boolean; sort_order: number }>,
) {
  const { error } = await supabase.from("lessons").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteLesson(id: string) {
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) throw error;
}

// ── Admin bootstrap ───────────────────────────────────────────
export async function claimFirstAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("claim_first_admin" as any);
  if (error) throw error;
  return !!data;
}

export type { Course };
