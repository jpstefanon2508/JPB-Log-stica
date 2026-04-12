-- Migration: Fix Signup and Validation Tracking
-- 1. Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES public.profiles(id);

-- 2. Update handle_new_user trigger to be more resilient and include company_name
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

-- 3. Re-apply the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
