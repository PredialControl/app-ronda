-- ============================================
-- MIGRATION SCRIPT - App Ronda
-- Data: 2026-02-03
-- ============================================

-- 1. Adicionar colunas na tabela relatorios_subsecoes
ALTER TABLE relatorios_subsecoes
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'MANUAL',
ADD COLUMN IF NOT EXISTS fotos_constatacao TEXT[],
ADD COLUMN IF NOT EXISTS descricao_constatacao TEXT;

-- 2. Adicionar colunas na tabela relatorios_pendencias
ALTER TABLE relatorios_pendencias
ADD COLUMN IF NOT EXISTS data_recebimento TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDENTE';

-- 3. Adicionar colunas na tabela pareceres_tecnicos
ALTER TABLE pareceres_tecnicos
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'NAO_EXECUTADO',
ADD COLUMN IF NOT EXISTS arquivo_word_url TEXT,
ADD COLUMN IF NOT EXISTS arquivo_word_nome TEXT;

-- ============================================
-- Verificar se as colunas foram criadas
-- ============================================
-- Execute isso depois para confirmar:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'relatorios_subsecoes';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'relatorios_pendencias';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pareceres_tecnicos';
