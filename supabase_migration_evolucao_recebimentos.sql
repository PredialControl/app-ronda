-- Criar tabela para salvar o status dos itens compilados
CREATE TABLE IF NOT EXISTS evolucao_recebimentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pendencia_id UUID NOT NULL,
    relatorio_id UUID NOT NULL,
    contrato_id UUID NOT NULL,
    situacao TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (situacao IN ('PENDENTE', 'RECEBIDO', 'NAO_FARA')),
    data_recebido DATE,
    construtora TEXT,
    sindico TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pendencia_id)
);

-- Criar índices
CREATE INDEX idx_evolucao_recebimentos_contrato ON evolucao_recebimentos(contrato_id);
CREATE INDEX idx_evolucao_recebimentos_relatorio ON evolucao_recebimentos(relatorio_id);
CREATE INDEX idx_evolucao_recebimentos_pendencia ON evolucao_recebimentos(pendencia_id);
CREATE INDEX idx_evolucao_recebimentos_situacao ON evolucao_recebimentos(situacao);

-- Habilitar RLS
ALTER TABLE evolucao_recebimentos ENABLE ROW LEVEL SECURITY;

-- Criar policy permissiva
CREATE POLICY "allow_all_evolucao_recebimentos"
    ON evolucao_recebimentos
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Garantir permissões
GRANT ALL ON evolucao_recebimentos TO postgres, anon, authenticated, service_role;
