-- Script para verificar a estrutura da tabela fotos_ronda
-- Execute este script no Supabase SQL Editor

-- Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'fotos_ronda'
);

-- Se a tabela existir, mostrar sua estrutura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'fotos_ronda'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar algumas linhas de exemplo se existirem
SELECT * FROM fotos_ronda LIMIT 5;











