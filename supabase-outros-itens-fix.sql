-- Script para verificar e corrigir a tabela outros_itens_corrigidos
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar a estrutura atual da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'outros_itens_corrigidos'
ORDER BY ordinal_position;

-- 2. Verificar se a tabela existe e suas constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'outros_itens_corrigidos';

-- 3. Se necessário, recriar a tabela com a estrutura correta
-- (Execute apenas se houver problemas na estrutura)

-- DROP TABLE IF EXISTS outros_itens_corrigidos CASCADE;

-- CREATE TABLE outros_itens_corrigidos (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     ronda_id UUID REFERENCES rondas(id) ON DELETE CASCADE,
--     nome TEXT NOT NULL,
--     descricao TEXT NOT NULL,
--     local TEXT NOT NULL,
--     tipo TEXT CHECK (tipo IN ('CORREÇÃO', 'MELHORIA', 'MANUTENÇÃO', 'OUTRO')) NOT NULL,
--     prioridade TEXT CHECK (prioridade IN ('BAIXA', 'MÉDIA', 'ALTA', 'URGENTE')) NOT NULL,
--     status TEXT CHECK (status IN ('PENDENTE', 'EM ANDAMENTO', 'CONCLUÍDO', 'CANCELADO')) NOT NULL,
--     contrato TEXT NOT NULL,
--     endereco TEXT NOT NULL,
--     data TEXT NOT NULL,
--     hora TEXT NOT NULL,
--     foto TEXT,
--     observacoes TEXT,
--     responsavel TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- 4. Habilitar RLS (Row Level Security)
-- ALTER TABLE outros_itens_corrigidos ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de acesso (ajuste conforme necessário)
-- CREATE POLICY "Permitir acesso total aos outros_itens_corrigidos" ON outros_itens_corrigidos
--     FOR ALL USING (true);

-- 6. Criar índices para melhor performance
-- CREATE INDEX idx_outros_itens_ronda_id ON outros_itens_corrigidos(ronda_id);
-- CREATE INDEX idx_outros_itens_contrato ON outros_itens_corrigidos(contrato);

-- 7. Verificar dados existentes
SELECT COUNT(*) as total_itens FROM outros_itens_corrigidos;

-- 8. Verificar se há dados corrompidos
SELECT * FROM outros_itens_corrigidos 
WHERE nome IS NULL OR descricao IS NULL OR local IS NULL
LIMIT 10;


