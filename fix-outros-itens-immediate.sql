-- CORREÇÃO IMEDIATA PARA TABELA outros_itens_corrigidos
-- Execute este script no SQL Editor do Supabase

-- 1. DESABILITAR RLS IMEDIATAMENTE (resolve o erro 401)
ALTER TABLE outros_itens_corrigidos DISABLE ROW LEVEL SECURITY;

-- 2. VERIFICAR SE FUNCIONOU
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'outros_itens_corrigidos';

-- 3. VERIFICAR ESTRUTURA DA TABELA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'outros_itens_corrigidos'
ORDER BY ordinal_position;

-- 4. VERIFICAR DADOS EXISTENTES
SELECT COUNT(*) as total_itens FROM outros_itens_corrigidos;

-- 5. TESTAR INSERÇÃO DIRETA (opcional)
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
--     '00000000-0000-0000-0000-000000000000',
--     'Teste RLS',
--     'Teste para verificar se RLS está funcionando',
--     'Local de teste',
--     'CORREÇÃO',
--     'MÉDIA',
--     'PENDENTE',
--     'Contrato teste',
--     'Endereço teste',
--     '2024-01-01',
--     '10:00',
--     NULL,
--     'Teste de RLS',
--     'Sistema'
-- );

-- 6. SE PRECISAR RECRIAR A TABELA (execute apenas se necessário)
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

-- 7. DESABILITAR RLS NA NOVA TABELA
-- ALTER TABLE outros_itens_corrigidos DISABLE ROW LEVEL SECURITY;

-- 8. CRIAR ÍNDICES PARA PERFORMANCE
-- CREATE INDEX idx_outros_itens_ronda_id ON outros_itens_corrigidos(ronda_id);
-- CREATE INDEX idx_outros_itens_contrato ON outros_itens_corrigidos(contrato);

-- RESULTADO ESPERADO:
-- rowsecurity deve ser 'f' (false) após executar o comando 1
-- Isso significa que RLS está desabilitado e o upload deve funcionar


