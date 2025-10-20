import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AreaTecnicaModal } from '@/components/AreaTecnicaModal';
import { NovaRondaScreen } from '@/components/NovaRondaScreen';
import { GerenciarContratos } from '@/components/GerenciarContratos';
import { KanbanBoard } from '@/components/KanbanBoard';
import { LaudosKanban } from '@/components/LaudosKanban';
import { CalendarView } from '@/components/CalendarView';

import { FotoRondaModal } from '@/components/FotoRondaModal';
import { TabelaRondas } from '@/components/TabelaRondas';
import { VisualizarRonda } from '@/components/VisualizarRonda';
import { OutroItemCorrigidoModal } from '@/components/OutroItemCorrigidoModal';
import { OutroItemModal } from '@/components/OutroItemModal';
import { Dashboard } from '@/components/Dashboard';
import { LoginScreen } from '@/components/LoginScreen';
import { AreaTecnica, Ronda, Contrato, FotoRonda, OutroItemCorrigido, UsuarioAutorizado } from '@/types';
import { AREAS_TECNICAS_PREDEFINIDAS } from '@/data/areasTecnicas';
import { FileText, Building2, BarChart3, LogOut, User, Calendar, Kanban, FileCheck } from 'lucide-react';

import { contratoService, rondaService, areaTecnicaService, fotoRondaService, outroItemService } from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';
import { authService } from '@/lib/auth';
import { debugSupabaseConnection, debugTableStructure } from '@/lib/debugSupabase';


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

  const [currentView, setCurrentView] = useState<'contratos' | 'rondas'>('contratos');
  const [contratoSelecionado, setContratoSelecionado] = useState<Contrato | null>(null);
  const [viewMode, setViewMode] = useState<'tabela' | 'visualizar' | 'nova' | 'dashboard' | 'kanban' | 'laudos' | 'calendario'>('tabela');
  const [rondaSelecionada, setRondaSelecionada] = useState<Ronda | null>(null);
  const [rondasCompletas, setRondasCompletas] = useState<Ronda[]>([]);
  
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
    } catch {}
    
    console.log('🌙 Tema escuro forçado via JavaScript');
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
  const handleLoginSuccess = (usuario: UsuarioAutorizado) => {
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

  // Carregar dados do banco de dados ao iniciar a aplicação
  useEffect(() => {
    const loadDataFromDatabase = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Carregando dados do banco Supabase/Neon...');
        
        // RECUPERAR RONDAS DO BROOK YOU PRIMEIRO
        console.log('🔥 RECUPERANDO RONDAS DO BROOK YOU...');
        const todasChaves = Object.keys(localStorage);
        let rondasBrookRecuperadas: Ronda[] = [];
        
        todasChaves.forEach(chave => {
          try {
            const dados = localStorage.getItem(chave);
            if (dados) {
              const parsed = JSON.parse(dados);
              if (Array.isArray(parsed)) {
                const rondasBrook = parsed.filter(item => {
                  if (!item) return false;
                  const contrato = item.contrato ? item.contrato.toLowerCase() : '';
                  const nome = item.nome ? item.nome.toLowerCase() : '';
                  return contrato.includes('brook') || 
                         contrato.includes('you') || 
                         nome.includes('brook') ||
                         contrato.includes('brook you');
                });
                if (rondasBrook.length > 0) {
                  console.log(`🎯 Encontradas ${rondasBrook.length} rondas do Brook You na chave "${chave}"`);
                  rondasBrookRecuperadas = rondasBrookRecuperadas.concat(rondasBrook);
                }
              }
            }
          } catch (error) {
            // Ignorar erros
          }
        });
        
        if (rondasBrookRecuperadas.length > 0) {
          console.log(`🎉 ${rondasBrookRecuperadas.length} RONDAS DO BROOK YOU RECUPERADAS!`, rondasBrookRecuperadas);
          // Salvar no localStorage atual
          const rondasAtuais = JSON.parse(localStorage.getItem('appRonda_rondas') || '[]');
          const rondasCombinadas = [...rondasAtuais, ...rondasBrookRecuperadas];
          localStorage.setItem('appRonda_rondas', JSON.stringify(rondasCombinadas));
        }

        // Buscar contratos e rondas em paralelo para reduzir latência total
        const [contratosFromDB, rondasFromDB] = await Promise.all([
          contratoService.getAll(),
          rondaService.getAll(),
        ]);

        console.log('📥 Dados recebidos do banco:', {
          contratos: contratosFromDB.length,
          rondas: rondasFromDB.length,
          contratosData: contratosFromDB,
          rondasData: rondasFromDB
        });

        setContratos(contratosFromDB);
        setRondas(rondasFromDB);
        console.log(`✅ ${contratosFromDB.length} contratos e ${rondasFromDB.length} rondas carregados`);

        // Se não há contratos, limpar estado da ronda
        if (contratosFromDB.length === 0) {
          console.log('📝 Nenhum contrato encontrado, limpando estado da ronda');
          setRondaSelecionada(null);
          setContratoSelecionado(null);
          setViewMode('tabela');
          // Limpar localStorage de ronda selecionada
          localStorage.removeItem('appRonda_rondaSelecionada');
        }

        // Se não há dados no banco, criar dados de exemplo
        if (contratosFromDB.length === 0 && rondasFromDB.length === 0) {
          console.log('🔄 Banco vazio, criando dados de exemplo...');
          
          try {
            // Criar contratos de exemplo no banco
            const contrato1 = await contratoService.create({
              nome: 'CT001/2024 - Manutenção Preventiva',
              sindico: 'Maria Santos',
              endereco: 'Rua das Flores, 123 - Centro',
              periodicidade: 'MENSAL',
              observacoes: 'Contrato de manutenção preventiva mensal',
              dataCriacao: '2024-01-01T00:00:00.000Z'
            });
            
            const contrato2 = await contratoService.create({
              nome: 'CT002/2024 - Inspeção Semanal',
              sindico: 'João Oliveira',
              endereco: 'Av. Principal, 456 - Bairro Novo',
              periodicidade: 'SEMANAL',
              observacoes: 'Inspeção semanal de segurança',
              dataCriacao: '2024-01-01T00:00:00.000Z'
            });
            
            // Criar ronda de exemplo no banco
            const ronda1 = await rondaService.create({
              nome: 'Ronda Matutina - Centro',
              contrato: 'CT001/2024 - Manutenção Preventiva',
              data: '2024-01-15',
              hora: '08:00',
              responsavel: 'Ricardo Oliveira',
              observacoesGerais: 'Verificação geral das áreas técnicas',
              areasTecnicas: [],
              fotosRonda: [],
              outrosItensCorrigidos: []
            });
            
            console.log('✅ Dados de exemplo criados no banco');
            
            // Atualizar estado com os dados criados
            setContratos([contrato1, contrato2]);
            setRondas([ronda1]);
          } catch (error) {
            console.error('❌ Erro ao criar dados de exemplo:', error);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados do banco:', error);
        console.log('🔄 Tentando carregar dados do localStorage como fallback...');
        
        // Fallback para localStorage quando não conseguir conectar ao banco
        try {
          const savedContratos = localStorage.getItem('appRonda_contratos');
          const savedRondas = localStorage.getItem('appRonda_rondas');
          
          if (savedContratos) {
            const contratosFromStorage = JSON.parse(savedContratos);
            setContratos(contratosFromStorage);
            console.log(`✅ ${contratosFromStorage.length} contratos carregados do localStorage`);
          }
          
          if (savedRondas) {
            const rondasFromStorage = JSON.parse(savedRondas);
            setRondas(rondasFromStorage);
            console.log(`✅ ${rondasFromStorage.length} rondas carregadas do localStorage`);
          }
          
          // Se não há dados nem no banco nem no localStorage, criar dados de exemplo
          if ((!savedContratos || JSON.parse(savedContratos).length === 0) && 
              (!savedRondas || JSON.parse(savedRondas).length === 0)) {
            console.log('🔄 Criando dados de exemplo no localStorage...');
            
            const contratoExemplo1: Contrato = {
              id: crypto.randomUUID(),
              nome: 'CT001/2024 - Manutenção Preventiva',
              sindico: 'Maria Santos',
              endereco: 'Rua das Flores, 123 - Centro',
              periodicidade: 'MENSAL' as const,
              observacoes: 'Contrato de manutenção preventiva mensal',
              dataCriacao: '2024-01-01T00:00:00.000Z'
            };
            
            const contratoExemplo2: Contrato = {
              id: crypto.randomUUID(),
              nome: 'CT002/2024 - Inspeção Semanal',
              sindico: 'João Oliveira',
              endereco: 'Av. Principal, 456 - Bairro Novo',
              periodicidade: 'SEMANAL' as const,
              observacoes: 'Inspeção semanal de segurança',
              dataCriacao: '2024-01-01T00:00:00.000Z'
            };
            
            const rondaExemplo = {
              id: crypto.randomUUID(),
              nome: 'Ronda Matutina - Centro',
              contrato: 'CT001/2024 - Manutenção Preventiva',
              data: '2024-01-15',
              hora: '08:00',
              responsavel: 'Ricardo Oliveira',
              observacoesGerais: 'Verificação geral das áreas técnicas',
              areasTecnicas: [],
              fotosRonda: [],
              outrosItensCorrigidos: []
            };
            
            const contratosExemplo = [contratoExemplo1, contratoExemplo2];
            const rondasExemplo = [rondaExemplo];
            
            // Salvar no localStorage
            localStorage.setItem('appRonda_contratos', JSON.stringify(contratosExemplo));
            localStorage.setItem('appRonda_rondas', JSON.stringify(rondasExemplo));
            
            // Atualizar estado
            setContratos(contratosExemplo);
            setRondas(rondasExemplo);
            
            console.log('✅ Dados de exemplo criados no localStorage');
          }
        } catch (storageError) {
          console.error('❌ Erro ao acessar localStorage:', storageError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDataFromDatabase();
  }, []);

  // Não selecionar automaticamente - deixar o usuário escolher
  // useEffect(() => {
  //   if (contratos.length > 0 && !contratoSelecionado) {
  //     console.log('🔄 Selecionando automaticamente o primeiro contrato:', contratos[0].nome);
  //     setContratoSelecionado(contratos[0]);
  //     setCurrentView('rondas');
  //     setViewMode('tabela'); // Ir para a tabela de rondas primeiro
  //   }
  // }, [contratos, contratoSelecionado]);

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
          console.log('🔄 Recarregando dados da ronda para modo visualizar:', rondaSelecionada.id);
          console.log('🔄 Estado atual da ronda antes de recarregar:', {
            id: rondaSelecionada.id,
            nome: rondaSelecionada.nome,
            fotosRonda: rondaSelecionada.fotosRonda?.length || 0,
            areasTecnicas: rondaSelecionada.areasTecnicas?.length || 0
          });
          
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
            
            // Atualizar estado local com dados frescos do banco
            setRondaSelecionada(rondaAtualizada);
            setRondas(prev => prev.map(r => r.id === rondaAtualizada.id ? rondaAtualizada : r));
            
            console.log('✅ Estado atualizado após recarregar:', {
              id: rondaAtualizada.id,
              nome: rondaAtualizada.nome,
              fotosRonda: rondaAtualizada.fotosRonda?.length || 0,
              areasTecnicas: rondaAtualizada.areasTecnicas?.length || 0
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

  // Carregar dados completos das rondas quando um contrato for selecionado
  useEffect(() => {
    if (contratoSelecionado && rondasDoContrato.length > 0) {
      console.log('🔄 Carregando dados completos das rondas do contrato:', contratoSelecionado.nome);
      
      // Adicionar timeout para evitar carregamentos muito frequentes
      const timeoutId = setTimeout(() => {
        Promise.all(
          rondasDoContrato
            .filter(ronda => ronda && ronda.id && ronda.id.trim() !== '') // Filtrar rondas com IDs válidos
            .map(ronda => 
              rondaService.loadCompleteRonda(ronda)
            )
        ).then(rondasCompletas => {
          console.log('✅ Dados completos carregados:', rondasCompletas.length);
          setRondasCompletas(rondasCompletas);
        }).catch(error => {
          console.error('❌ Erro ao carregar dados completos:', error);
          setRondasCompletas(rondasDoContrato.filter(ronda => ronda && ronda.id && ronda.id.trim() !== '')); // Usar dados básicos se der erro
        });
      }, 100); // Debounce de 100ms

      return () => clearTimeout(timeoutId);
    } else {
      setRondasCompletas([]);
    }
  }, [contratoSelecionado?.nome, rondas.length]); // Corrigido: usar contratoSelecionado.nome e rondas.length

  // Filtrar áreas técnicas pelo contrato selecionado
  const areasTecnicasDoContrato = contratoSelecionado
    ? rondasCompletas.flatMap(ronda => ronda.areasTecnicas)
    : [];

  const handleAddRonda = () => {
    if (!contratoSelecionado) {
      alert('Por favor, selecione um contrato primeiro');
      return;
    }
    // Abrir modal de nova ronda diretamente
    setViewMode('nova');
  };

  const handleSaveRonda = async (rondaData: {
    nome: string;
    data: string;
    hora: string;
    observacoesGerais?: string;
  }) => {
    try {
      console.log('🔄 Iniciando criação de nova ronda:', rondaData);
      console.log('🔄 Contrato selecionado:', contratoSelecionado);
      
      // Criar ronda básica no banco (sem áreas técnicas primeiro)
      const rondaBasica = await rondaService.create({
        nome: rondaData.nome,
        contrato: contratoSelecionado!.nome,
        data: rondaData.data,
        hora: rondaData.hora,
        responsavel: 'Ricardo Oliveira',
        observacoesGerais: rondaData.observacoesGerais,
        areasTecnicas: [], // Criar sem áreas primeiro
        fotosRonda: [],
        outrosItensCorrigidos: []
      });
      
      console.log('✅ Ronda básica criada no banco:', rondaBasica);
      
      // Criar a ronda final SEM áreas técnicas (usuário adiciona manualmente)
      const rondaFinal = {
        ...rondaBasica,
        areasTecnicas: [] // Começar vazio, usuário adiciona manualmente
      };
      
      console.log('✅ Ronda final criada:', rondaFinal);
      
      // Atualizar estado local
      setRondas(prev => [...prev, rondaFinal]);
      setRondaSelecionada(rondaFinal);
      setViewMode('visualizar');

      console.log('✅ Ronda completa criada e salva no banco!');
      console.log('🔍 Debug - rondaFinal definida como rondaSelecionada:', {
        id: rondaFinal.id,
        nome: rondaFinal.nome,
        idType: typeof rondaFinal.id,
        idLength: rondaFinal.id?.length
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
        areaSalva = await areaTecnicaService.update(areaTecnica.id, areaTecnica);
        console.log('✅ Área técnica atualizada no banco:', areaSalva);
      } else {
        // Adicionando nova área - criar no banco
        console.log('🆕 Criando nova área técnica no banco:', areaTecnica);
        const { id, ...areaSemId } = areaTecnica;
        areaSalva = await areaTecnicaService.create({
          ...areaSemId,
          ronda_id: rondaId
        });
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
    setCurrentView('contratos');
    setContratoSelecionado(null);
    setRondaSelecionada(null);
    setViewMode('tabela');
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

  return (
    <div className="min-h-screen">
      {/* Header com informações do usuário */}
      <header className="backdrop-blur bg-white/10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Building2 className="w-8 h-8 text-blue-300" />
              <h1 className="text-xl font-semibold text-white">Portal de Visitas MP</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Botão de debug temporário */}
              <Button
                onClick={debugDatabaseConnection}
                variant="outline"
                size="sm"
                className="text-yellow-300 border-yellow-400/30 hover:bg-yellow-500/10"
              >
                🔍 Debug DB
              </Button>
              
              {/* Informações do usuário */}
              <div className="flex items-center gap-2 text-sm text-white/80">
                <User className="w-4 h-4" />
                <span>{usuarioLogado?.nome}</span>
                <span className="text-white/40">•</span>
                <span>{usuarioLogado?.cargo}</span>
              </div>
              
              {/* Botão de logout */}
              <Button 
                onClick={async () => {
                  console.log('🔍 Iniciando debug do Supabase...');
                  await debugTableStructure();
                  const result = await debugSupabaseConnection();
                  if (result) {
                    alert('✅ Debug completo - Banco funcionando corretamente!');
                  } else {
                    alert('❌ Debug falhou - Verifique o console para detalhes');
                  }
                }} 
                variant="outline" 
                size="sm"
                className="text-blue-300 border-blue-400/30 hover:bg-blue-500/10 mr-2"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Debug Banco
              </Button>
              <Button 
                onClick={() => {
                  if (confirm('Tem certeza que deseja limpar todo o estado da aplicação? Isso irá remover rondas e contratos selecionados.')) {
                    limparEstadoCompleto();
                    alert('✅ Estado limpo com sucesso!');
                  }
                }} 
                variant="outline" 
                size="sm"
                className="text-yellow-300 border-yellow-400/30 hover:bg-yellow-500/10 mr-2"
              >
                <User className="w-4 h-4 mr-2" />
                Limpar Estado
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-red-300 border-red-400/30 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contrato Info */}
      {contratoSelecionado && (
        <div className="bg-blue-500/10 border-b border-blue-400/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-blue-200">{contratoSelecionado.nome}</h2>
                <p className="text-blue-200/80">
                  Síndico: {contratoSelecionado.sindico} | 
                  Endereço: {contratoSelecionado.endereco} | 
                  Periodicidade: {contratoSelecionado.periodicidade}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-200/80">Total de Rondas: {rondasDoContrato.length}</p>
                <p className="text-sm text-blue-200/80">Rondas Ativas: {rondasDoContrato.filter(r => r.data === new Date().toISOString().split('T')[0]).length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'contratos' ? (
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
            {/* Tabs de Navegação */}
            <div className="border-b border-gray-200/20 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setViewMode('tabela')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'tabela'
                      ? 'border-blue-400 text-blue-300'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Rondas Realizadas
                  </div>
                </button>
                
                <button
                  onClick={() => setViewMode('dashboard')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'dashboard'
                      ? 'border-blue-400 text-blue-300'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Dashboard
                  </div>
                </button>
                
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'kanban'
                      ? 'border-blue-400 text-blue-300'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Kanban className="w-4 h-4" />
                    Kanban de Implantação
                  </div>
                </button>
                
                <button
                  onClick={() => setViewMode('laudos')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'laudos'
                      ? 'border-blue-400 text-blue-300'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    Laudos
                  </div>
                </button>
                
                <button
                  onClick={() => setViewMode('calendario')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'calendario'
                      ? 'border-blue-400 text-blue-300'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Calendário de Visitas
                  </div>
                </button>
              </nav>
            </div>
            
            {/* Conteúdo baseado no modo de visualização */}
            {viewMode === 'tabela' && (
              <>
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
                  <h2 className="text-2xl font-semibold text-gray-100 mb-4">Selecione uma Ronda</h2>
                  <p className="text-gray-300 text-lg mb-8">
                    Clique em uma ronda na tabela acima para visualizar seus detalhes ou crie uma nova ronda.
                  </p>
                  <Button onClick={handleAddRonda} className="bg-green-600/80 hover:bg-green-600">
                    <FileText className="w-4 h-4 mr-2" />
                    Criar Nova Ronda
                  </Button>
                </div>
              </>
            )}

            {viewMode === 'kanban' && contratoSelecionado && (
              <KanbanBoard />
            )}

            {viewMode === 'laudos' && contratoSelecionado && (
              <LaudosKanban 
                contratoSelecionado={contratoSelecionado}
              />
            )}

            {viewMode === 'nova' && contratoSelecionado && (
              <NovaRondaScreen
                contrato={contratoSelecionado}
                onVoltar={() => setViewMode('tabela')}
                onSalvar={handleSaveRonda}
              />
            )}

            {viewMode === 'dashboard' && contratoSelecionado && (
              <Dashboard
                contrato={contratoSelecionado}
                rondas={rondasCompletas}
                areasTecnicas={areasTecnicasDoContrato}
              />
            )}

            {viewMode === 'calendario' && contratoSelecionado && (
              <CalendarView
                contrato={contratoSelecionado}
                onSelectContrato={setContratoSelecionado}
              />
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
                  // Implementar edição da ronda se necessário
                  alert('Funcionalidade de edição da ronda será implementada em breve');
                }}
                onExportarJSON={exportToJSON}
                isPrintMode={false}
              />
            )}
          </>
        )}
      </main>



      {/* Modals */}
      <AreaTecnicaModal
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

      <FotoRondaModal
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

    </div>
  );
}

export default App;