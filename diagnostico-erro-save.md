# 🔍 DIAGNÓSTICO - Erro ao Salvar Relatório

## 📋 INFORMAÇÕES PARA COLETAR

### 1. O BACKUP FOI CRIADO?

**Pergunte para a Jéssica:**
- Quando ela abrir o relatório novamente, aparece uma mensagem perguntando se quer "Restaurar backup"?
- Se SIM, os dados estão salvos! ✅
- Se NÃO, o backup pode não ter sido criado ⚠️

---

### 2. QUAL FOI O ERRO EXATO?

**Apareceu o modal de erro vermelho?**
- [ ] SIM - Copie a mensagem que apareceu
- [ ] NÃO - A tela só travou/deu erro genérico

**Se apareceu o modal, qual era a mensagem?**
```
(Cole aqui a mensagem de erro)
```

---

### 3. O QUE ELA ESTAVA FAZENDO?

- Quanto tempo editando? ______ minutos
- Quantas seções tinha? ______
- Quantas pendências? ______
- Estava adicionando fotos? [ ] SIM [ ] NÃO
- Se SIM, quantas fotos? ______
- Estava movendo pendências? [ ] SIM [ ] NÃO

---

### 4. VERIFICAR O CONSOLE DO NAVEGADOR

**IMPORTANTE: Isso mostra o erro técnico real!**

1. Pressione **F12** no navegador
2. Clique na aba **Console**
3. Procure por linhas com ❌ ou ERRO
4. Copie TODAS as mensagens de erro
5. Cole aqui:

```
(Cole aqui os erros do console)
```

---

### 5. VERIFICAR O BACKUP LOCAL

Execute este comando no navegador (F12 > Console):

```javascript
// Verificar se tem backup
const relatorioId = 'COLOQUE_O_ID_DO_RELATORIO_AQUI';
const contratoId = 'COLOQUE_O_ID_DO_CONTRATO_AQUI';
const key = `relatorio_autosave_${relatorioId}_${contratoId}`;
const backup = localStorage.getItem(key);
const timestamp = localStorage.getItem(`${key}_timestamp`);

if (backup) {
    const data = JSON.parse(backup);
    console.log('✅ BACKUP ENCONTRADO!');
    console.log('Timestamp:', timestamp);
    console.log('Total de seções:', data.secoes?.length || 0);
    console.log('Título:', data.titulo);
} else {
    console.log('❌ NENHUM BACKUP ENCONTRADO');
}
```

---

## 🔧 POSSÍVEIS CAUSAS

### Causa 1: Muitas Fotos (Timeout)
- Se tinha muitas fotos (>20), pode estar demorando muito para fazer upload
- Solução: Salvar em lotes menores

### Causa 2: Erro de Rede
- Conexão com internet caiu durante o save
- Solução: Backup local deve ter salvo, é só restaurar

### Causa 3: Erro de Permissão (RLS)
- Usuário não tem permissão para editar esse relatório
- Solução: Verificar permissões no Supabase

### Causa 4: Dados Corrompidos
- Algum campo com dado inválido
- Solução: Verificar console para ver qual campo

---

## ✅ PRÓXIMOS PASSOS

1. **Recuperar os dados da Jéssica**
   - Se tem backup: Restaurar via modal
   - Se não tem backup: Verificar auto-save no localStorage

2. **Identificar a causa**
   - Com os logs do console, saberei o erro exato

3. **Corrigir o problema**
   - Implementar fix específico para o erro

---

**Por favor, me passe essas informações para eu poder ajudar! 🙏**
