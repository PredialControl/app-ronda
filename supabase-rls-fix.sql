-- Script para corrigir as políticas de acesso (RLS) da tabela outros_itens_corrigidos
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'outros_itens_corrigidos';

-- 2. Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'outros_itens_corrigidos';

-- 3. Desabilitar RLS temporariamente para teste
ALTER TABLE outros_itens_corrigidos DISABLE ROW LEVEL SECURITY;

-- 4. Verificar se a tabela existe e sua estrutura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'outros_itens_corrigidos'
ORDER BY ordinal_position;

-- 5. Verificar se há dados na tabela
SELECT COUNT(*) as total_itens FROM outros_itens_corrigidos;

-- 6. Testar inserção direta (se necessário)
-- INSERT INTO outros_itens_corrigidos (
--     ronda_id,
--     nome,
--     descricao,
--     local,
--     tipo,
--     prioridade,
--     status,
--     contrato,
--     endereco,
--     data,
--     hora,
--     foto,
--     observacoes,
--     responsavel
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000', -- UUID de teste
--     'Teste',
--     'Descrição de teste',
--     'Local de teste',
--     'CORREÇÃO',
--     'MÉDIA',
--     'PENDENTE',
--     'Contrato teste',
--     'Endereço teste',
--     '2024-01-01',
--     '10:00',
--     NULL,
--     'Observação teste',
--     'Responsável teste'
-- );

-- 7. Se tudo estiver funcionando, reabilitar RLS com política permissiva
-- ALTER TABLE outros_itens_corrigidos ENABLE ROW LEVEL SECURITY;

-- 8. Criar política que permite acesso total (para desenvolvimento)
-- CREATE POLICY "Permitir acesso total aos outros_itens_corrigidos" 
-- ON outros_itens_corrigidos
-- FOR ALL 
-- USING (true)
-- WITH CHECK (true);

-- 9. Verificar se a política foi criada
-- SELECT * FROM pg_policies WHERE tablename = 'outros_itens_corrigidos';

-- 10. Se necessário, recriar a tabela com estrutura correta
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

-- 11. Criar índices para performance
-- CREATE INDEX idx_outros_itens_ronda_id ON outros_itens_corrigidos(ronda_id);
-- CREATE INDEX idx_outros_itens_contrato ON outros_itens_corrigidos(contrato);

-- 12. Desabilitar RLS na nova tabela (para desenvolvimento)
-- ALTER TABLE outros_itens_corrigidos DISABLE ROW LEVEL SECURITY;


