-- Script para criar as tabelas no Supabase/Neon PostgreSQL
-- Execute este script no seu projeto Supabase

-- Tabela de contratos
CREATE TABLE IF NOT EXISTS contratos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    sindico VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    periodicidade VARCHAR(50) NOT NULL,
    observacoes TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de rondas
CREATE TABLE IF NOT EXISTS rondas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    contrato VARCHAR(255) NOT NULL,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    responsavel VARCHAR(255),
    observacoes_gerais TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de áreas técnicas
CREATE TABLE IF NOT EXISTS areas_tecnicas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    contrato VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    foto TEXT,
    observacoes TEXT,
    ronda_id UUID REFERENCES rondas(id) ON DELETE CASCADE
);

-- Tabela de fotos da ronda
CREATE TABLE IF NOT EXISTS fotos_ronda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    foto TEXT NOT NULL,
    local VARCHAR(255) NOT NULL,
    pendencia VARCHAR(255) NOT NULL,
    especialidade VARCHAR(255) NOT NULL,
    responsavel VARCHAR(50) NOT NULL,
    observacoes TEXT,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    ronda_id UUID REFERENCES rondas(id) ON DELETE CASCADE
);

-- Tabela de outros itens corrigidos
CREATE TABLE IF NOT EXISTS outros_itens_corrigidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    local VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    prioridade VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    contrato VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    foto TEXT,
    observacoes TEXT,
    responsavel VARCHAR(255),
    ronda_id UUID REFERENCES rondas(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contratos_nome ON contratos(nome);
CREATE INDEX IF NOT EXISTS idx_rondas_contrato ON rondas(contrato);
CREATE INDEX IF NOT EXISTS idx_areas_tecnicas_ronda ON areas_tecnicas(ronda_id);
CREATE INDEX IF NOT EXISTS idx_fotos_ronda_ronda ON fotos_ronda(ronda_id);
CREATE INDEX IF NOT EXISTS idx_outros_itens_ronda ON outros_itens_corrigidos(ronda_id);

-- Habilitar Row Level Security (RLS) para segurança
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rondas ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas_tecnicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_ronda ENABLE ROW LEVEL SECURITY;
ALTER TABLE outros_itens_corrigidos ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso anônimo (para desenvolvimento)
CREATE POLICY "Permitir acesso anônimo a contratos" ON contratos FOR ALL USING (true);
CREATE POLICY "Permitir acesso anônimo a rondas" ON rondas FOR ALL USING (true);
CREATE POLICY "Permitir acesso anônimo a areas_tecnicas" ON areas_tecnicas FOR ALL USING (true);
CREATE POLICY "Permitir acesso anônimo a fotos_ronda" ON fotos_ronda FOR ALL USING (true);
CREATE POLICY "Permitir acesso anônimo a outros_itens_corrigidos" ON outros_itens_corrigidos FOR ALL USING (true);
