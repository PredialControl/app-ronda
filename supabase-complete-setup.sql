-- Script completo para App Ronda - Supabase + Neon
-- Execute este script no SQL Editor do Supabase

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Contratos
CREATE TABLE IF NOT EXISTS public.contratos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    sindico VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    periodicidade VARCHAR(50) NOT NULL,
    observacoes TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Rondas
CREATE TABLE IF NOT EXISTS public.rondas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    contrato VARCHAR(255) NOT NULL,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    responsavel VARCHAR(255) NOT NULL,
    observacoes_gerais TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Áreas Técnicas
CREATE TABLE IF NOT EXISTS public.areas_tecnicas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ronda_id UUID REFERENCES public.rondas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVO',
    contrato VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    foto TEXT,
    observacoes TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Fotos da Ronda
CREATE TABLE IF NOT EXISTS public.fotos_ronda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ronda_id UUID REFERENCES public.rondas(id) ON DELETE CASCADE,
    foto TEXT NOT NULL,
    local VARCHAR(255) NOT NULL,
    pendencia VARCHAR(50) NOT NULL DEFAULT 'BAIXA',
    especialidade VARCHAR(100) NOT NULL,
    responsavel VARCHAR(255) NOT NULL,
    observacoes TEXT,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Outros Itens Corrigidos
CREATE TABLE IF NOT EXISTS public.outros_itens_corrigidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ronda_id UUID REFERENCES public.rondas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    local VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
    contrato VARCHAR(255) NOT NULL,
    responsavel VARCHAR(255) NOT NULL,
    foto TEXT,
    observacoes TEXT,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rondas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas_tecnicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos_ronda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outros_itens_corrigidos ENABLE ROW LEVEL SECURITY;

-- Políticas para acesso anônimo (desenvolvimento)
CREATE POLICY "Permitir acesso anônimo a contratos" ON public.contratos
    FOR ALL USING (true);

CREATE POLICY "Permitir acesso anônimo a rondas" ON public.rondas
    FOR ALL USING (true);

CREATE POLICY "Permitir acesso anônimo a areas_tecnicas" ON public.areas_tecnicas
    FOR ALL USING (true);

CREATE POLICY "Permitir acesso anônimo a fotos_ronda" ON public.fotos_ronda
    FOR ALL USING (true);

CREATE POLICY "Permitir acesso anônimo a outros_itens_corrigidos" ON public.outros_itens_corrigidos
    FOR ALL USING (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_rondas_contrato ON public.rondas(contrato);
CREATE INDEX IF NOT EXISTS idx_areas_tecnicas_ronda_id ON public.areas_tecnicas(ronda_id);
CREATE INDEX IF NOT EXISTS idx_fotos_ronda_ronda_id ON public.fotos_ronda(ronda_id);
CREATE INDEX IF NOT EXISTS idx_outros_itens_ronda_id ON public.outros_itens_corrigidos(ronda_id);

-- Verificar se as tabelas foram criadas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('contratos', 'rondas', 'areas_tecnicas', 'fotos_ronda', 'outros_itens_corrigidos')
ORDER BY table_name, ordinal_position;

