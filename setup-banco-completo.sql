-- Script completo para configurar o banco de dados
-- Execute este script no Supabase SQL Editor

-- 1. Verificar tabelas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Criar tabela contratos se não existir
CREATE TABLE IF NOT EXISTS contratos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    sindico TEXT,
    endereco TEXT,
    periodicidade TEXT,
    observacoes TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela rondas se não existir
CREATE TABLE IF NOT EXISTS rondas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    contrato TEXT,
    data DATE,
    hora TIME,
    responsavel TEXT,
    observacoes_gerais TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela fotos_ronda se não existir
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

-- 5. Criar tabela areas_tecnicas se não existir
CREATE TABLE IF NOT EXISTS areas_tecnicas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ronda_id UUID NOT NULL,
    nome TEXT NOT NULL,
    status TEXT DEFAULT 'ATIVO',
    contrato TEXT,
    endereco TEXT,
    data DATE,
    hora TIME,
    foto TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar tabela outros_itens_corrigidos se não existir
CREATE TABLE IF NOT EXISTS outros_itens_corrigidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ronda_id UUID NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    local TEXT,
    tipo TEXT,
    prioridade TEXT,
    status TEXT,
    contrato TEXT,
    endereco TEXT,
    responsavel TEXT,
    foto TEXT,
    observacoes TEXT,
    data DATE,
    hora TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_rondas_contrato ON rondas(contrato);
CREATE INDEX IF NOT EXISTS idx_fotos_ronda_ronda_id ON fotos_ronda(ronda_id);
CREATE INDEX IF NOT EXISTS idx_areas_tecnicas_ronda_id ON areas_tecnicas(ronda_id);
CREATE INDEX IF NOT EXISTS idx_outros_itens_ronda_id ON outros_itens_corrigidos(ronda_id);

-- 8. Configurar RLS (Row Level Security)
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rondas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_ronda ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas_tecnicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE outros_itens_corrigidos ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas RLS básicas (permitir tudo por enquanto)
DROP POLICY IF EXISTS "contratos_policy" ON contratos;
CREATE POLICY "contratos_policy" ON contratos FOR ALL USING (true);

DROP POLICY IF EXISTS "rondas_policy" ON rondas;
CREATE POLICY "rondas_policy" ON rondas FOR ALL USING (true);

DROP POLICY IF EXISTS "fotos_ronda_policy" ON fotos_ronda;
CREATE POLICY "fotos_ronda_policy" ON fotos_ronda FOR ALL USING (true);

DROP POLICY IF EXISTS "areas_tecnicas_policy" ON areas_tecnicas;
CREATE POLICY "areas_tecnicas_policy" ON areas_tecnicas FOR ALL USING (true);

DROP POLICY IF EXISTS "outros_itens_corrigidos_policy" ON outros_itens_corrigidos;
CREATE POLICY "outros_itens_corrigidos_policy" ON outros_itens_corrigidos FOR ALL USING (true);

-- 10. Verificar estrutura final
SELECT 'contratos' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contratos' AND table_schema = 'public'
UNION ALL
SELECT 'rondas' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rondas' AND table_schema = 'public'
UNION ALL
SELECT 'fotos_ronda' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fotos_ronda' AND table_schema = 'public'
UNION ALL
SELECT 'areas_tecnicas' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'areas_tecnicas' AND table_schema = 'public'
UNION ALL
SELECT 'outros_itens_corrigidos' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'outros_itens_corrigidos' AND table_schema = 'public'
ORDER BY tabela, column_name;

-- 11. Verificar se há dados nas tabelas
SELECT 'contratos' as tabela, COUNT(*) as registros FROM contratos
UNION ALL
SELECT 'rondas' as tabela, COUNT(*) as registros FROM rondas
UNION ALL
SELECT 'fotos_ronda' as tabela, COUNT(*) as registros FROM fotos_ronda
UNION ALL
SELECT 'areas_tecnicas' as tabela, COUNT(*) as registros FROM areas_tecnicas
UNION ALL
SELECT 'outros_itens_corrigidos' as tabela, COUNT(*) as registros FROM outros_itens_corrigidos;













