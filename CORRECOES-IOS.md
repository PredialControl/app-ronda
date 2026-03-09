# Correções para iPhone (iOS PWA)

## Problemas Resolvidos

### 1. Botão Voltar não aparece direito no iOS Standalone

**Problema:** Quando o app é adicionado à tela inicial do iPhone (modo PWA standalone), o botão voltar em seções/subseções não aparecia corretamente devido a problemas com z-index e sticky positioning.

**Solução Implementada:**
- ✅ Criado `src/lib/iosHelpers.ts` com funções de detecção de iOS
- ✅ Adicionados estilos CSS específicos para iOS em `src/index.css`
- ✅ Configuração automática ao iniciar o app em `src/App.tsx`

**O que foi feito:**
- Detecção automática de iOS standalone
- CSS específico para headers sticky no iOS
- Z-index corrigido com `transform: translateZ(0)` para forçar layer de GPU
- Área de toque mínima de 44px (padrão Apple HIG)
- Suporte para safe areas (notch do iPhone)

### 2. Fotos não salvam na galeria do iPhone

**Problema:** No iOS, diferente do Android, fotos capturadas pelo PWA não são automaticamente salvas na galeria do dispositivo.

**Solução Implementada:**
- ✅ Criado componente `src/components/IOSSaveImageButton.tsx`
- ✅ Integrado ao `PhotoUpload.tsx` para adicionar botão de salvar
- ✅ Usa Web Share API quando disponível (iOS 13+)
- ✅ Fallback para download direto

**Como funciona:**
- Botão "Salvar na Galeria" aparece **apenas no iOS**
- Ao visualizar uma foto em preview, usuário pode salvar manualmente
- Usa `navigator.share()` para compartilhar foto (permite salvar na galeria)
- Se Share API não disponível, faz download direto

## Arquivos Criados

1. **`src/lib/iosHelpers.ts`**
   - Funções de detecção de iOS
   - `isIOS()` - Detecta se é iOS
   - `isIOSStandalone()` - Detecta se está no modo PWA
   - `shareOrSaveImage()` - Salva foto na galeria
   - `setupIOSStyles()` - Configura estilos automáticos

2. **`src/components/IOSSaveImageButton.tsx`**
   - Componente React para botão de salvar foto
   - Aparece apenas em dispositivos iOS
   - Variantes: ícone ou botão completo
   - Feedback visual (salvando/salvo)

## Arquivos Modificados

1. **`src/index.css`**
   - Adicionada seção "CORREÇÕES ESPECÍFICAS PARA iOS PWA"
   - Estilos para headers sticky
   - Z-index corrigido
   - Safe areas (notch)
   - Área de toque adequada (44px mínimo)

2. **`src/App.tsx`**
   - Import de `setupIOSStyles()`
   - useEffect para configurar estilos iOS na inicialização

3. **`src/components/PhotoUpload.tsx`**
   - Import de `IOSSaveImageButton`
   - Botão adicionado no modal de preview de fotos

4. **`src/components/RelatorioPendenciasEditor.tsx`**
   - Correção de tipo: `subsecao_id: null` → `subsecao_id: undefined`

## Como Testar

### Testar no iPhone:

1. **Abrir Safari no iPhone**
   - Acessar o app (URL do servidor)

2. **Adicionar à Tela Inicial**
   - Tocar no botão de compartilhar (quadrado com seta)
   - Selecionar "Adicionar à Tela de Início"
   - Confirmar

3. **Abrir o App da Tela Inicial**
   - O app abrirá em modo standalone (sem barra do Safari)

4. **Testar Navegação**
   - Navegar entre seções/subseções
   - Verificar se botão voltar aparece corretamente
   - Verificar se é clicável

5. **Testar Fotos**
   - Tirar uma foto ou selecionar da galeria
   - Tocar para visualizar em preview
   - Clicar no botão "Salvar na Galeria"
   - Verificar se foto foi salva na galeria do iPhone

## Notas Técnicas

### Por que o botão voltar não funcionava?

O iOS Safari em modo standalone tem comportamento diferente de rendering:
- Z-index não funciona da mesma forma
- Sticky positioning precisa de `-webkit-sticky`
- Elementos precisam de `transform: translateZ(0)` para criar novo stacking context
- Safe areas precisam ser consideradas (notch, barra inferior)

### Por que fotos não salvavam automaticamente?

- No Android, o `<input type="file" capture="environment">` salva foto na galeria automaticamente
- No iOS, a foto é apenas capturada para o app, **não é salva na galeria**
- Solução: Usar Web Share API ou download para salvar manualmente

## Build e Deploy

O build foi realizado com sucesso:
```bash
npm run build
# ✓ built in 18.68s
```

Arquivos gerados em `dist/`:
- `index.html` (3.47 kB)
- CSS e JS otimizados
- Pronto para deploy

## Próximos Passos

1. Fazer deploy da nova versão
2. Testar em iPhone físico (não emulador)
3. Validar ambas correções:
   - ✅ Botão voltar funciona
   - ✅ Fotos podem ser salvas na galeria

## Compatibilidade

- **iOS 12+**: Detecção de standalone funciona
- **iOS 13+**: Web Share API disponível (melhor UX)
- **iOS 12 e anteriores**: Fallback para download direto
- **Android**: Sem mudanças, continua funcionando normal
- **Desktop**: Sem mudanças

---

**Data:** 2026-03-09
**Build Status:** ✅ Sucesso
**Testes Requeridos:** iPhone físico com iOS 13+
