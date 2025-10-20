-- Script completo para configurar o Supabase
-- Execute este script no SQL Editor do Supabase

-- ==============================================
-- TABELA DE CONTRATOS
-- ==============================================
CREATE TABLE IF NOT EXISTS contratos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    sindico VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    periodicidade VARCHAR(50) NOT NULL,
    observacoes TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- TABELA DE AGENDA
-- ==============================================
CREATE TABLE IF NOT EXISTS agenda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contrato_id UUID NOT NULL,
    contrato_nome VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    dia_semana VARCHAR(20) NOT NULL CHECK (dia_semana IN ('SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO', 'DOMINGO')),
    horario TIME NOT NULL,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorrencia JSONB -- Para armazenar regras de recorrência
);

-- ==============================================
-- TABELA DE RONDAS
-- ==============================================
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

-- ==============================================
-- TABELA DE ÁREAS TÉCNICAS
-- ==============================================
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

-- ==============================================
-- TABELA DE FOTOS DA RONDA
-- ==============================================
CREATE TABLE IF NOT EXISTS fotos_ronda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ronda_id UUID REFERENCES rondas(id) ON DELETE CASCADE,
    descricao VARCHAR(255) NOT NULL,
    responsavel VARCHAR(255) NOT NULL,
    url_foto TEXT NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    tamanho INTEGER NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- TABELA DE OUTROS ITENS CORRIGIDOS
-- ==============================================
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

-- ==============================================
-- ÍNDICES PARA PERFORMANCE
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_contratos_nome ON contratos(nome);
CREATE INDEX IF NOT EXISTS idx_agenda_dia_semana ON agenda(dia_semana);
CREATE INDEX IF NOT EXISTS idx_agenda_contrato_id ON agenda(contrato_id);
CREATE INDEX IF NOT EXISTS idx_agenda_ativo ON agenda(ativo);
CREATE INDEX IF NOT EXISTS idx_agenda_horario ON agenda(horario);
CREATE INDEX IF NOT EXISTS idx_agenda_recorrencia ON agenda USING GIN (recorrencia);
CREATE INDEX IF NOT EXISTS idx_rondas_contrato ON rondas(contrato);
CREATE INDEX IF NOT EXISTS idx_areas_tecnicas_ronda ON areas_tecnicas(ronda_id);
CREATE INDEX IF NOT EXISTS idx_fotos_ronda_ronda ON fotos_ronda(ronda_id);
CREATE INDEX IF NOT EXISTS idx_outros_itens_ronda ON outros_itens_corrigidos(ronda_id);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE rondas ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas_tecnicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_ronda ENABLE ROW LEVEL SECURITY;
ALTER TABLE outros_itens_corrigidos ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- POLÍTICAS DE ACESSO ANÔNIMO (DESENVOLVIMENTO)
-- ==============================================
CREATE POLICY "Permitir acesso anônimo a contratos" ON contratos FOR ALL USING (true);
CREATE POLICY "Permitir acesso anônimo a agenda" ON agenda FOR ALL USING (true);
CREATE POLICY "Permitir acesso anônimo a rondas" ON rondas FOR ALL USING (true);
CREATE POLICY "Permitir acesso anônimo a areas_tecnicas" ON areas_tecnicas FOR ALL USING (true);
CREATE POLICY "Permitir acesso anônimo a fotos_ronda" ON fotos_ronda FOR ALL USING (true);
CREATE POLICY "Permitir acesso anônimo a outros_itens_corrigidos" ON outros_itens_corrigidos FOR ALL USING (true);

-- ==============================================
-- TRIGGERS PARA TIMESTAMPS
-- ==============================================
-- Trigger para agenda
CREATE OR REPLACE FUNCTION update_agenda_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agenda_timestamp
    BEFORE UPDATE ON agenda
    FOR EACH ROW
    EXECUTE FUNCTION update_agenda_timestamp();

-- Trigger para fotos_ronda
CREATE OR REPLACE FUNCTION update_fotos_ronda_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fotos_ronda_timestamp
    BEFORE UPDATE ON fotos_ronda
    FOR EACH ROW
    EXECUTE FUNCTION update_fotos_ronda_timestamp();

-- ==============================================
-- DADOS DE EXEMPLO
-- ==============================================
-- Inserir contratos de exemplo
INSERT INTO contratos (nome, sindico, endereco, periodicidade, observacoes) VALUES
('CT001/2024 - Manutenção Preventiva', 'João Silva', 'Rua das Flores, 123 - Centro', 'SEMANAL', 'Contrato de manutenção preventiva semanal'),
('CT002/2024 - Inspeção Semanal', 'Maria Santos', 'Av. Principal, 456 - Bairro Novo', 'QUINZENAL', 'Inspeção quinzenal de equipamentos'),
('CT003/2024 - Verificação Mensal', 'Pedro Costa', 'Rua da Paz, 789 - Jardim', 'MENSAL', 'Verificação mensal completa')
ON CONFLICT DO NOTHING;

-- Inserir agenda de exemplo
INSERT INTO agenda (contrato_id, contrato_nome, endereco, dia_semana, horario, observacoes, ativo) VALUES
((SELECT id FROM contratos WHERE nome = 'CT001/2024 - Manutenção Preventiva' LIMIT 1), 'CT001/2024 - Manutenção Preventiva', 'Rua das Flores, 123 - Centro', 'QUARTA', '08:00', 'Visita semanal - manhã', true),
((SELECT id FROM contratos WHERE nome = 'CT002/2024 - Inspeção Semanal' LIMIT 1), 'CT002/2024 - Inspeção Semanal', 'Av. Principal, 456 - Bairro Novo', 'SEGUNDA', '14:00', 'Inspeção semanal - tarde', true),
((SELECT id FROM contratos WHERE nome = 'CT001/2024 - Manutenção Preventiva' LIMIT 1), 'CT001/2024 - Manutenção Preventiva', 'Rua das Flores, 123 - Centro', 'SEXTA', '10:00', 'Verificação final da semana', true)
ON CONFLICT DO NOTHING;

-- ==============================================
-- VERIFICAÇÃO FINAL
-- ==============================================
-- Verificar se as tabelas foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('contratos', 'agenda', 'rondas', 'areas_tecnicas', 'fotos_ronda', 'outros_itens_corrigidos')
ORDER BY table_name;

-- Verificar dados inseridos
SELECT 'Contratos' as tabela, COUNT(*) as registros FROM contratos
UNION ALL
SELECT 'Agenda' as tabela, COUNT(*) as registros FROM agenda
UNION ALL
SELECT 'Rondas' as tabela, COUNT(*) as registros FROM rondas;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
