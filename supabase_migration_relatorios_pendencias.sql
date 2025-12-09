-- Tabela de Relatórios de Pendências
CREATE TABLE IF NOT EXISTS relatorios_pendencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Seções do Relatório
CREATE TABLE IF NOT EXISTS relatorio_secoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relatorio_id UUID NOT NULL REFERENCES relatorios_pendencias(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    titulo_principal TEXT NOT NULL,
    subtitulo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pendências
CREATE TABLE IF NOT EXISTS relatorio_pendencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    secao_id UUID NOT NULL REFERENCES relatorio_secoes(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    local TEXT NOT NULL,
    descricao TEXT NOT NULL,
    foto_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_relatorios_pendencias_contrato ON relatorios_pendencias(contrato_id);
CREATE INDEX IF NOT EXISTS idx_relatorio_secoes_relatorio ON relatorio_secoes(relatorio_id);
CREATE INDEX IF NOT EXISTS idx_relatorio_pendencias_secao ON relatorio_pendencias(secao_id);

-- RLS Policies
ALTER TABLE relatorios_pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_secoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_pendencias ENABLE ROW LEVEL SECURITY;

-- Policies para relatorios_pendencias
CREATE POLICY "Permitir visualização de relatórios" ON relatorios_pendencias FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de relatórios" ON relatorios_pendencias FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de relatórios" ON relatorios_pendencias FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de relatórios" ON relatorios_pendencias FOR DELETE USING (true);

-- Policies para relatorio_secoes
CREATE POLICY "Permitir visualização de seções" ON relatorio_secoes FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de seções" ON relatorio_secoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de seções" ON relatorio_secoes FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de seções" ON relatorio_secoes FOR DELETE USING (true);

-- Policies para relatorio_pendencias
CREATE POLICY "Permitir visualização de pendências" ON relatorio_pendencias FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de pendências" ON relatorio_pendencias FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de pendências" ON relatorio_pendencias FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de pendências" ON relatorio_pendencias FOR DELETE USING (true);
