
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'operator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- bootstrap: the first signed-in user who asks becomes admin (demo convenience)
CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
    ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin() TO authenticated;

-- WALLET
CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  amount numeric(12,2) NOT NULL,
  description text NOT NULL DEFAULT '',
  booking_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wallet_tx_user_idx ON public.wallet_transactions (user_id, created_at DESC);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet transactions" ON public.wallet_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.topup_wallet(p_amount numeric, p_method text DEFAULT 'UPI')
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_balance numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF p_amount <= 0 OR p_amount > 50000 THEN RAISE EXCEPTION 'Enter an amount between 1 and 50000'; END IF;
  INSERT INTO public.wallets (user_id, balance) VALUES (auth.uid(), p_amount)
    ON CONFLICT (user_id) DO UPDATE SET balance = public.wallets.balance + p_amount, updated_at = now()
    RETURNING balance INTO new_balance;
  INSERT INTO public.wallet_transactions (user_id, kind, amount, description)
    VALUES (auth.uid(), 'topup', p_amount, 'Money added via ' || p_method);
  RETURN new_balance;
END;
$$;
GRANT EXECUTE ON FUNCTION public.topup_wallet(numeric, text) TO authenticated;

-- BOOKING EXTRAS
ALTER TABLE public.bookings ADD COLUMN wallet_amount numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN refund_status text NOT NULL DEFAULT 'none';
ALTER TABLE public.bookings ADD COLUMN refund_amount numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN cancelled_at timestamptz;

-- LIVE TRACKING STATE
ALTER TABLE public.trips ADD COLUMN trip_status text NOT NULL DEFAULT 'scheduled';
ALTER TABLE public.trips ADD COLUMN delay_mins integer NOT NULL DEFAULT 0;
ALTER TABLE public.trips ADD COLUMN tracking_note text;
ALTER TABLE public.trips ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- Admin / operator management of inventory
CREATE POLICY "staff insert trips" ON public.trips FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "staff update trips" ON public.trips FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "admins delete trips" ON public.trips FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
GRANT INSERT, UPDATE, DELETE ON public.trips TO authenticated;

CREATE POLICY "staff insert operators" ON public.operators FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "staff update operators" ON public.operators FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
GRANT INSERT, UPDATE ON public.operators TO authenticated;

CREATE POLICY "staff read bookings" ON public.bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- BOOK WITH OPTIONAL WALLET PAYMENT
CREATE OR REPLACE FUNCTION public.book_trip(
  p_trip_id uuid,
  p_seats text[],
  p_passengers jsonb,
  p_boarding text,
  p_dropping text,
  p_contact_email text,
  p_contact_phone text,
  p_payment_method text,
  p_use_wallet boolean DEFAULT false
) RETURNS public.bookings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_trip public.trips;
  v_total numeric;
  v_wallet numeric := 0;
  v_balance numeric := 0;
  v_booking public.bookings;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id FOR UPDATE;
  IF v_trip.id IS NULL THEN RAISE EXCEPTION 'Trip not found'; END IF;
  IF array_length(p_seats, 1) IS NULL THEN RAISE EXCEPTION 'Select at least one seat'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_seats) s WHERE s = ANY(v_trip.booked_seats)) THEN
    RAISE EXCEPTION 'One or more selected seats are no longer available';
  END IF;

  v_total := round(v_trip.fare * array_length(p_seats, 1) * 1.05);

  IF p_use_wallet THEN
    SELECT coalesce(balance, 0) INTO v_balance FROM public.wallets WHERE user_id = auth.uid();
    v_wallet := least(coalesce(v_balance, 0), v_total);
  END IF;

  INSERT INTO public.bookings (
    user_id, trip_id, seats, passengers, boarding_point, dropping_point,
    contact_email, contact_phone, total_amount, payment_method, wallet_amount
  ) VALUES (
    auth.uid(), p_trip_id, p_seats, p_passengers, p_boarding, p_dropping,
    p_contact_email, p_contact_phone, v_total,
    CASE WHEN v_wallet >= v_total THEN 'NXTIXA wallet' ELSE p_payment_method END,
    v_wallet
  ) RETURNING * INTO v_booking;

  IF v_wallet > 0 THEN
    UPDATE public.wallets SET balance = balance - v_wallet, updated_at = now() WHERE user_id = auth.uid();
    INSERT INTO public.wallet_transactions (user_id, kind, amount, description, booking_id)
      VALUES (auth.uid(), 'payment', -v_wallet, 'Ticket ' || v_booking.pnr, v_booking.id);
  END IF;

  RETURN v_booking;
END;
$$;
GRANT EXECUTE ON FUNCTION public.book_trip(uuid, text[], jsonb, text, text, text, text, text, boolean) TO authenticated;

-- CANCEL + INSTANT WALLET REFUND
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id uuid)
RETURNS public.bookings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_booking public.bookings;
  v_trip public.trips;
  v_hours numeric;
  v_rate numeric;
  v_refund numeric;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id AND user_id = auth.uid() FOR UPDATE;
  IF v_booking.id IS NULL THEN RAISE EXCEPTION 'Ticket not found'; END IF;
  IF v_booking.status = 'cancelled' THEN RAISE EXCEPTION 'Ticket is already cancelled'; END IF;

  SELECT * INTO v_trip FROM public.trips WHERE id = v_booking.trip_id;
  v_hours := EXTRACT(EPOCH FROM (v_trip.depart_at - now())) / 3600;
  v_rate := CASE WHEN v_hours >= 24 THEN 0.9 WHEN v_hours >= 6 THEN 0.7 WHEN v_hours >= 1 THEN 0.5 ELSE 0 END;
  v_refund := round(v_booking.total_amount * v_rate);

  UPDATE public.bookings
    SET status = 'cancelled',
        cancelled_at = now(),
        refund_amount = v_refund,
        refund_status = CASE WHEN v_refund > 0 THEN 'credited' ELSE 'not_eligible' END
    WHERE id = p_booking_id
    RETURNING * INTO v_booking;

  IF v_refund > 0 THEN
    INSERT INTO public.wallets (user_id, balance) VALUES (auth.uid(), v_refund)
      ON CONFLICT (user_id) DO UPDATE SET balance = public.wallets.balance + v_refund, updated_at = now();
    INSERT INTO public.wallet_transactions (user_id, kind, amount, description, booking_id)
      VALUES (auth.uid(), 'refund', v_refund, 'Refund for ' || v_booking.pnr, v_booking.id);
  END IF;

  RETURN v_booking;
END;
$$;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
