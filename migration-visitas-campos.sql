-- Migration: Adicionar campos local, problema e foto_url na tabela visitas_realizadas
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna local
ALTER TABLE visitas_realizadas
ADD COLUMN IF NOT EXISTS local VARCHAR(255);

-- Adicionar coluna problema
ALTER TABLE visitas_realizadas
ADD COLUMN IF NOT EXISTS problema VARCHAR(255);

-- Adicionar coluna foto_url
ALTER TABLE visitas_realizadas
ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'visitas_realizadas'
ORDER BY ordinal_position;
