# 🚀 INSTRUÇÕES URGENTES - Adicionar coluna SECOES no Supabase

## ⚠️ AÇÃO NECESSÁRIA

Para que as seções do relatório funcionem, você precisa adicionar uma coluna na tabela `rondas` do Supabase.

## 📋 PASSO A PASSO

### 1. Acesse o Supabase
- Vá para: https://supabase.com/dashboard
- Faça login
- Selecione seu projeto

### 2. Abra o SQL Editor
- No menu lateral esquerdo, clique em **SQL Editor**
- Ou acesse: `https://supabase.com/dashboard/project/SEU_PROJETO/sql`

### 3. Execute o SQL
Cole o código abaixo e clique em **RUN**:

```sql
-- Adicionar coluna secoes na tabela rondas
ALTER TABLE rondas
ADD COLUMN IF NOT EXISTS secoes JSONB;

-- Adicionar comentário explicativo
COMMENT ON COLUMN rondas.secoes IS 'Seções dinâmicas do relatório (I - Objetivo, II - Observações, etc.) armazenadas como JSON';
```

### 4. Verifique se funcionou
Execute este SQL para confirmar:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'rondas'
AND column_name = 'secoes';
```

**Resultado esperado:**
```
column_name | data_type
------------+----------
secoes      | jsonb
```

## ✅ Pronto!

Depois de executar o SQL, as seções do relatório vão funcionar perfeitamente! 🎉

## 🐛 Se der erro

Se aparecer erro dizendo que a coluna já existe, está tudo OK! O `IF NOT EXISTS` garante que não vai duplicar.

## 📁 Arquivo SQL

O arquivo SQL completo está em:
```
supabase/migrations/add_secoes_to_rondas.sql
```

---

**Qualquer dúvida, me chama!** 💬
