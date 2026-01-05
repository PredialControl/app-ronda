# ⚠️ ERRO AO SALVAR RELATÓRIO? LEIA ISSO!

## 🔴 Erro Comum

Se você está recebendo erro ao salvar ou carregar relatórios, é porque você **NÃO EXECUTOU O SCRIPT SQL** no Supabase!

---

## ✅ SOLUÇÃO (5 minutos)

### Passo 1: Verificar se precisa executar

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Cole este código e clique em **RUN**:

```sql
-- TESTE: Verificar se executou o script
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'relatorio_subsecoes'
) AS tabela_existe;
```

**RESULTADO:**
- ✅ Se retornar `true` → Já executou, procure outro erro
- ❌ Se retornar `false` → PRECISA EXECUTAR O SCRIPT ABAIXO!

---

### Passo 2: Executar o Script de Migração

1. Ainda no **SQL Editor** do Supabase
2. Clique em **+ New query**
3. Abra o arquivo: `migration_subsecoes.sql` (na raiz do projeto)
4. Copie **TODO** o conteúdo do arquivo
5. Cole no SQL Editor
6. Clique em **RUN** ▶️
7. Aguarde até aparecer "Success"

---

### Passo 3: Testar se Funcionou

Depois de executar o script:

1. Volte no SQL Editor
2. Execute este teste:

```sql
-- Verificar se criou tudo certinho
SELECT
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'relatorio_subsecoes') as tabela_subsecoes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'relatorio_secoes' AND column_name = 'tem_subsecoes') as campo_tem_subsecoes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'relatorio_pendencias' AND column_name = 'subsecao_id') as campo_subsecao_id;
```

**Resultado esperado:**
```
tabela_subsecoes: 1
campo_tem_subsecoes: 1
campo_subsecao_id: 1
```

Se todos forem **1**, está funcionando!

---

## 🔴 Ainda dando erro?

### Erro: "column tem_subsecoes does not exist"
**Solução:** Você não executou o script SQL. Execute o `migration_subsecoes.sql`

### Erro: "relation relatorio_subsecoes does not exist"
**Solução:** Você não executou o script SQL. Execute o `migration_subsecoes.sql`

### Erro: "permission denied"
**Solução:** Verifique as políticas RLS. Execute a parte de políticas do `migration_subsecoes.sql`

### Erro: "Cannot read properties of undefined"
**Solução:** Limpe o cache do navegador (Ctrl + Shift + R) e recarregue

---

## 📞 Checklist Final

- [ ] Executou o `migration_subsecoes.sql` no Supabase?
- [ ] Viu a mensagem "Success" no SQL Editor?
- [ ] Aguardou o deploy do Vercel terminar?
- [ ] Limpou o cache do navegador (Ctrl + Shift + R)?
- [ ] Testou criar uma nova seção?

Se marcou TODOS, deve funcionar! 🎉
