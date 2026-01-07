-- ========================================
-- SCRIPT COMPLETO DE CORREÇÃO DO BANCO
-- Relatórios de Pendências
-- Data: 2026-01-06
-- ========================================

-- Este script corrige todas as colunas e tabelas faltantes
-- para que os relatórios de pendências funcionem corretamente

-- ========================================
-- 1. ADICIONAR COLUNAS FALTANTES EM relatorios_pendencias
-- ========================================

-- Coluna capa_url (imagem de capa personalizada)
ALTER TABLE relatorios_pendencias
ADD COLUMN IF NOT EXISTS capa_url TEXT;

COMMENT ON COLUMN relatorios_pendencias.capa_url IS 'URL da imagem de capa personalizada do relatório';

-- Coluna foto_localidade_url (foto da localidade)
ALTER TABLE relatorios_pendencias
ADD COLUMN IF NOT EXISTS foto_localidade_url TEXT;

COMMENT ON COLUMN relatorios_pendencias.foto_localidade_url IS 'URL da foto da localidade do empreendimento';

-- Campos de histórico de visitas
ALTER TABLE relatorios_pendencias
ADD COLUMN IF NOT EXISTS data_inicio_vistoria TEXT;

ALTER TABLE relatorios_pendencias
ADD COLUMN IF NOT EXISTS historico_visitas TEXT[];

ALTER TABLE relatorios_pendencias
ADD COLUMN IF NOT EXISTS data_situacao_atual TEXT;

COMMENT ON COLUMN relatorios_pendencias.data_inicio_vistoria IS 'Data de início das vistorias (formato: DD/MM/YYYY)';
COMMENT ON COLUMN relatorios_pendencias.historico_visitas IS 'Lista de datas e descrições das visitas realizadas';
COMMENT ON COLUMN relatorios_pendencias.data_situacao_atual IS 'Data da situação atual das vistorias (formato: DD/MM/YYYY)';

-- ========================================
-- 2. ADICIONAR COLUNAS FALTANTES EM relatorio_pendencias
-- ========================================

-- Coluna foto_depois_url (foto do "depois" da correção)
ALTER TABLE relatorio_pendencias
ADD COLUMN IF NOT EXISTS foto_depois_url TEXT;

COMMENT ON COLUMN relatorio_pendencias.foto_depois_url IS 'URL da foto "depois" (item corrigido)';

-- ========================================
-- 3. ADICIONAR SUBSEÇÕES
-- ========================================

-- Adicionar campo tem_subsecoes na tabela relatorio_secoes
ALTER TABLE relatorio_secoes
ADD COLUMN IF NOT EXISTS tem_subsecoes BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN relatorio_secoes.tem_subsecoes IS 'Indica se a seção possui subseções (A, B, C, etc.)';

-- Criar tabela relatorio_subsecoes
CREATE TABLE IF NOT EXISTS relatorio_subsecoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    secao_id UUID NOT NULL REFERENCES relatorio_secoes(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL DEFAULT 0,
    titulo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE relatorio_subsecoes IS 'Subseções de uma seção de relatório (ex: VIII.1A, VIII.1B)';

-- Adicionar campo subsecao_id na tabela relatorio_pendencias
ALTER TABLE relatorio_pendencias
ADD COLUMN IF NOT EXISTS subsecao_id UUID REFERENCES relatorio_subsecoes(id) ON DELETE CASCADE;

COMMENT ON COLUMN relatorio_pendencias.subsecao_id IS 'ID da subseção à qual a pendência pertence (se houver)';

-- ========================================
-- 4. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_relatorio_subsecoes_secao_id ON relatorio_subsecoes(secao_id);
CREATE INDEX IF NOT EXISTS idx_relatorio_subsecoes_ordem ON relatorio_subsecoes(ordem);
CREATE INDEX IF NOT EXISTS idx_relatorio_pendencias_subsecao_id ON relatorio_pendencias(subsecao_id);

-- ========================================
-- 5. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- ========================================

-- Habilitar RLS para relatorio_subsecoes
ALTER TABLE relatorio_subsecoes ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas para evitar conflitos
DROP POLICY IF EXISTS "Permitir visualização de subseções" ON relatorio_subsecoes;
DROP POLICY IF EXISTS "Permitir inserção de subseções" ON relatorio_subsecoes;
DROP POLICY IF EXISTS "Permitir atualização de subseções" ON relatorio_subsecoes;
DROP POLICY IF EXISTS "Permitir exclusão de subseções" ON relatorio_subsecoes;
DROP POLICY IF EXISTS "Permitir SELECT em relatorio_subsecoes para usuários autenticados" ON relatorio_subsecoes;
DROP POLICY IF EXISTS "Permitir INSERT em relatorio_subsecoes para usuários autenticados" ON relatorio_subsecoes;
DROP POLICY IF EXISTS "Permitir UPDATE em relatorio_subsecoes para usuários autenticados" ON relatorio_subsecoes;
DROP POLICY IF EXISTS "Permitir DELETE em relatorio_subsecoes para usuários autenticados" ON relatorio_subsecoes;

-- Criar políticas de acesso PERMISSIVAS (acesso total)
CREATE POLICY "Permitir visualização de subseções"
ON relatorio_subsecoes FOR SELECT
USING (true);

CREATE POLICY "Permitir inserção de subseções"
ON relatorio_subsecoes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir atualização de subseções"
ON relatorio_subsecoes FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir exclusão de subseções"
ON relatorio_subsecoes FOR DELETE
USING (true);

-- ========================================
-- 6. VERIFICAÇÃO FINAL
-- ========================================

-- Mostrar todas as colunas de relatorios_pendencias
SELECT 'COLUNAS DE relatorios_pendencias:' as info;
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'relatorios_pendencias'
ORDER BY ordinal_position;

-- Mostrar todas as colunas de relatorio_pendencias
SELECT 'COLUNAS DE relatorio_pendencias:' as info;
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'relatorio_pendencias'
ORDER BY ordinal_position;

-- Mostrar todas as colunas de relatorio_secoes
SELECT 'COLUNAS DE relatorio_secoes:' as info;
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'relatorio_secoes'
ORDER BY ordinal_position;

-- Verificar se a tabela relatorio_subsecoes foi criada
SELECT 'TABELA relatorio_subsecoes EXISTE?' as info;
SELECT
    EXISTS(
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'relatorio_subsecoes'
    ) as existe;

-- Mostrar todas as colunas de relatorio_subsecoes
SELECT 'COLUNAS DE relatorio_subsecoes:' as info;
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'relatorio_subsecoes'
ORDER BY ordinal_position;

-- Verificar RLS policies
SELECT 'POLICIES RLS:' as info;
SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('relatorios_pendencias', 'relatorio_secoes', 'relatorio_pendencias', 'relatorio_subsecoes')
ORDER BY tablename, policyname;

-- ========================================
-- FIM DO SCRIPT
-- ========================================

-- INSTRUÇÕES DE USO:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em "SQL Editor"
-- 3. Clique em "+ New query"
-- 4. Copie e cole TODO este script
-- 5. Clique em "RUN" (ou Ctrl+Enter)
-- 6. Verifique se todas as verificações mostraram sucesso

-- APÓS EXECUTAR ESTE SCRIPT:
-- ✅ Todos os relatórios devem carregar corretamente
-- ✅ Você poderá salvar relatórios com todas as funcionalidades
-- ✅ As subseções estarão disponíveis
-- ✅ O upload de fotos funcionará
