# App Ronda - Relatório Fotográfico

Aplicativo desktop para criação de relatórios fotográficos de ronda em equipamentos, desenvolvido com Tauri, React e shadcn/ui.

## Características

- ✅ Interface moderna e responsiva com shadcn/ui
- ✅ Gerenciamento de equipamentos com status (ATIVO/EM MANUTENÇÃO)
- ✅ Upload e seleção de fotos do celular/computador
- ✅ Filtros por nome, contrato, endereço e status
- ✅ Impressão em PDF com 4 cards por linha
- ✅ Exportação para JSON
- ✅ Aplicativo desktop nativo com Tauri

## Pré-requisitos

- Node.js 18+ 
- Rust (para compilação do Tauri)
- npm ou yarn

## Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd app-ronda
```

2. **Instale as dependências do frontend**
```bash
npm install
```

3. **Instale as dependências do Rust (Tauri)**
```bash
cd src-tauri
cargo install tauri-cli
cd ..
```

## Desenvolvimento

**Executar em modo de desenvolvimento:**
```bash
npm run tauri dev
```

**Construir para produção:**
```bash
npm run tauri build
```

## Uso

### Adicionar Equipamento
1. Clique em "Novo Equipamento"
2. Preencha os campos obrigatórios:
   - Nome do equipamento
   - Status (ATIVO ou EM MANUTENÇÃO)
   - Contrato
   - Endereço
   - Data e hora
3. Adicione uma foto (opcional)
4. Clique em "Adicionar"

### Gerenciar Equipamentos
- **Editar**: Clique no botão "Editar" em qualquer card
- **Excluir**: Clique no botão "Excluir" e confirme
- **Filtrar**: Use os filtros de busca e status na parte superior

### Imprimir Relatório
1. Clique em "Imprimir"
2. O sistema organizará automaticamente 4 cards por linha
3. Use Ctrl+P para imprimir ou salvar como PDF

### Exportar Dados
- Clique em "Exportar" para baixar os dados em formato JSON

## Estrutura do Projeto

```
app-ronda/
├── src/                    # Código React
│   ├── components/        # Componentes UI
│   ├── types/            # Tipos TypeScript
│   └── lib/              # Utilitários
├── src-tauri/            # Backend Rust (Tauri)
├── public/               # Arquivos estáticos
└── dist/                 # Build de produção
```

## Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Tauri (Rust)
- **Impressão**: react-to-print
- **Ícones**: Lucide React

## Funcionalidades dos Cards

Cada card de equipamento exibe:
- Nome do equipamento
- Status com badge colorido
- Informações do contrato
- Endereço
- Data e hora da ronda
- Foto do equipamento (se disponível)
- Botões de ação (editar/excluir)

## Configuração de Impressão

O sistema automaticamente:
- Organiza 4 cards por linha na impressão
- Oculta botões de ação durante a impressão
- Adiciona cabeçalho com resumo da ronda
- Otimiza layout para PDF

## Suporte

Para suporte ou dúvidas, abra uma issue no repositório.

## Licença

Este projeto está sob licença MIT.
