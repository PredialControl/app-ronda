-- =========================================
-- FIX: Corrigir RLS para Parecer Técnico
-- =========================================
-- Problema: As políticas RLS exigem autenticação mas o app usa acesso anônimo
-- Solução: Alterar políticas para permitir acesso público

-- 1. REMOVER POLÍTICAS ANTIGAS
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON pareceres_tecnicos;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON parecer_topicos;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON parecer_imagens;

-- 2. CRIAR POLÍTICAS PÚBLICAS PARA PARECERES_TECNICOS
CREATE POLICY "Public Access - SELECT"
  ON pareceres_tecnicos FOR SELECT
  USING (true);

CREATE POLICY "Public Access - INSERT"
  ON pareceres_tecnicos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public Access - UPDATE"
  ON pareceres_tecnicos FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public Access - DELETE"
  ON pareceres_tecnicos FOR DELETE
  USING (true);

-- 3. CRIAR POLÍTICAS PÚBLICAS PARA PARECER_TOPICOS
CREATE POLICY "Public Access - SELECT"
  ON parecer_topicos FOR SELECT
  USING (true);

CREATE POLICY "Public Access - INSERT"
  ON parecer_topicos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public Access - UPDATE"
  ON parecer_topicos FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public Access - DELETE"
  ON parecer_topicos FOR DELETE
  USING (true);

-- 4. CRIAR POLÍTICAS PÚBLICAS PARA PARECER_IMAGENS
CREATE POLICY "Public Access - SELECT"
  ON parecer_imagens FOR SELECT
  USING (true);

CREATE POLICY "Public Access - INSERT"
  ON parecer_imagens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public Access - UPDATE"
  ON parecer_imagens FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public Access - DELETE"
  ON parecer_imagens FOR DELETE
  USING (true);

-- 5. GARANTIR QUE RLS ESTÁ HABILITADO
ALTER TABLE pareceres_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parecer_topicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parecer_imagens ENABLE ROW LEVEL SECURITY;

-- 6. VERIFICAR POLÍTICAS CRIADAS
SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('pareceres_tecnicos', 'parecer_topicos', 'parecer_imagens')
ORDER BY tablename, policyname;

-- 7. ADICIONAR CAPA_URL SE NÃO EXISTIR
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pareceres_tecnicos'
        AND column_name = 'capa_url'
    ) THEN
        ALTER TABLE pareceres_tecnicos ADD COLUMN capa_url TEXT;
        COMMENT ON COLUMN pareceres_tecnicos.capa_url IS 'URL da imagem de capa personalizada do parecer';
    END IF;
END $$;

-- Mensagem de sucesso
SELECT '✅ Políticas RLS corrigidas! Agora o parecer técnico deve salvar normalmente.' as resultado;
