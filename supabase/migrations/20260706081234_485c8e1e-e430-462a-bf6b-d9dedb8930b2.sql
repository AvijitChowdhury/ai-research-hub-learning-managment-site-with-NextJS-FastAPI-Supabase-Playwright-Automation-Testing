
-- 1. Table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX reviews_course_id_idx ON public.reviews(course_id);

-- 2. Grants
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

-- 3. RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews of published courses are viewable"
  ON public.reviews FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_published = true)
  );

CREATE POLICY "Enrolled users can insert their own review"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid() AND e.course_id = reviews.course_id)
  );

CREATE POLICY "Users can update their own review"
  ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review"
  ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4. updated_at trigger
CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Aggregate rollup: keep courses.rating & reviews_count in sync.
CREATE OR REPLACE FUNCTION public.refresh_course_rating(_course_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.courses c
  SET
    rating = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM public.reviews WHERE course_id = _course_id), 0),
    reviews_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE course_id = _course_id), 0)
  WHERE c.id = _course_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reviews_rollup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_course_rating(OLD.course_id);
    RETURN OLD;
  ELSE
    PERFORM public.refresh_course_rating(NEW.course_id);
    IF TG_OP = 'UPDATE' AND NEW.course_id <> OLD.course_id THEN
      PERFORM public.refresh_course_rating(OLD.course_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER reviews_rollup_ins AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_rollup();
CREATE TRIGGER reviews_rollup_upd AFTER UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_rollup();
CREATE TRIGGER reviews_rollup_del AFTER DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_rollup();
