-- ============================================
-- FIX COMPLETO: Permissões e RLS para itens_relevantes_relatorio
-- ============================================

-- 1. GRANT de permissões básicas para authenticated e anon
GRANT ALL ON public.itens_relevantes_relatorio TO authenticated;
GRANT ALL ON public.itens_relevantes_relatorio TO anon;

-- 2. Desabilitar RLS temporariamente
ALTER TABLE public.itens_relevantes_relatorio DISABLE ROW LEVEL SECURITY;

-- 3. Remover todas as políticas existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'itens_relevantes_relatorio') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.itens_relevantes_relatorio';
    END LOOP;
END $$;

-- 4. Habilitar RLS novamente
ALTER TABLE public.itens_relevantes_relatorio ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas permissivas
CREATE POLICY "Permitir tudo para authenticated"
  ON public.itens_relevantes_relatorio
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir tudo para anon"
  ON public.itens_relevantes_relatorio
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 6. Verificação final
SELECT 'GRANTS:' as tipo;
SELECT
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'itens_relevantes_relatorio';

SELECT 'POLICIES:' as tipo;
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'itens_relevantes_relatorio'
ORDER BY policyname;
