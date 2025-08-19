import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AreaTecnicaModal } from '@/components/AreaTecnicaModal';
import { NovaRondaScreen } from '@/components/NovaRondaScreen';
import { GerenciarContratos } from '@/components/GerenciarContratos';
import { PrintRonda } from '@/components/PrintRonda';
import { FotoRondaModal } from '@/components/FotoRondaModal';
import { TabelaRondas } from '@/components/TabelaRondas';
import { VisualizarRonda } from '@/components/VisualizarRonda';
import { OutroItemCorrigidoModal } from '@/components/OutroItemCorrigidoModal';
import { AreaTecnica, Ronda, Contrato, FotoRonda, OutroItemCorrigido } from '@/types';
import { AREAS_TECNICAS_PREDEFINIDAS } from '@/data/areasTecnicas';
import { FileText, Building2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

function App() {
  // Estados com dados iniciais vazios
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAreaTecnica, setEditingAreaTecnica] = useState<AreaTecnica | null>(null);
  const [editingFotoRonda, setEditingFotoRonda] = useState<FotoRonda | null>(null);
  const [isFotoRondaModalOpen, setIsFotoRondaModalOpen] = useState(false);
  const [editingOutroItem, setEditingOutroItem] = useState<OutroItemCorrigido | null>(null);
  const [isOutroItemModalOpen, setIsOutroItemModalOpen] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [currentView, setCurrentView] = useState<'contratos' | 'rondas'>('contratos');
  const [contratoSelecionado, setContratoSelecionado] = useState<Contrato | null>(null);
  const [viewMode, setViewMode] = useState<'tabela' | 'visualizar' | 'nova'>('tabela');
  const [rondaSelecionada, setRondaSelecionada] = useState<Ronda | null>(null);

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

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onAfterPrint: () => setIsPrintMode(false),
  });

  // Carregar dados salvos do localStorage ao iniciar a aplicação
  useEffect(() => {
    console.log('🔄 Carregando dados do localStorage...');
    console.log('🔄 localStorage disponível:', typeof localStorage !== 'undefined');
    
    try {
      const savedRondas = localStorage.getItem('appRonda_rondas');
      const savedContratos = localStorage.getItem('appRonda_contratos');
      
      console.log('🔄 Dados salvos encontrados:', { 
        savedRondas: savedRondas ? 'SIM' : 'NÃO',
        savedContratos: savedContratos ? 'SIM' : 'NÃO',
        tamanhoRondas: savedRondas ? JSON.parse(savedRondas).length : 0,
        tamanhoContratos: savedContratos ? JSON.parse(savedContratos).length : 0
      });
      
      if (savedRondas) {
        try {
          const rondasParsed = JSON.parse(savedRondas);
          console.log('🔄 Rondas carregadas:', rondasParsed);
          console.log('🔄 Número de rondas carregadas:', rondasParsed.length);
          
          // Migração: adicionar campo responsavel aos itens de FotoRonda que não têm
          const rondasMigradas = rondasParsed.map((ronda: any) => ({
            ...ronda,
            fotosRonda: ronda.fotosRonda?.map((foto: any) => ({
              ...foto,
              responsavel: foto.responsavel || 'CONDOMÍNIO' // Valor padrão para itens antigos
            })) || []
          }));
          
          console.log('🔄 Rondas migradas com campo responsavel:', rondasMigradas);
          setRondas(rondasMigradas);
        } catch (error) {
          console.error('❌ Erro ao carregar rondas:', error);
          console.error('❌ Conteúdo do localStorage:', savedRondas);
        }
      }
      
      if (savedContratos) {
        try {
          const contratosParsed = JSON.parse(savedContratos);
          console.log('🔄 Contratos carregados:', contratosParsed);
          console.log('🔄 Número de contratos carregados:', contratosParsed.length);
          console.log('🔄 IDs dos contratos carregados:', contratosParsed.map((c: any) => c.id));
          
          // Verificação adicional: garantir que todos os contratos tenham IDs válidos
          const contratosValidos = contratosParsed.filter((c: any) => c.id && c.nome);
          if (contratosValidos.length !== contratosParsed.length) {
            console.warn('⚠️ ALERTA: Alguns contratos não têm IDs válidos!');
            console.warn('⚠️ Contratos válidos:', contratosValidos.length);
            console.warn('⚠️ Contratos totais:', contratosParsed.length);
          }
          
          setContratos(contratosValidos);
        } catch (error) {
          console.error('❌ Erro ao carregar contratos:', error);
          console.error('❌ Conteúdo do localStorage:', savedContratos);
        }
      }

      // Se não houver dados salvos, criar dados de exemplo na primeira execução
      if (!savedContratos && !savedRondas) {
        console.log('🔄 Nenhum dado salvo encontrado, criando dados de exemplo...');
        const dadosExemplo = {
          contratos: [
            {
              id: '1',
              nome: 'CT001/2024 - Manutenção Preventiva',
              sindico: 'Maria Santos',
              endereco: 'Rua das Flores, 123 - Centro',
              periodicidade: 'MENSAL' as const,
              observacoes: 'Contrato de manutenção preventiva mensal',
              dataCriacao: '2024-01-01T00:00:00.000Z'
            },
            {
              id: '2',
              nome: 'CT002/2024 - Inspeção Semanal',
              sindico: 'João Oliveira',
              endereco: 'Av. Principal, 456 - Bairro Novo',
              periodicidade: 'SEMANAL' as const,
              observacoes: 'Inspeção semanal de segurança',
              dataCriacao: '2024-01-01T00:00:00.000Z'
            }
          ],
          rondas: [
            {
              id: '1',
              nome: 'Ronda Matutina - Centro',
              contrato: 'CT001/2024 - Manutenção Preventiva',
              data: '2024-01-15',
              hora: '08:00',
              responsavel: 'Ricardo Oliveira',
              observacoesGerais: 'Verificação geral das áreas técnicas',
              areasTecnicas: [
                {
                  id: '1',
                  nome: 'Gerador',
                  status: 'ATIVO' as const,
                  contrato: 'CT001/2024 - Manutenção Preventiva',
                  endereco: 'Rua das Flores, 123 - Centro',
                  data: '2024-01-15',
                  hora: '08:30',
                  foto: null,
                  observacoes: 'Área técnica funcionando perfeitamente'
                }
              ],
              fotosRonda: [],
              outrosItensCorrigidos: []
            }
          ]
        };

        console.log('🔄 Dados de exemplo criados:', dadosExemplo);
        setContratos(dadosExemplo.contratos);
        setRondas(dadosExemplo.rondas);
        
        // Salvar os dados de exemplo no localStorage
        try {
          localStorage.setItem('appRonda_contratos', JSON.stringify(dadosExemplo.contratos));
          localStorage.setItem('appRonda_rondas', JSON.stringify(dadosExemplo.rondas));
          console.log('🔄 Dados de exemplo salvos no localStorage com sucesso');
        } catch (error) {
          console.error('❌ Erro ao salvar dados de exemplo:', error);
        }
      }
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error);
    }
  }, []);

  // Salvar rondas automaticamente sempre que mudarem
  useEffect(() => {
    console.log('💾 Salvando rondas no localStorage:', rondas);
    console.log('💾 Stack trace do salvamento:', new Error().stack);
    console.log('💾 Número de rondas:', rondas.length);
    console.log('💾 IDs das rondas:', rondas.map(r => r.id));
    
    // Verificação de segurança: não salvar arrays vazios se já existem dados
    if (rondas.length === 0) {
      const savedRondas = localStorage.getItem('appRonda_rondas');
      if (savedRondas && JSON.parse(savedRondas).length > 0) {
        console.warn('⚠️ ALERTA: Tentativa de salvar array vazio quando existem rondas salvas!');
        console.warn('⚠️ Rondas salvas:', JSON.parse(savedRondas));
        return; // Não sobrescrever dados existentes com array vazio
      }
    }
    
    try {
      localStorage.setItem('appRonda_rondas', JSON.stringify(rondas));
      console.log('💾 Rondas salvas com sucesso no localStorage');
    } catch (error) {
      console.error('❌ Erro ao salvar rondas no localStorage:', error);
    }
  }, [rondas]);

  // Função de backup automático
  const fazerBackup = () => {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        contratos: contratos,
        rondas: rondas
      };
      localStorage.setItem('appRonda_backup', JSON.stringify(backup));
      console.log('💾 Backup automático criado:', backup.timestamp);
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error);
    }
  };

  // Salvar contratos automaticamente sempre que mudarem
  useEffect(() => {
    console.log('💾 Salvando contratos no localStorage:', contratos);
    console.log('💾 Stack trace do salvamento:', new Error().stack);
    console.log('💾 Número de contratos:', contratos.length);
    console.log('💾 IDs dos contratos:', contratos.map(c => c.id));
    
    // Verificação de segurança: não salvar arrays vazios se já existem dados
    if (contratos.length === 0) {
      const savedContratos = localStorage.getItem('appRonda_contratos');
      if (savedContratos && JSON.parse(savedContratos).length > 0) {
        console.warn('⚠️ ALERTA: Tentativa de salvar array vazio quando existem contratos salvos!');
        console.warn('⚠️ Contratos salvos:', JSON.parse(savedContratos));
        return; // Não sobrescrever dados existentes com array vazio
      }
    }
    
    try {
      localStorage.setItem('appRonda_contratos', JSON.stringify(contratos));
      console.log('💾 Contratos salvos com sucesso no localStorage');
      
      // Fazer backup após salvar com sucesso
      fazerBackup();
    } catch (error) {
      console.error('❌ Erro ao salvar contratos no localStorage:', error);
    }
  }, [contratos]);

  // Filtrar rondas pelo contrato selecionado
  const rondasDoContrato = contratoSelecionado 
    ? rondas.filter(r => r.contrato === contratoSelecionado.nome)
    : [];

  const handleAddRonda = () => {
    if (!contratoSelecionado) {
      alert('Por favor, selecione um contrato primeiro');
      return;
    }
    setViewMode('nova');
  };

  const handleSaveRonda = (rondaData: {
    nome: string;
    data: string;
    hora: string;
    observacoesGerais?: string;
  }) => {
    // Garantir que a nova ronda tenha o contrato correto e responsável padrão
    const rondaCompleta: Ronda = {
      id: Date.now().toString(),
      nome: rondaData.nome,
      contrato: contratoSelecionado!.nome,
      data: rondaData.data,
      hora: rondaData.hora,
      responsavel: 'Ricardo Oliveira',
      observacoesGerais: rondaData.observacoesGerais,
      areasTecnicas: AREAS_TECNICAS_PREDEFINIDAS.map((nome, index) => ({
        id: (Date.now() + index).toString(),
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
    };
    
    setRondas(prev => [...prev, rondaCompleta]);
    setRondaSelecionada(rondaCompleta);
    setViewMode('visualizar');
    
    // Mostrar mensagem informativa
    alert(`Ronda "${rondaData.nome}" criada com sucesso!\n\nAs 8 áreas técnicas foram criadas automaticamente.\n\nAgora você pode:\n• Editar o status de cada área\n• Adicionar fotos\n• Incluir observações\n\nClique em "Editar Áreas Técnicas" para editar as áreas existentes.`);
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

  const handleDeleteAreaTecnica = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta área técnica?')) {
      setRondas(prev => prev.map(ronda => {
        if (ronda.id === rondaSelecionada?.id) {
          return {
            ...ronda,
            areasTecnicas: ronda.areasTecnicas.filter((at: AreaTecnica) => at.id !== id)
          };
        }
        return ronda;
      }));

      // Atualizar a ronda selecionada também
      setRondaSelecionada(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          areasTecnicas: prev.areasTecnicas.filter((at: AreaTecnica) => at.id !== id)
        };
      });
    }
  };

  const handleSaveAreaTecnica = (areaTecnica: AreaTecnica) => {
    console.log('handleSaveAreaTecnica chamado:', { areaTecnica, rondaSelecionada, editingAreaTecnica });
    console.log('Stack trace:', new Error().stack);
    
    if (!rondaSelecionada) {
      console.error('Nenhuma ronda selecionada!');
      return;
    }

    setRondas(prev => prev.map(ronda => {
      if (ronda.id === rondaSelecionada.id) {
        if (editingAreaTecnica) {
          console.log('Editando área técnica existente');
          return {
            ...ronda,
            areasTecnicas: ronda.areasTecnicas.map((at: AreaTecnica) =>
              at.id === areaTecnica.id ? areaTecnica : at
            )
          };
        } else {
          console.log('Adicionando nova área técnica');
          return {
            ...ronda,
            areasTecnicas: [...ronda.areasTecnicas, areaTecnica]
          };
        }
      }
      return ronda;
    }));

    // Atualizar a ronda selecionada também
    setRondaSelecionada(prev => {
      if (!prev) return prev;
      if (editingAreaTecnica) {
        const nova = {
          ...prev,
          areasTecnicas: prev.areasTecnicas.map((at: AreaTecnica) =>
            at.id === areaTecnica.id ? areaTecnica : at
          )
        };
        console.log('Ronda selecionada atualizada:', nova);
        return nova;
      } else {
        const nova = {
          ...prev,
          areasTecnicas: [...prev.areasTecnicas, areaTecnica]
        };
        console.log('Ronda selecionada atualizada:', nova);
        return nova;
      }
    });
  };

  const handlePrintMode = () => {
    if (!rondaSelecionada) {
      alert('Por favor, selecione uma ronda para imprimir');
      return;
    }
    setIsPrintMode(true);
    setTimeout(() => {
      handlePrint();
    }, 100);
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

  const handleSaveContrato = (contrato: Contrato) => {
    console.log('💾 Salvando contrato:', contrato);
    console.log('💾 Estado atual dos contratos:', contratos);
    console.log('💾 Contrato selecionado atual:', contratoSelecionado);
    
    // Validação adicional para evitar contratos sem ID
    if (!contrato.id) {
      console.error('❌ ERRO: Contrato sem ID!', contrato);
      alert('Erro: Contrato sem ID. Tente novamente.');
      return;
    }
    
    // Função para salvar no localStorage imediatamente
    const salvarNoLocalStorage = (contratosAtualizados: Contrato[]) => {
      try {
        localStorage.setItem('appRonda_contratos', JSON.stringify(contratosAtualizados));
        console.log('💾 Contratos salvos imediatamente no localStorage');
      } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
      }
    };
    
    setContratos(prev => {
      const existingIndex = prev.findIndex(c => c.id === contrato.id);
      console.log('💾 Índice do contrato existente:', existingIndex);
      console.log('💾 Contratos anteriores:', prev.map(c => ({ id: c.id, nome: c.nome })));
      
      let contratosAtualizados: Contrato[];
      
      if (existingIndex >= 0) {
        // Editando contrato existente
        contratosAtualizados = prev.map(c => c.id === contrato.id ? contrato : c);
        console.log('💾 Contratos após edição:', contratosAtualizados.map(c => ({ id: c.id, nome: c.nome })));
        
        // Verificação de segurança: garantir que não perdemos contratos
        if (contratosAtualizados.length !== prev.length) {
          console.error('❌ ALERTA: Número de contratos mudou durante edição!');
          console.error('❌ Antes:', prev.length, 'Depois:', contratosAtualizados.length);
          // Restaurar estado anterior em caso de erro
          return prev;
        }
      } else {
        // Criando novo contrato
        const newContrato = {
          ...contrato,
          id: Date.now().toString(), // Garantir ID único
          dataCriacao: new Date().toISOString()
        };
        contratosAtualizados = [...prev, newContrato];
        console.log('💾 Contratos após criação:', contratosAtualizados.map(c => ({ id: c.id, nome: c.nome })));
      }
      
      // Salvar no localStorage imediatamente
      salvarNoLocalStorage(contratosAtualizados);
      
      return contratosAtualizados;
    });
    
    // Verificar se o contrato atual foi editado e atualizar o contrato selecionado
    if (contratoSelecionado && contratoSelecionado.id === contrato.id) {
      setContratoSelecionado(contrato);
      console.log('💾 Contrato selecionado atualizado:', contrato);
    }
    
    // Verificação adicional após a atualização
    setTimeout(() => {
      console.log('💾 Verificação pós-salvamento - Contratos no estado:', contratos);
      console.log('💾 Verificação pós-salvamento - Contratos no localStorage:', localStorage.getItem('appRonda_contratos'));
    }, 100);
  };

  const handleDeleteContrato = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.')) {
      setContratos(prev => {
        const contratosAtualizados = prev.filter(c => c.id !== id);
        
        // Salvar no localStorage imediatamente
        try {
          localStorage.setItem('appRonda_contratos', JSON.stringify(contratosAtualizados));
          console.log('💾 Contratos salvos no localStorage após exclusão');
        } catch (error) {
          console.error('❌ Erro ao salvar no localStorage após exclusão:', error);
        }
        
        return contratosAtualizados;
      });
      
      // Se o contrato deletado era o selecionado, limpar a seleção
      if (contratoSelecionado && contratoSelecionado.id === id) {
        setContratoSelecionado(null);
        setCurrentView('contratos');
        setViewMode('tabela');
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

  const handleRecuperarDados = () => {
    console.log('🚨 Tentando recuperar dados perdidos...');
    
    try {
      // Verificar se há dados corrompidos
      const savedRondas = localStorage.getItem('appRonda_rondas');
      const savedContratos = localStorage.getItem('appRonda_contratos');
      
      console.log('🚨 Dados encontrados no localStorage:', { savedRondas, savedContratos });
      console.log('🚨 Estado atual dos contratos:', contratos);
      console.log('🚨 Estado atual das rondas:', rondas);
      
      if (savedRondas) {
        try {
          const rondasParsed = JSON.parse(savedRondas);
          console.log('🚨 Rondas recuperadas:', rondasParsed);
          setRondas(rondasParsed);
        } catch (error) {
          console.error('🚨 Erro ao recuperar rondas:', error);
        }
      }
      
      if (savedContratos) {
        try {
          const contratosParsed = JSON.parse(savedContratos);
          console.log('🚨 Contratos recuperados:', contratosParsed);
          setContratos(contratosParsed);
        } catch (error) {
          console.error('🚨 Erro ao recuperar contratos:', error);
        }
      }
      
      alert('Tentativa de recuperação concluída. Verifique o console para detalhes.');
    } catch (error) {
      console.error('🚨 Erro na recuperação:', error);
      alert('Erro na recuperação. Verifique o console.');
    }
  };

  const handleDebugContratos = () => {
    console.log('🔍 DEBUG - Estado atual dos contratos:');
    console.log('🔍 Contratos no estado:', contratos);
    console.log('🔍 Contratos no localStorage:', localStorage.getItem('appRonda_contratos'));
    console.log('🔍 Contrato selecionado:', contratoSelecionado);
    console.log('🔍 Número de contratos:', contratos.length);
    console.log('🔍 IDs dos contratos:', contratos.map(c => ({ id: c.id, nome: c.nome })));
    
    alert('Informações de debug enviadas para o console. Pressione F12 para ver.');
  };

  const handleRecuperarContratos = () => {
    console.log('🔄 Tentando recuperar contratos perdidos...');
    
    try {
      const savedContratos = localStorage.getItem('appRonda_contratos');
      if (savedContratos) {
        const contratosParsed = JSON.parse(savedContratos);
        console.log('🔄 Contratos encontrados no localStorage:', contratosParsed);
        
        if (contratosParsed.length > 0) {
          setContratos(contratosParsed);
          console.log('🔄 Contratos recuperados com sucesso!');
          alert(`Contratos recuperados com sucesso! Total: ${contratosParsed.length}`);
        } else {
          console.log('🔄 Nenhum contrato encontrado no localStorage');
          alert('Nenhum contrato encontrado no localStorage');
        }
      } else {
        console.log('🔄 Nenhum dado de contratos encontrado no localStorage');
        alert('Nenhum dado de contratos encontrado no localStorage');
      }
    } catch (error) {
      console.error('🔄 Erro ao recuperar contratos:', error);
      alert('Erro ao recuperar contratos. Verifique o console.');
    }
  };

  const handleRestaurarBackup = () => {
    console.log('🔄 Tentando restaurar dados do backup...');
    
    try {
      const backup = localStorage.getItem('appRonda_backup');
      if (backup) {
        const backupData = JSON.parse(backup);
        console.log('🔄 Backup encontrado:', backupData);
        
        if (backupData.contratos && backupData.contratos.length > 0) {
          setContratos(backupData.contratos);
          console.log('🔄 Contratos restaurados do backup!');
        }
        
        if (backupData.rondas && backupData.rondas.length > 0) {
          setRondas(backupData.rondas);
          console.log('🔄 Rondas restauradas do backup!');
        }
        
        alert(`Backup restaurado com sucesso!\n\nContratos: ${backupData.contratos?.length || 0}\nRondas: ${backupData.rondas?.length || 0}\n\nTimestamp: ${new Date(backupData.timestamp).toLocaleString('pt-BR')}`);
      } else {
        console.log('🔄 Nenhum backup encontrado');
        alert('Nenhum backup encontrado no localStorage');
      }
    } catch (error) {
      console.error('🔄 Erro ao restaurar backup:', error);
      alert('Erro ao restaurar backup. Verifique o console.');
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

  const handleSaveFotoRonda = (fotoRonda: FotoRonda) => {
    if (rondaSelecionada) {
      let updatedFotosRonda;
      
      if (editingFotoRonda) {
        // Editando foto existente
        updatedFotosRonda = rondaSelecionada.fotosRonda.map(fr => 
          fr.id === fotoRonda.id ? fotoRonda : fr
        );
      } else {
        // Adicionando nova foto
        updatedFotosRonda = [...rondaSelecionada.fotosRonda, fotoRonda];
      }
      
      const updatedRonda = { ...rondaSelecionada, fotosRonda: updatedFotosRonda };
      setRondas(prev => prev.map(r => r.id === rondaSelecionada.id ? updatedRonda : r));
      
      // Atualizar a ronda selecionada também
      setRondaSelecionada(updatedRonda);
    }
  };

  const handleDeleteFotoRonda = (id: string) => {
    if (rondaSelecionada) {
      if (confirm('Tem certeza que deseja excluir este item da ronda? Esta ação não pode ser desfeita.')) {
        const updatedFotosRonda = rondaSelecionada.fotosRonda.filter(fr => fr.id !== id);
        const updatedRonda = { ...rondaSelecionada, fotosRonda: updatedFotosRonda };
        
        setRondas(prev => prev.map(r => r.id === rondaSelecionada.id ? updatedRonda : r));
        
        // Atualizar a ronda selecionada também
        setRondaSelecionada(updatedRonda);
        
        console.log('Item da ronda excluído com sucesso');
      }
    }
  };

  const handleAddOutroItem = () => {
    if (!rondaSelecionada) return;
    setEditingOutroItem(null);
    setIsOutroItemModalOpen(true);
  };

  const handleSaveOutroItem = (outroItem: OutroItemCorrigido) => {
    if (!rondaSelecionada) return;

    setRondas(prev => prev.map(ronda => {
      if (ronda.id === rondaSelecionada.id) {
        if (editingOutroItem) {
          return {
            ...ronda,
            outrosItensCorrigidos: ronda.outrosItensCorrigidos.map(item => 
              item.id === outroItem.id ? outroItem : item
            )
          };
        } else {
          return {
            ...ronda,
            outrosItensCorrigidos: [...ronda.outrosItensCorrigidos, outroItem]
          };
        }
      }
      return ronda;
    }));

    setRondaSelecionada(prev => {
      if (!prev) return prev;
      if (editingOutroItem) {
        return {
          ...prev,
          outrosItensCorrigidos: editingOutroItem 
            ? prev.outrosItensCorrigidos.map(item => item.id === outroItem.id ? outroItem : item)
            : [...prev.outrosItensCorrigidos, outroItem]
        };
      } else {
        return {
          ...prev,
          outrosItensCorrigidos: [...prev.outrosItensCorrigidos, outroItem]
        };
      }
    });

    setIsOutroItemModalOpen(false);
    setEditingOutroItem(null);
  };

  const handleDeleteOutroItem = (id: string) => {
    if (!rondaSelecionada) return;
    
    if (confirm('Tem certeza que deseja excluir este item?')) {
      setRondas(prev => prev.map(ronda => {
        if (ronda.id === rondaSelecionada.id) {
          return {
            ...ronda,
            outrosItensCorrigidos: ronda.outrosItensCorrigidos.filter(item => item.id !== id)
          };
        }
        return ronda;
      }));

      setRondaSelecionada(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          outrosItensCorrigidos: prev.outrosItensCorrigidos.filter(item => item.id !== id)
        };
      });
    }
  };

  const handleVoltarContratos = () => {
    setCurrentView('contratos');
    setContratoSelecionado(null);
    setRondaSelecionada(null);
    setViewMode('tabela');
  };

  if (currentView === 'contratos') {
    return (
      <GerenciarContratos
        contratos={contratos}
        onSaveContrato={handleSaveContrato}
        onDeleteContrato={handleDeleteContrato}
        onSelectContrato={handleSelectContrato}
        onVoltar={() => {}} // Não precisa de voltar na tela principal
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleVoltarContratos} 
                variant="ghost" 
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar aos Contratos
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">App Ronda</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleAddRonda} variant="outline" className="bg-green-600 text-white hover:bg-green-700">
                <FileText className="w-4 h-4 mr-2" />
                Nova Ronda
              </Button>
              <Button 
                onClick={handleRecuperarDados} 
                variant="outline" 
                className="bg-purple-600 text-white hover:bg-purple-700"
                title="Tentar recuperar dados perdidos"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Recuperar Dados
              </Button>
              <Button 
                onClick={handleRecriarDados} 
                variant="outline" 
                className="bg-yellow-600 text-white hover:bg-yellow-700"
                title="Recriar dados de exemplo"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Recriar Dados
              </Button>
              <Button 
                onClick={handleDebugContratos} 
                variant="outline" 
                className="bg-gray-600 text-white hover:bg-gray-700"
                title="Debug dos contratos"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Debug Contratos
              </Button>
              <Button 
                onClick={handleRecuperarContratos} 
                variant="outline" 
                className="bg-green-600 text-white hover:bg-green-700"
                title="Recuperar contratos perdidos"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Recuperar Contratos
              </Button>
              <Button 
                onClick={handleRestaurarBackup} 
                variant="outline" 
                className="bg-indigo-600 text-white hover:bg-indigo-700"
                title="Restaurar dados do último backup automático"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Restaurar Backup
              </Button>
              <Button 
                onClick={handleLimparDados} 
                variant="outline" 
                className="bg-red-600 text-white hover:bg-red-700"
                title="Limpar todos os dados da aplicação"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Limpar Dados
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contrato Info */}
      {contratoSelecionado && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-blue-900">{contratoSelecionado.nome}</h2>
                <p className="text-blue-700">
                  Síndico: {contratoSelecionado.sindico} | 
                  Endereço: {contratoSelecionado.endereco} | 
                  Periodicidade: {contratoSelecionado.periodicidade}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600">Total de Rondas: {rondasDoContrato.length}</p>
                <p className="text-sm text-blue-600">Rondas Ativas: {rondasDoContrato.filter(r => r.data === new Date().toISOString().split('T')[0]).length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!contratoSelecionado ? (
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
            {/* Conteúdo baseado no modo de visualização */}
            {viewMode === 'tabela' && (
              <>
                {/* Tabela de Rondas */}
                <div className="mb-8">
                  <TabelaRondas
                    rondas={rondasDoContrato}
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
                  />
                </div>

                {/* Mensagem de seleção */}
                <div className="text-center py-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Selecione uma Ronda</h2>
                  <p className="text-gray-600 text-lg mb-8">
                    Clique em uma ronda na tabela acima para visualizar seus detalhes ou crie uma nova ronda.
                  </p>
                  <Button onClick={handleAddRonda} className="bg-green-600 hover:bg-green-700">
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

            {viewMode === 'visualizar' && rondaSelecionada && contratoSelecionado && (
              <VisualizarRonda
                ronda={rondaSelecionada}
                contrato={contratoSelecionado}
                areasTecnicas={rondaSelecionada.areasTecnicas}
                onVoltar={() => setViewMode('tabela')}
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
                onExportarPDF={handlePrintMode}
                onExportarJSON={exportToJSON}
                isPrintMode={isPrintMode}
              />
            )}
          </>
        )}
      </main>

      {/* Componente para Impressão/PDF */}
      {rondaSelecionada && contratoSelecionado && (
        <div style={{ display: 'none' }}>
          <PrintRonda
            ref={printRef}
            ronda={rondaSelecionada}
            contrato={contratoSelecionado}
            areasTecnicas={rondaSelecionada.areasTecnicas}
          />
        </div>
      )}

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
