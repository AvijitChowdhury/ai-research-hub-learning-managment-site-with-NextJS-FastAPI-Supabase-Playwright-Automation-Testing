
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

-- Replace public SELECT policy to exclude hidden
DROP POLICY IF EXISTS "Reviews of published courses are viewable" ON public.reviews;
CREATE POLICY "Reviews of published courses are viewable"
  ON public.reviews FOR SELECT
  USING (
    hidden = false
    AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = reviews.course_id AND c.is_published = true)
  );

-- Admin can select/update/delete all reviews (moderation)
DROP POLICY IF EXISTS "Admins manage reviews" ON public.reviews;
CREATE POLICY "Admins manage reviews"
  ON public.reviews FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
