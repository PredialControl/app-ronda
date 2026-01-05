# Implementação de Subseções nos Relatórios

## O que foi implementado?

Agora você pode criar relatórios com **dois tipos de estrutura**:

### 1. **Sem Subseções** (Modo Antigo)
```
VIII.1 - SALA DE PAINÉIS
  → Pendências diretas
```

### 2. **Com Subseções** (Novo!)
```
VIII.1 - HALLS RESIDENCIAL
  VIII.1A - 22 PAVIMENTO
    → Pendências do 22º pavimento
  VIII.1B - 23 PAVIMENTO
    → Pendências do 23º pavimento
  VIII.1C - 24 PAVIMENTO
    → Pendências do 24º pavimento
```

---

## Como executar a migração no banco de dados

### Passo 1: Acessar o Supabase
1. Entre no seu dashboard do Supabase
2. Vá em **SQL Editor** (menu lateral esquerdo)

### Passo 2: Executar o script
1. Clique em **+ New query**
2. Abra o arquivo `migration_subsecoes.sql` (está na raiz do projeto)
3. Copie **TODO** o conteúdo do arquivo
4. Cole no editor SQL do Supabase
5. Clique em **RUN** (ou pressione Ctrl+Enter)

### Passo 3: Verificar
Após executar, você deve ver a mensagem de sucesso. Para confirmar:
```sql
-- Execute esta query para verificar:
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_name IN ('relatorio_secoes', 'relatorio_subsecoes', 'relatorio_pendencias')
ORDER BY table_name, ordinal_position;
```

Você deve ver:
- Tabela `relatorio_subsecoes` criada
- Coluna `tem_subsecoes` em `relatorio_secoes`
- Coluna `subsecao_id` em `relatorio_pendencias`

---

## Como usar a nova funcionalidade

### 1. Criar uma seção COM subseções

1. Acesse o editor de relatórios
2. Clique em **"Adicionar Seção"**
3. Preencha o **Título Principal** (ex: "HALLS RESIDENCIAL")
4. ✅ **MARQUE o checkbox**: "Esta seção tem subseções (VIII.1A, VIII.1B, VIII.1C...)"
5. Clique em **"Adicionar Subseção"**
6. Preencha o título da subseção (ex: "22 PAVIMENTO")
7. Adicione pendências dentro da subseção
8. Repita para adicionar mais subseções (B, C, D...)

### 2. Criar uma seção SEM subseções (modo tradicional)

1. Acesse o editor de relatórios
2. Clique em **"Adicionar Seção"**
3. Preencha o **Título Principal** (ex: "SALA DE PAINÉIS")
4. ❌ **NÃO marque** o checkbox de subseções
5. Preencha o **Subtítulo/Área** (ex: "3º Subsolo")
6. Adicione pendências diretamente na seção

---

## Estrutura do Relatório Gerado

### Exemplo Completo:

```
VIII - CONSTATAÇÕES TÉCNICAS

VIII.1 - HALLS RESIDENCIAL (com subseções)
  VIII.1A - 22 PAVIMENTO
  VIII.1B - 23 PAVIMENTO
  VIII.1C - 24 PAVIMENTO

VIII.2 - SALA DE PAINÉIS ELÉTRICOS (sem subseções)

VIII.3 - PISCINA (com subseções)
  VIII.3A - ÁREA INFANTIL
  VIII.3B - ÁREA ADULTO

VIII.4 - ELEVADORES (sem subseções)
```

---

## Problemas Comuns

### Erro ao executar o script SQL
**Problema:** "relation already exists" ou "column already exists"

**Solução:** Alguém já executou o script antes. Verifique se as tabelas/colunas existem:
```sql
SELECT * FROM relatorio_subsecoes LIMIT 1;
```

### Checkbox não aparece
**Problema:** A interface não mostra o checkbox de subseções

**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+R)
2. Reinicie o servidor de desenvolvimento (`npm run dev`)

### Erro ao salvar
**Problema:** Erro ao salvar relatório com subseções

**Solução:**
1. Verifique se executou o script SQL no Supabase
2. Verifique o console do navegador (F12) para ver o erro específico
3. Confirme que as políticas RLS foram criadas corretamente

---

## Arquivos Modificados

✅ `/src/types/index.ts` - Novos tipos TypeScript
✅ `/src/lib/docxRelatorioPendencias.ts` - Geração de DOCX
✅ `/src/components/RelatorioPendenciasEditor.tsx` - Interface de edição
✅ `/src/lib/relatorioPendenciasService.ts` - Serviços de API
✅ `migration_subsecoes.sql` - Script de migração do banco

---

## Suporte

Se tiver problemas:
1. Verifique o console do navegador (F12)
2. Verifique os logs do Supabase
3. Confirme que executou o script SQL corretamente
