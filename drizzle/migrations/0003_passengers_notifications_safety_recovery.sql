-- Saved passengers
CREATE TABLE public.saved_passengers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  age integer NOT NULL DEFAULT 25,
  gender text NOT NULL DEFAULT 'male',
  relation text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_passengers TO authenticated;
GRANT ALL ON public.saved_passengers TO service_role;
ALTER TABLE public.saved_passengers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own passengers" ON public.saved_passengers FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Emergency contacts
CREATE TABLE public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  phone text NOT NULL,
  relation text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contacts" ON public.emergency_contacts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  booking_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Safety reports
CREATE TABLE public.safety_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  booking_id uuid,
  category text NOT NULL DEFAULT 'other',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.safety_reports TO authenticated;
GRANT ALL ON public.safety_reports TO service_role;
ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own safety reports insert" ON public.safety_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own safety reports read" ON public.safety_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- Support tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  booking_id uuid,
  kind text NOT NULL DEFAULT 'general',
  subject text NOT NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own support insert" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own support read" ON public.support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- Payment attempts / recovery
CREATE TABLE public.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  seats text[] NOT NULL,
  passengers jsonb NOT NULL DEFAULT '[]'::jsonb,
  boarding_point text NOT NULL DEFAULT '',
  dropping_point text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  payment_method text NOT NULL DEFAULT 'UPI',
  use_wallet boolean NOT NULL DEFAULT false,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 1,
  last_error text NOT NULL DEFAULT '',
  booking_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payment_attempts_user_idx ON public.payment_attempts (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.payment_attempts TO authenticated;
GRANT ALL ON public.payment_attempts TO service_role;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts read" ON public.payment_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own attempts insert" ON public.payment_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own attempts update" ON public.payment_attempts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Notify on booking events
CREATE OR REPLACE FUNCTION public.notify_booking_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, kind, title, body, booking_id)
    VALUES (NEW.user_id, 'booking', 'Booking confirmed · ' || NEW.pnr,
      'Your seats ' || array_to_string(NEW.seats, ', ') || ' are confirmed. Boarding at ' || coalesce(NEW.boarding_point, '-') || '.',
      NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    INSERT INTO public.notifications (user_id, kind, title, body, booking_id)
    VALUES (NEW.user_id, 'refund', 'Ticket cancelled · ' || NEW.pnr,
      CASE WHEN NEW.refund_amount > 0
        THEN 'Refund of Rs ' || NEW.refund_amount || ' credited to your NXTIXA wallet.'
        ELSE 'This ticket was not eligible for a refund.' END,
      NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_notify AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_event();