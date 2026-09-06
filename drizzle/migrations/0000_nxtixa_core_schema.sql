
-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'phone')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- OPERATORS
CREATE TABLE public.operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rating numeric(2,1) NOT NULL DEFAULT 4.2,
  verified boolean NOT NULL DEFAULT true,
  total_trips integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.operators TO anon;
GRANT SELECT ON public.operators TO authenticated;
GRANT ALL ON public.operators TO service_role;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operators public read" ON public.operators FOR SELECT TO anon, authenticated USING (true);

-- TRIPS
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
  from_city text NOT NULL,
  to_city text NOT NULL,
  depart_at timestamptz NOT NULL,
  arrive_at timestamptz NOT NULL,
  bus_type text NOT NULL,
  total_seats integer NOT NULL DEFAULT 36,
  booked_seats text[] NOT NULL DEFAULT '{}',
  fare numeric(10,2) NOT NULL,
  rating numeric(2,1) NOT NULL DEFAULT 4.3,
  amenities text[] NOT NULL DEFAULT '{}',
  boarding_points text[] NOT NULL DEFAULT '{}',
  dropping_points text[] NOT NULL DEFAULT '{}',
  women_safe boolean NOT NULL DEFAULT true,
  live_tracking boolean NOT NULL DEFAULT true,
  demand_level text NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX trips_search_idx ON public.trips (from_city, to_city, depart_at);
GRANT SELECT ON public.trips TO anon;
GRANT SELECT ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trips public read" ON public.trips FOR SELECT TO anon, authenticated USING (true);

-- BOOKINGS
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  pnr text NOT NULL DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  seats text[] NOT NULL,
  passengers jsonb NOT NULL DEFAULT '[]'::jsonb,
  boarding_point text,
  dropping_point text,
  contact_email text,
  contact_phone text,
  total_amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL DEFAULT 'upi',
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bookings select" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own bookings insert" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own bookings update" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- keep trip seat map in sync
CREATE OR REPLACE FUNCTION public.sync_trip_seats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.trips SET booked_seats = ARRAY(SELECT DISTINCT unnest(booked_seats || NEW.seats)) WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.trips SET booked_seats = ARRAY(SELECT s FROM unnest(booked_seats) s WHERE NOT (s = ANY(NEW.seats))) WHERE id = NEW.trip_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER bookings_sync_seats AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_trip_seats();

-- seat validation: reject already booked seats
CREATE OR REPLACE FUNCTION public.validate_seats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE taken text[];
BEGIN
  SELECT booked_seats INTO taken FROM public.trips WHERE id = NEW.trip_id;
  IF EXISTS (SELECT 1 FROM unnest(NEW.seats) s WHERE s = ANY(taken)) THEN
    RAISE EXCEPTION 'One or more selected seats are no longer available';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER bookings_validate_seats BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_seats();

-- DEMO DATA
INSERT INTO public.operators (id, name, rating, verified, total_trips) VALUES
  ('11111111-1111-1111-1111-111111111101', 'KPN Travels', 4.6, true, 18420),
  ('11111111-1111-1111-1111-111111111102', 'SRM Transports', 4.4, true, 15230),
  ('11111111-1111-1111-1111-111111111103', 'Parveen Travels', 4.5, true, 21100),
  ('11111111-1111-1111-1111-111111111104', 'YBM Travels', 4.2, true, 9870),
  ('11111111-1111-1111-1111-111111111105', 'Rathimeena Travels', 4.3, true, 12450),
  ('11111111-1111-1111-1111-111111111106', 'Jabbar Travels', 4.1, true, 7640);

INSERT INTO public.trips (operator_id, from_city, to_city, depart_at, arrive_at, bus_type, total_seats, fare, rating, amenities, boarding_points, dropping_points, demand_level)
SELECT
  o.id,
  r.from_city,
  r.to_city,
  (current_date + d)::timestamptz + (t.hour || ' hours')::interval,
  (current_date + d)::timestamptz + (t.hour || ' hours')::interval + (r.duration || ' hours')::interval,
  t.bus_type,
  36,
  round(r.base_fare * t.fare_mult),
  4.0 + ((t.hour % 5) * 0.2),
  t.amenities,
  r.boarding,
  r.dropping,
  CASE WHEN t.hour >= 21 THEN 'high' WHEN t.hour >= 14 THEN 'medium' ELSE 'low' END
FROM generate_series(0, 13) AS d,
  (VALUES
    ('Chennai', 'Coimbatore', 8, 750, ARRAY['CMBT Koyambedu','Guindy','Vadapalani'], ARRAY['Gandhipuram','Ukkadam','Singanallur']),
    ('Chennai', 'Madurai', 9, 800, ARRAY['CMBT Koyambedu','Tambaram','Guindy'], ARRAY['Mattuthavani','Periyar','Arappalayam']),
    ('Coimbatore', 'Chennai', 8, 750, ARRAY['Gandhipuram','Ukkadam'], ARRAY['CMBT Koyambedu','Guindy']),
    ('Bangalore', 'Chennai', 7, 700, ARRAY['Madiwala','Electronic City','Hebbal'], ARRAY['CMBT Koyambedu','Perungalathur']),
    ('Chennai', 'Bangalore', 7, 700, ARRAY['CMBT Koyambedu','Vadapalani'], ARRAY['Madiwala','Kalasipalyam']),
    ('Madurai', 'Chennai', 9, 800, ARRAY['Mattuthavani','Arappalayam'], ARRAY['CMBT Koyambedu','Tambaram']),
    ('Chennai', 'Tirunelveli', 11, 950, ARRAY['CMBT Koyambedu','Tambaram'], ARRAY['New Bus Stand','Palayamkottai']),
    ('Chennai', 'Trichy', 6, 620, ARRAY['CMBT Koyambedu','Guindy'], ARRAY['Chatram Bus Stand','Thillai Nagar'])
  ) AS r(from_city, to_city, duration, base_fare, boarding, dropping),
  (VALUES
    (6, 'AC Seater', 0.9, ARRAY['Charging Point','Water Bottle','WiFi']),
    (14, 'AC Sleeper', 1.15, ARRAY['Blanket','Charging Point','WiFi','Live Tracking']),
    (21, 'AC Sleeper', 1.3, ARRAY['Blanket','Charging Point','WiFi','Live Tracking','CCTV']),
    (22, 'Non-AC Sleeper', 0.8, ARRAY['Charging Point','Reading Light'])
  ) AS t(hour, bus_type, fare_mult, amenities),
  (SELECT id FROM public.operators ORDER BY random() LIMIT 3) AS o(id);
