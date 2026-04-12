-- Update Enums
ALTER TYPE user_profile ADD VALUE IF NOT EXISTS 'CLIENTE';
ALTER TYPE user_profile ADD VALUE IF NOT EXISTS 'FUNCIONARIO';

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'IN_DELIVERY';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'DELIVERED';

-- Update Orders Table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS frequency TEXT; -- e.g., 'WEEKLY'

-- Update RLS Policies for the new roles
-- 1. Helper for Employee check
CREATE OR REPLACE FUNCTION public.is_funcionario()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND perfil = 'FUNCIONARIO'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Orders Policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to OR 
    is_admin()
  );

DROP POLICY IF EXISTS "Employees can update assigned orders" ON orders;
CREATE POLICY "Employees can update assigned orders" ON orders
  FOR UPDATE USING (
    auth.uid() = assigned_to OR is_admin()
  );

-- 3. Update Profile Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR is_admin()
  );
