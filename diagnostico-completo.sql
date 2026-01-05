-- ========================================
-- DIAGNÓSTICO E RECRIAÇÃO COMPLETA
-- Execute este script no SQL Editor do Supabase
-- ========================================

-- 1. VERIFICAR SE AS TABELAS JÁ EXISTEM
SELECT '=== VERIFICANDO TABELAS EXISTENTES ===' as info;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE '%relatorio%'
ORDER BY table_name;

-- 2. DELETAR TUDO E RECRIAR
DROP TABLE IF EXISTS relatorio_pendencias CASCADE;
DROP TABLE IF EXISTS relatorio_secoes CASCADE;
DROP TABLE IF EXISTS relatorios_pendencias CASCADE;

-- 3. CRIAR TABELAS NO SCHEMA PUBLIC EXPLICITAMENTE
CREATE TABLE public.relatorios_pendencias (
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

CREATE TABLE public.relatorio_secoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    relatorio_id UUID NOT NULL REFERENCES public.relatorios_pendencias(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    titulo_principal TEXT NOT NULL,
    subtitulo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.relatorio_pendencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    secao_id UUID NOT NULL REFERENCES public.relatorio_secoes(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    local TEXT NOT NULL,
    descricao TEXT,
    foto_url TEXT,
    foto_depois_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR ÍNDICES
CREATE INDEX idx_relatorio_secoes_relatorio ON public.relatorio_secoes(relatorio_id);
CREATE INDEX idx_relatorio_pendencias_secao ON public.relatorio_pendencias(secao_id);

-- 5. DEFINIR OWNER E PERMISSÕES
ALTER TABLE public.relatorios_pendencias OWNER TO postgres;
ALTER TABLE public.relatorio_secoes OWNER TO postgres;
ALTER TABLE public.relatorio_pendencias OWNER TO postgres;

GRANT ALL ON public.relatorios_pendencias TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.relatorio_secoes TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.relatorio_pendencias TO postgres, anon, authenticated, service_role;

-- 6. HABILITAR RLS
ALTER TABLE public.relatorios_pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio_secoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio_pendencias ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR POLICIES PERMISSIVAS
CREATE POLICY "allow_all" ON public.relatorios_pendencias
    FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "allow_all" ON public.relatorio_secoes
    FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "allow_all" ON public.relatorio_pendencias
    FOR ALL TO public USING (true) WITH CHECK (true);

-- 8. NOTIFICAR POSTGREST PARA RECARREGAR SCHEMA
NOTIFY pgrst, 'reload schema';

-- 9. INSERIR UM REGISTRO DE TESTE
INSERT INTO public.relatorios_pendencias (
    contrato_id,
    titulo,
    data_inicio_vistoria,
    data_situacao_atual
) VALUES (
    'df669db3-ce0c-4d05-af58-2445c39d930a',
    'Teste - Relatório de Pendências',
    '2025-12-11',
    '2025-12-11'
) RETURNING id, titulo, created_at;

-- 10. VERIFICAÇÃO FINAL
SELECT '=== TABELAS CRIADAS ===' as status;
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE '%relatorio%'
ORDER BY table_name;

SELECT '=== PERMISSÕES ===' as status;
SELECT DISTINCT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('relatorios_pendencias', 'relatorio_secoes', 'relatorio_pendencias')
AND table_schema = 'public'
ORDER BY table_name, grantee;

SELECT '=== POLICIES ===' as status;
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('relatorios_pendencias', 'relatorio_secoes', 'relatorio_pendencias')
ORDER BY tablename;

SELECT '=== DADOS DE TESTE ===' as status;
SELECT COUNT(*) as total_relatorios FROM public.relatorios_pendencias;

SELECT '✅ CONCLUÍDO! Aguarde 30 segundos e recarregue a aplicação.' as resultado;
