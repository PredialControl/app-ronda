-- Script para criar o bucket de fotos no Supabase Storage
-- Execute este SQL no Editor SQL do Supabase

-- IMPORTANTE: Este script cria a configuração necessária no banco de dados
-- Mas você TAMBÉM precisa criar o bucket manualmente no Supabase Dashboard:
-- 1. Vá em Storage no painel do Supabase
-- 2. Clique em "New bucket"
-- 3. Nome do bucket: "fotos"
-- 4. Marque como "Public bucket" (se quiser que as fotos sejam públicas)
-- 5. Clique em "Create bucket"

-- Alternativamente, você pode criar o bucket via SQL se tiver as permissões:
-- Nota: A tabela storage.buckets pode exigir permissões especiais

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fotos',
  'fotos',
  true, -- bucket público (defina como false se quiser privado)
  52428800, -- limite de 50MB por arquivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas de acesso ao bucket
-- Permitir leitura pública (qualquer pessoa pode ver as fotos)
CREATE POLICY "Permitir leitura pública de fotos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'fotos');

-- Permitir upload autenticado (usuários autenticados podem fazer upload)
CREATE POLICY "Permitir upload de fotos para usuários autenticados" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'fotos' AND auth.role() = 'authenticated');

-- Permitir atualização autenticada
CREATE POLICY "Permitir atualização de fotos para usuários autenticados" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'fotos' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'fotos' AND auth.role() = 'authenticated');

-- Permitir deleção autenticada
CREATE POLICY "Permitir deleção de fotos para usuários autenticados" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'fotos' AND auth.role() = 'authenticated');

-- Se você quiser permitir upload sem autenticação (público), use:
-- CREATE POLICY "Permitir upload público" ON storage.objects
--   FOR INSERT
--   WITH CHECK (bucket_id = 'fotos');

-- Verificar se o bucket foi criado
SELECT * FROM storage.buckets WHERE id = 'fotos';
