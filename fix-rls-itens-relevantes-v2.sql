-- ============================================
-- FIX: Políticas RLS para itens_relevantes_relatorio
-- ============================================

-- 1. Desabilitar RLS temporariamente
ALTER TABLE public.itens_relevantes_relatorio DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes (ignorando erros se não existirem)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Permitir leitura de itens relevantes" ON public.itens_relevantes_relatorio;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Permitir inserção de itens relevantes" ON public.itens_relevantes_relatorio;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Permitir atualização de itens relevantes" ON public.itens_relevantes_relatorio;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Permitir exclusão de itens relevantes" ON public.itens_relevantes_relatorio;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Habilitar RLS
ALTER TABLE public.itens_relevantes_relatorio ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas permissivas para usuários autenticados
CREATE POLICY "Permitir leitura de itens relevantes"
  ON public.itens_relevantes_relatorio
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir inserção de itens relevantes"
  ON public.itens_relevantes_relatorio
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de itens relevantes"
  ON public.itens_relevantes_relatorio
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão de itens relevantes"
  ON public.itens_relevantes_relatorio
  FOR DELETE
  TO authenticated
  USING (true);

-- 5. Verificação
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'itens_relevantes_relatorio'
ORDER BY policyname;
