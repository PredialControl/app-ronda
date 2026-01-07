-- ========================================
-- SCRIPT FORÇA CRIAÇÃO DE SUBSEÇÕES
-- ========================================

-- 1. DROPAR TABELA SE EXISTIR (cuidado: apaga dados!)
DROP TABLE IF EXISTS relatorio_subsecoes CASCADE;

-- 2. RECRIAR TABELA DO ZERO
CREATE TABLE relatorio_subsecoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    secao_id UUID NOT NULL REFERENCES relatorio_secoes(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL DEFAULT 0,
    titulo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ADICIONAR COLUNA subsecao_id EM relatorio_pendencias (se não existir)
ALTER TABLE relatorio_pendencias
DROP COLUMN IF EXISTS subsecao_id;

ALTER TABLE relatorio_pendencias
ADD COLUMN subsecao_id UUID REFERENCES relatorio_subsecoes(id) ON DELETE CASCADE;

-- 4. ADICIONAR COLUNA tem_subsecoes EM relatorio_secoes (se não existir)
ALTER TABLE relatorio_secoes
DROP COLUMN IF EXISTS tem_subsecoes;

ALTER TABLE relatorio_secoes
ADD COLUMN tem_subsecoes BOOLEAN DEFAULT FALSE;

-- 5. CRIAR ÍNDICES
DROP INDEX IF EXISTS idx_relatorio_subsecoes_secao_id;
DROP INDEX IF EXISTS idx_relatorio_subsecoes_ordem;
DROP INDEX IF EXISTS idx_relatorio_pendencias_subsecao_id;

CREATE INDEX idx_relatorio_subsecoes_secao_id ON relatorio_subsecoes(secao_id);
CREATE INDEX idx_relatorio_subsecoes_ordem ON relatorio_subsecoes(ordem);
CREATE INDEX idx_relatorio_pendencias_subsecao_id ON relatorio_pendencias(subsecao_id);

-- 6. CONFIGURAR RLS
ALTER TABLE relatorio_subsecoes ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Permitir visualização de subseções" ON relatorio_subsecoes;
DROP POLICY IF EXISTS "Permitir inserção de subseções" ON relatorio_subsecoes;
DROP POLICY IF EXISTS "Permitir atualização de subseções" ON relatorio_subsecoes;
DROP POLICY IF EXISTS "Permitir exclusão de subseções" ON relatorio_subsecoes;

-- Criar policies PERMISSIVAS
CREATE POLICY "Permitir visualização de subseções"
ON relatorio_subsecoes FOR SELECT
USING (true);

CREATE POLICY "Permitir inserção de subseções"
ON relatorio_subsecoes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir atualização de subseções"
ON relatorio_subsecoes FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir exclusão de subseções"
ON relatorio_subsecoes FOR DELETE
USING (true);

-- 7. FORÇAR RELOAD DO SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- 8. VERIFICAÇÃO FINAL
SELECT 'TABELA relatorio_subsecoes:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'relatorio_subsecoes'
ORDER BY ordinal_position;

SELECT 'TOTAL DE REGISTROS:' as info;
SELECT COUNT(*) as total FROM relatorio_subsecoes;

SELECT 'SCHEMA RELOAD ENVIADO!' as status;
