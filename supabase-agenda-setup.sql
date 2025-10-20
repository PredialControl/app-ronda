-- Script para criar a tabela de agenda no Supabase
-- Execute este script no SQL Editor do Supabase

-- Tabela de agenda
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

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_agenda_dia_semana ON agenda(dia_semana);
CREATE INDEX IF NOT EXISTS idx_agenda_contrato_id ON agenda(contrato_id);
CREATE INDEX IF NOT EXISTS idx_agenda_ativo ON agenda(ativo);
CREATE INDEX IF NOT EXISTS idx_agenda_horario ON agenda(horario);
CREATE INDEX IF NOT EXISTS idx_agenda_recorrencia ON agenda USING GIN (recorrencia);

-- Habilitar Row Level Security (RLS) para segurança
ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso anônimo (para desenvolvimento)
CREATE POLICY "Permitir acesso anônimo a agenda" ON agenda FOR ALL USING (true);

-- Trigger para atualizar data_atualizacao automaticamente
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

-- Inserir alguns dados de exemplo
INSERT INTO agenda (contrato_id, contrato_nome, endereco, dia_semana, horario, observacoes, ativo) VALUES
('00000000-0000-0000-0000-000000000001', 'CT001/2024 - Manutenção Preventiva', 'Rua das Flores, 123 - Centro', 'QUARTA', '08:00', 'Visita semanal - manhã', true),
('00000000-0000-0000-0000-000000000002', 'CT002/2024 - Inspeção Semanal', 'Av. Principal, 456 - Bairro Novo', 'SEGUNDA', '14:00', 'Inspeção semanal - tarde', true),
('00000000-0000-0000-0000-000000000001', 'CT001/2024 - Manutenção Preventiva', 'Rua das Flores, 123 - Centro', 'SEXTA', '10:00', 'Verificação final da semana', true);

-- Verificar se a tabela foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'agenda'
ORDER BY ordinal_position;

-- Verificar os dados inseridos
SELECT * FROM agenda ORDER BY dia_semana, horario;

