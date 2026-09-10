CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ta text NOT NULL DEFAULT '',
  aliases text[] NOT NULL DEFAULT '{}',
  district text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT 'Tamil Nadu',
  kind text NOT NULL DEFAULT 'city',
  lat numeric,
  lng numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX locations_name_en_key ON public.locations (lower(name_en));
CREATE INDEX locations_active_idx ON public.locations (is_active);

GRANT SELECT ON public.locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO authenticated;
GRANT ALL ON public.locations TO service_role;

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations public read" ON public.locations
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "staff insert locations" ON public.locations
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "staff update locations" ON public.locations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "admins delete locations" ON public.locations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.location_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_ta text NOT NULL DEFAULT '',
  point_type text NOT NULL DEFAULT 'both',
  landmark text NOT NULL DEFAULT '',
  lat numeric,
  lng numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX location_points_location_idx ON public.location_points (location_id);

GRANT SELECT ON public.location_points TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.location_points TO authenticated;
GRANT ALL ON public.location_points TO service_role;

ALTER TABLE public.location_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "points public read" ON public.location_points
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "staff insert points" ON public.location_points
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "staff update points" ON public.location_points
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "admins delete points" ON public.location_points
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS from_location_id uuid REFERENCES public.locations(id);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS to_location_id uuid REFERENCES public.locations(id);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS bus_number text NOT NULL DEFAULT '';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS ac boolean NOT NULL DEFAULT true;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS berth_type text NOT NULL DEFAULT 'seater';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS cancellation_policy text NOT NULL DEFAULT '90% refund up to 24h before departure, 70% up to 6h, 50% up to 1h.';

CREATE INDEX IF NOT EXISTS trips_route_date_idx ON public.trips (lower(from_city), lower(to_city), depart_at);
