-- Script para criar tabela de visitas realizadas no Supabase
-- Execute este script no SQL Editor do Supabase

-- Tabela de visitas realizadas (registros de atividades)
CREATE TABLE IF NOT EXISTS visitas_realizadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contrato_nome VARCHAR(255) NOT NULL,
    usuario_login VARCHAR(100) NOT NULL,
    data DATE NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_visitas_contrato ON visitas_realizadas(contrato_nome);
CREATE INDEX IF NOT EXISTS idx_visitas_usuario ON visitas_realizadas(usuario_login);
CREATE INDEX IF NOT EXISTS idx_visitas_data ON visitas_realizadas(data);
CREATE INDEX IF NOT EXISTS idx_visitas_tipo ON visitas_realizadas(tipo);

-- Habilitar Row Level Security (RLS)
ALTER TABLE visitas_realizadas ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso (desenvolvimento)
DROP POLICY IF EXISTS "Permitir acesso a visitas_realizadas" ON visitas_realizadas;
CREATE POLICY "Permitir acesso a visitas_realizadas" ON visitas_realizadas FOR ALL USING (true) WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_visitas_realizadas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_visitas_realizadas_timestamp ON visitas_realizadas;
CREATE TRIGGER update_visitas_realizadas_timestamp
    BEFORE UPDATE ON visitas_realizadas
    FOR EACH ROW
    EXECUTE FUNCTION update_visitas_realizadas_timestamp();

-- Verificar se a tabela foi criada
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'visitas_realizadas'
ORDER BY ordinal_position;
