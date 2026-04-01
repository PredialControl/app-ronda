// SupervisorApp - PWA Mobile para Supervisores
// Interface otimizada para uso em campo com celular

import { useState, useEffect, useRef } from 'react';
import { authService } from '@/lib/auth';
import { contratoService, rondaService } from '@/lib/supabaseService';
import { Contrato, Ronda, ChecklistItem, UsuarioAutorizado } from '@/types';
import { AREAS_TECNICAS_PREDEFINIDAS } from '@/data/areasTecnicas';
import {
  LogIn,
  LogOut,
  Building2,
  ChevronRight,
  AlertTriangle,
  PlayCircle,
  Camera,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  ArrowLeft,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  MapPin,
  Flame,
  Wrench,
  Home,
  List,
  User
} from 'lucide-react';

// Configuração de locais por equipamento
// tipo: 'fixo' = local único óbvio, 'opcoes' = escolher entre opções, 'livre' = digitar
const LOCAIS_EQUIPAMENTOS: Record<string, { tipo: 'fixo' | 'opcoes' | 'livre', valor?: string, opcoes?: string[] }> = {
  // Áreas Técnicas (Ronda Semanal) - locais fixos ou com opções
  'Gerador': { tipo: 'fixo', valor: 'Sala do Gerador' },
  'Nível óleo diesel': { tipo: 'fixo', valor: 'Sala do Gerador' },
  'Pressurização': { tipo: 'fixo', valor: 'Casa de Máquinas' },
  'Bombas de água potável': { tipo: 'fixo', valor: 'Casa de Máquinas' },
  'Boilers': { tipo: 'fixo', valor: 'Casa de Máquinas' },
  'Bombas de água quente': { tipo: 'fixo', valor: 'Casa de Máquinas' },
  'Bomba de reúso': { tipo: 'fixo', valor: 'Casa de Máquinas' },
  'Bomba de esgoto': { tipo: 'fixo', valor: 'Subsolo' },
  'Bomba de água pluvial': { tipo: 'fixo', valor: 'Subsolo' },
  'Caixas de água': { tipo: 'opcoes', opcoes: ['Reservatório Superior', 'Reservatório Inferior'] },
  'Barrilete': { tipo: 'fixo', valor: 'Cobertura' },
  'Aquecedores': { tipo: 'fixo', valor: 'Casa de Máquinas' },
  'Poço de drenagem': { tipo: 'fixo', valor: 'Subsolo' },
  'Central de Incêndio': { tipo: 'fixo', valor: 'Portaria' },
  'Bomba de Incêndio': { tipo: 'fixo', valor: 'Casa de Máquinas' },

  // Ronda Mensal (Incêndio) - livre para digitar (múltiplos locais)
  'Extintores': { tipo: 'livre' },
  'Mangueiras de incêndio': { tipo: 'livre' },
  'Hidrantes': { tipo: 'livre' },
  'Sinalização de emergência': { tipo: 'livre' },
  'Portas corta-fogo': { tipo: 'livre' },

  // Ronda Bimestral (Áreas Comuns) - livre para digitar
  'Halls de entrada': { tipo: 'livre' },
  'Iluminação dos corredores': { tipo: 'livre' },
  'Escadarias': { tipo: 'livre' },
  'Corrimãos e guarda-corpos': { tipo: 'livre' },
  'Pisos e revestimentos': { tipo: 'livre' }
};

// Configuração das rondas por periodicidade (igual ao sistema principal)
const CONFIG_RONDAS = {
  SEMANAL: {
    nome: 'Ronda Semanal',
    icon: Wrench,
    cor: 'emerald',
    periodicidadeDias: 7,
    descricao: 'Áreas Técnicas',
    roteiro: AREAS_TECNICAS_PREDEFINIDAS
  },
  MENSAL: {
    nome: 'Ronda Mensal',
    icon: Flame,
    cor: 'blue',
    periodicidadeDias: 30,
    descricao: 'Incêndio',
    roteiro: [
      'Extintores',
      'Mangueiras de incêndio',
      'Hidrantes',
      'Sinalização de emergência',
      'Portas corta-fogo'
    ]
  },
  BIMESTRAL: {
    nome: 'Ronda Bimestral',
    icon: Building2,
    cor: 'purple',
    periodicidadeDias: 60,
    descricao: 'Áreas Comuns',
    roteiro: [
      'Halls de entrada',
      'Iluminação dos corredores',
      'Escadarias',
      'Corrimãos e guarda-corpos',
      'Pisos e revestimentos'
    ]
  }
};

