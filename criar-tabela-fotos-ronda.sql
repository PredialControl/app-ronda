-- Script para criar/corrigir a tabela fotos_ronda
-- Execute este script no Supabase SQL Editor

-- Criar tabela fotos_ronda se não existir
CREATE TABLE IF NOT EXISTS fotos_ronda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ronda_id UUID NOT NULL,
    foto TEXT,
    local TEXT,
    pendencia TEXT,
    especialidade TEXT,
    responsavel TEXT DEFAULT 'CONDOMÍNIO',
    observacoes TEXT,
    data DATE,
    hora TIME,
    criticidade TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna created_at se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fotos_ronda' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE fotos_ronda 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Adicionar coluna updated_at se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fotos_ronda' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE fotos_ronda 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_fotos_ronda_ronda_id ON fotos_ronda(ronda_id);

-- Adicionar RLS (Row Level Security) se necessário
ALTER TABLE fotos_ronda ENABLE ROW LEVEL SECURITY;

-- Política básica de RLS (ajuste conforme necessário)
CREATE POLICY IF NOT EXISTS "fotos_ronda_policy" ON fotos_ronda
    FOR ALL USING (true);

-- Verificar estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'fotos_ronda'
AND table_schema = 'public'
ORDER BY ordinal_position;













