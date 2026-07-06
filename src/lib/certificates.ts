import { supabase } from "@/integrations/supabase/client";

export type Certificate = {
  id: string;
  user_id: string;
  course_id: string;
  code: string;
  issued_at: string;
};

export type CertificateWithDetails = {
  id: string;
  code: string;
  issued_at: string;
  courses: { title: string; slug: string; instructor_name: string | null } | null;
  profiles: { display_name: string | null } | null;
};

export async function fetchMyCertificates(): Promise<
  (Certificate & { courses: { title: string; slug: string } | null })[]
> {
  const { data, error } = await supabase
    .from("certificates" as any)
    .select("id,user_id,course_id,code,issued_at,courses:course_id(title,slug)")
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any;
}

export async function fetchCertificateByCode(
  code: string
): Promise<CertificateWithDetails | null> {
  // Guard: verify_certificate expects a uuid; invalid input would throw 22P02.
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(code)) return null;
  const { data, error } = await supabase.rpc("verify_certificate" as any, { _code: code });
  if (error) {
    if ((error as any).code === "22P02") return null;
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    issued_at: row.issued_at,
    courses: {
      title: row.course_title,
      slug: row.course_slug,
      instructor_name: row.instructor_name,
    },
    profiles: { display_name: row.student_name },
  };
}



export async function fetchMyCertificateForCourse(
  courseId: string
): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from("certificates" as any)
    .select("id,user_id,course_id,code,issued_at")
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) throw error;
  return (data as any) ?? null;
}
