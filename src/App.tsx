import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AreaTecnicaModal } from '@/components/AreaTecnicaModal';
import { NovaRondaScreen } from '@/components/NovaRondaScreen';
import { GerenciarContratos } from '@/components/GerenciarContratos';
import { KanbanBoard } from '@/components/KanbanBoard';
import { LaudosKanban } from '@/components/LaudosKanban';
import { ParecerTecnico } from '@/components/ParecerTecnico';
import { RelatorioPendencias } from '@/components/RelatorioPendencias';
import { ItensCompilados } from '@/components/ItensCompilados';

import { FotoRondaModal } from '@/components/FotoRondaModal';
import { TabelaRondas } from '@/components/TabelaRondas';
import { VisualizarRonda } from '@/components/VisualizarRonda';
import { RondasPendentes } from '@/components/RondasPendentes';
import { OutroItemCorrigidoModal } from '@/components/OutroItemCorrigidoModal';
import { OutroItemModal } from '@/components/OutroItemModal';
import { EditarRondaModal } from '@/components/EditarRondaModal';
import { Dashboard } from '@/components/Dashboard';
import { LoginScreen } from '@/components/LoginScreen';
import { GerenciarUsuarios } from '@/components/GerenciarUsuarios';
import { AppLayout } from '@/components/AppLayout';
import { MenuLevel } from '@/components/Sidebar';
import { BreadcrumbItem } from '@/components/Breadcrumb';
import { AreaTecnica, Ronda, Contrato, FotoRonda, OutroItemCorrigido, UsuarioAutorizado } from '@/types';
import { FileText, Building2, BarChart3, LogOut, User, Kanban, FileCheck, ArrowLeft, Hammer, Shield } from 'lucide-react';

import { contratoService, rondaService, areaTecnicaService, fotoRondaService, outroItemService } from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';
import { authService } from '@/lib/auth';
import { syncService } from '@/lib/syncService';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ColetaOffline } from '@/components/ColetaOffline';
import { ColetaInspecao } from '@/components/ColetaInspecao';
import { setupIOSStyles } from '@/lib/iosHelpers';


