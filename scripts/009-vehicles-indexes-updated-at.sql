-- Add updated_at column to vehicles if missing
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add notes column to vehicles if missing
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS vehicles_updated_at ON public.vehicles;
CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Case-insensitive unique index on VIN (when not null/empty)
DROP INDEX IF EXISTS idx_vehicles_vin_unique;
CREATE UNIQUE INDEX idx_vehicles_vin_unique
  ON public.vehicles (lower(vin))
  WHERE vin IS NOT NULL AND vin <> '';

-- Case-insensitive unique index on license_plate (when not null/empty)
DROP INDEX IF EXISTS idx_vehicles_plate_unique;
CREATE UNIQUE INDEX idx_vehicles_plate_unique
  ON public.vehicles (lower(license_plate))
  WHERE license_plate IS NOT NULL AND license_plate <> '';

-- Add index on check_ins(vehicle_id) if not exists
CREATE INDEX IF NOT EXISTS idx_check_ins_vehicle_id
  ON public.check_ins (vehicle_id);

-- Ensure RLS is enabled on vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Add anon update policy for vehicles (needed for checkin flow)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'anon_update_vehicles'
  ) THEN
    CREATE POLICY anon_update_vehicles ON public.vehicles
      FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
