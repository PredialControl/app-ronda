-- ============================================================
-- Migração: adicionar colunas que faltam na tabela rondas
-- Causa do erro 500 ao buscar rondas (/rest/v1/rondas select=...)
-- Execute no SQL Editor do Supabase — UMA VEZ
-- ============================================================

-- Adicionar colunas se não existirem (ADD COLUMN IF NOT EXISTS é idempotente)
ALTER TABLE rondas ADD COLUMN IF NOT EXISTS tipo_visita VARCHAR(50) DEFAULT 'RONDA';
ALTER TABLE rondas ADD COLUMN IF NOT EXISTS template_ronda VARCHAR(50);
ALTER TABLE rondas ADD COLUMN IF NOT EXISTS roteiro JSONB DEFAULT '[]'::jsonb;
ALTER TABLE rondas ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '[]'::jsonb;

-- Backfill em registros que existiam antes dessas colunas
UPDATE rondas SET tipo_visita = 'RONDA' WHERE tipo_visita IS NULL;

-- Verificação — lista TODAS as colunas da tabela rondas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'rondas'
ORDER BY ordinal_position;