function App() {
  // Estados com dados iniciais vazios
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);

  // Função para garantir que arrays nunca sejam null/undefined
  const ensureArray = (arr: any[] | null | undefined): any[] => {
    return Array.isArray(arr) ? arr.filter(item => item != null) : [];
  };

  // Estados de autenticação
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioAutorizado | null>(null);
  const [isAutenticado, setIsAutenticado] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAreaTecnica, setEditingAreaTecnica] = useState<AreaTecnica | null>(null);
  const [editingFotoRonda, setEditingFotoRonda] = useState<FotoRonda | null>(null);
  const [isFotoRondaModalOpen, setIsFotoRondaModalOpen] = useState(false);
  const [editingOutroItem, setEditingOutroItem] = useState<OutroItemCorrigido | null>(null);
  const [isOutroItemModalOpen, setIsOutroItemModalOpen] = useState(false);
  const [isEditarRondaModalOpen, setIsEditarRondaModalOpen] = useState(false);

  const [currentView, setCurrentView] = useState<'contratos' | 'rondas'>('contratos');
  const [mainSection, setMainSection] = useState<'contratos' | 'agenda' | 'chamados' | 'dashboard'>('contratos');
  const [contratoSelecionado, setContratoSelecionado] = useState<Contrato | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const [viewMode, setViewMode] = useState<'tabela' | 'visualizar' | 'nova' | 'dashboard' | 'kanban' | 'laudos' | 'parecer' | 'relatorios-pendencias' | 'itens-compilados' | 'coleta' | 'coleta-inspecao' | 'usuarios' | 'menu' | 'contrato-detalhe' | 'plano-manutencao'>('menu');
  const [rondaSelecionada, setRondaSelecionada] = useState<Ronda | null>(null);
  const [rondasCompletas, setRondasCompletas] = useState<Ronda[]>([]);

  // Estado para template pré-selecionado ao iniciar ronda a partir de alerta de pendência
  const [templateInicialRonda, setTemplateInicialRonda] = useState<'SEMANAL' | 'MENSAL' | 'BIMESTRAL' | null>(null);

  // Estado para o novo menu lateral
  const [menuLevel, setMenuLevel] = useState<MenuLevel>('main');
  const [subMenuType, setSubMenuType] = useState<'implantacao' | 'supervisao' | null>(null);

  // CORREÇÃO: Limpar localStorage inválido na inicialização
  useEffect(() => {
    try {
      const salvo = localStorage.getItem('appRonda_rondaSelecionada');
      if (salvo) {
        const ronda = JSON.parse(salvo);
        // Se a ronda salva tem campos vazios, limpar
        if (!ronda || !ronda.id || ronda.id.trim() === '' || !ronda.nome || ronda.nome.trim() === '') {
          // Limpando localStorage com dados inválidos
          localStorage.removeItem('appRonda_rondaSelecionada');
          setRondaSelecionada(null);
        } else {
          // Verificar se o contrato da ronda ainda existe (apenas se há contratos carregados)
          if (contratos.length > 0) {
            const contratosExistentes = contratos.map(c => c.nome);
            if (!contratosExistentes.includes(ronda.contrato)) {
              // Contrato não existe mais, limpando ronda selecionada
              localStorage.removeItem('appRonda_rondaSelecionada');
              setRondaSelecionada(null);
            }
          }
        }
      }
    } catch (error) {
      // Erro ao verificar localStorage, limpando
      localStorage.removeItem('appRonda_rondaSelecionada');
      setRondaSelecionada(null);
    }
  }, [contratos]); // Adicionar contratos como dependência

  // Iniciar sincronização automática offline
  useEffect(() => {
    syncService.startAutoSync();
  }, []);

  useEffect(() => {
    // FORÇAR tema escuro com JavaScript
    const root = document.documentElement;
    const body = document.body;

    // Aplicar classes e estilos
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
    root.style.backgroundColor = 'rgb(15 23 42)';
    root.style.color = 'rgb(248 250 252)';

    body.classList.add('dark');
    body.style.backgroundColor = 'rgb(15 23 42)';
    body.style.color = 'rgb(248 250 252)';

    // Forçar no elemento root da React
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.backgroundColor = 'rgb(15 23 42)';
      rootElement.style.color = 'rgb(248 250 252)';
      rootElement.style.minHeight = '100vh';
    }

    // Salvar no localStorage
    try {
      localStorage.setItem('theme', 'dark');
    } catch { }

    console.log('🌙 Tema escuro forçado via JavaScript');
  }, []);

  // Configurar estilos específicos para iOS standalone
  useEffect(() => {
    setupIOSStyles();
    console.log('📱 Estilos iOS configurados');
  }, []);

  // Debug: Log do estado dos dados
  useEffect(() => {
    console.log('📊 Estado atual dos dados:', {
      contratos: contratos.length,
      rondas: rondas.length,
      contratoSelecionado: contratoSelecionado?.nome || 'nenhum',
      currentView,
      usuarioLogado: usuarioLogado?.nome || 'não logado',
      contratosData: contratos,
      rondasData: rondas
    });

    // Debug específico para rondas
    if (rondas.length > 0) {
      console.log('🔄 Rondas carregadas:', rondas.map(r => ({
        id: r.id,
        nome: r.nome,
        data: r.data,
        areasTecnicas: r.areasTecnicas?.length || 0,
        fotosRonda: r.fotosRonda?.length || 0
      })));
    } else {
      console.log('⚠️ Nenhuma ronda carregada');
    }
  }, [contratos, rondas, contratoSelecionado, currentView, usuarioLogado]);

  // Log para debug da ronda selecionada (apenas quando válida)
  useEffect(() => {
    if (rondaSelecionada && rondaSelecionada.id && rondaSelecionada.id.trim() !== '') {
      console.log('✅ Ronda selecionada válida:', rondaSelecionada);
    }
  }, [rondaSelecionada?.id]);

  // CORREÇÃO: Garantir que `rondaSelecionada` nunca fique inválida e seja persistida
  const lastRondaId = useRef<string | null>(null);

  // CORREÇÃO: Ref para preservar roteiro de rondas recém-criadas com template
  const rondaRoteiroRef = useRef<{ id: string; roteiro: string[]; templateRonda?: string } | null>(null);

  // CORREÇÃO: Flag para pular reload após criação de ronda
  const skipNextReloadRef = useRef<boolean>(false);

  useEffect(() => {
    // Evitar execução desnecessária se o ID não mudou
    const currentId = rondaSelecionada?.id || null;
    if (currentId === lastRondaId.current) {
      return;
    }
    lastRondaId.current = currentId;

    // Validação mais suave: apenas verificar campos essenciais
    const isInvalida = !rondaSelecionada ||
      !rondaSelecionada.id ||
      rondaSelecionada.id.trim() === '' ||
      rondaSelecionada.id.startsWith('temp-');

    if (isInvalida) {
      // Se é um objeto com ID inválido, limpar completamente
      if (rondaSelecionada && typeof rondaSelecionada === 'object' &&
        (!rondaSelecionada.id || rondaSelecionada.id.trim() === '' || rondaSelecionada.id.startsWith('temp-'))) {
        setRondaSelecionada(null);
        return;
      }

      // Se é null, tentar recuperar do localStorage APENAS UMA VEZ
      if (rondaSelecionada === null) {
        try {
          const salvo = localStorage.getItem('appRonda_rondaSelecionada');
          if (salvo) {
            const recuperada: Ronda = JSON.parse(salvo);
            // Validar se a ronda recuperada é válida
            if (recuperada &&
              recuperada.id &&
              recuperada.id.trim() !== '' &&
              !recuperada.id.startsWith('temp-') &&
              recuperada.nome &&
              recuperada.nome.trim() !== '' &&
              recuperada.contrato &&
              recuperada.contrato.trim() !== '') {
              setRondaSelecionada(recuperada);
            } else {
              localStorage.removeItem('appRonda_rondaSelecionada');
            }
          }
        } catch (error) {
          localStorage.removeItem('appRonda_rondaSelecionada');
        }
      }
    } else {
      // Ronda válida, salvar no localStorage
      try {
        localStorage.setItem('appRonda_rondaSelecionada', JSON.stringify(rondaSelecionada));
        (window as any).__rondaSelecionada = rondaSelecionada;
      } catch (error) {
        // Silenciar erro de localStorage
      }
    }
  }, [rondaSelecionada?.id]); // Usar apenas ID como dependência

  // Log para debug do modal
  useEffect(() => {
    console.log('Modal mudou:', { isModalOpen, editingAreaTecnica });
    console.log('Stack trace:', new Error().stack);

    // Verificar se o modal está sendo fechado automaticamente
    if (isModalOpen === false && editingAreaTecnica) {
      console.warn('⚠️ ATENÇÃO: Modal foi fechado mas editingAreaTecnica ainda existe!');
      console.warn('Stack trace do fechamento:', new Error().stack);
    }
  }, [isModalOpen, editingAreaTecnica]);

  // Log para debug do contrato selecionado
  useEffect(() => {
    console.log('Contrato selecionado mudou:', contratoSelecionado);
  }, [contratoSelecionado]);

  // Verificar autenticação ao carregar a aplicação
  useEffect(() => {
    const verificarAutenticacao = () => {
      const sessaoRestaurada = authService.restaurarSessao();
      if (sessaoRestaurada) {
        const usuario = authService.getUsuarioAtual();
        if (usuario) {
          setUsuarioLogado(usuario);
          setIsAutenticado(true);
          console.log('✅ Sessão restaurada para:', usuario.nome);
        }
      }
    };

    verificarAutenticacao();
  }, []);

  // Atualizar atividade do usuário periodicamente
  useEffect(() => {
    if (isAutenticado) {
      const interval = setInterval(() => {
        authService.atualizarAtividade();
      }, 60000); // A cada minuto

      return () => clearInterval(interval);
    }
  }, [isAutenticado]);



  // Funções de autenticação
  const handleLoginSuccess = (usuario: any) => {
    setUsuarioLogado(usuario);
    setIsAutenticado(true);
    console.log('✅ Login realizado com sucesso:', usuario.nome);
  };

  const handleLogout = async () => {
    try {
      await authService.fazerLogout();
      setUsuarioLogado(null);
      setIsAutenticado(false);
      setContratoSelecionado(null);
      setRondaSelecionada(null);
      setViewMode('tabela');
      localStorage.removeItem('appRonda_contratoSelecionado');
      localStorage.removeItem('appRonda_rondaSelecionada');
      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  };

  // Função para limpar estado completamente
  const limparEstadoCompleto = () => {
    console.log('🧹 Limpando estado completo da aplicação...');
    setRondaSelecionada(null);
    setContratoSelecionado(null);
    setViewMode('tabela');
    localStorage.removeItem('appRonda_rondaSelecionada');
    localStorage.removeItem('appRonda_contratoSelecionado');
    localStorage.removeItem('appRonda_contratos');
    localStorage.removeItem('appRonda_rondas');
    console.log('✅ Estado limpo com sucesso');
  };

  // Função de debug para testar conexão com banco
  const debugDatabaseConnection = async () => {
    try {
      console.log('🔍 DEBUG: Testando conexão com banco...');

      // Testar conexão básica
      const { data, error } = await supabase
        .from('rondas')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Erro na conexão:', error);
        alert(`Erro na conexão: ${error.message}`);
      } else {
        console.log('✅ Conexão OK:', data);

        // Testar busca de rondas
        const rondas = await rondaService.getAll();
        console.log('📊 Rondas encontradas:', rondas.length);
        console.log('📋 Dados das rondas:', rondas);

        alert(`Conexão OK! Encontradas ${rondas.length} rondas no banco.`);
      }
    } catch (error) {
      console.error('❌ Erro no debug:', error);
      alert(`Erro no debug: ${error}`);
    }
  };

  // Estado para controlar carregamento de rondas por contrato (lazy loading)
  const [loadingContrato, setLoadingContrato] = useState<string | null>(null);
  const [rondasCarregadas, setRondasCarregadas] = useState<Set<string>>(new Set());

  // Carregar APENAS contratos ao iniciar (LAZY LOADING - rondas só quando clica no contrato)
  useEffect(() => {
    const loadContratosOnly = async () => {
      try {
        setIsLoading(true);
        console.log('🚀 LAZY LOADING: Carregando apenas contratos...');

        // Buscar SOMENTE contratos (rápido!)
        const contratosFromDB = await contratoService.getAll();

        console.log(`✅ ${contratosFromDB.length} contratos carregados rapidamente`);
        setContratos(contratosFromDB);

        // Se não há contratos, criar exemplo
        if (contratosFromDB.length === 0) {
          console.log('📝 Nenhum contrato encontrado, criando exemplo...');
          const contrato1 = await contratoService.create({
            nome: 'CT001/2024 - Manutenção Preventiva',
            sindico: 'Maria Santos',
            endereco: 'Rua das Flores, 123 - Centro',
            periodicidade: 'MENSAL',
            status: 'IMPLANTADO',
            observacoes: 'Contrato de manutenção preventiva mensal',
            dataCriacao: '2024-01-01T00:00:00.000Z'
          });
          setContratos([contrato1]);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar contratos:', error);
        // Fallback para localStorage
        try {
          const savedContratos = localStorage.getItem('appRonda_contratos');
          if (savedContratos) {
            setContratos(JSON.parse(savedContratos));
          }
        } catch (e) {
          console.error('❌ Erro ao acessar localStorage:', e);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadContratosOnly();
  }, []);

  // Função para carregar rondas de um contrato específico (LAZY LOADING)
  const carregarRondasDoContrato = async (contratoNome: string) => {
    // Se já carregou as rondas desse contrato, não carrega de novo
    if (rondasCarregadas.has(contratoNome)) {
      console.log(`⚡ Rondas do contrato "${contratoNome}" já em cache`);
      return;
    }

    try {
      setLoadingContrato(contratoNome);
      console.log(`⚡ LAZY LOADING: Carregando rondas do contrato "${contratoNome}"...`);

      // ⚡ OTIMIZADO: Buscar apenas rondas deste contrato (sem dados completos)
      const rondasDoContrato = await rondaService.getByContrato(contratoNome);

      console.log(`✅ ${rondasDoContrato.length} rondas carregadas para "${contratoNome}"`);

      // Adicionar ao estado (mantendo as já existentes de outros contratos)
      setRondas(prev => {
        const outrasRondas = prev.filter(r => r.contrato !== contratoNome);
        return [...outrasRondas, ...rondasDoContrato];
      });

      // Marcar como carregado
      setRondasCarregadas(prev => new Set([...prev, contratoNome]));
    } catch (error) {
      console.error(`❌ Erro ao carregar rondas do contrato "${contratoNome}":`, error);
    } finally {
      setLoadingContrato(null);
    }
  };

  // Restaurar contrato selecionado do localStorage - APENAS na primeira carga
  const [jaRestaurou, setJaRestaurou] = useState(false);
  useEffect(() => {
    // Só restaurar UMA VEZ na inicialização, não toda vez que contratoSelecionado mudar
    if (contratos.length > 0 && !contratoSelecionado && !jaRestaurou) {
      setJaRestaurou(true); // Marca que já tentou restaurar
      try {
        const contratoSalvoId = localStorage.getItem('appRonda_contratoSelecionado');
        if (contratoSalvoId) {
          const contrato = contratos.find(c => c.id === contratoSalvoId);
          if (contrato) {
            console.log('🔄 Restaurando contrato selecionado (apenas na inicialização):', contrato.nome);
            setContratoSelecionado(contrato);
            setCurrentView('rondas');
            setMenuLevel('contrato');
            setViewMode('contrato-detalhe');
          } else {
            localStorage.removeItem('appRonda_contratoSelecionado');
          }
        }
      } catch (error) {
        console.error('Erro ao restaurar contrato selecionado:', error);
        localStorage.removeItem('appRonda_contratoSelecionado');
      }
    }
  }, [contratos]); // Remover contratoSelecionado das dependências!

  // Salvar contrato selecionado no localStorage sempre que mudar
  useEffect(() => {
    if (contratoSelecionado) {
      localStorage.setItem('appRonda_contratoSelecionado', contratoSelecionado.id);
      console.log('💾 Contrato selecionado salvo no localStorage:', contratoSelecionado.nome);
    } else {
      localStorage.removeItem('appRonda_contratoSelecionado');
    }
  }, [contratoSelecionado]);

  // Salvar rondas automaticamente sempre que mudarem
  useEffect(() => {
    // As rondas agora são salvas diretamente no banco quando criadas/editadas
    // Este useEffect não é mais necessário para localStorage
  }, [rondas]);

  // Recarregar dados da ronda quando entrar no modo visualizar
  useEffect(() => {
    if (viewMode === 'visualizar' && rondaSelecionada) {
      const recarregarDadosRonda = async () => {
        try {
          // CORREÇÃO: Verificar se devemos pular o reload (ronda acabou de ser criada)
          if (skipNextReloadRef.current) {
            console.log('🚫 PULANDO RELOAD - ronda acabou de ser criada!');
            console.log('🚫 rondaSelecionada atual:', {
              id: rondaSelecionada.id,
              nome: rondaSelecionada.nome,
              roteiro: rondaSelecionada.roteiro?.length || 0,
              templateRonda: rondaSelecionada.templateRonda
            });
            // Resetar o flag após pular
            skipNextReloadRef.current = false;
            return;
          }

          console.log('🔄 Recarregando dados da ronda para modo visualizar:', rondaSelecionada.id);
          console.log('🔄 Estado atual da ronda antes de recarregar:', {
            id: rondaSelecionada.id,
            nome: rondaSelecionada.nome,
            fotosRonda: rondaSelecionada.fotosRonda?.length || 0,
            areasTecnicas: rondaSelecionada.areasTecnicas?.length || 0,
            roteiro: rondaSelecionada.roteiro?.length || 0
          });

          // CORREÇÃO: Verificar se há roteiro guardado na ref (ronda recém-criada com template)
          const roteiroFromRef = rondaRoteiroRef.current;
          if (roteiroFromRef && roteiroFromRef.id === rondaSelecionada.id) {
            console.log('📋 Roteiro encontrado na ref! Restaurando...', roteiroFromRef);

            // Atualizar a ronda com o roteiro da ref
            const rondaComRoteiroRef = {
              ...rondaSelecionada,
              roteiro: roteiroFromRef.roteiro,
              templateRonda: roteiroFromRef.templateRonda
            };

            setRondaSelecionada(rondaComRoteiroRef);
            setRondas(prev => prev.map(r => r.id === rondaComRoteiroRef.id ? rondaComRoteiroRef : r));

            // Limpar a ref depois de usar
            rondaRoteiroRef.current = null;
            console.log('✅ Roteiro restaurado da ref com sucesso!', rondaComRoteiroRef.roteiro?.length, 'itens');
            return;
          }

          // Verificar se é uma ronda local (não está no banco)
          if (rondaSelecionada.id.startsWith('local-')) {
            console.log('🏠 Ronda local detectada, não recarregando do banco');
            return;
          }

          // Verificar se a ronda já tem fotos carregadas
          if (rondaSelecionada.fotosRonda && rondaSelecionada.fotosRonda.length > 0) {
            console.log('📸 Ronda já tem fotos carregadas, não recarregando:', rondaSelecionada.fotosRonda.length);
            return;
          }

          // IMPORTANTE: Se a ronda já tem roteiro, não recarregar do banco
          // (rondas criadas com template já vêm com o roteiro preenchido)
          if (rondaSelecionada.roteiro && rondaSelecionada.roteiro.length > 0) {
            console.log('📋 Ronda já tem roteiro no estado, não recarregando do banco:', rondaSelecionada.roteiro.length, 'itens');
            return;
          }

          // Verificar se o ID da ronda é válido antes de buscar
          if (!rondaSelecionada.id || rondaSelecionada.id.trim() === '') {
            // ID inválido, não recarregar
            return;
          }

          // Buscar ronda atualizada do banco com todos os dados relacionados
          const rondaAtualizada = await rondaService.getById(rondaSelecionada.id);

          if (rondaAtualizada) {
            console.log('✅ Ronda recarregada do banco:', rondaAtualizada);
            console.log('📸 Fotos encontradas:', rondaAtualizada.fotosRonda?.length || 0);
            console.log('🔧 Áreas técnicas encontradas:', rondaAtualizada.areasTecnicas?.length || 0);

            // IMPORTANTE: Preservar roteiro e checklistItems do estado atual ou da ref
            // pois podem não estar salvos no banco ainda
            const roteiroPreservado = rondaAtualizada.roteiro ||
                                       rondaSelecionada.roteiro ||
                                       (roteiroFromRef?.id === rondaSelecionada.id ? roteiroFromRef.roteiro : []);

            const rondaComRoteiro = {
              ...rondaAtualizada,
              roteiro: roteiroPreservado,
              templateRonda: rondaAtualizada.templateRonda || rondaSelecionada.templateRonda || roteiroFromRef?.templateRonda,
              checklistItems: rondaAtualizada.checklistItems || rondaSelecionada.checklistItems || []
            };

            console.log('✅ Roteiro preservado:', rondaComRoteiro.roteiro);
            console.log('✅ ChecklistItems preservados:', rondaComRoteiro.checklistItems?.length || 0);

            // Atualizar estado local com dados frescos do banco + dados preservados
            setRondaSelecionada(rondaComRoteiro);
            setRondas(prev => prev.map(r => r.id === rondaComRoteiro.id ? rondaComRoteiro : r));

            console.log('✅ Estado atualizado após recarregar:', {
              id: rondaComRoteiro.id,
              nome: rondaComRoteiro.nome,
              fotosRonda: rondaComRoteiro.fotosRonda?.length || 0,
              areasTecnicas: rondaComRoteiro.areasTecnicas?.length || 0,
              roteiro: rondaComRoteiro.roteiro?.length || 0
            });
          } else {
            console.warn('⚠️ Ronda não encontrada no banco, mantendo estado atual');
          }
        } catch (error) {
          console.error('❌ Erro ao recarregar dados da ronda:', error);
        }
      };

      recarregarDadosRonda();
    } else {
      console.log('🔄 useEffect não executado:', { viewMode, rondaSelecionada: !!rondaSelecionada });
    }
  }, [viewMode, rondaSelecionada?.id]);

  // Filtrar rondas pelo contrato selecionado
  const rondasDoContrato = contratoSelecionado
    ? rondas.filter(r => r.contrato === contratoSelecionado.nome)
    : [];

  // OTIMIZADO: Usar rondas básicas inicialmente, carregar completas só quando necessário
  useEffect(() => {
    if (contratoSelecionado && rondasDoContrato.length > 0) {
      // Usar dados básicos imediatamente (sem loading)
      const rondasValidas = rondasDoContrato.filter(ronda => ronda && ronda.id && ronda.id.trim() !== '');
      setRondasCompletas(rondasValidas);
      console.log('⚡ Rondas básicas setadas:', rondasValidas.length);
    } else {
      setRondasCompletas([]);
    }
  }, [contratoSelecionado?.nome, rondas.length]);

  // Filtrar áreas técnicas pelo contrato selecionado
  const areasTecnicasDoContrato = contratoSelecionado
    ? rondasCompletas.flatMap(ronda => ronda.areasTecnicas)
    : [];

  const handleAddRonda = () => {
    if (!contratoSelecionado) {
      alert('Por favor, selecione um contrato primeiro');
      return;
    }
    // Limpar template inicial antes de abrir nova ronda manual
    setTemplateInicialRonda(null);
    setViewMode('nova');
  };

  // Handler para iniciar ronda a partir do alerta de pendência
  const handleIniciarRondaPendente = (template: 'SEMANAL' | 'MENSAL' | 'BIMESTRAL') => {
    if (!contratoSelecionado) {
      alert('Por favor, selecione um contrato primeiro');
      return;
    }
    // Definir template inicial e abrir tela de nova ronda
    setTemplateInicialRonda(template);
    setViewMode('nova');
  };

  const handleSaveRonda = async (rondaData: {
    nome: string;
    data: string;
    hora: string;
    observacoesGerais?: string;
    tipoVisita?: 'RONDA' | 'REUNIAO' | 'OUTROS';
    templateRonda?: string;
    roteiro?: string[];
    areasTecnicasSugeridas?: string[];
    objetivoRelatorio?: string;
  }) => {
    try {
      console.log('🔄 Iniciando criação de nova ronda:', rondaData);
      console.log('🔄 Contrato selecionado:', contratoSelecionado);
      console.log('🔄 Template:', rondaData.templateRonda);
      console.log('🔄 Roteiro:', rondaData.roteiro);
      console.log('🔄 Objetivo:', rondaData.objetivoRelatorio?.substring(0, 50) + '...');

      // Criar ronda básica no banco (sem áreas técnicas primeiro)
      const rondaBasica = await rondaService.create({
        nome: rondaData.nome,
        contrato: contratoSelecionado!.nome,
        data: rondaData.data,
        hora: rondaData.hora,
        tipoVisita: rondaData.tipoVisita || 'RONDA',
        templateRonda: rondaData.templateRonda,
        roteiro: rondaData.roteiro || [],
        objetivoRelatorio: rondaData.objetivoRelatorio,
        responsavel: 'Ricardo Oliveira',
        observacoesGerais: rondaData.observacoesGerais,
        areasTecnicas: [], // Criar sem áreas primeiro
        checklistItems: [], // Checklist vazio para começar
        fotosRonda: [],
        outrosItensCorrigidos: []
      });

      console.log('✅ Ronda básica criada no banco:', rondaBasica);

      // Criar a ronda final com roteiro e objetivo
      const rondaFinal = {
        ...rondaBasica,
        areasTecnicas: [], // Começar vazio, usuário adiciona manualmente
        roteiro: rondaData.roteiro || [],
        templateRonda: rondaData.templateRonda,
        objetivoRelatorio: rondaData.objetivoRelatorio,
        checklistItems: []
      };

      console.log('✅ Ronda final criada:', rondaFinal);
      console.log('✅ Roteiro incluído:', rondaFinal.roteiro);

      // IMPORTANTE: Pular o próximo reload do useEffect
      // A ronda acabou de ser criada, não precisa recarregar do banco
      skipNextReloadRef.current = true;
      console.log('🚫 skipNextReloadRef setado para TRUE');

      // IMPORTANTE: Guardar roteiro na ref ANTES de setar o estado
      // Isso evita que o useEffect de reload perca o roteiro
      if (rondaFinal.roteiro && rondaFinal.roteiro.length > 0) {
        rondaRoteiroRef.current = {
          id: rondaFinal.id,
          roteiro: rondaFinal.roteiro,
          templateRonda: rondaFinal.templateRonda
        };
        console.log('📋 Roteiro salvo na ref para proteção:', rondaRoteiroRef.current);
      }

      // Atualizar estado local
      setRondas(prev => [...prev, rondaFinal]);
      setRondaSelecionada(rondaFinal);
      setViewMode('visualizar');

      console.log('✅ Ronda completa criada e salva no banco!');
      console.log('🔍 Debug - rondaFinal definida como rondaSelecionada:', {
        id: rondaFinal.id,
        nome: rondaFinal.nome,
        idType: typeof rondaFinal.id,
        idLength: rondaFinal.id?.length,
        roteiro: rondaFinal.roteiro,
        roteiroLength: rondaFinal.roteiro?.length || 0,
        templateRonda: rondaFinal.templateRonda
      });
    } catch (error) {
      console.error('❌ Erro ao criar ronda no banco:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`❌ Erro ao criar ronda:\n\n${errorMessage}\n\nPor favor, verifique sua conexão com a internet e tente novamente.`);
    }
  };

  const handleAddAreaTecnica = () => {
    console.log('🔧 handleAddAreaTecnica chamado');

    // CORREÇÃO: Validação mais rigorosa da ronda selecionada
    if (!rondaSelecionada) {
      alert('Por favor, selecione ou crie uma ronda primeiro');
      return;
    }

    // Validar todos os campos obrigatórios da ronda
    if (!rondaSelecionada.id ||
      rondaSelecionada.id.trim() === '' ||
      rondaSelecionada.id.startsWith('temp-') ||
      !rondaSelecionada.nome ||
      rondaSelecionada.nome.trim() === '' ||
      !rondaSelecionada.contrato ||
      rondaSelecionada.contrato.trim() === '') {
      console.error('❌ Ronda inválida ao tentar adicionar área técnica:', {
        id: rondaSelecionada.id,
        nome: rondaSelecionada.nome,
        contrato: rondaSelecionada.contrato
      });
      alert('❌ Erro: A ronda selecionada não é válida. Por favor, selecione uma ronda válida e tente novamente.');
      // Limpar ronda inválida
      setRondaSelecionada(null);
      return;
    }

    setEditingAreaTecnica(null);
    setIsModalOpen(true);
    console.log('Modal aberto para adicionar nova área técnica');
  };

  const handleDeleteAreaTecnica = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta área técnica?')) {
      try {
        if (!rondaSelecionada) {
          console.error('❌ Nenhuma ronda selecionada para excluir área técnica');
          return;
        }

        console.log('🗑️ Excluindo área técnica com ID:', id);

        // Excluir do banco de dados
        await areaTecnicaService.delete(id);
        console.log('✅ Área técnica excluída do banco com sucesso');

        // Atualizar estado local
        const updatedAreasTecnicas = rondaSelecionada.areasTecnicas.filter((at: AreaTecnica) => at.id !== id);
        const updatedRonda = {
          ...rondaSelecionada,
          areasTecnicas: updatedAreasTecnicas
        };

        // Atualizar estado global
        setRondas(prev => prev.map(ronda =>
          ronda.id === rondaSelecionada.id ? updatedRonda : ronda
        ));

        // Atualizar ronda selecionada
        setRondaSelecionada(updatedRonda);

        console.log('✅ Área técnica excluída com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao excluir área técnica:', error);
        alert('Erro ao excluir área técnica. Verifique o console para mais detalhes.');
      }
    }
  };

  const handleSaveAreaTecnica = async (areaTecnica: AreaTecnica) => {
    console.log('💾 Salvando área técnica:', areaTecnica.nome);

    if (!rondaSelecionada) {
      console.error('❌ Nenhuma ronda selecionada!');
      alert('Erro: Nenhuma ronda selecionada. Recarregue a página e tente novamente.');
      return;
    }

    // CORREÇÃO: Garantir que sempre temos um ID válido
    let rondaId = rondaSelecionada.id;
    let rondaAtualizada = rondaSelecionada;

    // Se o ID está vazio, tentar recuperar do localStorage
    if (!rondaId || rondaId.trim() === '') {
      try {
        const salvo = localStorage.getItem('appRonda_rondaSelecionada');
        const rec: Ronda | null = salvo ? JSON.parse(salvo) : null;
        if (rec?.id && rec.id.trim() !== '') {
          rondaId = rec.id;
          rondaAtualizada = rec;
          console.log('🔄 ID recuperado do localStorage:', rondaId);
          // Atualizar o estado com a ronda recuperada
          setRondaSelecionada(rec);
        } else {
          console.error('❌ ID da ronda está vazio ou inválido!', rondaId);
          alert('❌ Erro: A ronda não tem um ID válido. Por favor, selecione uma ronda válida e tente novamente.');
          return;
        }
      } catch (error) {
        console.error('❌ Erro ao recuperar ronda do localStorage:', error);
        alert('❌ Erro: Não foi possível recuperar os dados da ronda. Por favor, selecione uma ronda válida e tente novamente.');
        return;
      }
    }

    // VALIDAÇÃO FINAL: Garantir que temos um ID válido antes de prosseguir
    if (!rondaId || rondaId.trim() === '' || rondaId.startsWith('temp-')) {
      console.error('❌ ID da ronda ainda está vazio após tentativas de recuperação!', rondaId);
      alert('❌ Erro crítico: Não foi possível obter um ID válido para a ronda. Por favor, recarregue a página e selecione uma ronda válida.');
      return;
    }

    try {
      let areaSalva: AreaTecnica;

      if (editingAreaTecnica) {
        // Editando área existente - atualizar no banco
        console.log('🔄 Editando área técnica existente no banco:', areaTecnica);
        const areaAtualizada = await areaTecnicaService.update(areaTecnica.id, areaTecnica);
        // Mapear teste_status do banco para testeStatus do frontend
        areaSalva = {
          ...areaAtualizada,
          testeStatus: (areaAtualizada as any).teste_status || (areaAtualizada as any).testeStatus || areaTecnica.testeStatus
        };
        console.log('✅ Área técnica atualizada no banco:', areaSalva);
      } else {
        // Adicionando nova área - criar no banco
        console.log('🆕 Criando nova área técnica no banco:', areaTecnica);
        const { id, ...areaSemId } = areaTecnica;
        const areaCriada = await areaTecnicaService.create({
          ...areaSemId,
          ronda_id: rondaId
        });
        // Mapear teste_status do banco para testeStatus do frontend
        areaSalva = {
          ...areaCriada,
          testeStatus: (areaCriada as any).teste_status || (areaCriada as any).testeStatus || areaTecnica.testeStatus
        };
        console.log('✅ Nova área técnica criada no banco:', areaSalva);
      }

      // Atualizar estado local
      const updatedAreasTecnicas = editingAreaTecnica
        ? rondaSelecionada.areasTecnicas.map(at => at.id === areaSalva.id ? areaSalva : at)
        : [...rondaSelecionada.areasTecnicas, areaSalva];

      const updatedRonda = { ...rondaSelecionada, areasTecnicas: updatedAreasTecnicas };

      // Atualizar estado global
      setRondas(prev => prev.map(ronda =>
        ronda.id === rondaSelecionada.id ? updatedRonda : ronda
      ));

      // Atualizar a ronda selecionada também
      setRondaSelecionada(updatedRonda);

      // Fechar modal
      setIsModalOpen(false);
      setEditingAreaTecnica(null);

      console.log('✅ Área técnica salva com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar área técnica:', error);

      if (error instanceof Error) {
        if (error.message.includes('Timeout')) {
          alert('⏱️ Operação demorou muito para responder. Tente novamente ou verifique sua conexão.');
        } else if (error.message.includes('canceling statement')) {
          alert('🔄 Operação foi cancelada devido ao tempo limite. Tente novamente.');
        } else {
          alert(`❌ Erro ao salvar área técnica: ${error.message || 'Erro desconhecido'}`);
        }
      } else {
        alert('❌ Erro desconhecido ao salvar área técnica');
      }
    }
  };





  const exportToJSON = () => {
    if (!rondaSelecionada) {
      alert('Por favor, selecione uma ronda para exportar');
      return;
    }
    const dataStr = JSON.stringify(rondaSelecionada, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ronda-${rondaSelecionada.nome.replace(/\s+/g, '-')}-${rondaSelecionada.data}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveContrato = async (contrato: Contrato) => {
    try {
      console.log('💾 Salvando contrato no banco:', contrato);

      let contratoSalvo: Contrato;

      // Verificar se o contrato já existe no banco
      const contratoExiste = contratos.find(c => c.id === contrato.id);

      if (contratoExiste) {
        // Editando contrato existente que está no banco
        console.log('🔄 Editando contrato existente:', contrato.id);
        contratoSalvo = await contratoService.update(contrato.id, contrato);
        console.log('✅ Contrato atualizado no banco:', contratoSalvo);
      } else {
        // Criando novo contrato
        console.log('🆕 Criando novo contrato');
        const { id, ...contratoSemId } = contrato;
        contratoSalvo = await contratoService.create(contratoSemId);
        console.log('✅ Contrato criado no banco:', contratoSalvo);
      }

      // Atualizar estado local
      setContratos(prev => {
        const existingIndex = prev.findIndex(c => c.id === contratoSalvo.id);
        if (existingIndex >= 0) {
          return prev.map(c => c.id === contratoSalvo.id ? contratoSalvo : c);
        } else {
          return [...prev, contratoSalvo];
        }
      });

      // Atualizar contrato selecionado se necessário
      if (contratoSelecionado && contratoSelecionado.id === contratoSalvo.id) {
        setContratoSelecionado(contratoSalvo);
      }

      console.log('✅ Contrato salvo com sucesso no banco');
    } catch (error) {
      console.error('❌ Erro ao salvar contrato no banco:', error);
      console.log('🔄 Salvando contrato no localStorage como fallback...');

      // Fallback para localStorage
      try {
        const contratoComId = {
          ...contrato,
          id: contrato.id || crypto.randomUUID()
        };

        const contratosAtualizados = contrato.id
          ? contratos.map(c => c.id === contrato.id ? contratoComId : c)
          : [...contratos, contratoComId];

        localStorage.setItem('appRonda_contratos', JSON.stringify(contratosAtualizados));
        setContratos(contratosAtualizados);

        if (contratoSelecionado && contratoSelecionado.id === contratoComId.id) {
          setContratoSelecionado(contratoComId);
        }

        console.log('✅ Contrato salvo no localStorage');
        alert('Contrato salvo localmente (modo offline)');
      } catch (storageError) {
        console.error('❌ Erro ao salvar no localStorage:', storageError);
        alert('Erro ao salvar contrato. Verifique o console.');
      }
    }
  };

  const handleDeleteContrato = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.')) {
      try {
        // Deletar do banco
        await contratoService.delete(id);
        console.log('✅ Contrato deletado do banco');

        // Atualizar estado local
        setContratos(prev => prev.filter(c => c.id !== id));

        // Se o contrato deletado era o selecionado, limpar a seleção
        if (contratoSelecionado && contratoSelecionado.id === id) {
          setContratoSelecionado(null);
          setCurrentView('contratos');
          setViewMode('tabela');
        }
      } catch (error) {
        console.error('❌ Erro ao deletar contrato do banco:', error);
        alert('Erro ao deletar contrato. Verifique o console.');
      }
    }
  };

  const handleLimparDados = () => {
    if (confirm('ATENÇÃO: Esta ação irá apagar TODOS os dados da aplicação (contratos, rondas, áreas técnicas, fotos). Esta ação não pode ser desfeita. Tem certeza?')) {
      localStorage.removeItem('appRonda_contratos');
      localStorage.removeItem('appRonda_rondas');
      localStorage.removeItem('appRonda_contratoSelecionado');
      localStorage.removeItem('appRonda_rondaSelecionada');
      setContratos([]);
      setRondas([]);
      setContratoSelecionado(null);
      setRondaSelecionada(null);
      setCurrentView('contratos');
      setViewMode('tabela');
      alert('Todos os dados foram apagados. A aplicação será recarregada com dados de exemplo.');
      window.location.reload();
    }
  };

  const handleRecriarDados = () => {
    if (confirm('Esta ação irá recriar os dados de exemplo. Tem certeza?')) {
      localStorage.removeItem('appRonda_contratos');
      localStorage.removeItem('appRonda_rondas');
      localStorage.removeItem('appRonda_contratoSelecionado');
      localStorage.removeItem('appRonda_rondaSelecionada');
      window.location.reload();
    }
  };




  const handleSelectContrato = (contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setCurrentView('rondas');
    setViewMode('tabela'); // Já começa mostrando a tabela de rondas
    setRondaSelecionada(null);
  };

  const handleEditAreaTecnica = (areaTecnica: AreaTecnica) => {
    console.log('handleEditAreaTecnica chamado:', areaTecnica);
    console.log('Estado atual - isModalOpen:', isModalOpen, 'editingAreaTecnica:', editingAreaTecnica);

    setEditingAreaTecnica(areaTecnica);
    console.log('editingAreaTecnica definido como:', areaTecnica);

    setIsModalOpen(true);
    console.log('isModalOpen definido como true');
  };

  // Funções para gerenciar fotos da ronda
  const handleAddFotoRonda = () => {
    console.log('🔄 handleAddFotoRonda chamado - criando novo item');
    setEditingFotoRonda(null);
    setIsFotoRondaModalOpen(true);
    console.log('🔄 editingFotoRonda definido como null, modal aberto');
  };

  const handleEditFotoRonda = (fotoRonda: FotoRonda) => {
    console.log('🔄 handleEditFotoRonda chamado - editando item:', fotoRonda);
    setEditingFotoRonda(fotoRonda);
    setIsFotoRondaModalOpen(true);
    console.log('🔄 editingFotoRonda definido como:', fotoRonda);
  };

  const handleSaveFotoRonda = async (fotoRonda: FotoRonda) => {
    if (!rondaSelecionada) {
      console.error('❌ Nenhuma ronda selecionada!');
      alert('Erro: Nenhuma ronda selecionada. Recarregue a página e tente novamente.');
      return;
    }

    try {
      let fotoSalva: FotoRonda;

      if (editingFotoRonda) {
        // Editando foto existente - atualizar no banco
        console.log('🔄 Editando foto existente no banco:', fotoRonda);
        fotoSalva = await fotoRondaService.update(fotoRonda.id, fotoRonda);
        console.log('✅ Foto atualizada no banco:', fotoSalva);
      } else {
        // Adicionando nova foto - criar no banco
        console.log('🆕 Criando nova foto no banco:', fotoRonda);
        const { id, ...fotoSemId } = fotoRonda;
        fotoSalva = await fotoRondaService.create({
          ...fotoSemId,
          ronda_id: rondaSelecionada.id
        });
        console.log('✅ Nova foto criada no banco:', fotoSalva);
      }

      // Atualizar estado local
      const updatedFotosRonda = editingFotoRonda
        ? rondaSelecionada.fotosRonda.map(fr => fr.id === fotoSalva.id ? fotoSalva : fr)
        : [...rondaSelecionada.fotosRonda, fotoSalva];

      const updatedRonda = { ...rondaSelecionada, fotosRonda: updatedFotosRonda };

      // Atualizar estado global
      setRondas(prev => prev.map(r => r.id === rondaSelecionada.id ? updatedRonda : r));
      setRondaSelecionada(updatedRonda);

      // Fechar modal
      setIsFotoRondaModalOpen(false);
      setEditingFotoRonda(null);

      console.log('✅ Foto da ronda salva com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar foto da ronda:', error);

      if (error instanceof Error) {
        if (error.message.includes('Timeout')) {
          alert('⏱️ Upload da foto demorou muito para responder. Tente novamente ou verifique sua conexão.');
        } else if (error.message.includes('canceling statement')) {
          alert('🔄 Upload foi cancelado devido ao tempo limite. Tente novamente.');
        } else {
          alert(`❌ Erro ao salvar foto: ${error.message || 'Erro desconhecido'}`);
        }
      } else {
        alert('❌ Erro desconhecido ao salvar foto');
      }
    }
  };

  const handleDeleteFotoRonda = async (id: string) => {
    if (!rondaSelecionada) {
      console.error('❌ Nenhuma ronda selecionada para excluir foto');
      return;
    }

    if (confirm('Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.')) {
      try {
        // Deletar foto do banco
        console.log('🗑️ Deletando foto do banco com ID:', id);
        await fotoRondaService.delete(id);

        // Atualizar estado local
        const updatedFotosRonda = rondaSelecionada.fotosRonda.filter(fr => fr.id !== id);
        const updatedRonda = { ...rondaSelecionada, fotosRonda: updatedFotosRonda };

        setRondas(prev => prev.map(r => r.id === rondaSelecionada.id ? updatedRonda : r));
        setRondaSelecionada(updatedRonda);

        console.log('✅ Foto da ronda excluída com sucesso do banco!');
      } catch (error) {
        console.error('❌ Erro ao excluir foto da ronda do banco:', error);

        if (error instanceof Error) {
          if (error.message.includes('Timeout')) {
            alert('⏱️ Exclusão demorou muito para responder. Tente novamente.');
          } else if (error.message.includes('canceling statement')) {
            alert('🔄 Exclusão foi cancelada devido ao tempo limite. Tente novamente.');
          } else {
            alert(`❌ Erro ao excluir foto: ${error.message || 'Erro desconhecido'}`);
          }
        } else {
          alert('❌ Erro desconhecido ao excluir foto');
        }
      }
    }
  };

  const handleAddOutroItem = () => {
    if (!rondaSelecionada) return;
    setEditingOutroItem(null);
    setIsOutroItemModalOpen(true);
  };

  const handleSaveOutroItem = async (outroItem: OutroItemCorrigido) => {
    if (!rondaSelecionada) {
      console.error('❌ Nenhuma ronda selecionada!');
      alert('Erro: Nenhuma ronda selecionada');
      return;
    }

    console.log('🔄 handleSaveOutroItem chamado com:', outroItem);
    console.log('🔄 Ronda selecionada:', rondaSelecionada);
    console.log('🔄 ID da ronda:', rondaSelecionada.id);

    try {
      let itemSalvo: OutroItemCorrigido;

      if (editingOutroItem) {
        // Editando item existente - atualizar no banco
        console.log('🔄 Editando item existente no banco:', outroItem);
        console.log('🔄 Categoria do item sendo editado:', outroItem.categoria);
        console.log('🔄 Fotos do item sendo editado:', outroItem.fotos?.length);

        // Verificar se é uma edição de foto individual
        if (outroItem.isIndividualPhotoEdit && outroItem.originalItemId) {
          console.log('🔄 Detectada edição de foto individual, atualizando item original');

          // Encontrar o item original
          const itemOriginal = rondaSelecionada.outrosItensCorrigidos?.find(item => item.id === outroItem.originalItemId);
          if (itemOriginal) {
            // Atualizar apenas os campos editados, mantendo as outras fotos
            const itemAtualizado = {
              ...itemOriginal,
              nome: outroItem.nome || itemOriginal.nome,
              descricao: outroItem.descricao || itemOriginal.descricao,
              local: outroItem.local || itemOriginal.local,
              tipo: outroItem.tipo || itemOriginal.tipo,
              prioridade: outroItem.prioridade || itemOriginal.prioridade,
              status: outroItem.status || itemOriginal.status,
              responsavel: outroItem.responsavel || itemOriginal.responsavel,
              observacoes: outroItem.observacoes || itemOriginal.observacoes,
              categoria: itemOriginal.categoria || 'CHAMADO' // Preservar categoria original
            };

            itemSalvo = await outroItemService.update(itemOriginal.id, itemAtualizado);
            console.log('🔄 Item original atualizado:', itemSalvo);
          } else {
            console.error('❌ Item original não encontrado para foto individual');
            throw new Error('Item original não encontrado');
          }
        } else {
          // Edição normal de item completo
          // Verificar se o ID contém "-foto-" e usar o ID original
          let idParaUpdate = outroItem.id;
          if (outroItem.id.includes('-foto-')) {
            // Extrair o ID original removendo "-foto-X"
            idParaUpdate = outroItem.id.split('-foto-')[0];
            console.log('🔄 ID modificado detectado, usando ID original:', idParaUpdate);
          }

          // Criar objeto de atualização com categoria corrigida
          const itemParaUpdate = {
            ...outroItem,
            categoria: outroItem.categoria || 'CHAMADO' // Preservar categoria original
          };

          itemSalvo = await outroItemService.update(idParaUpdate, itemParaUpdate);
          console.log('🔄 Item salvo após edição:', itemSalvo);
        }

        console.log('🔄 Categoria do item salvo:', itemSalvo.categoria);
      } else {
        // Adicionando novo item - criar no banco
        console.log('🆕 Criando novo item no banco:', outroItem);
        const { id, ...itemSemId } = outroItem;

        const itemParaCriar = {
          ...itemSemId,
          ronda_id: rondaSelecionada.id
        };

        console.log('🔄 Item para criar no banco:', itemParaCriar);

        itemSalvo = await outroItemService.create(itemParaCriar);
      }

      console.log('✅ Item salvo no banco:', itemSalvo);

      // Atualizar estado local
      console.log('🔄 Atualizando estado local...');
      console.log('🔄 editingOutroItem:', editingOutroItem);
      console.log('🔄 itemSalvo:', itemSalvo);
      console.log('🔄 outrosItensCorrigidos antes:', rondaSelecionada.outrosItensCorrigidos);
      console.log('🔄 outroItem sendo salvo:', outroItem);
      console.log('🔄 outroItem.id:', outroItem.id);
      console.log('🔄 outroItem.categoria:', outroItem.categoria);

      const updatedOutrosItens = editingOutroItem
        ? (() => {
          // Se é uma edição de foto individual, substituir o item original
          if (outroItem.isIndividualPhotoEdit && outroItem.originalItemId) {
            console.log('🔄 Atualizando item original após edição de foto individual');
            return ensureArray(rondaSelecionada.outrosItensCorrigidos).filter(item => item && item.id).map(item => {
              console.log('🔄 Verificando item:', item.id, '===', itemSalvo.id, '?', item.id === itemSalvo.id);
              return item.id === itemSalvo.id ? itemSalvo : item;
            });
          } else {
            // Edição normal - substituir item existente
            console.log('🔄 Substituindo item existente');

            // Determinar qual ID usar para encontrar o item a ser substituído
            let idParaBuscar = itemSalvo.id;
            if (outroItem.id.includes('-foto-')) {
              // Se o item editado tinha ID modificado, buscar pelo ID original
              idParaBuscar = outroItem.id.split('-foto-')[0];
              console.log('🔄 Buscando item original para substituir:', idParaBuscar);
            }

            return ensureArray(rondaSelecionada.outrosItensCorrigidos).filter(item => item && item.id).map(item => {
              console.log('🔄 Verificando item:', item.id, '===', idParaBuscar, '?', item.id === idParaBuscar);
              return item.id === idParaBuscar ? itemSalvo : item;
            });
          }
        })()
        : [...ensureArray(rondaSelecionada.outrosItensCorrigidos).filter(item => item && item.id), itemSalvo];

      console.log('🔄 outrosItensCorrigidos depois:', updatedOutrosItens);
      console.log('🔄 Quantidade antes:', rondaSelecionada.outrosItensCorrigidos?.length || 0);
      console.log('🔄 Quantidade depois:', updatedOutrosItens.length);

      // Verificar se algum item foi perdido
      const idsAntes = (rondaSelecionada.outrosItensCorrigidos || []).map(item => item.id).sort();
      const idsDepois = updatedOutrosItens.map(item => item.id).sort();
      console.log('🔄 IDs antes:', idsAntes);
      console.log('🔄 IDs depois:', idsDepois);

      const idsPerdidos = idsAntes.filter(id => !idsDepois.includes(id));
      if (idsPerdidos.length > 0) {
        console.error('❌ ITENS PERDIDOS:', idsPerdidos);
      }

      const updatedRonda = { ...rondaSelecionada, outrosItensCorrigidos: updatedOutrosItens };

      // Atualizar estado local
      setRondas(prev => prev.map(ronda =>
        ronda.id === rondaSelecionada.id ? updatedRonda : ronda
      ));

      setRondaSelecionada(updatedRonda);

      console.log('✅ Item da ronda salvo com sucesso no banco!');

      setIsOutroItemModalOpen(false);
      setEditingOutroItem(null);
    } catch (error) {
      console.error('❌ Erro ao salvar item da ronda no banco:', error);
      alert('Erro ao salvar item da ronda. Verifique o console.');
    }
  };

  const handleDeleteOutroItem = async (id: string) => {
    if (!rondaSelecionada) return;

    if (confirm('Tem certeza que deseja excluir este item?')) {
      try {
        // Deletar item do banco
        console.log('🗑️ Deletando item do banco com ID:', id);
        await outroItemService.delete(id);

        // Atualizar estado local
        const updatedRonda = {
          ...rondaSelecionada,
          outrosItensCorrigidos: rondaSelecionada.outrosItensCorrigidos.filter(item => item.id !== id)
        };

        setRondas(prev => prev.map(ronda =>
          ronda.id === rondaSelecionada.id ? updatedRonda : ronda
        ));

        setRondaSelecionada(updatedRonda);

        console.log('✅ Item da ronda excluído com sucesso do banco!');
      } catch (error) {
        console.error('❌ Erro ao excluir item da ronda do banco:', error);
        alert('Erro ao excluir item da ronda. Verifique o console.');
      }
    }
  };

  const handleVoltarContratos = () => {
    console.log('🔙 Voltando para contratos...');
    // IMPORTANTE: Limpar localStorage ANTES de limpar estado para evitar restauração
    localStorage.removeItem('appRonda_contratoSelecionado');
    localStorage.removeItem('appRonda_rondaSelecionada');
    // Agora limpar estados
    setMenuLevel('main');
    setSubMenuType(null);
    setViewMode('menu');
    setCurrentView('contratos');
    setMainSection('contratos');
    setContratoSelecionado(null);
    setRondaSelecionada(null);
    setRondasCompletas([]);
  };

  // Handler para navegação dos menus
  const handleMenuNavigation = (destination: string) => {
    console.log('🔀 Navegando para:', destination);

    // Mapear destino para viewMode
    const navigationMap: { [key: string]: typeof viewMode } = {
      'kanban': 'kanban',
      'relatorio-pendencias': 'relatorios-pendencias',
      'evolucao-recebimentos': 'itens-compilados',
      'documentacao-tecnica': 'laudos',
      'plano-manutencao': 'plano-manutencao',
      'rondas-supervisao': 'tabela',
      'parecer-tecnico': 'parecer',
      'documentos-condominio': 'laudos',
      'verificar-preventivas': 'laudos',
      // Sub-itens do Kanban
      'kanban-vistoria': 'kanban',
      'kanban-recebimento': 'kanban',
      'kanban-conferencia': 'kanban',
      'kanban-comissionamento': 'kanban',
      'kanban-documentacao': 'kanban',
    };

    const newViewMode = navigationMap[destination] || 'tabela';

    // Manter o contrato selecionado e ir para a view correta
    setCurrentView('rondas');
    setViewMode(newViewMode);
  };

  // Handler para navegação do sidebar
  const handleSidebarNavigate = (destination: string) => {
    console.log('📍 Sidebar navegando para:', destination);

    // Menu principal
    if (menuLevel === 'main') {
      if (destination === 'contratos') {
        setMainSection('contratos');
        setViewMode('menu');
      } else if (destination === 'agenda') {
        setMainSection('agenda');
        setViewMode('menu');
      } else if (destination === 'chamados') {
        setMainSection('chamados');
        setViewMode('menu');
      } else if (destination === 'dashboard') {
        setMainSection('dashboard');
        setViewMode('dashboard');
      }
      return;
    }

    // Menu do contrato (Implantação/Supervisão)
    if (menuLevel === 'contrato') {
      if (destination === 'implantacao') {
        setMenuLevel('implantacao');
        setSubMenuType('implantacao');
      } else if (destination === 'supervisao') {
        setMenuLevel('supervisao');
        setSubMenuType('supervisao');
      }
      return;
    }

    // Menu de Implantação
    if (menuLevel === 'implantacao') {
      handleMenuNavigation(destination);
      return;
    }

    // Menu de Supervisão
    if (menuLevel === 'supervisao') {
      handleMenuNavigation(destination);
      return;
    }
  };

  // Handler para voltar no sidebar (OTIMIZADO - sem recarregar dados)
  const handleSidebarBack = () => {
    console.log('⬅️ Sidebar voltando de:', menuLevel, 'subMenuType:', subMenuType);

    if (menuLevel === 'implantacao' || menuLevel === 'supervisao') {
      // Voltar de Implantação/Supervisão para seleção do contrato
      setMenuLevel('contrato');
      setSubMenuType(null);
      setViewMode('contrato-detalhe');
    } else if (menuLevel === 'contrato') {
      // Voltar do contrato para lista de contratos
      // IMPORTANTE: Limpar localStorage ANTES de limpar estado para evitar restauração
      localStorage.removeItem('appRonda_contratoSelecionado');
      localStorage.removeItem('appRonda_rondaSelecionada');
      // Agora limpar estados
      setMenuLevel('main');
      setSubMenuType(null);
      setViewMode('menu');
      setMainSection('contratos');
      setCurrentView('contratos');
      setContratoSelecionado(null);
      setRondaSelecionada(null);
      setRondasCompletas([]);
    }
  };

  // Calcular breadcrumbs
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];

    // Sempre tem o item principal baseado na seção
    const sectionLabels = {
      contratos: 'Contratos',
      agenda: 'Agenda',
      chamados: 'Chamados',
      dashboard: 'Dashboard'
    };

    items.push({
      id: 'main',
      label: sectionLabels[mainSection],
      onClick: () => {
        setMenuLevel('main');
        setContratoSelecionado(null);
        setViewMode('menu');
      }
    });

    // Se tem contrato selecionado
    if (contratoSelecionado) {
      items.push({
        id: 'contrato',
        label: contratoSelecionado.nome,
        onClick: () => {
          setMenuLevel('contrato');
          setSubMenuType(null);
          setViewMode('contrato-detalhe');
        }
      });

      // Se está em submenu (usar menuLevel como fonte de verdade)
      if (menuLevel === 'implantacao') {
        items.push({
          id: 'implantacao',
          label: 'Implantação',
          onClick: () => {
            setMenuLevel('implantacao');
            setSubMenuType('implantacao');
            setViewMode('contrato-detalhe');
          }
        });
      } else if (menuLevel === 'supervisao') {
        items.push({
          id: 'supervisao',
          label: 'Supervisão',
          onClick: () => {
            setMenuLevel('supervisao');
            setSubMenuType('supervisao');
            setViewMode('contrato-detalhe');
          }
        });
      }

      // Se está em uma view específica
      const viewLabels: { [key: string]: string } = {
        'kanban': 'Kanban',
        'relatorios-pendencias': 'Relatório de Pendências',
        'itens-compilados': 'Evolução dos Recebimentos',
        'laudos': 'Documentação',
        'tabela': 'Rondas',
        'parecer': 'Parecer Técnico',
        'dashboard': 'Dashboard'
      };

      if (viewMode !== 'menu' && viewMode !== 'contrato-detalhe' && viewLabels[viewMode]) {
        items.push({
          id: viewMode,
          label: viewLabels[viewMode]
        });
      }
    }

    return items;
  };

  // Se não estiver autenticado, mostrar tela de login
  if (!isAutenticado) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Se estiver carregando, mostrar indicador de loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Tela de coleta offline (full-screen mobile)
  if (viewMode === 'coleta') {
    return (
      <ColetaOffline onVoltar={() => {
        setViewMode('tabela');
        setCurrentView('contratos');
      }} />
    );
  }

  // Tela de coleta de inspeção (full-screen mobile)
  if (viewMode === 'coleta-inspecao') {
    return (
      <ColetaInspecao
        onVoltar={() => {
          setViewMode('tabela');
          setCurrentView('contratos');
        }}
        onLogout={handleLogout}
        usuario={usuarioLogado}
      />
    );
  }

  // Tela de gerenciamento de usuários (apenas admin)
  if (viewMode === 'usuarios') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <header className="bg-[rgba(26,47,42,0.8)] backdrop-blur-lg border-b border-green-500/20 shadow-lg">
          <div className="w-full mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  onClick={() => setViewMode('tabela')}
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline ml-2">Voltar</span>
                </Button>
                <h1 className="text-sm sm:text-xl font-semibold text-white">Gerenciar Usuários</h1>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-red-400 border-red-500/30 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Sair</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="w-full mx-auto px-3 sm:px-6 lg:px-8 py-8">
          <GerenciarUsuarios usuarioLogado={usuarioLogado} />
        </main>
      </div>
    );
  }

  return (
    <AppLayout
      menuLevel={menuLevel}
      activeMenuItem={viewMode === 'menu' ? mainSection : viewMode}
      contratoNome={contratoSelecionado?.nome}
      breadcrumbItems={getBreadcrumbs()}
      onNavigate={handleSidebarNavigate}
      onBack={menuLevel !== 'main' ? handleSidebarBack : undefined}
      onLogout={handleLogout}
      onColetaInspecao={() => setViewMode('coleta-inspecao')}
      onUsuarios={usuarioLogado?.is_admin ? () => {
        setViewMode('usuarios');
        setContratoSelecionado(null);
        setCurrentView('contratos');
        setMenuLevel('main');
      } : undefined}
      usuarioNome={usuarioLogado?.nome}
      usuarioCargo={usuarioLogado?.cargo}
      isAdmin={usuarioLogado?.is_admin}
    >
      {/* Contrato Info - Card quando contrato selecionado */}
      {contratoSelecionado && (viewMode === 'contrato-detalhe' || menuLevel === 'contrato') && (
        <div className="bg-gradient-to-r from-emerald-600/20 to-emerald-800/20 backdrop-blur-sm rounded-xl border border-emerald-500/30 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-emerald-400 truncate">{contratoSelecionado.nome}</h2>
              <div className="text-xs sm:text-sm text-gray-300 space-y-0.5">
                <p className="truncate">Síndico: {contratoSelecionado.sindico}</p>
                <p className="truncate">Endereço: {contratoSelecionado.endereco}</p>
                <p className="truncate">Periodicidade: {contratoSelecionado.periodicidade}</p>
              </div>
            </div>
            <div className="text-left sm:text-right flex sm:flex-col gap-3 sm:gap-0 flex-shrink-0">
              <p className="text-xs sm:text-sm text-blue-200/80">Rondas: {rondasDoContrato.length}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        {/* Lista de contratos - quando está no menu principal e seção contratos */}
        {!contratoSelecionado && viewMode === 'menu' && mainSection === 'contratos' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Seus Contratos</h2>
              <GerenciarContratos
                contratos={contratos}
                onSelectContrato={async (contrato) => {
                  setContratoSelecionado(contrato);
                  setViewMode('contrato-detalhe');
                  setMenuLevel('contrato');
                  // LAZY LOADING: Carregar rondas do contrato selecionado
                  await carregarRondasDoContrato(contrato.nome);
                }}
                onSaveContrato={async (contrato: Contrato) => {
                  try {
                    console.log('🔄 Salvando contrato:', { id: contrato.id, nome: contrato.nome, isEdit: !!contrato.id });

                    if (contrato.id && contrato.id.trim() !== '') {
                      // Editando contrato existente
                      console.log('🔄 Editando contrato existente com ID:', contrato.id);
                      const contratoAtualizado = await contratoService.update(contrato.id, contrato);
                      setContratos(prev => prev.map(c => c.id === contrato.id ? contratoAtualizado : c));
                      if (contratoSelecionado?.id === contrato.id) {
                        setContratoSelecionado(contratoAtualizado);
                      }
                      console.log('✅ Contrato atualizado com sucesso:', contratoAtualizado);
                    } else {
                      // Criando novo contrato
                      console.log('🔄 Criando novo contrato');
                      const { id, ...dadosNovoContrato } = contrato;
                      const contratoSalvo = await contratoService.create(dadosNovoContrato);

                      if (!contratoSalvo || !contratoSalvo.id) {
                        throw new Error('Contrato não foi criado corretamente');
                      }

                      setContratos(prev => [...prev, contratoSalvo]);
                      console.log('✅ Contrato criado com sucesso:', contratoSalvo);
                    }
                  } catch (error) {
                    console.error('❌ Erro ao salvar contrato:', error);
                    alert('Erro ao salvar contrato. Verifique o console.');
                  }
                }}
                onDeleteContrato={async (id: string) => {
                  if (confirm('Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.')) {
                    try {
                      await contratoService.delete(id);
                      setContratos(prev => prev.filter(c => c.id !== id));
                      if (contratoSelecionado?.id === id) {
                        setContratoSelecionado(null);
                        setCurrentView('contratos');
                      }
                      console.log('✅ Contrato excluído com sucesso');
                    } catch (error) {
                      console.error('❌ Erro ao excluir contrato:', error);
                      alert('Erro ao excluir contrato. Verifique o console.');
                    }
                  }
                }}
                onVoltarContratos={() => {
                  // Fechar modal e voltar à lista de contratos
                  setCurrentView('contratos');
                  setViewMode('menu');
                }}
              />
            </div>
        )}

        {/* Tela de seleção - quando contrato selecionado mas ainda não escolheu Implantação/Supervisão */}
        {contratoSelecionado && viewMode === 'contrato-detalhe' && menuLevel === 'contrato' && (
          <div className="text-center py-12">
            {loadingContrato ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-white mb-2">Carregando dados...</h2>
                <p className="text-gray-400">Buscando informações do contrato</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-white mb-4">Selecione uma opção</h2>
                <p className="text-gray-400 text-lg">
                  Use o menu lateral para escolher entre Implantação ou Supervisão
                </p>
              </>
            )}
          </div>
        )}

        {/* Tela de Implantação - quando selecionou Implantação */}
        {contratoSelecionado && menuLevel === 'implantacao' && viewMode === 'contrato-detalhe' && (
          <div className="py-10 px-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                <Hammer className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Implantação</h2>
                <p className="text-gray-400 text-sm mt-0.5">Use o menu lateral para navegar entre as seções</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  key: 'kanban',
                  icon: '📋',
                  titulo: 'Kanban',
                  cor: 'border-emerald-500/40 hover:border-emerald-400',
                  descricao: 'Acompanhe o andamento de cada etapa da implantação: comissionamentos, conferências, documentação e vistoria. Visualize o status de cada card e registre fotos, checklists e pendências.'
                },
                {
                  key: 'relatorio-pendencias',
                  icon: '📝',
                  titulo: 'Relatório de Pendências',
                  cor: 'border-blue-500/40 hover:border-blue-400',
                  descricao: 'Crie e gerencie relatórios com as pendências do contrato. Organize itens por seção, registre locais e descrições, e acompanhe o status de cada pendência ao longo do processo.'
                },
                {
                  key: 'evolucao-recebimentos',
                  icon: '📈',
                  titulo: 'Evolução dos Recebimentos',
                  cor: 'border-purple-500/40 hover:border-purple-400',
                  descricao: 'Visualize a evolução dos recebimentos com tabela resumo por relatório, gráficos de distribuição de status e linha do tempo de itens recebidos e não farão ao longo do projeto.'
                },
                {
                  key: 'documentacao-tecnica',
                  icon: '📂',
                  titulo: 'Documentação Técnica',
                  cor: 'border-amber-500/40 hover:border-amber-400',
                  descricao: 'Acesse e gerencie todos os documentos técnicos do empreendimento: manuais, projetos as built, alvarás, ARTs, certificados e demais documentos obrigatórios para entrega.'
                },
                {
                  key: 'plano-manutencao',
                  icon: '🔧',
                  titulo: 'Plano de Manutenção',
                  cor: 'border-cyan-500/40 hover:border-cyan-400',
                  descricao: 'Consulte e registre o plano de manutenção preventiva do condomínio, com frequências, responsáveis e histórico de execuções para garantir a conservação do empreendimento.'
                },
              ].map(({ key, icon, titulo, cor, descricao }) => (
                <button
                  key={key}
                  onClick={() => handleMenuNavigation(key)}
                  className={`text-left bg-gray-800 border-2 ${cor} rounded-xl p-5 transition-all duration-200 hover:bg-gray-750 group`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-white font-bold text-base group-hover:text-orange-300 transition-colors">{titulo}</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{descricao}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tela de Supervisão - quando selecionou Supervisão */}
        {contratoSelecionado && menuLevel === 'supervisao' && viewMode === 'contrato-detalhe' && (
          <div className="py-10 px-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Supervisão</h2>
                <p className="text-gray-400 text-sm mt-0.5">Use o menu lateral para navegar entre as seções</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  key: 'rondas-supervisao',
                  icon: '🔍',
                  titulo: 'Rondas de Supervisão',
                  cor: 'border-emerald-500/40 hover:border-emerald-400',
                  descricao: 'Registre e acompanhe as rondas de supervisão realizadas no condomínio. Documente inspeções, ocorrências e conformidades observadas durante as visitas técnicas.'
                },
                {
                  key: 'parecer-tecnico',
                  icon: '📋',
                  titulo: 'Parecer Técnico',
                  cor: 'border-blue-500/40 hover:border-blue-400',
                  descricao: 'Elabore e consulte pareceres técnicos sobre o estado do empreendimento. Registre avaliações, recomendações e laudos emitidos pela equipe de supervisão.'
                },
                {
                  key: 'documentos-condominio',
                  icon: '📂',
                  titulo: 'Documentos do Condomínio',
                  cor: 'border-purple-500/40 hover:border-purple-400',
                  descricao: 'Centralize e acesse os documentos do condomínio: atas, regulamentos, apólices de seguro, contratos de manutenção e demais arquivos relevantes para a gestão condominial.'
                },
                {
                  key: 'verificar-preventivas',
                  icon: '✅',
                  titulo: 'Verificar Preventivas',
                  cor: 'border-amber-500/40 hover:border-amber-400',
                  descricao: 'Verifique a execução das manutenções preventivas programadas. Confirme a realização dos serviços, registre observações e acompanhe o cumprimento do plano de manutenção.'
                },
              ].map(({ key, icon, titulo, cor, descricao }) => (
                <button
                  key={key}
                  onClick={() => handleMenuNavigation(key)}
                  className={`text-left bg-gray-800 border-2 ${cor} rounded-xl p-5 transition-all duration-200 hover:bg-gray-750 group`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-white font-bold text-base group-hover:text-blue-300 transition-colors">{titulo}</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{descricao}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentView === 'contratos' && viewMode !== 'menu' && viewMode !== 'contrato-detalhe' ? (
          <GerenciarContratos
            contratos={contratos}
            onSelectContrato={(contrato) => {
              setContratoSelecionado(contrato);
              setCurrentView('rondas');
              setViewMode('tabela');
            }}
            onSaveContrato={async (contrato: Contrato) => {
              try {
                console.log('🔄 Salvando contrato:', { id: contrato.id, nome: contrato.nome, isEdit: !!contrato.id });

                if (contrato.id && contrato.id.trim() !== '') {
                  // Editando contrato existente
                  console.log('🔄 Editando contrato existente com ID:', contrato.id);
                  const contratoAtualizado = await contratoService.update(contrato.id, contrato);
                  setContratos(prev => prev.map(c => c.id === contrato.id ? contratoAtualizado : c));
                  if (contratoSelecionado?.id === contrato.id) {
                    setContratoSelecionado(contratoAtualizado);
                  }
                  console.log('✅ Contrato atualizado com sucesso:', contratoAtualizado);
                } else {
                  // Criando novo contrato
                  console.log('🔄 Criando novo contrato');
                  const { id, ...dadosNovoContrato } = contrato;
                  const contratoSalvo = await contratoService.create(dadosNovoContrato);

                  if (!contratoSalvo || !contratoSalvo.id) {
                    throw new Error('Contrato não foi criado corretamente');
                  }

                  setContratos(prev => [...prev, contratoSalvo]);
                  console.log('✅ Contrato criado com sucesso:', contratoSalvo);
                }
              } catch (error) {
                console.error('❌ Erro ao salvar contrato:', error);
                alert('Erro ao salvar contrato. Verifique o console.');
              }
            }}
            onDeleteContrato={async (id: string) => {
              if (confirm('Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.')) {
                try {
                  await contratoService.delete(id);
                  setContratos(prev => prev.filter(c => c.id !== id));
                  if (contratoSelecionado?.id === id) {
                    setContratoSelecionado(null);
                    setCurrentView('contratos');
                  }
                  console.log('✅ Contrato excluído com sucesso');
                } catch (error) {
                  console.error('❌ Erro ao excluir contrato:', error);
                  alert('Erro ao excluir contrato. Verifique o console.');
                }
              }
            }}
            onVoltarContratos={() => {
              // Fechar modal e voltar à lista de contratos
              setCurrentView('contratos');
            }}
          />
        ) : !contratoSelecionado ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Selecione um Contrato</h2>
            <p className="text-gray-600 text-lg mb-8">
              Clique em um contrato para visualizar suas rondas e áreas técnicas.
            </p>
            <Button onClick={handleVoltarContratos} className="bg-blue-600 hover:bg-blue-700">
              <Building2 className="w-4 h-4 mr-2" />
              Ver Contratos
            </Button>
          </div>
        ) : (
          <>
            {/* Conteúdo baseado no modo de visualização - Navegação via Sidebar */}
            {viewMode === 'tabela' && (
              <>
                {/* Alertas de Rondas Pendentes por Periodicidade */}
                <RondasPendentes
                  rondas={rondasCompletas}
                  onIniciarRonda={handleIniciarRondaPendente}
                />

                {/* Tabela de Rondas */}
                <div className="mb-8">
                  <TabelaRondas
                    rondas={rondasCompletas}
                    contrato={contratoSelecionado}
                    onSelectRonda={(ronda) => {
                      setRondaSelecionada(ronda);
                      setViewMode('visualizar');
                    }}
                    onNovaRonda={handleAddRonda}
                    onDeletarRonda={async (id) => {
                      if (confirm('Tem certeza que deseja excluir esta ronda? Esta ação não pode ser desfeita.\n\nIsso vai deletar:\n• A ronda\n• Todas as áreas técnicas\n• Todas as fotos\n• Todos os outros itens')) {
                        try {
                          console.log('🗑️ Deletando ronda do Supabase:', id);

                          // Deletar do Supabase (CASCADE vai deletar áreas, fotos e itens automaticamente)
                          await rondaService.delete(id);

                          // Atualizar estado local
                          setRondas(prev => prev.filter(r => r.id !== id));

                          if (rondaSelecionada?.id === id) {
                            setRondaSelecionada(null);
                            setViewMode('tabela');
                          }

                          console.log('✅ Ronda deletada com sucesso do Supabase!');
                          alert('✅ Ronda deletada com sucesso!');
                        } catch (error) {
                          console.error('❌ Erro ao deletar ronda:', error);
                          alert('❌ Erro ao deletar ronda. Tente novamente.');
                        }
                      }
                    }}
                    onVoltarContratos={handleVoltarContratos}
                  />
                </div>

                {/* Mensagem de seleção */}
                <div className="text-center py-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Selecione uma Ronda</h2>
                  <p className="text-gray-900 text-lg">
                    Clique em uma ronda na tabela acima para visualizar seus detalhes.
                  </p>
                </div>
              </>
            )}

            {viewMode === 'kanban' && contratoSelecionado && (
              <KanbanBoard
                contratoId={contratoSelecionado.id}
                contratoNome={contratoSelecionado.nome}
              />
            )}

            {viewMode === 'laudos' && contratoSelecionado && (
              <LaudosKanban
                contratoSelecionado={contratoSelecionado}
              />
            )}

            {viewMode === 'nova' && contratoSelecionado && (
              <NovaRondaScreen
                contrato={contratoSelecionado}
                onVoltar={() => {
                  setTemplateInicialRonda(null); // Limpar template ao voltar
                  setViewMode('tabela');
                }}
                onSalvar={handleSaveRonda}
                templateInicial={templateInicialRonda || undefined}
              />
            )}

            {viewMode === 'dashboard' && contratoSelecionado && (
              <Dashboard
                contrato={contratoSelecionado}
                rondas={rondasCompletas}
                areasTecnicas={areasTecnicasDoContrato}
              />
            )}

            {viewMode === 'parecer' && contratoSelecionado && (
              <ParecerTecnico
                contratoSelecionado={contratoSelecionado}
              />
            )}

            {viewMode === 'relatorios-pendencias' && contratoSelecionado && (
              <RelatorioPendencias
                contratoSelecionado={contratoSelecionado}
              />
            )}

            {viewMode === 'itens-compilados' && contratoSelecionado && (
              <ItensCompilados
                contratoSelecionado={contratoSelecionado}
              />
            )}

            {viewMode === 'plano-manutencao' && contratoSelecionado && (
              <div className="bg-gray-800/50 rounded-xl p-8 text-center">
                <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileCheck className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Plano de Manutenção</h2>
                <p className="text-gray-400 mb-6">
                  Em breve você poderá gerenciar o plano de manutenção preventiva do contrato aqui.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                  Em desenvolvimento
                </div>
              </div>
            )}

            {viewMode === 'visualizar' && rondaSelecionada && contratoSelecionado && (
              <VisualizarRonda
                ronda={rondaSelecionada}
                contrato={contratoSelecionado}
                areasTecnicas={rondaSelecionada.areasTecnicas}
                onVoltar={() => {
                  // Preservar o estado da ronda selecionada ao voltar
                  console.log('🔄 Voltando para tabela, preservando ronda selecionada:', rondaSelecionada);
                  console.log('🔄 Fotos da ronda preservadas:', rondaSelecionada.fotosRonda);
                  setViewMode('tabela');
                  // NÃO limpar rondaSelecionada para preservar os dados
                }}
                onEditarArea={(area) => {
                  console.log('onEditarArea chamado do VisualizarRonda:', area);
                  handleEditAreaTecnica(area);
                }}
                onDeletarArea={handleDeleteAreaTecnica}
                onAdicionarArea={handleAddAreaTecnica}
                onAdicionarItemChamado={handleAddFotoRonda}
                onEditarItemChamado={handleEditFotoRonda}
                onDeletarItemChamado={handleDeleteFotoRonda}
                onAdicionarOutroItem={handleAddOutroItem}
                onEditarOutroItem={(item) => {
                  setEditingOutroItem(item);
                  setIsOutroItemModalOpen(true);
                }}
                onDeletarOutroItem={handleDeleteOutroItem}
                onEditarRonda={() => {
                  setIsEditarRondaModalOpen(true);
                }}
                onExportarJSON={exportToJSON}
                isPrintMode={false}
              />
            )}
          </>
        )
        }



      {/* Modals */}
      < AreaTecnicaModal
        areaTecnica={editingAreaTecnica}
        isOpen={isModalOpen}
        onClose={() => {
          console.log('Modal fechando...');
          console.log('Estado antes de fechar:', { isModalOpen, editingAreaTecnica, rondaSelecionada, contratoSelecionado });
          setIsModalOpen(false);
          setEditingAreaTecnica(null);
          console.log('Estado após fechar:', { isModalOpen, editingAreaTecnica, rondaSelecionada, contratoSelecionado });
        }}
        onSave={handleSaveAreaTecnica}
        contratoRonda={rondaSelecionada?.contrato || ''}
        enderecoRonda={contratoSelecionado?.endereco || ''}
        dataRonda={rondaSelecionada?.data || ''}
        horaRonda={rondaSelecionada?.hora || ''}
        onSaveMultiple={async (areas) => {
          if (!rondaSelecionada) {
            console.error('❌ Nenhuma ronda selecionada!');
            alert('Erro: Nenhuma ronda selecionada.');
            return;
          }

          // CORREÇÃO: Garantir que sempre temos um ID válido
          let rondaId = rondaSelecionada.id;
          let rondaAtualizada = rondaSelecionada;

          // Se o ID está vazio, tentar recuperar do localStorage
          if (!rondaId || rondaId.trim() === '') {
            try {
              const salvo = localStorage.getItem('appRonda_rondaSelecionada');
              const rec: Ronda | null = salvo ? JSON.parse(salvo) : null;
              if (rec?.id && rec.id.trim() !== '') {
                rondaId = rec.id;
                rondaAtualizada = rec;
                console.log('🔄 ID recuperado do localStorage:', rondaId);
                // Atualizar o estado com a ronda recuperada
                setRondaSelecionada(rec);
              } else {
                console.error('❌ ID da ronda está vazio ou inválido!', rondaId);
                alert('❌ Erro: A ronda não tem um ID válido. Por favor, selecione uma ronda válida e tente novamente.');
                return;
              }
            } catch (error) {
              console.error('❌ Erro ao recuperar ronda do localStorage:', error);
              alert('❌ Erro: Não foi possível recuperar os dados da ronda. Por favor, selecione uma ronda válida e tente novamente.');
              return;
            }
          }

          // VALIDAÇÃO FINAL: Garantir que temos um ID válido antes de prosseguir
          if (!rondaId || rondaId.trim() === '' || rondaId.startsWith('temp-')) {
            console.error('❌ ID da ronda ainda está vazio após tentativas de recuperação!', rondaId);
            alert('❌ Erro crítico: Não foi possível obter um ID válido para a ronda. Por favor, recarregue a página e selecione uma ronda válida.');
            return;
          }

          console.log(`💾 Salvando ${areas.length} áreas com fotos...`);
          console.log('🔍 Ronda ID:', rondaId);
          console.log('🔍 Ronda completa:', rondaAtualizada);
          console.log('🔍 Áreas a salvar:', areas);

          try {
            const areasSalvas = [];
            let erros = 0;

            // Salvar uma por vez para identificar qual dá erro
            for (let i = 0; i < areas.length; i++) {
              try {
                console.log(`📸 Salvando área ${i + 1}/${areas.length}...`);
                const areaSalva = await areaTecnicaService.create({
                  ...areas[i],
                  ronda_id: rondaId
                });
                areasSalvas.push(areaSalva);
                console.log(`✅ Área ${i + 1} salva:`, areaSalva);
              } catch (error) {
                console.error(`❌ Erro ao salvar área ${i + 1}:`, error);
                erros++;
              }
            }

            if (areasSalvas.length > 0) {
              // Atualizar estado local com as áreas que foram salvas
              const updatedAreasTecnicas = [...rondaAtualizada.areasTecnicas, ...areasSalvas];
              const updatedRonda = { ...rondaAtualizada, areasTecnicas: updatedAreasTecnicas };

              setRondas(prev => prev.map(r => r.id === rondaId ? updatedRonda : r));
              setRondaSelecionada(updatedRonda);

              console.log(`✅ ${areasSalvas.length} áreas salvas com sucesso!`);

              if (erros > 0) {
                alert(`⚠️ ${areasSalvas.length} áreas salvas com sucesso!\n${erros} áreas falharam.`);
              } else {
                alert(`✅ ${areasSalvas.length} áreas salvas com sucesso!`);
              }
            } else {
              console.error('❌ Nenhuma área foi salva!');
              alert('❌ Erro: Nenhuma área foi salva. Verifique o console para mais detalhes.');
            }
          } catch (error) {
            console.error('❌ Erro geral ao salvar áreas:', error);
            alert(`❌ Erro ao salvar áreas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
        }}
      />

      < FotoRondaModal
        fotoRonda={editingFotoRonda}
        isOpen={isFotoRondaModalOpen}
        onClose={() => {
          console.log('🔄 FotoRondaModal fechando, editingFotoRonda:', editingFotoRonda);
          setIsFotoRondaModalOpen(false);
          setEditingFotoRonda(null);
          console.log('🔄 FotoRondaModal fechado, editingFotoRonda limpo');
        }}
        onSave={handleSaveFotoRonda}
      />

      <OutroItemModal
        item={editingOutroItem}
        isOpen={isOutroItemModalOpen}
        onClose={() => {
          setIsOutroItemModalOpen(false);
          setEditingOutroItem(null);
        }}
        onSave={handleSaveOutroItem}
        contratoRonda={rondaSelecionada?.contrato || ''}
        enderecoRonda={contratoSelecionado?.endereco || ''}
        dataRonda={rondaSelecionada?.data || ''}
        horaRonda={rondaSelecionada?.hora || ''}
      />

      <EditarRondaModal
        isOpen={isEditarRondaModalOpen}
        onClose={() => setIsEditarRondaModalOpen(false)}
        ronda={rondaSelecionada}
        onSave={async (rondaAtualizada) => {
          try {
            console.log('🔄 Atualizando ronda:', rondaAtualizada);

            // Atualizar no banco
            await rondaService.update(rondaAtualizada.id, rondaAtualizada);

            // Atualizar estado local
            setRondas(prev => prev.map(r => r.id === rondaAtualizada.id ? rondaAtualizada : r));
            setRondaSelecionada(rondaAtualizada);

            console.log('✅ Ronda atualizada com sucesso!');
          } catch (error) {
            console.error('❌ Erro ao atualizar ronda:', error);
            alert('Erro ao atualizar ronda. Verifique o console.');
          }
        }}
      />

      {/* Indicador de status offline */}
      <OfflineIndicator />
      </div>
    </AppLayout>
  );
}

export default App;