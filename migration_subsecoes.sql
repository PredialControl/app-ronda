-- ========================================
-- MIGRATION: Adicionar Subseções ao Relatório
-- Data: 2026-01-05
-- Descrição: Permite criar seções com subseções (VIII.1A, VIII.1B, etc.)
-- ========================================

-- 1. Adicionar campo tem_subsecoes na tabela relatorio_secoes
ALTER TABLE relatorio_secoes
ADD COLUMN tem_subsecoes BOOLEAN DEFAULT FALSE;

-- 2. Criar tabela relatorio_subsecoes
CREATE TABLE IF NOT EXISTS relatorio_subsecoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    secao_id UUID NOT NULL REFERENCES relatorio_secoes(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL DEFAULT 0,
    titulo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Adicionar campo subsecao_id na tabela relatorio_pendencias
ALTER TABLE relatorio_pendencias
ADD COLUMN subsecao_id UUID REFERENCES relatorio_subsecoes(id) ON DELETE CASCADE;

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_relatorio_subsecoes_secao_id ON relatorio_subsecoes(secao_id);
CREATE INDEX IF NOT EXISTS idx_relatorio_subsecoes_ordem ON relatorio_subsecoes(ordem);
CREATE INDEX IF NOT EXISTS idx_relatorio_pendencias_subsecao_id ON relatorio_pendencias(subsecao_id);

-- 5. Comentários para documentação
COMMENT ON TABLE relatorio_subsecoes IS 'Subseções de uma seção de relatório (ex: VIII.1A, VIII.1B)';
COMMENT ON COLUMN relatorio_secoes.tem_subsecoes IS 'Indica se a seção possui subseções (A, B, C, etc.)';
COMMENT ON COLUMN relatorio_pendencias.subsecao_id IS 'ID da subseção à qual a pendência pertence (se houver)';

-- 6. Habilitar Row Level Security (RLS) - se estiver usando Supabase
ALTER TABLE relatorio_subsecoes ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de acesso (RLS) - ajuste conforme suas regras de negócio
CREATE POLICY "Permitir SELECT em relatorio_subsecoes para usuários autenticados"
ON relatorio_subsecoes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir INSERT em relatorio_subsecoes para usuários autenticados"
ON relatorio_subsecoes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir UPDATE em relatorio_subsecoes para usuários autenticados"
ON relatorio_subsecoes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir DELETE em relatorio_subsecoes para usuários autenticados"
ON relatorio_subsecoes FOR DELETE
TO authenticated
USING (true);

-- ========================================
-- FIM DA MIGRATION
-- ========================================

-- COMO USAR:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se todas as tabelas foram criadas/alteradas corretamente
-- 3. Teste a funcionalidade na aplicação

-- ROLLBACK (se necessário):
-- DROP TABLE relatorio_subsecoes CASCADE;
-- ALTER TABLE relatorio_pendencias DROP COLUMN subsecao_id;
-- ALTER TABLE relatorio_secoes DROP COLUMN tem_subsecoes;
