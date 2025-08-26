-- RECRIAR TABELA outros_itens_corrigidos DO ZERO
-- Execute este script no SQL Editor do Supabase

-- 1. REMOVER TABELA EXISTENTE (se houver)
DROP TABLE IF EXISTS outros_itens_corrigidos CASCADE;

-- 2. CRIAR NOVA TABELA COM ESTRUTURA CORRETA
CREATE TABLE outros_itens_corrigidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ronda_id UUID,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    local TEXT NOT NULL,
    tipo TEXT NOT NULL,
    prioridade TEXT NOT NULL,
    status TEXT NOT NULL,
    contrato TEXT NOT NULL,
    endereco TEXT NOT NULL,
    data TEXT NOT NULL,
    hora TEXT NOT NULL,
    foto TEXT,
    observacoes TEXT,
    responsavel TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_outros_itens_ronda_id ON outros_itens_corrigidos(ronda_id);
CREATE INDEX idx_outros_itens_contrato ON outros_itens_corrigidos(contrato);
CREATE INDEX idx_outros_itens_status ON outros_itens_corrigidos(status);

-- 4. DESABILITAR RLS (Row Level Security)
ALTER TABLE outros_itens_corrigidos DISABLE ROW LEVEL SECURITY;

-- 5. VERIFICAR SE A TABELA FOI CRIADA CORRETAMENTE
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'outros_itens_corrigidos';

-- 6. VERIFICAR ESTRUTURA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'outros_itens_corrigidos'
ORDER BY ordinal_position;

-- 7. TESTAR INSERÇÃO
INSERT INTO outros_itens_corrigidos (
    ronda_id,
    nome,
    descricao,
    local,
    tipo,
    prioridade,
    status,
    contrato,
    endereco,
    data,
    hora,
    foto,
    observacoes,
    responsavel
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Teste de Criação',
    'Teste para verificar se a tabela foi criada corretamente',
    'Local de teste',
    'CORREÇÃO',
    'MÉDIA',
    'PENDENTE',
    'Contrato teste',
    'Endereço teste',
    '2024-01-01',
    '10:00',
    NULL,
    'Teste de criação da tabela',
    'Sistema'
);

-- 8. VERIFICAR SE A INSERÇÃO FUNCIONOU
SELECT COUNT(*) as total_itens FROM outros_itens_corrigidos;

-- 9. LIMPAR ITEM DE TESTE
DELETE FROM outros_itens_corrigidos WHERE nome = 'Teste de Criação';

-- RESULTADO ESPERADO:
-- rowsecurity deve ser 'f' (false)
-- A inserção de teste deve funcionar
-- A tabela deve ter todos os campos necessários
-- O upload de fotos deve funcionar agora!


