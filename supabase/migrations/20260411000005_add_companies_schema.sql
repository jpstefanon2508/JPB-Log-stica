-- Criar a tabela de empresas (se não existir)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tax_id TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionar o `company_id` à tabela de profiles, caso não exista
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Ativar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS de Companies

-- 1. Qualquer usuário autenticado pode ler a lista de empresas (necessário pro Dropdown)
DROP POLICY IF EXISTS "Qualquer logado le empresas" ON public.companies;
CREATE POLICY "Qualquer logado le empresas" ON public.companies
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Clientes na tela de Onboarding podem criar empresas caso elas não existam (necessário pro formulário de Perfil Completo)
DROP POLICY IF EXISTS "Clientes inserem propria empresa" ON public.companies;
CREATE POLICY "Clientes inserem propria empresa" ON public.companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Funcionario Administrador tem acesso total
DROP POLICY IF EXISTS "Admins editam empresas" ON public.companies;
CREATE POLICY "Admins editam empresas" ON public.companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND perfil IN ('ADMIN', 'SUPER_ADMIN')
    )
  );
