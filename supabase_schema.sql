-- ArcticLogistics - Database Schema (Supabase/PostgreSQL)

-- 1. Enums (Check if they exist before creating)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_profile') THEN
        CREATE TYPE user_profile AS ENUM ('USER', 'CLIENTE', 'FUNCIONARIO', 'ADMIN', 'SUPER_ADMIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'IN_DELIVERY', 'DELIVERED', 'CANCELED');
    END IF;
END $$;

-- 2. Profiles Table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  empresa TEXT,
  setor TEXT,
  tax_id TEXT,
  endereco TEXT,
  cidade TEXT,
  perfil user_profile DEFAULT 'CLIENTE',
  status user_status DEFAULT 'PENDING',
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  quantidade_kg NUMERIC NOT NULL CHECK (quantidade_kg > 0),
  data_solicitada DATE NOT NULL,
  local_entrega TEXT NOT NULL,
  observacoes TEXT,
  status order_status DEFAULT 'PENDING',
  assigned_to UUID REFERENCES profiles(id),
  is_recurring BOOLEAN DEFAULT FALSE,
  frequency TEXT,
  
  -- Status Timestamps
  confirmed_at TIMESTAMPTZ,
  in_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Order History Table (Keeping it for audit, but using columns in orders for quick access)
CREATE TABLE IF NOT EXISTS order_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  status order_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  observacao TEXT
);

-- 5. Companies Table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tax_id TEXT UNIQUE,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Staff Assignments (Responsibility)
CREATE TABLE IF NOT EXISTS staff_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, company_id)
);

-- 7. Staff Schedules
CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, day_of_week)
);

-- Update profiles to link to companies
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- 8. Helper Functions to break RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND perfil IN ('ADMIN', 'SUPER_ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND perfil = 'SUPER_ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_active()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;

-- Companies Policies
DROP POLICY IF EXISTS "Admins can manage companies" ON companies;
CREATE POLICY "Admins can manage companies" ON companies
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users can view their own company" ON companies;
CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = companies.id
    ) OR is_admin()
  );

-- Staff Assignments Policies
DROP POLICY IF EXISTS "Admins can manage staff assignments" ON staff_assignments;
CREATE POLICY "Admins can manage staff assignments" ON staff_assignments
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Staff can view their own assignments" ON staff_assignments;
CREATE POLICY "Staff can view their own assignments" ON staff_assignments
  FOR SELECT USING (staff_id = auth.uid() OR is_admin());

-- Staff Schedules Policies
DROP POLICY IF EXISTS "Admins can manage staff schedules" ON staff_schedules;
CREATE POLICY "Admins can manage staff schedules" ON staff_schedules
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Staff can view their own schedule" ON staff_schedules;
CREATE POLICY "Staff can view their own schedule" ON staff_schedules
  FOR SELECT USING (staff_id = auth.uid() OR is_admin());

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (is_admin());

-- Orders Policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (
    auth.uid() = user_id OR 
    is_admin() OR 
    auth.uid() = assigned_to
  );

DROP POLICY IF EXISTS "Users can create orders if ACTIVE" ON orders;
CREATE POLICY "Users can create orders if ACTIVE" ON orders
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id AND is_active()) OR is_admin()
  );

DROP POLICY IF EXISTS "Admins and Assigned Employees can update orders" ON orders;
CREATE POLICY "Admins and Assigned Employees can update orders" ON orders
  FOR UPDATE USING (
    is_admin() OR auth.uid() = assigned_to OR (auth.uid() = user_id AND status = 'PENDING')
  );

-- Order History Policies
DROP POLICY IF EXISTS "Users can view history of their own orders" ON order_history;
CREATE POLICY "Users can view history of their own orders" ON order_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE id = order_id AND (user_id = auth.uid() OR assigned_to = auth.uid())
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "Admins can view all history" ON order_history;
CREATE POLICY "Admins can view all history" ON order_history
  FOR SELECT USING (is_admin());

-- 7. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- 7. Trigger for automatic profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, status, perfil, empresa)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Usuário'), 
    NEW.email, 
    CASE 
      WHEN NEW.email = 'jpstefanon@gmail.com' THEN 'ACTIVE'::user_status
      ELSE 'PENDING'::user_status
    END, 
    CASE 
      WHEN NEW.email = 'jpstefanon@gmail.com' THEN 'SUPER_ADMIN'::user_profile
      ELSE 'CLIENTE'::user_profile
    END,
    NEW.raw_user_meta_data->>'company_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    empresa = EXCLUDED.empresa;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Return NEW to allow auth signup to succeed even if profile creation fails
  -- The frontend /complete-profile page has a fallback to create the profile
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
