-- Migração: Adicionar "Teste Hidrostático de Extintores" em todos os contratos existentes
-- Data: 2025-12-03

-- Inserir o laudo "Teste Hidrostático de Extintores" para todos os contratos que ainda não o possuem
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

-- Verificar quantos laudos foram adicionados
SELECT 
    COUNT(*) as total_laudos_adicionados
FROM laudos
WHERE titulo = 'Teste Hidrostático de Extintores';
