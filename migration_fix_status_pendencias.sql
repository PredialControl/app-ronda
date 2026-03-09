-- ============================================
-- FIX COMPLETO: Garantir TODAS as colunas na tabela relatorio_pendencias
-- RODE ESTE SCRIPT NO SQL EDITOR DO SUPABASE
-- ============================================

-- 1. foto_depois_url (foto do depois / corrigido)
ALTER TABLE relatorio_pendencias
ADD COLUMN IF NOT EXISTS foto_depois_url TEXT;

-- 2. status (PENDENTE / RECEBIDO / NAO_FARAO)
ALTER TABLE relatorio_pendencias
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDENTE';

-- 3. data_recebimento (data que marcou como recebido)
ALTER TABLE relatorio_pendencias
ADD COLUMN IF NOT EXISTS data_recebimento TEXT;

-- 4. subsecao_id (referência à subseção)
ALTER TABLE relatorio_pendencias
ADD COLUMN IF NOT EXISTS subsecao_id UUID REFERENCES relatorio_subsecoes(id) ON DELETE CASCADE;

-- 5. Tornar subtitulo opcional na tabela relatorio_secoes
ALTER TABLE relatorio_secoes
ALTER COLUMN subtitulo DROP NOT NULL;

-- ============================================
-- VERIFICAR se tudo foi criado:
-- ============================================
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'relatorio_pendencias' ORDER BY ordinal_position;
