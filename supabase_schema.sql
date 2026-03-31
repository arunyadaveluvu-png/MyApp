-- MedicoCrew Refactored Database Schema (Separate Tables)

-- Drop existing monolith if exists
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.hospitals CASCADE;
DROP TABLE IF EXISTS public.equipment CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- 1. Profile Tables (Role-Specific)
CREATE TABLE public.admin_profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text,
  email text UNIQUE,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.management_profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text,
  email text UNIQUE,
  hospital_id uuid, -- Optional: Link to a specific hospital they manage
  budget decimal(15,2) DEFAULT 5000000.00,
  total_procurements int DEFAULT 0,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.user_profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text,
  email text UNIQUE,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Hospitals Table
CREATE TABLE public.hospitals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  location text,
  address text,
  phone text,
  email text,
  website text,
  description text,
  image_url text,
  management_id uuid REFERENCES public.management_profiles(id),
  beds int DEFAULT 0,
  doctors int DEFAULT 0,
  services text[],
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- New Table: Hospital Staff
CREATE TABLE public.hospital_staff (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL, -- Doctor, Nurse, Admin, etc.
  speciality text,
  email text,
  phone text,
  image_url text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Equipment Table
CREATE TABLE public.equipment (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  price decimal(10,2) NOT NULL,
  stock int DEFAULT 0,
  description text,
  supplier text,
  image_url text,
  rating decimal(2,1) DEFAULT 0.0,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Appointments Table
CREATE TABLE public.appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_date timestamp WITH time zone NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  token_number text UNIQUE NOT NULL,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Hospital Inventory Table (Purchased Equipment)
CREATE TABLE public.hospital_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE,
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  acquisition_date timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  maintenance_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Reviews Table
CREATE TABLE public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token_number text,
  equipment_quality int CHECK (equipment_quality BETWEEN 1 and 5),
  treatment_quality int CHECK (treatment_quality BETWEEN 1 and 5),
  staff_behavior int CHECK (staff_behavior BETWEEN 1 and 5),
  cleanliness int CHECK (cleanliness BETWEEN 1 and 5),
  waiting_time int CHECK (waiting_time BETWEEN 1 and 5),
  overall_rating decimal(2,1),
  review_text text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Orders Table (Marketplace Transactions)
CREATE TABLE public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id uuid REFERENCES public.hospitals(id),
  equipment_id uuid REFERENCES public.equipment(id),
  quantity int NOT NULL DEFAULT 1,
  total_price decimal(10,2) NOT NULL,
  status text DEFAULT 'pending',
  order_date timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. RLS Policies
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all admin profiles." ON admin_profiles FOR SELECT USING (true);

ALTER TABLE public.management_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Management profiles are viewable by everyone." ON management_profiles FOR SELECT USING (true);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User profiles are viewable by everyone." ON user_profiles FOR SELECT USING (true);

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hospitals are viewable by everyone." ON hospitals FOR SELECT USING (true);
CREATE POLICY "Management/Admin can update hospital." ON hospitals FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM admin_profiles) OR auth.uid() = management_id
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone." ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert reviews." ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipment is viewable by everyone." ON equipment FOR SELECT USING (true);
CREATE POLICY "Admin can manage equipment." ON equipment FOR ALL USING (
  auth.uid() IN (SELECT id FROM admin_profiles)
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable select for owners and facility managers"
ON public.appointments FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (SELECT id FROM management_profiles WHERE hospital_id = appointments.hospital_id)
);

CREATE POLICY "Enable insert for authenticated users"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable status updates for facility managers"
ON public.appointments FOR UPDATE
TO authenticated
USING (auth.uid() IN (SELECT id FROM management_profiles WHERE hospital_id = appointments.hospital_id));

ALTER TABLE public.hospital_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hospital staff is viewable by everyone." ON hospital_staff FOR SELECT USING (true);
CREATE POLICY "Management can manage their hospital staff." ON hospital_staff FOR ALL USING (
  auth.uid() IN (SELECT id FROM management_profiles WHERE hospital_id = hospital_staff.hospital_id)
);

-- 9. Automated Profile Branching Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_hosp_id uuid;
BEGIN
  IF (new.raw_user_meta_data->>'role') = 'admin' THEN
    INSERT INTO public.admin_profiles (id, full_name, email)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  ELSIF (new.raw_user_meta_data->>'role') = 'management' THEN
    -- Check if we need to create a new hospital
    IF new.raw_user_meta_data->>'hospital_name' IS NOT NULL THEN
      INSERT INTO public.hospitals (name, management_id)
      VALUES (new.raw_user_meta_data->>'hospital_name', new.id)
      RETURNING id INTO new_hosp_id;
    ELSE
      new_hosp_id := (new.raw_user_meta_data->>'hospital_id')::uuid;
    END IF;

    INSERT INTO public.management_profiles (id, full_name, email, hospital_id)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, new_hosp_id);
    
    -- Update hospital management_id if it was just linked (existing hospital case)
    IF new.raw_user_meta_data->>'hospital_id' IS NOT NULL THEN
      UPDATE public.hospitals SET management_id = new.id WHERE id = new_hosp_id;
    END IF;
  ELSE
    INSERT INTO public.user_profiles (id, full_name, email)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
