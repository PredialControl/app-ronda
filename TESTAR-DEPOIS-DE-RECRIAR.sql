-- ========================================
-- TESTE APÓS RECRIAR AS TABELAS
-- ========================================

-- 1. INSERIR UM RELATÓRIO DE TESTE
INSERT INTO relatorios_pendencias (contrato_id, titulo)
VALUES ('00000000-0000-0000-0000-000000000000', 'TESTE DE RELATÓRIO')
RETURNING id;

-- COPIE O ID RETORNADO E USE NAS PRÓXIMAS QUERIES!
-- Substitua 'SEU-ID-AQUI' pelo ID que foi retornado acima

-- 2. INSERIR UMA SEÇÃO DE TESTE
INSERT INTO relatorio_secoes (relatorio_id, ordem, titulo_principal, subtitulo)
VALUES ('SEU-ID-AQUI', 0, 'TESTE SEÇÃO', 'TESTE SUBTÍTULO')
RETURNING id;

-- COPIE O ID DA SEÇÃO E USE NA PRÓXIMA QUERY!
-- Substitua 'ID-DA-SECAO-AQUI' pelo ID que foi retornado acima

-- 3. INSERIR UMA PENDÊNCIA COM FOTO DEPOIS
INSERT INTO relatorio_pendencias (secao_id, ordem, local, descricao, foto_url, foto_depois_url)
VALUES (
    'ID-DA-SECAO-AQUI',
    0,
    'Local de teste',
    'Descrição de teste',
    'https://exemplo.com/foto-antes.jpg',
    'https://exemplo.com/foto-depois.jpg'
)
RETURNING *;

-- 4. VERIFICAR SE FOI SALVO CORRETAMENTE
SELECT
    rp.id,
    rp.ordem,
    rp.local,
    rp.foto_url,
    rp.foto_depois_url,
    rs.titulo_principal,
    r.titulo
FROM relatorio_pendencias rp
JOIN relatorio_secoes rs ON rp.secao_id = rs.id
JOIN relatorios_pendencias r ON rs.relatorio_id = r.id
WHERE r.titulo = 'TESTE DE RELATÓRIO';

-- 5. ATUALIZAR A FOTO DEPOIS
UPDATE relatorio_pendencias
SET foto_depois_url = 'https://exemplo.com/NOVA-foto-depois.jpg'
WHERE local = 'Local de teste'
RETURNING *;

-- 6. VERIFICAR SE ATUALIZOU
SELECT foto_depois_url
FROM relatorio_pendencias
WHERE local = 'Local de teste';

-- 7. LIMPAR O TESTE
DELETE FROM relatorios_pendencias WHERE titulo = 'TESTE DE RELATÓRIO';

-- 8. CONFIRMAR QUE FOI DELETADO
SELECT COUNT(*) as registros_restantes
FROM relatorios_pendencias
WHERE titulo = 'TESTE DE RELATÓRIO';
