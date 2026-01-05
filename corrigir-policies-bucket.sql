-- Script para corrigir as políticas do bucket 'fotos'
-- Este script remove as políticas antigas e cria novas que permitem acesso público

-- 1. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Permitir leitura pública de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de fotos para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de fotos para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir deleção de fotos para usuários autenticados" ON storage.objects;

-- 2. Criar novas políticas com acesso público total
-- LEITURA PÚBLICA (qualquer pessoa pode ver as fotos)
CREATE POLICY "Public Access - SELECT"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos');

-- UPLOAD PÚBLICO (qualquer pessoa pode fazer upload)
CREATE POLICY "Public Access - INSERT"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fotos');

-- ATUALIZAÇÃO PÚBLICA (qualquer pessoa pode atualizar)
CREATE POLICY "Public Access - UPDATE"
ON storage.objects FOR UPDATE
USING (bucket_id = 'fotos')
WITH CHECK (bucket_id = 'fotos');

-- DELEÇÃO PÚBLICA (qualquer pessoa pode deletar)
CREATE POLICY "Public Access - DELETE"
ON storage.objects FOR DELETE
USING (bucket_id = 'fotos');

-- 3. Garantir que o bucket está configurado como público
UPDATE storage.buckets
SET public = true
WHERE id = 'fotos';

-- 4. Verificar as políticas criadas
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%Public Access%';

-- 5. Verificar configuração do bucket
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'fotos';
