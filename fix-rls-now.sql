-- RESOLVER ERRO 401 AGORA!
-- Execute APENAS este comando no SQL Editor do Supabase:

ALTER TABLE outros_itens_corrigidos DISABLE ROW LEVEL SECURITY;

-- Depois execute este para verificar se funcionou:
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'outros_itens_corrigidos';

-- Se rowsecurity = 'f', então RLS está desabilitado e o upload deve funcionar!


