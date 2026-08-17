-- ============================================================
-- Migration 002: Normalize schema
-- Adds: vehicles, check_ins, check_in_photos tables
-- Migrates data from old flat tables to normalized ones
-- ============================================================

-- 1. Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.shop_customers(id) ON DELETE CASCADE,
  vin TEXT,
  year TEXT,
  make TEXT,
  model TEXT,
  trim TEXT,
  license_plate TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create check_ins table
CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.shop_customers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  mileage TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create check_in_photos table
CREATE TABLE IF NOT EXISTS public.check_in_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id UUID NOT NULL REFERENCES public.check_ins(id) ON DELETE CASCADE,
  blob_url TEXT NOT NULL,
  file_name TEXT,
  content_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Add uniqueness constraints on shop_customers
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_name_unique
  ON public.shop_customers (lower(trim(first_name)), lower(trim(last_name)));

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email_unique
  ON public.shop_customers (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_unique
  ON public.shop_customers (regexp_replace(phone, '[^0-9]', '', 'g'))
  WHERE phone IS NOT NULL AND trim(phone) <> '';

-- 5. Enable RLS on new tables
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_in_photos ENABLE ROW LEVEL SECURITY;

-- 6. Anon policies (for /checkin tablet flow)
CREATE POLICY "anon_insert_vehicles" ON public.vehicles
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_vehicles" ON public.vehicles
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_check_ins" ON public.check_ins
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_insert_check_in_photos" ON public.check_in_photos
  FOR INSERT TO anon WITH CHECK (true);

-- 7. Service role full access (admin dashboard)
CREATE POLICY "service_role_all_vehicles" ON public.vehicles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_check_ins" ON public.check_ins
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_check_in_photos" ON public.check_in_photos
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8. Migrate existing data from shop_vehicle_checkins to new tables
INSERT INTO public.vehicles (customer_id, vin, year, make, model, trim, license_plate, notes, created_at)
SELECT customer_id, vin, year, make, model, trim, license_plate, null, created_at
FROM public.shop_vehicle_checkins
ON CONFLICT DO NOTHING;

-- For each old checkin, create a matching check_in record
-- We match by customer_id + created_at to find the vehicle we just created
INSERT INTO public.check_ins (customer_id, vehicle_id, mileage, notes, created_at)
SELECT
  svc.customer_id,
  v.id,
  svc.mileage,
  svc.notes,
  svc.created_at
FROM public.shop_vehicle_checkins svc
JOIN public.vehicles v
  ON v.customer_id = svc.customer_id
  AND v.created_at = svc.created_at
ON CONFLICT DO NOTHING;
