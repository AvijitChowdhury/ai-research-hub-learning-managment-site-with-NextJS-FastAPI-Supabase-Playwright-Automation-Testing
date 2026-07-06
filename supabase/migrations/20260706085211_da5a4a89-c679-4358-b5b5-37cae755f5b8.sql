-- 1. Table
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  code UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX certificates_user_idx ON public.certificates(user_id);
CREATE INDEX certificates_course_idx ON public.certificates(course_id);

-- 2. Grants
GRANT SELECT ON public.certificates TO anon;
GRANT SELECT ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;

-- 3. RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Anyone can verify certificates"
  ON public.certificates FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. Auto-issue on full completion
CREATE OR REPLACE FUNCTION public.issue_certificate_if_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_lessons INT;
  done_lessons INT;
BEGIN
  IF NEW.completed IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO total_lessons
  FROM public.lessons l
  JOIN public.modules m ON m.id = l.module_id
  WHERE m.course_id = NEW.course_id;

  IF total_lessons = 0 THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(DISTINCT lp.lesson_id) INTO done_lessons
  FROM public.lesson_progress lp
  JOIN public.lessons l ON l.id = lp.lesson_id
  JOIN public.modules m ON m.id = l.module_id
  WHERE lp.user_id = NEW.user_id
    AND m.course_id = NEW.course_id
    AND lp.completed = TRUE;

  IF done_lessons >= total_lessons THEN
    INSERT INTO public.certificates (user_id, course_id)
    VALUES (NEW.user_id, NEW.course_id)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_issue_certificate
AFTER INSERT OR UPDATE OF completed ON public.lesson_progress
FOR EACH ROW
EXECUTE FUNCTION public.issue_certificate_if_complete();