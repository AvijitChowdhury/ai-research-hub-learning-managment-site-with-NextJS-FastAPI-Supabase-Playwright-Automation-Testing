
DROP POLICY IF EXISTS "Users create own enrollments" ON public.enrollments;

CREATE POLICY "Users create own enrollments"
  ON public.enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Free course: allow direct enrollment
      EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = enrollments.course_id
          AND c.is_published = true
          AND COALESCE(c.price_cents, 0) = 0
      )
      -- Paid course: require a paid order for this user/course
      OR EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.course_id = enrollments.course_id
          AND o.user_id = auth.uid()
          AND o.status = 'paid'
      )
    )
  );
