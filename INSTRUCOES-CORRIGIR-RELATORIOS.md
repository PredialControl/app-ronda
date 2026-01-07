# Guia para Corrigir os Relatórios de Pendências

## Problema Identificado

O campo de relatórios de pendências **não está carregando** e **não está salvando** porque o banco de dados está faltando várias colunas e tabelas necessárias.

## Diagnóstico

Após rodar o servidor local em `http://localhost:1420/`, identificamos que faltam as seguintes estruturas no banco de dados:

### Tabelas Faltando:
- ❌ Tabela `relatorio_subsecoes` (para subseções VIII.1A, VIII.1B, etc.)

### Colunas Faltando em `relatorios_pendencias`:
- ❌ `capa_url` (imagem de capa personalizada)
- ❌ `foto_localidade_url` (foto da localidade)
- ❌ `data_inicio_vistoria` (data de início das vistorias)
- ❌ `historico_visitas` (histórico de visitas realizadas)
- ❌ `data_situacao_atual` (data da situação atual)

### Colunas Faltando em `relatorio_pendencias`:
- ❌ `foto_depois_url` (foto do "depois" da correção)
- ❌ `subsecao_id` (referência à subseção)

### Colunas Faltando em `relatorio_secoes`:
- ❌ `tem_subsecoes` (indica se a seção tem subseções)

---

## Solução: Executar Script SQL

### Passo 1: Acessar o Supabase
1. Abra seu navegador
2. Acesse https://supabase.com/
3. Faça login na sua conta
4. Selecione o projeto do App Ronda

### Passo 2: Abrir o SQL Editor
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"+ New query"**

### Passo 3: Copiar o Script SQL
1. Abra o arquivo `CORRIGIR-BANCO-RELATORIOS-COMPLETO.sql` (está na raiz do projeto)
2. Copie **TODO** o conteúdo do arquivo (Ctrl+A, depois Ctrl+C)

### Passo 4: Executar o Script
1. Cole o conteúdo no editor SQL do Supabase (Ctrl+V)
2. Clique em **"RUN"** (ou pressione Ctrl+Enter)
3. Aguarde a execução (deve levar alguns segundos)

### Passo 5: Verificar o Resultado
Após executar, role até o final dos resultados. Você deve ver:

✅ **COLUNAS DE relatorios_pendencias:**
- Lista de todas as colunas, incluindo as novas: `capa_url`, `foto_localidade_url`, `data_inicio_vistoria`, `historico_visitas`, `data_situacao_atual`

✅ **COLUNAS DE relatorio_pendencias:**
- Lista de todas as colunas, incluindo: `foto_depois_url`, `subsecao_id`

✅ **COLUNAS DE relatorio_secoes:**
- Lista de todas as colunas, incluindo: `tem_subsecoes`

✅ **TABELA relatorio_subsecoes EXISTE?**
- Deve mostrar `true`

✅ **POLICIES RLS:**
- Lista de todas as políticas de segurança criadas

---

## Passo 6: Testar no Navegador

### 1. Abrir a Aplicação
- Abra seu navegador
- Acesse: `http://localhost:1420/`

### 2. Acessar Relatórios de Pendências
- Faça login (se necessário)
- Selecione um contrato
- Clique na aba/seção de **"Relatórios de Pendências"**

### 3. Verificar se Carrega
Você deve ver:
- ✅ Lista de relatórios existentes (se houver)
- ✅ Botão "Novo Relatório" funcionando
- ✅ Sem erros no console do navegador (pressione F12 para abrir o console)

### 4. Testar Criação de Novo Relatório
1. Clique em **"Novo Relatório"**
2. Preencha o título (obrigatório)
3. Adicione uma seção
4. Adicione uma pendência
5. Clique em **"Salvar"**
6. Aguarde o salvamento
7. Verifique se apareceu a mensagem de sucesso: **"Relatório de pendências salvo com sucesso!"**

---

## Erros Comuns e Soluções

### Erro: "column already exists"
**Causa:** Alguém já executou parte do script antes

**Solução:** Não é um problema! O script usa `IF NOT EXISTS` e `ADD COLUMN IF NOT EXISTS`, então ele pula as colunas que já existem. Continue normalmente.

### Erro: "permission denied"
**Causa:** Você não tem permissão para alterar o banco

**Solução:** Verifique se você está logado como administrador do projeto no Supabase.

### Erro no navegador: "Cannot read property 'secoes' of undefined"
**Causa:** O banco ainda não foi atualizado OU o cache do navegador está desatualizado

**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+R ou Ctrl+F5)
2. Recarregue a página
3. Se persistir, feche e abra o navegador novamente

### Relatórios ainda não carregam
**Causa:** Pode haver erros de permissão (RLS - Row Level Security)

**Solução:**
1. Abra o console do navegador (F12)
2. Vá na aba "Console"
3. Procure por erros em vermelho
4. Se houver erros de "permission denied" ou "policy", entre em contato para ajustar as políticas RLS

---

## Funcionalidades Disponíveis Após a Correção

### ✅ Criar Relatórios de Pendências
- Título customizado
- Capa personalizada
- Foto da localidade
- Histórico de vistorias

### ✅ Seções e Subseções
- Criar seções simples (VIII.1, VIII.2, etc.)
- Criar seções com subseções (VIII.1A, VIII.1B, VIII.1C, etc.)

### ✅ Pendências
- Adicionar pendências com local e descrição
- Upload de foto "antes"
- Upload de foto "depois" (opcional)
- Upload em lote (múltiplas fotos de uma vez)

### ✅ Exportação
- Gerar arquivo DOCX do relatório completo

---

## Próximos Passos

Após executar o script e verificar que tudo está funcionando:

1. ✅ Teste criar um relatório completo
2. ✅ Teste editar um relatório existente
3. ✅ Teste excluir um relatório
4. ✅ Teste exportar para DOCX

---

## Suporte

Se tiver problemas:
1. Verifique o console do navegador (F12) para ver erros específicos
2. Verifique os logs do Supabase (SQL Editor > Query Results)
3. Tire um print do erro e anote qual ação você estava fazendo

---

**Data de criação deste guia:** 2026-01-06
**Arquivo do script SQL:** `CORRIGIR-BANCO-RELATORIOS-COMPLETO.sql`
