-- 1. Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  token_number text UNIQUE NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  appointment_date timestamp WITH time zone DEFAULT (now() + interval '1 day'),
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create hospital_inventory table
CREATE TABLE IF NOT EXISTS public.hospital_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE,
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE CASCADE,
  quantity int DEFAULT 1,
  acquisition_date timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add budget to management_profiles
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='management_profiles' AND column_name='budget') THEN
    ALTER TABLE public.management_profiles ADD COLUMN budget decimal(12,2) DEFAULT 50000.00;
  END IF;
END $$;

-- 4. Update reviews to support token validation
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='token_number') THEN
    ALTER TABLE public.reviews ADD COLUMN token_number text;
  END IF;
END $$;

-- 5. Enable RLS on new tables
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Appointments viewable" ON public.appointments;
CREATE POLICY "Appointments viewable" ON public.appointments
FOR SELECT USING (
  auth.uid() = user_id OR 
  auth.uid() IN (SELECT id FROM admin_profiles) OR
  auth.uid() IN (SELECT id FROM management_profiles WHERE hospital_id = appointments.hospital_id)
);

DROP POLICY IF EXISTS "Inventory viewable" ON public.hospital_inventory;
CREATE POLICY "Inventory viewable" ON public.hospital_inventory
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM admin_profiles) OR
  auth.uid() IN (SELECT id FROM management_profiles WHERE hospital_id = hospital_inventory.hospital_id)
);

-- Seed initial data
INSERT INTO public.appointments (hospital_id, user_id, token_number, status)
SELECT id, (SELECT id FROM user_profiles LIMIT 1), 'MC-TOKEN-001', 'completed' FROM hospitals LIMIT 1
ON CONFLICT (token_number) DO NOTHING;

INSERT INTO public.hospital_inventory (hospital_id, equipment_id, quantity)
SELECT h.id, e.id, 1 FROM hospitals h, equipment e LIMIT 5
ON CONFLICT DO NOTHING;