type TemplateKey = keyof typeof CONFIG_RONDAS;
type ViewMode = 'login' | 'contratos' | 'contrato' | 'ronda' | 'addItem' | 'checklist';

interface RondaPendente {
  tipo: TemplateKey;
  nome: string;
  diasDesdeUltima: number;
  periodicidadeDias: number;
  status: 'PENDENTE' | 'ATENCAO' | 'OK';
  mensagem: string;
  ultimaData: string | null;
}

export function SupervisorApp() {
  // Estados de autenticação
  const [usuario, setUsuario] = useState<UsuarioAutorizado | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginError, setLoginError] = useState('');

  // Estados de dados
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [contratoSelecionado, setContratoSelecionado] = useState<Contrato | null>(null);
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [rondasPendentes, setRondasPendentes] = useState<RondaPendente[]>([]);

  // Estados de navegação
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [templateSelecionado, setTemplateSelecionado] = useState<TemplateKey | null>(null);

  // Estados da ronda em execução
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [tipoItemSelecionado, setTipoItemSelecionado] = useState<string | null>(null);
  const [formItem, setFormItem] = useState({
    local: '',
    fotos: [] as string[],
    status: 'OK' as 'OK' | 'NAO_OK',
    observacao: ''
  });

  // Estados de UI
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detectar conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Verificar autenticação ao iniciar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Tentar restaurar sessão do localStorage
      const sessaoRestaurada = authService.restaurarSessao();
      if (sessaoRestaurada) {
        const usuarioAtual = authService.getUsuarioAtual();
        if (usuarioAtual) {
          setUsuario(usuarioAtual);
          setViewMode('contratos');
          await loadContratos();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const resultado = await authService.fazerLogin(loginEmail, loginSenha);

      if (resultado.sucesso && resultado.usuario) {
        setUsuario(resultado.usuario);
        setViewMode('contratos');
        await loadContratos();
      } else {
        setLoginError(resultado.erro || 'Erro ao fazer login');
      }
    } catch (error: any) {
      setLoginError(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.fazerLogout();
    setUsuario(null);
    setViewMode('login');
    setContratos([]);
    setContratoSelecionado(null);
  };

  const loadContratos = async () => {
    try {
      const data = await contratoService.getAll();
      setContratos(data || []);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
    }
  };

  const loadRondas = async (contratoNome: string) => {
    try {
      const data = await rondaService.getByContrato(contratoNome);
      setRondas(data || []);
      calcularRondasPendentes(data || []);
    } catch (error) {
      console.error('Erro ao carregar rondas:', error);
    }
  };

  const calcularRondasPendentes = (rondasData: Ronda[]) => {
    const hoje = new Date();
    const resultado: RondaPendente[] = [];

    (Object.keys(CONFIG_RONDAS) as TemplateKey[]).forEach(tipo => {
      const config = CONFIG_RONDAS[tipo];
      const rondasDoTipo = rondasData
        .filter(r => r.templateRonda === tipo)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      const ultimaRonda = rondasDoTipo[0];
      const ultimaData = ultimaRonda?.data || null;

      let diasDesdeUltima = ultimaData
        ? Math.floor((hoje.getTime() - new Date(ultimaData).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      let status: 'PENDENTE' | 'ATENCAO' | 'OK' = 'OK';
      let mensagem = '';

      if (!ultimaData) {
        status = 'PENDENTE';
        mensagem = 'Nunca realizada';
      } else if (diasDesdeUltima >= config.periodicidadeDias) {
        status = 'PENDENTE';
        mensagem = `Atrasada ${diasDesdeUltima - config.periodicidadeDias} dias`;
      } else if (diasDesdeUltima >= config.periodicidadeDias - 3) {
        status = 'ATENCAO';
        mensagem = `Vence em ${config.periodicidadeDias - diasDesdeUltima} dias`;
      } else {
        mensagem = `OK - próxima em ${config.periodicidadeDias - diasDesdeUltima} dias`;
      }

      resultado.push({
        tipo,
        nome: config.nome,
        diasDesdeUltima,
        periodicidadeDias: config.periodicidadeDias,
        status,
        mensagem,
        ultimaData
      });
    });

    // Ordenar: PENDENTE primeiro
    resultado.sort((a, b) => {
      const ordem = { PENDENTE: 0, ATENCAO: 1, OK: 2 };
      return ordem[a.status] - ordem[b.status];
    });

    setRondasPendentes(resultado);
  };

  const handleSelectContrato = async (contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setViewMode('contrato');
    await loadRondas(contrato.nome);
  };

  const handleIniciarRonda = (template: TemplateKey) => {
    setTemplateSelecionado(template);
    setChecklistItems([]);
    setTipoItemSelecionado(null);
    resetFormItem();
    setViewMode('ronda');
  };

  const resetFormItem = () => {
    setFormItem({
      local: '',
      fotos: [] as string[],
      status: 'OK',
      observacao: ''
    });
  };

  const handleAdicionarItem = (tipo: string) => {
    setTipoItemSelecionado(tipo);
    resetFormItem();

    // Verificar se tem local pré-definido
    const configLocal = LOCAIS_EQUIPAMENTOS[tipo];
    if (configLocal?.tipo === 'fixo' && configLocal.valor) {
      // Local fixo - já preenche automaticamente
      setFormItem(prev => ({ ...prev, local: configLocal.valor! }));
    }

    setViewMode('addItem');
  };

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormItem(prev => ({
          ...prev,
          fotos: [...prev.fotos, reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormItem(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  };

  const handleSalvarItem = () => {
    if (!formItem.local.trim()) {
      alert('Informe o local');
      return;
    }

    if (!tipoItemSelecionado) {
      alert('Tipo de item não selecionado');
      return;
    }

    const now = new Date();

    const novoItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      rondaId: '',
      tipo: tipoItemSelecionado,
      objetivo: `Verificar ${tipoItemSelecionado.toLowerCase()}`,
      local: formItem.local,
      fotos: formItem.fotos,
      status: formItem.status,
      observacao: formItem.observacao || undefined,
      data: now.toISOString().split('T')[0],
      hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setChecklistItems(prev => [...prev, novoItem]);

    // Voltar para a tela da ronda (lista de tipos)
    setTipoItemSelecionado(null);
    resetFormItem();
    setViewMode('ronda');
  };

  const handleFinalizarRonda = async () => {
    if (!contratoSelecionado || !templateSelecionado) return;

    setSyncing(true);
    try {
      const config = CONFIG_RONDAS[templateSelecionado];
      const now = new Date();

      const novaRonda: Omit<Ronda, 'id'> = {
        nome: `${config.nome} - ${now.toLocaleDateString('pt-BR')}`,
        contrato: contratoSelecionado.nome,
        data: now.toISOString().split('T')[0],
        hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        tipoVisita: 'RONDA',
        templateRonda: templateSelecionado,
        roteiro: config.roteiro,
        checklistItems: checklistItems,
        areasTecnicas: [],
        fotosRonda: [],
        outrosItensCorrigidos: [],
        responsavel: usuario?.nome
      };

      await rondaService.create(novaRonda as Ronda);

      alert('Ronda salva com sucesso!');

      // Recarregar rondas e voltar
      await loadRondas(contratoSelecionado.nome);
      setViewMode('contrato');
      setTemplateSelecionado(null);
      setChecklistItems([]);
    } catch (error) {
      console.error('Erro ao salvar ronda:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSyncing(false);
    }
  };

  // ============ RENDERIZAÇÃO ============

  // Loading inicial
  if (loading && viewMode === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Tela de Login
  if (viewMode === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 p-4 text-center border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">Supervisor</h1>
          <p className="text-sm text-gray-400">Rondas de Supervisão</p>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Entrar</h2>
            </div>

            {loginError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Senha</label>
              <input
                type="password"
                value={loginSenha}
                onChange={(e) => setLoginSenha(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                placeholder="********"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>

        {/* Status de conexão */}
        <div className={`p-2 text-center text-sm ${isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
          {isOnline ? (
            <span className="flex items-center justify-center gap-2"><Wifi className="w-4 h-4" /> Online</span>
          ) : (
            <span className="flex items-center justify-center gap-2"><WifiOff className="w-4 h-4" /> Offline</span>
          )}
        </div>
      </div>
    );
  }

  // Tela de Contratos
  if (viewMode === 'contratos') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white">Meus Contratos</h1>
              <p className="text-xs text-gray-400">{usuario?.nome}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lista de contratos */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {contratos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum contrato encontrado</p>
            </div>
          ) : (
            contratos.map(contrato => (
              <button
                key={contrato.id}
                onClick={() => handleSelectContrato(contrato)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-left hover:border-emerald-500/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{contrato.nome}</h3>
                    <p className="text-sm text-gray-400 mt-1">{contrato.endereco}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        contrato.status === 'IMPLANTADO'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {contrato.status || 'IMPLANTADO'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Status */}
        <div className={`p-2 text-center text-xs ${isOnline ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
          {isOnline ? 'Online' : 'Offline - dados podem estar desatualizados'}
        </div>
      </div>
    );
  }

  // Tela do Contrato (com alertas de rondas pendentes)
  if (viewMode === 'contrato' && contratoSelecionado) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setContratoSelecionado(null);
                setViewMode('contratos');
              }}
              className="p-2 -ml-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white truncate">{contratoSelecionado.nome}</h1>
              <p className="text-xs text-gray-400 truncate">{contratoSelecionado.endereco}</p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Alertas de Rondas Pendentes */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Rondas Programadas</h2>

            {rondasPendentes.map(ronda => {
              const config = CONFIG_RONDAS[ronda.tipo];
              const Icon = config.icon;
              const isPendente = ronda.status === 'PENDENTE';
              const isAtencao = ronda.status === 'ATENCAO';

              return (
                <div
                  key={ronda.tipo}
                  className={`rounded-xl p-4 border ${
                    isPendente
                      ? 'bg-red-500/10 border-red-500/30'
                      : isAtencao
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isPendente
                          ? 'bg-red-500/20'
                          : isAtencao
                          ? 'bg-yellow-500/20'
                          : 'bg-slate-700'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          isPendente
                            ? 'text-red-400'
                            : isAtencao
                            ? 'text-yellow-400'
                            : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{ronda.nome}</span>
                          {isPendente && (
                            <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">PENDENTE</span>
                          )}
                        </div>
                        <p className={`text-sm ${
                          isPendente ? 'text-red-300' : isAtencao ? 'text-yellow-300' : 'text-gray-400'
                        }`}>
                          {ronda.mensagem}
                        </p>
                      </div>
                    </div>

                    {(isPendente || isAtencao) && (
                      <button
                        onClick={() => handleIniciarRonda(ronda.tipo)}
                        className={`px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2 ${
                          isPendente ? 'bg-red-600' : 'bg-yellow-600'
                        }`}
                      >
                        <PlayCircle className="w-4 h-4" />
                        Iniciar
                      </button>
                    )}

                    {!isPendente && !isAtencao && (
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Histórico recente */}
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Últimas Rondas</h2>
            {rondas.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhuma ronda registrada</p>
            ) : (
              <div className="space-y-2">
                {rondas.slice(0, 5).map(ronda => (
                  <div key={ronda.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{ronda.nome}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(ronda.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {ronda.checklistItems?.length || 0} itens verificados
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Tela de Execução da Ronda - Lista de tipos para adicionar
  if (viewMode === 'ronda' && templateSelecionado) {
    const config = CONFIG_RONDAS[templateSelecionado];

    // Extrair tipos únicos do roteiro
    const tiposDisponiveis = config.roteiro.map(item => {
      return item.replace('Verificar ', '').replace('verificar ', '');
    });

    // Contar itens por tipo
    const contarItensPorTipo = (tipo: string) => {
      return checklistItems.filter(item => item.tipo === tipo).length;
    };

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (checklistItems.length > 0) {
                  if (confirm('Deseja cancelar esta ronda? Os itens já adicionados serão perdidos.')) {
                    setViewMode('contrato');
                    setTemplateSelecionado(null);
                    setChecklistItems([]);
                  }
                } else {
                  setViewMode('contrato');
                  setTemplateSelecionado(null);
                }
              }}
              className="p-2 -ml-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">{config.nome}</h1>
              <p className="text-xs text-gray-400">{checklistItems.length} itens adicionados</p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Tipos de itens para adicionar */}
          <div>
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
              Adicionar Item
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {tiposDisponiveis.map((tipo, idx) => {
                const count = contarItensPorTipo(tipo);
                return (
                  <button
                    key={idx}
                    onClick={() => handleAdicionarItem(tipo)}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-left hover:border-emerald-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium text-sm">{tipo}</span>
                      {count > 0 && (
                        <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                          {count}
                        </span>
                      )}
                    </div>
                    <span className="text-emerald-400 text-xs flex items-center gap-1">
                      <PlayCircle className="w-3 h-3" />
                      Adicionar
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Itens já adicionados */}
          {checklistItems.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
                Itens Adicionados ({checklistItems.length})
              </h2>
              <div className="space-y-2">
                {checklistItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`rounded-lg p-3 border ${
                      item.status === 'OK'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.status === 'OK' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm">{item.tipo}</div>
                        <div className="text-xs text-gray-400">{item.local}</div>
                      </div>
                      {item.fotos.length > 0 && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          {item.fotos.length}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Remover este item?')) {
                            setChecklistItems(prev => prev.filter(i => i.id !== item.id));
                          }
                        }}
                        className="p-1 text-gray-500 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Botão Finalizar */}
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <button
            onClick={() => {
              if (checklistItems.length === 0) {
                alert('Adicione pelo menos um item antes de finalizar');
                return;
              }
              setViewMode('checklist');
            }}
            disabled={checklistItems.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-gray-500 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Finalizar Ronda ({checklistItems.length} itens)
          </button>
        </div>
      </div>
    );
  }

  // Tela de Adicionar Item
  if (viewMode === 'addItem' && templateSelecionado && tipoItemSelecionado) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setTipoItemSelecionado(null);
                setViewMode('ronda');
              }}
              className="p-2 -ml-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">{tipoItemSelecionado}</h1>
              <p className="text-xs text-gray-400">Preencha os dados</p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Local - dependendo do tipo de equipamento */}
          {(() => {
            const configLocal = LOCAIS_EQUIPAMENTOS[tipoItemSelecionado];

            // Local fixo - mostrar como badge (não editável)
            if (configLocal?.tipo === 'fixo') {
              return (
                <div>
                  <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Local
                  </label>
                  <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg px-4 py-3 text-emerald-300 font-medium">
                    {formItem.local}
                  </div>
                </div>
              );
            }

            // Opções - mostrar botões para selecionar
            if (configLocal?.tipo === 'opcoes' && configLocal.opcoes) {
              return (
                <div>
                  <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Selecione o Local *
                  </label>
                  <div className="grid gap-2">
                    {configLocal.opcoes.map((opcao) => (
                      <button
                        key={opcao}
                        onClick={() => setFormItem(prev => ({ ...prev, local: opcao }))}
                        className={`w-full p-3 rounded-lg border-2 text-left font-medium transition-all ${
                          formItem.local === opcao
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                            : 'border-slate-600 bg-slate-800 text-gray-300 hover:border-slate-500'
                        }`}
                      >
                        {opcao}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            // Livre - mostrar input de texto
            return (
              <div>
                <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Local *
                </label>
                <input
                  type="text"
                  value={formItem.local}
                  onChange={(e) => setFormItem(prev => ({ ...prev, local: e.target.value }))}
                  placeholder="Ex: 3º Andar, Hall B, Escada A..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>
            );
          })()}

          {/* Fotos */}
          <div>
            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400" />
              Fotos
            </label>

            {formItem.fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {formItem.fotos.map((foto, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={foto} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handleAddPhoto}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-slate-800 border border-slate-600 border-dashed rounded-lg py-4 text-gray-400 flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              {formItem.fotos.length > 0 ? 'Adicionar mais fotos' : 'Tirar foto'}
            </button>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormItem(prev => ({ ...prev, status: 'OK' }))}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${
                  formItem.status === 'OK'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                    : 'border-slate-600 bg-slate-800 text-gray-400'
                }`}
              >
                <CheckCircle className="w-8 h-8" />
                <span className="font-medium">OK</span>
              </button>
              <button
                onClick={() => setFormItem(prev => ({ ...prev, status: 'NAO_OK' }))}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${
                  formItem.status === 'NAO_OK'
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-slate-600 bg-slate-800 text-gray-400'
                }`}
              >
                <AlertCircle className="w-8 h-8" />
                <span className="font-medium">NÃO OK</span>
              </button>
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className={`block text-sm mb-2 ${
              formItem.status === 'NAO_OK' ? 'text-red-400' : 'text-gray-400'
            }`}>
              Observação {formItem.status === 'NAO_OK' && '(descreva o problema)'}
            </label>
            <textarea
              value={formItem.observacao}
              onChange={(e) => setFormItem(prev => ({ ...prev, observacao: e.target.value }))}
              placeholder={formItem.status === 'NAO_OK' ? 'Descreva o problema encontrado...' : 'Opcional'}
              rows={3}
              className={`w-full bg-slate-800 border rounded-lg px-4 py-3 text-white focus:outline-none ${
                formItem.status === 'NAO_OK' ? 'border-red-500/50 focus:border-red-500' : 'border-slate-600 focus:border-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <button
            onClick={handleSalvarItem}
            className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 ${
              formItem.status === 'OK' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            <Save className="w-5 h-5" />
            Salvar {tipoItemSelecionado}
          </button>
        </div>
      </div>
    );
  }

  // Tela de Confirmação/Checklist Final
  if (viewMode === 'checklist' && templateSelecionado) {
    const config = CONFIG_RONDAS[templateSelecionado];
    const itensOk = checklistItems.filter(i => i.status === 'OK').length;
    const itensNaoOk = checklistItems.filter(i => i.status === 'NAO_OK').length;

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700">
          <h1 className="text-lg font-bold text-white">{config.nome}</h1>
          <p className="text-sm text-gray-400">Revisão Final</p>
        </div>

        {/* Resumo */}
        <div className="p-4">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-emerald-400">{itensOk}</div>
                <div className="text-sm text-gray-400">OK</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-400">{itensNaoOk}</div>
                <div className="text-sm text-gray-400">NÃO OK</div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de itens */}
        <div className="flex-1 overflow-auto px-4 space-y-2">
          {checklistItems.map((item, idx) => (
            <div
              key={item.id}
              className={`rounded-lg p-3 border ${
                item.status === 'OK'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.status === 'OK' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{item.tipo}</div>
                  <div className="text-sm text-gray-400">{item.local}</div>
                  {item.observacao && (
                    <div className={`text-xs mt-1 ${item.status === 'NAO_OK' ? 'text-red-300' : 'text-gray-500'}`}>
                      {item.observacao}
                    </div>
                  )}
                </div>
                {item.fotos.length > 0 && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    {item.fotos.length}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botões */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 space-y-3">
          <button
            onClick={handleFinalizarRonda}
            disabled={syncing}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {syncing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Finalizar e Enviar
              </>
            )}
          </button>
          <button
            onClick={() => setViewMode('ronda')}
            className="w-full bg-slate-700 py-3 rounded-xl font-medium text-gray-300"
          >
            Voltar e Editar
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
