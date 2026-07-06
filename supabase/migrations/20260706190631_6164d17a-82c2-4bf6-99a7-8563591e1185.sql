
-- ============ LESSONS: restrict sensitive columns ============
CREATE OR REPLACE VIEW public.lessons_public
WITH (security_invoker = true) AS
SELECT id, module_id, title, duration_secs, type, free_preview, sort_order, created_at
FROM public.lessons
WHERE EXISTS (
  SELECT 1 FROM public.modules m
  JOIN public.courses c ON c.id = m.course_id
  WHERE m.id = lessons.module_id AND c.is_published = true
);

GRANT SELECT ON public.lessons_public TO anon, authenticated;

DROP POLICY IF EXISTS "Lessons of published courses are viewable" ON public.lessons;

CREATE POLICY "Free preview lessons are public"
ON public.lessons FOR SELECT
TO anon, authenticated
USING (
  free_preview = true
  AND EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = lessons.module_id AND c.is_published = true
  )
);

CREATE POLICY "Enrolled users can view lessons"
ON public.lessons FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.enrollments e ON e.course_id = m.course_id
    WHERE m.id = lessons.module_id AND e.user_id = auth.uid()
  )
);

-- ============ CERTIFICATES: no anonymous enumeration ============
DROP POLICY IF EXISTS "Anyone can verify certificates" ON public.certificates;

CREATE POLICY "Users view their own certificates"
ON public.certificates FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.verify_certificate(_code uuid)
RETURNS TABLE (
  id uuid,
  code uuid,
  issued_at timestamptz,
  course_title text,
  course_slug text,
  instructor_name text,
  student_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ce.id,
    ce.code,
    ce.issued_at,
    c.title,
    c.slug,
    c.instructor_name,
    p.display_name
  FROM public.certificates ce
  JOIN public.courses c ON c.id = ce.course_id
  LEFT JOIN public.profiles p ON p.id = ce.user_id
  WHERE ce.code = _code
$$;

REVOKE ALL ON FUNCTION public.verify_certificate(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_certificate(uuid) TO anon, authenticated;

-- ============ PROFILES: hide bio from anon ============
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, display_name, avatar_url) ON public.profiles TO anon;

-- ============ Lock down trigger-only SECURITY DEFINER functions ============
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reviews_rollup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_course_rating(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.issue_certificate_if_complete() FROM PUBLIC, anon, authenticated;
