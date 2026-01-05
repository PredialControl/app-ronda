-- Deletar tabelas se existirem
DROP TABLE IF EXISTS relatorio_pendencias CASCADE;
DROP TABLE IF EXISTS relatorio_secoes CASCADE;
DROP TABLE IF EXISTS relatorios_pendencias CASCADE;

-- Criar tabela principal de relatórios
CREATE TABLE relatorios_pendencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contrato_id UUID NOT NULL,
    titulo TEXT NOT NULL,
    capa_url TEXT,
    foto_localidade_url TEXT,
    data_inicio_vistoria TEXT,
    historico_visitas TEXT[],
    data_situacao_atual TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de seções
CREATE TABLE relatorio_secoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    relatorio_id UUID NOT NULL REFERENCES relatorios_pendencias(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    titulo_principal TEXT NOT NULL,
    subtitulo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de pendências
CREATE TABLE relatorio_pendencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    secao_id UUID NOT NULL REFERENCES relatorio_secoes(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    local TEXT NOT NULL,
    descricao TEXT,
    foto_url TEXT,
    foto_depois_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_relatorio_secoes_relatorio ON relatorio_secoes(relatorio_id);
CREATE INDEX idx_relatorio_pendencias_secao ON relatorio_pendencias(secao_id);

-- Definir permissões
GRANT ALL ON relatorios_pendencias TO postgres, anon, authenticated, service_role;
GRANT ALL ON relatorio_secoes TO postgres, anon, authenticated, service_role;
GRANT ALL ON relatorio_pendencias TO postgres, anon, authenticated, service_role;

-- Habilitar RLS
ALTER TABLE relatorios_pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_secoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_pendencias ENABLE ROW LEVEL SECURITY;

-- Criar policies
CREATE POLICY "allow_all" ON relatorios_pendencias FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON relatorio_secoes FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON relatorio_pendencias FOR ALL TO public USING (true) WITH CHECK (true);

-- Notificar PostgREST
NOTIFY pgrst, 'reload schema';
