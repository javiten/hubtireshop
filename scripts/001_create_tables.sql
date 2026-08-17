-- Create shop_customers table
CREATE TABLE IF NOT EXISTS public.shop_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create shop_vehicle_checkins table
CREATE TABLE IF NOT EXISTS public.shop_vehicle_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.shop_customers(id) ON DELETE CASCADE,
  vin TEXT,
  mileage TEXT,
  year TEXT,
  make TEXT,
  model TEXT,
  trim TEXT,
  license_plate TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.shop_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_vehicle_checkins ENABLE ROW LEVEL SECURITY;

-- Allow anon inserts for check-in flow (public tablet)
CREATE POLICY "anon_insert_customers" ON public.shop_customers
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_insert_checkins" ON public.shop_vehicle_checkins
  FOR INSERT TO anon WITH CHECK (true);

-- Allow service_role full access (admin dashboard)
CREATE POLICY "service_role_all_customers" ON public.shop_customers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_checkins" ON public.shop_vehicle_checkins
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow anon to read back the customer they just inserted (needed for getting customer_id)
CREATE POLICY "anon_select_customers" ON public.shop_customers
  FOR SELECT TO anon USING (true);
