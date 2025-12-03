-- Migração: Criar tabela laudos e adicionar "Teste Hidrostático de Extintores"
-- Data: 2025-12-03

-- 1. Criar tabela laudos (se não existir)
CREATE TABLE IF NOT EXISTS laudos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('em-dia', 'proximo-vencimento', 'vencidos')),
    data_vencimento DATE,
    data_emissao DATE,
    periodicidade TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_laudos_contrato_id ON laudos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_laudos_status ON laudos(status);

-- 3. Inserir o laudo "Teste Hidrostático de Extintores" para todos os contratos que ainda não o possuem
INSERT INTO laudos (contrato_id, titulo, periodicidade, status, data_vencimento)
SELECT 
    c.id as contrato_id,
    'Teste Hidrostático de Extintores' as titulo,
    'A cada 5 anos' as periodicidade,
    'vencidos' as status,
    CURRENT_DATE - INTERVAL '1 day' as data_vencimento
FROM contratos c
WHERE NOT EXISTS (
    SELECT 1 
    FROM laudos l 
    WHERE l.contrato_id = c.id 
    AND l.titulo = 'Teste Hidrostático de Extintores'
);

-- 4. Verificar quantos laudos foram adicionados
SELECT 
    COUNT(*) as total_laudos_adicionados
FROM laudos
WHERE titulo = 'Teste Hidrostático de Extintores';
