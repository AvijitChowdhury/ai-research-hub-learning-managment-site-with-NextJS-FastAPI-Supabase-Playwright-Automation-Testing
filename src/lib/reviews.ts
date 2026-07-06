import { supabase } from "@/integrations/supabase/client";

export type Review = {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  author: { displayName: string | null; avatarUrl: string | null };
};

export async function fetchReviews(courseId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id,course_id,user_id,rating,body,created_at,updated_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [];
  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profs } = await supabase
    .from("profiles")
    .select("id,display_name,avatar_url")
    .in("id", ids);
  const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
  return rows.map((r) => {
    const p = profMap.get(r.user_id);
    return {
      id: r.id,
      courseId: r.course_id,
      userId: r.user_id,
      rating: r.rating,
      body: r.body,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      author: {
        displayName: p?.display_name ?? null,
        avatarUrl: p?.avatar_url ?? null,
      },
    };
  });
}

export async function fetchMyReview(courseId: string): Promise<Review | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("reviews")
    .select("id,course_id,user_id,rating,body,created_at,updated_at")
    .eq("course_id", courseId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    courseId: data.course_id,
    userId: data.user_id,
    rating: data.rating,
    body: data.body,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    author: { displayName: null, avatarUrl: null },
  };
}

export async function upsertReview(courseId: string, rating: number, body: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("reviews")
    .upsert(
      { user_id: user.id, course_id: courseId, rating, body: body.trim() || null },
      { onConflict: "user_id,course_id" },
    );
  if (error) throw error;
}

export async function deleteMyReview(courseId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("user_id", user.id)
    .eq("course_id", courseId);
  if (error) throw error;
}
