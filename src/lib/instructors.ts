import { supabase } from "@/integrations/supabase/client";

export type InstructorSummary = {
  name: string;
  title: string | null;
  bio: string | null;
  avatar: string | null;
  courseCount: number;
  courseIds: string[];
};

// Instructor info is embedded on the courses table (schema supports adding a
// dedicated instructors table later without breaking anything). This groups by
// name and lets admins edit metadata across all of an instructor's courses at once.
export async function fetchInstructors(): Promise<InstructorSummary[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("id,instructor_name,instructor_title,instructor_bio,instructor_avatar");
  if (error) throw error;
  const map = new Map<string, InstructorSummary>();
  for (const r of data ?? []) {
    const key = r.instructor_name ?? "—";
    const cur = map.get(key);
    if (cur) {
      cur.courseCount++;
      cur.courseIds.push(r.id);
    } else {
      map.set(key, {
        name: key,
        title: r.instructor_title,
        bio: r.instructor_bio,
        avatar: r.instructor_avatar,
        courseCount: 1,
        courseIds: [r.id],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function updateInstructorAcrossCourses(
  originalName: string,
  patch: { name?: string; title?: string | null; bio?: string | null; avatar?: string | null },
) {
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.instructor_name = patch.name;
  if (patch.title !== undefined) update.instructor_title = patch.title;
  if (patch.bio !== undefined) update.instructor_bio = patch.bio;
  if (patch.avatar !== undefined) update.instructor_avatar = patch.avatar;
  if (Object.keys(update).length === 0) return;
  const { error } = await supabase
    .from("courses")
    .update(update as any)
    .eq("instructor_name", originalName);
  if (error) throw error;
}
