import { supabase } from "@/integrations/supabase/client";

export type Certificate = {
  id: string;
  user_id: string;
  course_id: string;
  code: string;
  issued_at: string;
};

export type CertificateWithDetails = Certificate & {
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
  const { data, error } = await supabase
    .from("certificates" as any)
    .select(
      "id,user_id,course_id,code,issued_at,courses:course_id(title,slug,instructor_name),profiles:user_id(display_name)"
    )
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return (data as any) ?? null;
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
