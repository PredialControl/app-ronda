import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AreaTecnicaModal } from '@/components/AreaTecnicaModal';
import { NovaRondaScreen } from '@/components/NovaRondaScreen';
import { GerenciarContratos } from '@/components/GerenciarContratos';

import { FotoRondaModal } from '@/components/FotoRondaModal';
import { TabelaRondas } from '@/components/TabelaRondas';
import { VisualizarRonda } from '@/components/VisualizarRonda';
import { OutroItemCorrigidoModal } from '@/components/OutroItemCorrigidoModal';
import { Dashboard } from '@/components/Dashboard';
import { LoginScreen } from '@/components/LoginScreen';
import { AreaTecnica, Ronda, Contrato, FotoRonda, OutroItemCorrigido, UsuarioAutorizado } from '@/types';
import { AREAS_TECNICAS_PREDEFINIDAS } from '@/data/areasTecnicas';
import { FileText, Building2, BarChart3, LogOut, User } from 'lucide-react';

import { contratoService, rondaService, areaTecnicaService, fotoRondaService, outroItemService } from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';
import { authService } from '@/lib/auth';


function App() {
  // Estados com dados iniciais vazios
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);

  // Estados de autenticação
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioAutorizado | null>(null);
  const [isAutenticado, setIsAutenticado] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAreaTecnica, setEditingAreaTecnica] = useState<AreaTecnica | null>(null);
  const [editingFotoRonda, setEditingFotoRonda] = useState<FotoRonda | null>(null);
  const [isFotoRondaModalOpen, setIsFotoRondaModalOpen] = useState(false);
  const [editingOutroItem, setEditingOutroItem] = useState<OutroItemCorrigido | null>(null);
  const [isOutroItemModalOpen, setIsOutroItemModalOpen] = useState(false);

  const [currentView, setCurrentView] = useState<'contratos' | 'rondas'>('contratos');
  const [contratoSelecionado, setContratoSelecionado] = useState<Contrato | null>(null);
  const [viewMode, setViewMode] = useState<'tabela' | 'visualizar' | 'nova' | 'dashboard'>('tabela');
  const [rondaSelecionada, setRondaSelecionada] = useState<Ronda | null>(null);
  const [rondasCompletas, setRondasCompletas] = useState<Ronda[]>([]);
  

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

  // Log para debug da ronda selecionada
  useEffect(() => {
    console.log('Ronda selecionada mudou:', rondaSelecionada);
  }, [rondaSelecionada]);

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
        console.log('🔄 Carregando dados do banco Supabase/Neon...');

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
            fotosRonda: rondaSelecionada.fotosRonda.length,
            areasTecnicas: rondaSelecionada.areasTecnicas.length
          });
          
          // Buscar ronda atualizada do banco com todos os dados relacionados
          const rondaAtualizada = await rondaService.getById(rondaSelecionada.id);
          
          if (rondaAtualizada) {
            console.log('✅ Ronda recarregada do banco:', rondaAtualizada);
            console.log('📸 Fotos encontradas:', rondaAtualizada.fotosRonda.length);
            console.log('🔧 Áreas técnicas encontradas:', rondaAtualizada.areasTecnicas.length);
            
            // Atualizar estado local com dados frescos do banco
            setRondaSelecionada(rondaAtualizada);
            setRondas(prev => prev.map(r => r.id === rondaAtualizada.id ? rondaAtualizada : r));
            
            console.log('✅ Estado atualizado após recarregar:', {
              id: rondaAtualizada.id,
              nome: rondaAtualizada.nome,
              fotosRonda: rondaAtualizada.fotosRonda.length,
              areasTecnicas: rondaAtualizada.areasTecnicas.length
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
      
      Promise.all(
        rondasDoContrato.map(ronda => 
          rondaService.loadCompleteRonda(ronda)
        )
      ).then(rondasCompletas => {
        console.log('✅ Dados completos carregados:', rondasCompletas.length);
        setRondasCompletas(rondasCompletas);
      }).catch(error => {
        console.error('❌ Erro ao carregar dados completos:', error);
        setRondasCompletas(rondasDoContrato); // Usar dados básicos se der erro
      });
    } else {
      setRondasCompletas([]);
    }
  }, [contratoSelecionado, rondasDoContrato]);

  // Filtrar áreas técnicas pelo contrato selecionado
  const areasTecnicasDoContrato = contratoSelecionado
    ? rondasCompletas.flatMap(ronda => ronda.areasTecnicas)
    : [];

  const handleAddRonda = () => {
    if (!contratoSelecionado) {
      alert('Por favor, selecione um contrato primeiro');
      return;
    }
    setViewMode('nova');
  };

  const handleSaveRonda = async (rondaData: {
    nome: string;
    data: string;
    hora: string;
    observacoesGerais?: string;
  }) => {
    try {
      // Criar ronda no banco
      const rondaCompleta = await rondaService.create({
        nome: rondaData.nome,
        contrato: contratoSelecionado!.nome,
        data: rondaData.data,
        hora: rondaData.hora,
        responsavel: 'Ricardo Oliveira',
        observacoesGerais: rondaData.observacoesGerais,
        areasTecnicas: AREAS_TECNICAS_PREDEFINIDAS.map((nome, index) => ({
          id: crypto.randomUUID(),
          nome,
          status: 'ATIVO' as const,
          contrato: contratoSelecionado!.nome,
          endereco: contratoSelecionado!.endereco,
          data: rondaData.data,
          hora: rondaData.hora,
          foto: null,
          observacoes: ''
        })),
        fotosRonda: [],
        outrosItensCorrigidos: []
      });
      
      console.log('✅ Ronda básica criada no banco:', rondaCompleta);
      
      // AGORA salvar as áreas técnicas no banco também
      const areasTecnicasCompletas = AREAS_TECNICAS_PREDEFINIDAS.map((nome, index) => ({
        id: crypto.randomUUID(),
        nome,
        status: 'ATIVO' as const,
        contrato: contratoSelecionado!.nome,
        endereco: contratoSelecionado!.endereco,
        data: rondaData.data,
        hora: rondaData.hora,
        foto: null,
        observacoes: ''
      }));
      
      // Atualizar a ronda com as áreas técnicas e salvar no banco
      const rondaComAreasTecnicas = {
        ...rondaCompleta,
        areasTecnicas: areasTecnicasCompletas
      };
      
      console.log('💾 Salvando ronda com áreas técnicas no banco:', rondaComAreasTecnicas);
      
      const rondaFinal = await rondaService.update(rondaCompleta.id, rondaComAreasTecnicas);
      console.log('✅ Ronda com áreas técnicas salva no banco:', rondaFinal);
      
      // Atualizar estado local
      setRondas(prev => [...prev, rondaFinal]);
      setRondaSelecionada(rondaFinal);
      setViewMode('visualizar');
      
      console.log('✅ Ronda completa criada e salva no banco!');
      
      // Mostrar mensagem informativa
      alert(`Ronda "${rondaData.nome}" criada com sucesso!\n\nAs 8 áreas técnicas foram criadas automaticamente.\n\nAgora você pode:\n• Editar o status de cada área\n• Adicionar fotos\n• Incluir observações\n\nClique em "Editar Áreas Técnicas" para editar as áreas existentes.`);
    } catch (error) {
      console.error('❌ Erro ao criar ronda no banco:', error);
      alert('Erro ao criar ronda. Verifique o console.');
    }
  };

  const handleAddAreaTecnica = () => {
    console.log('handleAddAreaTecnica chamado, rondaSelecionada:', rondaSelecionada);
    if (!rondaSelecionada) {
      alert('Por favor, selecione ou crie uma ronda primeiro');
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
    console.log('handleSaveAreaTecnica chamado:', { areaTecnica, rondaSelecionada, editingAreaTecnica });
    
    if (!rondaSelecionada) {
      console.error('❌ Nenhuma ronda selecionada!');
      alert('Erro: Nenhuma ronda selecionada. Recarregue a página e tente novamente.');
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
          ronda_id: rondaSelecionada.id
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
      
      if (error.message.includes('Timeout')) {
        alert('⏱️ Operação demorou muito para responder. Tente novamente ou verifique sua conexão.');
      } else if (error.message.includes('canceling statement')) {
        alert('🔄 Operação foi cancelada devido ao tempo limite. Tente novamente.');
      } else {
        alert(`❌ Erro ao salvar área técnica: ${error.message || 'Erro desconhecido'}`);
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
      
      if (error.message.includes('Timeout')) {
        alert('⏱️ Upload da foto demorou muito para responder. Tente novamente ou verifique sua conexão.');
      } else if (error.message.includes('canceling statement')) {
        alert('🔄 Upload foi cancelado devido ao tempo limite. Tente novamente.');
      } else {
        alert(`❌ Erro ao salvar foto: ${error.message || 'Erro desconhecido'}`);
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
        
        if (error.message.includes('Timeout')) {
          alert('⏱️ Exclusão demorou muito para responder. Tente novamente.');
        } else if (error.message.includes('canceling statement')) {
          alert('🔄 Exclusão foi cancelada devido ao tempo limite. Tente novamente.');
        } else {
          alert(`❌ Erro ao excluir foto: ${error.message || 'Erro desconhecido'}`);
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
        itemSalvo = await outroItemService.update(outroItem.id, outroItem);
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
      const updatedOutrosItens = editingOutroItem
        ? rondaSelecionada.outrosItensCorrigidos.map(item => item.id === itemSalvo.id ? itemSalvo : item)
        : [...rondaSelecionada.outrosItensCorrigidos, itemSalvo];
      
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

  return (
    <div className="min-h-screen">
      {/* Header com informações do usuário */}
      <header className="backdrop-blur bg-white/10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Building2 className="w-8 h-8 text-blue-300" />
              <h1 className="text-xl font-semibold text-white">Portal de Visitas Manutenção Predial</h1>
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
                  onClick={() => setViewMode('nova')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'nova'
                      ? 'border-blue-400 text-blue-300'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Medições (Água, Luz, Gás)
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
                    onDeletarRonda={(id) => {
                      if (confirm('Tem certeza que deseja excluir esta ronda? Esta ação não pode ser desfeita.')) {
                        setRondas(prev => prev.filter(r => r.id !== id));
                        if (rondaSelecionada?.id === id) {
                          setRondaSelecionada(null);
                          setViewMode('tabela');
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
        contratoRonda={rondaSelecionada?.contrato}
        enderecoRonda={contratoSelecionado?.endereco}
        dataRonda={rondaSelecionada?.data}
        horaRonda={rondaSelecionada?.hora}
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

      <OutroItemCorrigidoModal
        item={editingOutroItem}
        isOpen={isOutroItemModalOpen}
        onClose={() => {
          setIsOutroItemModalOpen(false);
          setEditingOutroItem(null);
        }}
        onSave={handleSaveOutroItem}
        contratoRonda={rondaSelecionada?.contrato}
        enderecoRonda={contratoSelecionado?.endereco}
      />
    </div>
  );
}

export default App;
