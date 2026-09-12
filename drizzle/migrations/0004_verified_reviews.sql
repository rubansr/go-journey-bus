ALTER TABLE public.operators
  ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_score numeric(4,1) NOT NULL DEFAULT 80;

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  operator_id uuid REFERENCES public.operators(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  punctuality integer CHECK (punctuality BETWEEN 1 AND 5),
  cleanliness integer CHECK (cleanliness BETWEEN 1 AND 5),
  staff integer CHECK (staff BETWEEN 1 AND 5),
  comfort integer CHECK (comfort BETWEEN 1 AND 5),
  comment text,
  tags text[] NOT NULL DEFAULT '{}',
  reviewer_name text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'flagged', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_operator_idx ON public.reviews (operator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_user_idx ON public.reviews (user_id);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_review_booking(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.trips t ON t.id = b.trip_id
    WHERE b.id = p_booking_id
      AND b.user_id = auth.uid()
      AND b.status <> 'cancelled'
      AND t.arrive_at < now()
  )
$$;

CREATE POLICY "reviews public read" ON public.reviews
  FOR SELECT TO anon, authenticated USING (status = 'published' OR user_id = auth.uid());

CREATE POLICY "reviews staff read" ON public.reviews
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "verified travellers insert reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.can_review_booking(booking_id));

CREATE POLICY "travellers update own reviews" ON public.reviews
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "travellers delete own reviews" ON public.reviews
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "admins moderate reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.refresh_operator_reputation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator uuid := COALESCE(NEW.operator_id, OLD.operator_id);
  v_avg numeric;
  v_count integer;
  v_verified boolean;
BEGIN
  IF v_operator IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT AVG(rating), COUNT(*) INTO v_avg, v_count
  FROM public.reviews
  WHERE operator_id = v_operator AND status = 'published';

  SELECT verified INTO v_verified FROM public.operators WHERE id = v_operator;

  UPDATE public.operators
  SET rating = COALESCE(ROUND(v_avg::numeric, 1), rating),
      review_count = COALESCE(v_count, 0),
      trust_score = LEAST(
        99.0,
        ROUND(
          COALESCE(v_avg, 4.0) * 16
          + LEAST(COALESCE(v_count, 0), 50) * 0.3
          + CASE WHEN COALESCE(v_verified, false) THEN 8 ELSE 0 END,
          1
        )
      )
  WHERE id = v_operator;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS reviews_reputation ON public.reviews;
CREATE TRIGGER reviews_reputation
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_operator_reputation();

UPDATE public.operators
SET trust_score = LEAST(99.0, ROUND(rating * 16 + CASE WHEN verified THEN 8 ELSE 0 END, 1))
WHERE review_count = 0;