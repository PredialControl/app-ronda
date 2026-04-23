// SupervisorApp - PWA Mobile para Supervisores
// Interface otimizada para uso em campo com celular

import { useState, useEffect, useRef } from 'react';
import { authService } from '@/lib/auth';
import { contratoService, rondaService, itemRelevanteService, visitaService, VisitaRealizada } from '@/lib/supabaseService';
import { Contrato, Ronda, ChecklistItem, UsuarioAutorizado, ItemRelevante } from '@/types';
import { AREAS_TECNICAS_PREDEFINIDAS } from '@/data/areasTecnicas';
import { emailService, EmailDestinatario } from '@/lib/emailService';
import { emailJSService } from '@/lib/emailJSService';
import { supabase } from '@/lib/supabase';
import { RelatorioPDF, preparePdfData } from '@/lib/pdfReact';
import { PhotoUpload } from '@/components/PhotoUpload';
import { pdf } from '@react-pdf/renderer';
import {
  LogIn,
  LogOut,
  Building2,
  ChevronRight,
  ChevronLeft,
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
  User,
  Eye,
  FileText,
  Mail,
  Send,
  Plus,
  Trash2,
  Settings,
  History,
  Calendar,
  Edit3
} from 'lucide-react';

// Função para comprimir imagem
const comprimirImagem = (base64: string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Redimensionar se maior que maxWidth
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      // Converter para JPEG com qualidade reduzida
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(base64); // Se falhar, retorna original
    img.src = base64;
  });
};

// Equipamentos que precisam de Teste de Funcionamento
const EQUIPAMENTOS_COM_TESTE = [
  'Gerador',
  'Pressurização',
  'Bombas de água potável',
  'Boilers',
  'Bombas de água quente',
  'Bomba de reúso',
  'Bomba de esgoto',
  'Bomba de água pluvial',
  'Aquecedores',
  'Central de Incêndio',
  'Bomba de Incêndio',
  'Extintores',
  'Mangueiras de incêndio',
  'Hidrantes'
];

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
  },
  MANUAL: {
    nome: 'Relatório Manual',
    icon: Camera,
    cor: 'blue',
    periodicidadeDias: 0,
    descricao: 'Relatório Fotográfico',
    roteiro: [] as string[]
  }
};

type TemplateKey = keyof typeof CONFIG_RONDAS;
type ViewMode = 'login' | 'contratos' | 'contrato' | 'ronda' | 'addItem' | 'checklist' | 'batchPhotos' | 'editarRonda' | 'itensRelevantes' | 'visitas' | 'agenda';

interface RondaPendente {
  tipo: TemplateKey;
  nome: string;
  diasDesdeUltima: number;
  periodicidadeDias: number;
  status: 'PENDENTE' | 'ATENCAO' | 'OK';
  mensagem: string;
  ultimaData: string | null;
}

// Componente Modal para Criar/Editar Item Relevante
function ModalItemRelevante({
  item,
  onSave,
  onClose,
  onDelete
}: {
  item: ItemRelevante | null;
  onSave: (dados: Partial<ItemRelevante>) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [titulo, setTitulo] = useState(item?.titulo || '');
  const [local, setLocal] = useState(item?.local || '');
  const [responsabilidade, setResponsabilidade] = useState<'condominio' | 'construtora' | 'a_definir'>(item?.responsabilidade || 'a_definir');
  const [parecer, setParecer] = useState(item?.parecer || '');
  const [fotoUrl, setFotoUrl] = useState(item?.foto_url || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Converter para base64 comprimido
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        // Comprimir imagem
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 800;
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          setFotoUrl(compressed);
          setUploading(false);
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao processar foto:', error);
      setUploading(false);
    }
  };

  const handleSalvar = () => {
    if (!titulo.trim()) {
      alert('Informe o título do item');
      return;
    }
    onSave({
      titulo,
      local,
      responsabilidade,
      parecer,
      foto_url: fotoUrl
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {item ? 'Editar Item' : 'Novo Item'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 space-y-4">
          {/* Foto */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Foto</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFotoUpload}
              className="hidden"
            />
            {fotoUrl ? (
              <div className="relative">
                <img src={fotoUrl} alt="" className="w-full h-48 object-cover rounded-lg" />
                <button
                  onClick={() => setFotoUrl('')}
                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-full"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-32 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-emerald-500 hover:text-emerald-400 transition-all"
              >
                <Camera className="w-8 h-8 mb-2" />
                <span>{uploading ? 'Processando...' : 'Tirar ou Selecionar Foto'}</span>
              </button>
            )}
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Bomba de Incêndio Não Funciona"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Local */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Local</label>
            <input
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex: Sala de Bombas"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Responsabilidade */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Responsabilidade</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setResponsabilidade('condominio')}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  responsabilidade === 'condominio'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                Condomínio
              </button>
              <button
                onClick={() => setResponsabilidade('construtora')}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  responsabilidade === 'construtora'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                Construtora
              </button>
              <button
                onClick={() => setResponsabilidade('a_definir')}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  responsabilidade === 'a_definir'
                    ? 'bg-gray-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                A Definir
              </button>
            </div>
          </div>

          {/* Parecer */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Parecer / Observações</label>
            <textarea
              value={parecer}
              onChange={(e) => setParecer(e.target.value)}
              placeholder="Descrição do problema ou parecer técnico..."
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <button
            onClick={handleSalvar}
            className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-semibold text-white"
          >
            {item ? 'Salvar Alterações' : 'Criar Item'}
          </button>
          {item && onDelete && (
            <button
              onClick={onDelete}
              className="w-full bg-red-600/20 hover:bg-red-600/30 py-3 rounded-lg font-semibold text-red-400"
            >
              Excluir Item
            </button>
          )}
        </div>
      </div>
    </div>
  );
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
  const [itensRelevantes, setItensRelevantes] = useState<ItemRelevante[]>([]);
  const [itemRelevanteEditando, setItemRelevanteEditando] = useState<ItemRelevante | null>(null);
  const [showModalItemRelevante, setShowModalItemRelevante] = useState(false);
  const [showModalVisita, setShowModalVisita] = useState(false);
  const [visitaDescricao, setVisitaDescricao] = useState('');
  const [visitaData, setVisitaData] = useState(new Date().toISOString().split('T')[0]);
  const [visitaTipo, setVisitaTipo] = useState('Vistoria Técnica');
  const [visitaLocal, setVisitaLocal] = useState('');
  const [visitaProblema, setVisitaProblema] = useState('');
  const [visitaFotos, setVisitaFotos] = useState<string[]>([]);
  const [uploadandoFotoVisita, setUploadandoFotoVisita] = useState(false);
  const [salvandoVisita, setSalvandoVisita] = useState(false);
  const [visitas, setVisitas] = useState<VisitaRealizada[]>([]);
  const [filtroKanban, setFiltroKanban] = useState<'dia' | 'mes' | 'ano'>('mes');
  const [filtroStatusItens, setFiltroStatusItens] = useState<'todos' | 'pendente' | 'concluido'>('todos');
  const [filtroMesItens, setFiltroMesItens] = useState<string>('todos');

  // Estados do calendário/agenda
  const [mesAtual, setMesAtual] = useState(new Date());
  const [filtroAgenda, setFiltroAgenda] = useState<'todos' | 'implantacao' | 'supervisao'>('todos');
  const [showModalEvento, setShowModalEvento] = useState(false);
  const [eventoData, setEventoData] = useState(new Date().toISOString().split('T')[0]);
  const [eventoTitulo, setEventoTitulo] = useState('');
  const [eventoDescricao, setEventoDescricao] = useState('');
  const [todasRondas, setTodasRondas] = useState<Ronda[]>([]);
  const [todosItensRelevantes, setTodosItensRelevantes] = useState<ItemRelevante[]>([]);

  // Estados de navegação
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [templateSelecionado, setTemplateSelecionado] = useState<TemplateKey | null>(null);
  const [objetivoManual, setObjetivoManual] = useState('');

  // Estados da ronda em execução
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [tipoItemSelecionado, setTipoItemSelecionado] = useState<string | null>(null);
  const [rondaEditando, setRondaEditando] = useState<Ronda | null>(null);
  const [formItem, setFormItem] = useState({
    local: '',
    fotos: [] as string[],
    status: 'OK' as 'OK' | 'NAO_OK',
    observacao: '',
    testeFuncionamento: 'SIM' as 'SIM' | 'NAO'
  });

  // Estados de UI
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [filtroContrato, setFiltroContrato] = useState('');
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [showEnviarEmail, setShowEnviarEmail] = useState(false);
  const [emailDestinatarios, setEmailDestinatarios] = useState<EmailDestinatario[]>([]);
  const [novoEmail, setNovoEmail] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [showHistoricoEmail, setShowHistoricoEmail] = useState(false);
  const [historicoEmails, setHistoricoEmails] = useState<Array<{
    id: string;
    data: string;
    hora: string;
    contrato: string;
    destinatarios: string[];
    tipoRonda: string;
    pdfUrl?: string;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  // Estados para fotos em lote
  const [fotosPendentes, setFotosPendentes] = useState<string[]>([]);
  const [fotoAtualIndex, setFotoAtualIndex] = useState(0);

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

  // Carregar dados da agenda quando entrar na aba
  useEffect(() => {
    if (viewMode === 'agenda' && usuario) {
      loadDadosAgenda();
    }
  }, [viewMode]);

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
          await loadVisitas();
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
        await loadVisitas();
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

  const loadItensRelevantes = async (contratoNome: string) => {
    try {
      const data = await itemRelevanteService.getByContrato(contratoNome);
      setItensRelevantes(data || []);
    } catch (error) {
      console.error('Erro ao carregar itens relevantes:', error);
    }
  };

  const loadVisitas = async () => {
    try {
      const data = await visitaService.getAll();
      setVisitas(data || []);
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
    }
  };

  // Carregar todos os dados para a agenda (rondas e itens de todos os contratos)
  const loadDadosAgenda = async () => {
    try {
      // Carregar todas as rondas
      const rondasData = await rondaService.getAll();
      setTodasRondas(rondasData || []);

      // Carregar itens relevantes de todos os contratos
      const contratosData = await contratoService.getAll();
      const todosItens: ItemRelevante[] = [];
      for (const contrato of contratosData) {
        const itens = await itemRelevanteService.getByContrato(contrato.nome);
        todosItens.push(...itens);
      }
      setTodosItensRelevantes(todosItens);
    } catch (error) {
      console.error('Erro ao carregar dados da agenda:', error);
    }
  };

  const handleSalvarVisita = async () => {
    if (!contratoSelecionado) {
      alert('Selecione um contrato antes de registrar a visita');
      return;
    }
    if (!usuario) {
      alert('Erro: usuário não identificado. Faça login novamente.');
      return;
    }
    if (!visitaLocal.trim() || !visitaProblema.trim()) {
      alert('Preencha o Local e o Problema');
      return;
    }
    if (visitaFotos.length === 0) {
      alert('Adicione pelo menos uma foto');
      return;
    }

    setSalvandoVisita(true);
    try {
      await visitaService.create({
        contrato_nome: contratoSelecionado.nome,
        usuario_login: usuario.nome,
        data: new Date().toISOString().split('T')[0],
        tipo: 'Ocorrência',
        descricao: visitaProblema.trim(),
        local: visitaLocal.trim(),
        problema: visitaProblema.trim(),
        fotos: visitaFotos
      });

      setShowModalVisita(false);
      setVisitaDescricao('');
      setVisitaData(new Date().toISOString().split('T')[0]);
      setVisitaTipo('Vistoria Técnica');
      setVisitaLocal('');
      setVisitaProblema('');
      setVisitaFotos([]);
      await loadVisitas();
      alert('Ocorrência registrada!');
    } catch (error) {
      console.error('Erro ao salvar visita:', error);
      alert('Erro ao salvar visita');
    } finally {
      setSalvandoVisita(false);
    }
  };

  const handleDeletarVisita = async (id: string) => {
    if (confirm('Excluir esta visita?')) {
      try {
        await visitaService.delete(id);
        await loadVisitas();
      } catch (error) {
        console.error('Erro ao deletar visita:', error);
      }
    }
  };

  // Cores por usuário para a agenda
  const CORES_USUARIOS: { [key: string]: string } = {
    'tiago': 'bg-blue-500',
    'ricardo': 'bg-emerald-500',
    'joao': 'bg-purple-500',
    'maria': 'bg-pink-500',
    'pedro': 'bg-orange-500',
    'default': 'bg-gray-500'
  };

  const getCorUsuario = (login: string) => {
    const loginLower = login.toLowerCase();
    return CORES_USUARIOS[loginLower] || CORES_USUARIOS['default'];
  };

  const calcularRondasPendentes = (rondasData: Ronda[]) => {
    const hoje = new Date();
    const resultado: RondaPendente[] = [];

    (Object.keys(CONFIG_RONDAS) as TemplateKey[]).forEach(tipo => {
      // Pular MANUAL - não é obrigatório e tem seu próprio botão
      if (tipo === 'MANUAL') return;

      const config = CONFIG_RONDAS[tipo];
      // Ronda manual substitui APENAS a Semanal (não Mensal/Bimestral)
      const rondasDoTipo = rondasData
        .filter(r => r.templateRonda === tipo || (tipo === 'SEMANAL' && r.templateRonda === 'MANUAL'))
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
    await loadItensRelevantes(contrato.nome);
  };

  const handleIniciarRonda = (template: TemplateKey) => {
    setTemplateSelecionado(template);
    setChecklistItems([]);
    setTipoItemSelecionado(null);
    setRondaEditando(null);
    resetFormItem();
    setViewMode('ronda');
  };

  const handleVerRonda = (ronda: Ronda) => {
    setRondaEditando(ronda);
    setTemplateSelecionado(ronda.templateRonda as TemplateKey || 'SEMANAL');
    setChecklistItems(ronda.checklistItems || []);
    setShowPreview(true); // Mostra preview primeiro
  };

  // Funções de Email
  const carregarEmailsContrato = () => {
    if (!contratoSelecionado) return;
    const config = emailService.obterConfiguracaoEmail(contratoSelecionado.id);
    setEmailDestinatarios(config?.destinatarios || []);
  };

  // Funções de Histórico de Email
  const carregarHistoricoEmails = () => {
    try {
      const saved = localStorage.getItem('appRonda_historicoEmails');
      if (saved) {
        const todos = JSON.parse(saved);
        // Filtrar pelo contrato atual
        if (contratoSelecionado) {
          setHistoricoEmails(todos.filter((h: any) => h.contratoId === contratoSelecionado.id));
        } else {
          setHistoricoEmails(todos);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar histórico:', e);
    }
  };

  const salvarEmailNoHistorico = (destinatarios: string[], tipoRonda: string, pdfUrl?: string) => {
    if (!contratoSelecionado) return;
    try {
      const saved = localStorage.getItem('appRonda_historicoEmails');
      const todos = saved ? JSON.parse(saved) : [];
      const agora = new Date();
      const novo = {
        id: Date.now().toString(),
        data: agora.toLocaleDateString('pt-BR'),
        hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        contratoId: contratoSelecionado.id,
        contrato: contratoSelecionado.nome,
        destinatarios,
        tipoRonda,
        pdfUrl
      };
      todos.unshift(novo); // Adiciona no início
      // Manter apenas os últimos 100 registros
      if (todos.length > 100) todos.pop();
      localStorage.setItem('appRonda_historicoEmails', JSON.stringify(todos));
      carregarHistoricoEmails();
    } catch (e) {
      console.error('Erro ao salvar histórico:', e);
    }
  };

  const handleAbrirConfigEmail = () => {
    carregarEmailsContrato();
    setShowEmailConfig(true);
  };

  const handleAdicionarDestinatario = () => {
    if (!novoEmail.trim() || !novoNome.trim()) {
      alert('Preencha email e nome');
      return;
    }
    const novo: EmailDestinatario = {
      id: Date.now().toString(),
      email: novoEmail.trim(),
      nome: novoNome.trim(),
      ativo: true
    };
    setEmailDestinatarios(prev => [...prev, novo]);
    setNovoEmail('');
    setNovoNome('');
  };

  const handleRemoverDestinatario = (id: string) => {
    setEmailDestinatarios(prev => prev.filter(d => d.id !== id));
  };

  const handleSalvarConfigEmail = () => {
    if (!contratoSelecionado) return;
    emailService.configurarEmails(contratoSelecionado.id, contratoSelecionado.nome, emailDestinatarios);
    alert('Configuração de emails salva!');
    setShowEmailConfig(false);
  };

  const handleEnviarRelatorioEmail = async () => {
    if (!contratoSelecionado || !templateSelecionado) return;

    const config = emailService.obterConfiguracaoEmail(contratoSelecionado.id);
    if (!config || config.destinatarios.length === 0) {
      alert('Configure os destinatários de email primeiro!');
      setShowEmailConfig(true);
      return;
    }

    setEnviandoEmail(true);
    try {
      const configRonda = CONFIG_RONDAS[templateSelecionado];
      const dataRondaOriginal = rondaEditando ? new Date(rondaEditando.data).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
      // Usar hífen no assunto para evitar encoding HTML do EmailJS
      const dataRonda = dataRondaOriginal.replace(/\//g, '-');

      // ========== GERAR PDF ==========
      let pdfUrl = '';

      try {
        console.log('📄 Gerando PDF do relatório...');

        // Criar ronda completa para o PDF (funciona tanto para edição quanto nova ronda)
        const now = new Date();
        const nomeRonda = templateSelecionado === 'MANUAL' && objetivoManual.trim()
          ? `${objetivoManual.trim()} - ${now.toLocaleDateString('pt-BR')}`
          : `${configRonda.nome} - ${now.toLocaleDateString('pt-BR')}`;

        const rondaCompleta: Ronda = rondaEditando ? {
          ...rondaEditando,
          checklistItems: checklistItems,
          areasTecnicas: [],
          fotosRonda: [],
          outrosItensCorrigidos: []
        } : {
          id: `temp-${Date.now()}`,
          nome: nomeRonda,
          contrato: contratoSelecionado.nome,
          data: now.toISOString().split('T')[0],
          hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          tipoVisita: 'RONDA',
          templateRonda: templateSelecionado,
          roteiro: templateSelecionado === 'MANUAL' ? [objetivoManual.trim() || 'Relatório Manual'] : configRonda.roteiro,
          checklistItems: checklistItems,
          areasTecnicas: [],
          fotosRonda: [],
          outrosItensCorrigidos: [],
          responsavel: usuario?.nome
        };

        // Preparar dados do PDF
        const { rondaNormalized, areasNormalized } = await preparePdfData(rondaCompleta, []);

        // Gerar blob do PDF
        const pdfBlob = await pdf(
          <RelatorioPDF
            ronda={rondaNormalized}
            contrato={contratoSelecionado}
            areas={areasNormalized}
          />
        ).toBlob();

        // Upload para Supabase Storage
        const timestamp = Date.now();
        // Limpar nome removendo acentos e caracteres especiais
        const nomeLimpo = configRonda.nome
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-zA-Z0-9]/g, '_') // Substitui caracteres especiais por _
          .replace(/_+/g, '_'); // Remove underscores duplicados
        const nomeArquivo = `relatorios-email/${contratoSelecionado.id}/${timestamp}_${nomeLimpo}.pdf`;

        const { error: uploadError } = await supabase.storage
          .from('app-ronda')
          .upload(nomeArquivo, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) {
          console.error('❌ Erro ao fazer upload do PDF:', uploadError);
          alert('Erro no upload do PDF: ' + uploadError.message);
        } else {
          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from('app-ronda')
            .getPublicUrl(nomeArquivo);

          pdfUrl = urlData.publicUrl;
          console.log('✅ PDF enviado para:', pdfUrl);
        }
      } catch (pdfError) {
        console.error('❌ Erro ao gerar PDF:', pdfError);
        alert('Erro ao gerar PDF: ' + (pdfError instanceof Error ? pdfError.message : String(pdfError)));
        // Continua sem PDF se der erro
      }

      // ========== MONTAR EMAIL PROFISSIONAL ==========
      const itensOk = checklistItems.filter(i => i.status === 'OK').length;
      const itensNaoOk = checklistItems.filter(i => i.status === 'NAO_OK').length;

      let sucessos = 0;
      for (const dest of config.destinatarios) {
        if (dest.ativo) {
          const assunto = `Relatório de Vistoria - ${contratoSelecionado.nome} - ${dataRonda}`;

          // Corpo profissional do email
          let corpo = `Prezado(a) ${dest.nome},\n\n`;
          corpo += `Segue relatório de vistorias realizadas no condomínio ${contratoSelecionado.nome} na data de ${dataRonda}.\n\n`;

          corpo += `📋 RESUMO DA VISTORIA:\n`;
          corpo += `• Tipo: ${configRonda.nome}\n`;
          corpo += `• Itens verificados: ${checklistItems.length}\n`;
          corpo += `• Itens OK: ${itensOk}\n`;
          corpo += `• Itens com pendência: ${itensNaoOk}\n\n`;

          if (itensNaoOk > 0) {
            corpo += `⚠️ PENDÊNCIAS ENCONTRADAS:\n`;
            checklistItems.filter(i => i.status === 'NAO_OK').forEach(item => {
              corpo += `• ${item.tipo} - ${item.local}`;
              if (item.observacao) corpo += `: ${item.observacao}`;
              corpo += '\n';
            });
            corpo += '\n';
          }

          if (pdfUrl) {
            corpo += `📎 RELATÓRIO COMPLETO EM PDF:\n`;
            corpo += `${pdfUrl}\n\n`;
          }

          corpo += `Qualquer dúvida, estou à disposição.\n\n`;
          corpo += `Atenciosamente,\n`;
          corpo += `Equipe de Manutenção Predial\n`;
          corpo += `www.manutencaopredial.net.br`;

          // Enviar email via EmailJS (limpo, sem cabeçalhos)
          const enviado = await emailJSService.enviarEmail(dest.email, dest.nome, assunto, corpo);
          if (enviado) sucessos++;
        }
      }

      if (sucessos > 0) {
        // Salvar no histórico
        const destinatariosEnviados = config.destinatarios.filter(d => d.ativo).map(d => d.email);
        salvarEmailNoHistorico(destinatariosEnviados, configRonda.nome, pdfUrl || undefined);

        const msgPdf = pdfUrl ? '\n\n✅ Link do PDF incluído no email!' : '';
        alert(`✅ Relatório enviado para ${sucessos} destinatário(s)!${msgPdf}`);
      } else {
        // Mostrar erro real do EmailJS
        const lastError = (window as any).__lastEmailError || 'Verifique sua conexão de internet';
        alert(`Erro ao enviar email:\n${lastError}`);
      }
    } catch (error: any) {
      const errorMsg = error?.message || error?.text || String(error);
      console.error('Erro ao enviar email:', errorMsg);
      alert(`Erro ao enviar email:\n${errorMsg}`);
    } finally {
      setEnviandoEmail(false);
      setShowEnviarEmail(false);
    }
  };

  const handleEditarRonda = () => {
    // Já tem rondaEditando, checklistItems e templateSelecionado setados
    setShowPreview(false);
    setTipoItemSelecionado(null);
    resetFormItem();
    setViewMode('ronda');
  };

  const resetFormItem = () => {
    setFormItem({
      local: '',
      fotos: [] as string[],
      status: 'OK',
      observacao: '',
      testeFuncionamento: 'SIM'
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
    if (!files || files.length === 0) return;

    // Processar todas as fotos de forma sequencial
    const novasFotos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Converter para base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Comprimir a imagem
        const compressed = await comprimirImagem(base64);
        novasFotos.push(compressed);
      } catch (error) {
        console.error('Erro ao processar foto:', error);
      }
    }

    // Adicionar todas as fotos de uma vez
    if (novasFotos.length > 0) {
      setFormItem(prev => ({
        ...prev,
        fotos: [...prev.fotos, ...novasFotos]
      }));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Estado para guardar os arquivos originais (não processados)
  const [arquivosOriginais, setArquivosOriginais] = useState<File[]>([]);
  const [fotoAtualProcessada, setFotoAtualProcessada] = useState<string>('');

  // Função para processar UMA foto por vez (economia de memória)
  const processarFotoAtual = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        // Compressão MUITO agressiva: 500px e qualidade 0.4
        const compressed = await comprimirImagem(base64, 500, 0.4);
        resolve(compressed);
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Handler para fotos em lote - LIMITA A 3 FOTOS para não travar celular
  const handleBatchPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limitar a 3 fotos por vez para não travar o celular
    const MAX_FOTOS = 3;
    let arquivos = Array.from(files);

    if (arquivos.length > MAX_FOTOS) {
      alert(`⚠️ Limite de ${MAX_FOTOS} fotos por vez!\n\nVocê selecionou ${arquivos.length} fotos.\nApenas as primeiras ${MAX_FOTOS} serão processadas.\n\nDepois de salvar, você pode adicionar mais.`);
      arquivos = arquivos.slice(0, MAX_FOTOS);
    }

    setArquivosOriginais(arquivos);
    setFotoAtualIndex(0);
    setFotosPendentes([]); // Limpar fotos antigas

    // Processar APENAS a primeira foto
    const primeiraFoto = await processarFotoAtual(arquivos[0]);
    setFotoAtualProcessada(primeiraFoto);
    setFormItem(prev => ({ ...prev, fotos: [primeiraFoto], local: '', status: 'OK', observacao: '', testeFuncionamento: 'SIM' }));
    setViewMode('batchPhotos');

    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = '';
    }
  };

  // Salvar foto do lote e ir para próxima
  const handleSalvarFotoLote = async () => {
    if (!formItem.local.trim()) {
      alert('Informe o local');
      return;
    }

    const now = new Date();
    const novoItem: ChecklistItem = {
      id: `item-${Date.now()}-${fotoAtualIndex}`,
      rondaId: '',
      tipo: formItem.local, // Usar local como tipo para simplificar
      objetivo: templateSelecionado === 'MANUAL' ? 'Registro de pendência' : 'Registro fotográfico',
      local: formItem.local,
      fotos: [fotoAtualProcessada], // Usar a foto processada atual
      status: templateSelecionado === 'MANUAL' ? 'NAO_OK' : formItem.status, // MANUAL sempre é pendência
      observacao: formItem.observacao || undefined,
      testeFuncionamento: formItem.testeFuncionamento,
      data: now.toISOString().split('T')[0],
      hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setChecklistItems(prev => [...prev, novoItem]);

    // Próxima foto ou voltar
    if (fotoAtualIndex < arquivosOriginais.length - 1) {
      const nextIndex = fotoAtualIndex + 1;
      setFotoAtualIndex(nextIndex);

      // Processar a próxima foto AGORA (libera memória da anterior)
      setFotoAtualProcessada(''); // Limpar anterior
      const proximaFoto = await processarFotoAtual(arquivosOriginais[nextIndex]);
      setFotoAtualProcessada(proximaFoto);
      setFormItem(prev => ({ ...prev, fotos: [proximaFoto], local: '', observacao: '' }));
    } else {
      // Terminou todas as fotos - limpar tudo
      setArquivosOriginais([]);
      setFotoAtualProcessada('');
      setFotosPendentes([]);
      setFotoAtualIndex(0);
      resetFormItem();
      setViewMode('ronda');
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
      objetivo: templateSelecionado === 'MANUAL' ? 'Registro de pendência' : `Verificar ${tipoItemSelecionado.toLowerCase()}`,
      local: formItem.local,
      fotos: formItem.fotos,
      status: templateSelecionado === 'MANUAL' ? 'NAO_OK' : formItem.status, // MANUAL sempre é pendência
      observacao: formItem.observacao || undefined,
      testeFuncionamento: formItem.testeFuncionamento,
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

      if (rondaEditando) {
        // Atualizando ronda existente
        const rondaAtualizada: Ronda = {
          ...rondaEditando,
          checklistItems: checklistItems,
          responsavel: usuario?.nome
        };

        await rondaService.update(rondaEditando.id, rondaAtualizada);
        alert('Ronda atualizada com sucesso!');
      } else {
        // Criando nova ronda
        const nomeRonda = templateSelecionado === 'MANUAL' && objetivoManual.trim()
          ? `${objetivoManual.trim()} - ${now.toLocaleDateString('pt-BR')}`
          : `${config.nome} - ${now.toLocaleDateString('pt-BR')}`;

        const novaRonda: Omit<Ronda, 'id'> = {
          nome: nomeRonda,
          contrato: contratoSelecionado.nome,
          data: now.toISOString().split('T')[0],
          hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          tipoVisita: 'RONDA',
          templateRonda: templateSelecionado,
          roteiro: templateSelecionado === 'MANUAL' ? [objetivoManual.trim() || 'Relatório Manual'] : config.roteiro,
          checklistItems: checklistItems,
          areasTecnicas: [],
          fotosRonda: [],
          outrosItensCorrigidos: [],
          responsavel: usuario?.nome
        };

        await rondaService.create(novaRonda as Ronda);

        // Se for MANUAL, também salvar como visita no histórico
        if (templateSelecionado === 'MANUAL') {
          const visita: Omit<VisitaRealizada, 'id'> = {
            contrato_nome: contratoSelecionado.nome,
            usuario_login: usuario?.email || usuario?.nome || 'supervisor',
            data: now.toISOString().split('T')[0],
            tipo: 'Relatório Manual',
            descricao: objetivoManual.trim() || 'Relatório Manual',
            local: checklistItems.length > 0 ? checklistItems.map(i => i.local).join(', ') : undefined,
            problema: checklistItems.length > 0 ? checklistItems.map(i => (i as any).pendencia || i.observacao).filter(Boolean).join('; ') : undefined
          };
          try {
            await visitaService.create(visita as VisitaRealizada);
          } catch (e) {
            console.log('Visita salva junto com a ronda');
          }
        }

        alert('Relatório salvo com sucesso!');
        setObjetivoManual('');
      }

      // Recarregar rondas e voltar
      await loadRondas(contratoSelecionado.nome);
      setViewMode('contrato');
      setTemplateSelecionado(null);
      setChecklistItems([]);
      setRondaEditando(null);
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
    // Filtrar contratos
    const contratosFiltrados = contratos.filter(c =>
      c.nome.toLowerCase().includes(filtroContrato.toLowerCase()) ||
      c.endereco.toLowerCase().includes(filtroContrato.toLowerCase())
    );

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

          {/* Campo de Busca */}
          <div className="mt-3">
            <input
              type="text"
              value={filtroContrato}
              onChange={(e) => setFiltroContrato(e.target.value)}
              placeholder="Buscar contrato..."
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Lista de contratos */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {contratosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{filtroContrato ? 'Nenhum contrato encontrado' : 'Nenhum contrato cadastrado'}</p>
            </div>
          ) : (
            contratosFiltrados.map(contrato => (
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

        {/* Bottom Navigation */}
        <div className="bg-slate-800 border-t border-slate-700">
          {/* Status */}
          <div className={`p-1 text-center text-xs ${isOnline ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </div>
          {/* Tabs */}
          <div className="flex">
            <button
              onClick={() => setViewMode('contratos')}
              className="flex-1 py-3 flex flex-col items-center gap-1 text-emerald-400 border-t-2 border-emerald-400"
            >
              <Building2 className="w-5 h-5" />
              <span className="text-xs font-medium">Contratos</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-400 hover:text-white"
            >
              <Calendar className="w-5 h-5" />
              <span className="text-xs">Agenda</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de Agenda - Calendário Mensal
  if (viewMode === 'agenda') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white">Agenda</h1>
              <p className="text-xs text-gray-400">{usuario?.nome}</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navegação do Mês */}
        <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
          <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))} className="p-2 text-white bg-slate-700 rounded">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-bold text-lg">
            {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))} className="p-2 text-white bg-slate-700 rounded">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-slate-800 px-4 py-3 flex gap-2 border-b border-slate-700">
          <button onClick={() => setFiltroAgenda('todos')} className={`px-4 py-2 rounded-lg font-medium ${filtroAgenda === 'todos' ? 'bg-white text-black' : 'bg-slate-700 text-white'}`}>
            Todos
          </button>
          <button onClick={() => setFiltroAgenda('implantacao')} className={`px-4 py-2 rounded-lg font-medium ${filtroAgenda === 'implantacao' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-white'}`}>
            Implantacao
          </button>
          <button onClick={() => setFiltroAgenda('supervisao')} className={`px-4 py-2 rounded-lg font-medium ${filtroAgenda === 'supervisao' ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-white'}`}>
            Supervisao
          </button>
        </div>

        {/* Calendário Simples */}
        <div className="flex-1 overflow-auto p-4">
          {/* Dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
              <div key={d} className="text-center text-sm text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Grid do calendário */}
          <div className="grid grid-cols-7 gap-1">
            {(() => {
              const ano = mesAtual.getFullYear();
              const mes = mesAtual.getMonth();
              const primeiroDia = new Date(ano, mes, 1).getDay();
              const ultimoDia = new Date(ano, mes + 1, 0).getDate();
              const hoje = new Date();
              const cells = [];

              // Células vazias antes do primeiro dia
              for (let i = 0; i < primeiroDia; i++) {
                cells.push(<div key={`empty-${i}`} className="h-16 bg-slate-900 rounded" />);
              }

              // Dias do mês
              for (let dia = 1; dia <= ultimoDia; dia++) {
                const dataAtual = new Date(ano, mes, dia);
                const isHoje = dataAtual.toDateString() === hoje.toDateString();
                const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

                // Contar eventos do dia
                const eventosRonda = todasRondas.filter(r => r.data === dataStr).length;
                const eventosVisita = visitas.filter(v => v.data === dataStr).length;
                const eventosKanban = todosItensRelevantes.filter(i => i.data_abertura === dataStr).length;

                cells.push(
                  <div key={dia} className={`h-16 p-1 rounded border ${isHoje ? 'bg-emerald-500/30 border-emerald-500' : 'bg-slate-800 border-slate-700'}`}>
                    <div className={`text-sm font-bold ${isHoje ? 'text-emerald-400' : 'text-white'}`}>{dia}</div>
                    <div className="flex gap-0.5 mt-1 flex-wrap">
                      {eventosRonda > 0 && <div className="w-2 h-2 bg-yellow-500 rounded-full" title={`${eventosRonda} ronda(s)`} />}
                      {eventosVisita > 0 && <div className="w-2 h-2 bg-emerald-500 rounded-full" title={`${eventosVisita} visita(s)`} />}
                      {eventosKanban > 0 && <div className="w-2 h-2 bg-blue-500 rounded-full" title={`${eventosKanban} kanban`} />}
                    </div>
                  </div>
                );
              }

              return cells;
            })()}
          </div>

          {/* Legenda */}
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500 rounded-full" /><span className="text-gray-400">Rondas</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full" /><span className="text-gray-400">Visitas</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full" /><span className="text-gray-400">Kanban</span></div>
          </div>
        </div>

        {/* Botão Adicionar */}
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <button onClick={() => setShowModalEvento(true)} className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg">
            Adicionar Evento
          </button>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-slate-800 border-t border-slate-700">
          <div className={`p-1 text-center text-xs ${isOnline ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </div>
          <div className="flex">
            <button onClick={() => setViewMode('contratos')} className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-400">
              <Building2 className="w-5 h-5" />
              <span className="text-xs">Contratos</span>
            </button>
            <button onClick={() => setViewMode('agenda')} className="flex-1 py-3 flex flex-col items-center gap-1 text-emerald-400 border-t-2 border-emerald-400">
              <Calendar className="w-5 h-5" />
              <span className="text-xs font-medium">Agenda</span>
            </button>
          </div>
        </div>

        {/* Modal */}
        {showModalEvento && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-sm p-4">
              <h2 className="text-lg font-bold mb-4">Adicionar Evento</h2>
              <input type="date" value={eventoData} onChange={e => setEventoData(e.target.value)} className="w-full border p-2 rounded mb-2" />
              <input type="text" value={eventoTitulo} onChange={e => setEventoTitulo(e.target.value)} placeholder="Titulo" className="w-full border p-2 rounded mb-2" />
              <textarea value={eventoDescricao} onChange={e => setEventoDescricao(e.target.value)} placeholder="Descricao" className="w-full border p-2 rounded mb-4" rows={3} />
              <div className="flex gap-2">
                <button onClick={() => setShowModalEvento(false)} className="flex-1 py-2 bg-gray-300 rounded">Cancelar</button>
                <button onClick={async () => {
                  if (!eventoTitulo.trim()) { alert('Informe o titulo'); return; }
                  await visitaService.create({ contrato_nome: 'Evento Manual', usuario_login: usuario?.nome || '', data: eventoData, tipo: eventoTitulo, descricao: eventoDescricao });
                  setShowModalEvento(false);
                  await loadVisitas();
                  alert('Evento adicionado!');
                }} className="flex-1 py-2 bg-orange-500 text-white rounded">Salvar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tela de Preview do Relatório (DEVE VIR ANTES das outras telas!)
  if (showPreview && templateSelecionado && contratoSelecionado) {
    const config = CONFIG_RONDAS[templateSelecionado];
    const itensParaRelatorio = checklistItems.filter(i => i.testeFuncionamento !== 'NAO');
    const itensOk = itensParaRelatorio.filter(i => i.status === 'OK');
    const itensNaoOk = itensParaRelatorio.filter(i => i.status === 'NAO_OK');

    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowPreview(false);
                if (rondaEditando && viewMode === 'contrato') {
                  setRondaEditando(null);
                  setTemplateSelecionado(null);
                  setChecklistItems([]);
                }
              }}
              className="p-2 -ml-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">
                {rondaEditando && viewMode === 'contrato' ? 'Visualizar Ronda' : 'Preview do Relatório'}
              </h1>
              <p className="text-sm text-gray-400">
                {rondaEditando && viewMode === 'contrato'
                  ? `${new Date(rondaEditando.data).toLocaleDateString('pt-BR')} - ${checklistItems.length} itens`
                  : 'Como ficará o PDF'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo do Preview - Simula o PDF */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            {/* Cabeçalho do Relatório */}
            <div className="text-center border-b-2 border-emerald-500 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-slate-800">{config.nome}</h1>
              <p className="text-gray-600 mt-1">{contratoSelecionado.nome}</p>
              <p className="text-sm text-gray-500">
                {rondaEditando
                  ? new Date(rondaEditando.data).toLocaleDateString('pt-BR')
                  : new Date().toLocaleDateString('pt-BR')
                }
              </p>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-emerald-600">{itensOk.length}</div>
                <div className="text-sm text-emerald-700">Itens OK</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-600">{itensNaoOk.length}</div>
                <div className="text-sm text-red-700">Itens com Problema</div>
              </div>
            </div>

            {/* Lista de Itens */}
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Checklist da Ronda ({itensParaRelatorio.length} itens)
            </h2>

            <div className="space-y-4">
              {itensParaRelatorio.map((item) => (
                <div
                  key={item.id}
                  className={`border-2 rounded-lg overflow-hidden ${
                    item.status === 'OK' ? 'border-emerald-300' : 'border-red-300'
                  }`}
                >
                  {/* Header do Card */}
                  <div className={`px-4 py-2 flex items-center justify-between ${
                    item.status === 'OK' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    <span className="font-bold">{item.tipo}</span>
                    <span className="text-sm">{item.status === 'OK' ? 'OK' : 'NÃO OK'}</span>
                  </div>

                  {/* Foto */}
                  {item.fotos.length > 0 && (
                    <div className="h-40 bg-gray-200">
                      <img
                        src={item.fotos[0]}
                        alt={item.tipo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-3 bg-white">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      {item.local}
                    </p>
                    {item.observacao && (
                      <p className={`text-sm mt-2 p-2 rounded ${
                        item.status === 'NAO_OK' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
                      }`}>
                        {item.observacao}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
              Relatório gerado automaticamente pelo App Ronda
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 space-y-3">
          {/* Botão de Enviar por Email */}
          <button
            onClick={handleEnviarRelatorioEmail}
            disabled={enviandoEmail}
            className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {enviandoEmail ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar por Email
              </>
            )}
          </button>

          {/* Se veio de ronda existente (só visualizando), mostra Editar e Voltar */}
          {rondaEditando && viewMode === 'contrato' ? (
            <>
              <button
                onClick={handleEditarRonda}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
              >
                <Wrench className="w-5 h-5" />
                Editar Ronda
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setRondaEditando(null);
                  setTemplateSelecionado(null);
                  setChecklistItems([]);
                }}
                className="w-full bg-slate-600 hover:bg-slate-700 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowPreview(false)}
              className="w-full bg-slate-600 hover:bg-slate-700 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar para Edição
            </button>
          )}
        </div>
      </div>
    );
  }

  // Modal de Configuração de Email
  if (showEmailConfig && contratoSelecionado) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEmailConfig(false)}
              className="p-2 -ml-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" />
                Configurar Emails
              </h1>
              <p className="text-sm text-gray-400">{contratoSelecionado.nome}</p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Adicionar novo destinatário */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h3 className="font-medium text-white mb-3">Adicionar Destinatário</h3>
            <div className="space-y-3">
              <input
                type="email"
                value={novoEmail}
                onChange={(e) => setNovoEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400"
              />
              <input
                type="text"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Nome"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400"
              />
              <button
                onClick={handleAdicionarDestinatario}
                className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Adicionar
              </button>
            </div>
          </div>

          {/* Lista de destinatários */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h3 className="font-medium text-white mb-3">
              Destinatários ({emailDestinatarios.length})
            </h3>
            {emailDestinatarios.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Nenhum destinatário</p>
            ) : (
              <div className="space-y-2">
                {emailDestinatarios.map(dest => (
                  <div
                    key={dest.id}
                    className="flex items-center justify-between bg-slate-700 rounded-lg p-3"
                  >
                    <div>
                      <p className="text-white font-medium">{dest.nome}</p>
                      <p className="text-sm text-gray-400">{dest.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoverDestinatario(dest.id)}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <button
            onClick={handleSalvarConfigEmail}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Salvar Configuração
          </button>
        </div>
      </div>
    );
  }

  // Modal de Histórico de Emails
  if (showHistoricoEmail) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistoricoEmail(false)}
              className="p-2 -ml-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                Histórico de Envios
              </h1>
              <p className="text-sm text-gray-400">Últimos emails enviados</p>
            </div>
          </div>
        </div>

        {/* Lista de Histórico */}
        <div className="flex-1 overflow-auto p-4">
          {historicoEmails.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum email enviado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historicoEmails.map(item => (
                <div
                  key={item.id}
                  className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">{item.tipoRonda}</p>
                      <p className="text-sm text-gray-400">{item.contrato}</p>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <p>{item.data}</p>
                      <p>{item.hora}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300">
                    <span className="text-gray-500">Para: </span>
                    {item.destinatarios.join(', ')}
                  </div>
                  {item.pdfUrl && (
                    <a
                      href={item.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                      <FileText className="w-4 h-4" />
                      Ver PDF
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tela de Visitas/Ocorrências
  if (viewMode === 'visitas' && contratoSelecionado) {
    const visitasDoContrato = visitas.filter(v => v.contrato_nome === contratoSelecionado.nome)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    const handleNovaVisita = () => {
      setVisitaData(new Date().toISOString().split('T')[0]);
      setVisitaTipo('Vistoria Técnica');
      setVisitaLocal('');
      setVisitaProblema('');
      setVisitaFotos([]);
      setShowModalVisita(true);
    };

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode('contrato')} className="p-2 bg-transparent border-none text-white">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-white text-lg font-bold m-0">Visitas / Ocorrências</h1>
              <p className="text-slate-400 text-xs mt-1 m-0">{contratoSelecionado.nome}</p>
            </div>
            <button onClick={handleNovaVisita} className="p-2.5 bg-blue-600 rounded-lg border-none">
              <Plus size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Resumo */}
        <div className="flex gap-2 p-4 pb-2">
          <div className="flex-1 flex justify-center p-2.5 bg-blue-600 rounded-lg">
            <span className="text-white font-bold text-sm">{visitasDoContrato.length} REGISTROS</span>
          </div>
        </div>

        {/* Lista de Cards */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
          {visitasDoContrato.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-base">
              Nenhuma visita registrada
            </div>
          ) : (
            visitasDoContrato.map(visita => (
              <div
                key={visita.id}
                className="rounded-xl p-4 mb-3 bg-slate-800 border border-slate-700"
              >
                {/* Cabeçalho com data e tipo */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-blue-400 text-xs font-semibold">{visita.tipo}</span>
                    <p className="text-slate-400 text-xs mt-1">
                      {new Date(visita.data).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeletarVisita(visita.id)}
                    className="p-2 bg-red-500/20 rounded-lg border-none"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>

                {/* Local */}
                {visita.local && (
                  <div className="mb-2">
                    <span className="text-slate-500 text-xs">LOCAL:</span>
                    <p className="text-white font-semibold text-sm m-0">{visita.local}</p>
                  </div>
                )}

                {/* Problema */}
                {visita.problema && (
                  <div className="mb-3">
                    <span className="text-slate-500 text-xs">PROBLEMA:</span>
                    <p className="text-slate-300 text-sm m-0">{visita.problema}</p>
                  </div>
                )}

                {/* Fotos */}
                {visita.fotos && visita.fotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {visita.fotos.map((foto, index) => (
                      <img
                        key={index}
                        src={foto}
                        alt={`Foto ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                        onClick={() => window.open(foto, '_blank')}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Registrar Visita - Padrão FotoRondaModal */}
        {showModalVisita && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-modal p-6 w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                  <Camera className="w-5 h-5 text-blue-400" />
                  Nova Ocorrência
                </h2>
                <button onClick={() => setShowModalVisita(false)} className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Upload de Fotos - Igual FotoRondaModal */}
                <div className="space-y-4 glass p-4">
                  <PhotoUpload
                    photos={visitaFotos}
                    onPhotosChange={(novasFotos) => setVisitaFotos(novasFotos)}
                    maxPhotos={40}
                    label="📸 Fotos"
                    showCounter={true}
                  />
                </div>

                {/* Local */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Local *</label>
                  <input
                    type="text"
                    value={visitaLocal}
                    onChange={(e) => setVisitaLocal(e.target.value)}
                    placeholder="Ex: Bomba, Caixa d'água, Portaria..."
                    className="glass-input w-full"
                  />
                </div>

                {/* Problema/Pendência */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Problema / Pendência *</label>
                  <input
                    type="text"
                    value={visitaProblema}
                    onChange={(e) => setVisitaProblema(e.target.value)}
                    placeholder="Ex: Vazamento, lâmpada queimada..."
                    className="glass-input w-full"
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModalVisita(false)}
                    className="flex-1 bg-gray-800 border border-gray-600 text-white hover:bg-gray-700 py-3 px-4 rounded-lg font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalvarVisita}
                    disabled={salvandoVisita}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50"
                  >
                    {salvandoVisita ? 'Salvando...' : 'Registrar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tela de Itens Relevantes (Lista simplificada)
  if (viewMode === 'itensRelevantes' && contratoSelecionado) {
    // Pegar meses únicos
    const mesesDisponiveis = [...new Set(itensRelevantes.map(item => {
      const data = new Date(item.data_abertura);
      return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
    }))].sort().reverse();

    // Filtrar itens
    const itensFiltrados = itensRelevantes.filter(item => {
      const passaStatus = filtroStatusItens === 'todos' || item.status === filtroStatusItens;
      const passaMes = filtroMesItens === 'todos' || item.data_abertura.startsWith(filtroMesItens);
      return passaStatus && passaMes;
    }).sort((a, b) => new Date(b.data_abertura).getTime() - new Date(a.data_abertura).getTime());

    const totalPendentes = itensRelevantes.filter(i => i.status === 'pendente').length;
    const totalConcluidos = itensRelevantes.filter(i => i.status === 'concluido').length;

    const formatarMes = (mesAno: string) => {
      const [ano, mes] = mesAno.split('-');
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${meses[parseInt(mes) - 1]}/${ano}`;
    };

    const handleNovoItem = () => {
      setItemRelevanteEditando(null);
      setShowModalItemRelevante(true);
    };

    const handleEditarItem = (item: ItemRelevante) => {
      setItemRelevanteEditando(item);
      setShowModalItemRelevante(true);
    };

    const handleSalvarItem = async (dados: Partial<ItemRelevante>) => {
      try {
        if (itemRelevanteEditando) {
          await itemRelevanteService.update(itemRelevanteEditando.id, { titulo: dados.titulo, parecer: dados.parecer });
        } else {
          await itemRelevanteService.create({
            contrato_nome: contratoSelecionado.nome,
            titulo: dados.titulo || '',
            parecer: dados.parecer,
            data_abertura: new Date().toISOString().split('T')[0],
            responsabilidade: 'a_definir',
            status: 'pendente'
          });
        }
        await loadItensRelevantes(contratoSelecionado.nome);
        setShowModalItemRelevante(false);
      } catch (error) {
        console.error('Erro ao salvar item:', error);
        alert('Erro ao salvar item');
      }
    };

    const handleAlterarStatus = async (item: ItemRelevante) => {
      const novoStatus = item.status === 'pendente' ? 'concluido' : 'pendente';
      try {
        await itemRelevanteService.updateStatus(item.id, novoStatus);
        await loadItensRelevantes(contratoSelecionado.nome);
      } catch (error) {
        console.error('Erro ao alterar status:', error);
      }
    };

    const handleDeletarItem = async (id: string) => {
      if (confirm('Excluir este item?')) {
        try {
          await itemRelevanteService.delete(id);
          await loadItensRelevantes(contratoSelecionado.nome);
          setShowModalItemRelevante(false);
        } catch (error) {
          console.error('Erro ao deletar item:', error);
        }
      }
    };

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col itens-relevantes-page">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b-2 border-slate-700 texto-branco">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode('contrato')} className="p-2 bg-transparent border-none texto-branco">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-white text-lg font-bold m-0">Itens Relevantes</h1>
              <p className="text-slate-300 text-xs mt-1 m-0">{contratoSelecionado.nome}</p>
            </div>
            <button onClick={handleNovoItem} className="p-2.5 bg-blue-600 rounded-lg border-none">
              <Plus size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Resumo */}
        <div className="flex gap-2 p-4 pb-2">
          <div className="flex-1 flex justify-center p-2.5 bg-red-600 rounded-lg">
            <span className="text-white font-bold text-sm">{totalPendentes} PENDENTES</span>
          </div>
          <div className="flex-1 flex justify-center p-2.5 bg-green-600 rounded-lg">
            <span className="text-white font-bold text-sm">{totalConcluidos} CONCLUÍDOS</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 px-4 pb-4 pt-2">
          <select
            value={filtroStatusItens}
            onChange={(e) => setFiltroStatusItens(e.target.value as any)}
            className="flex-1 p-3 rounded-lg font-semibold text-sm filtro-select"
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="concluido">Concluídos</option>
          </select>
          <select
            value={filtroMesItens}
            onChange={(e) => setFiltroMesItens(e.target.value)}
            className="flex-1 p-3 rounded-lg font-semibold text-sm filtro-select"
          >
            <option value="todos">Todos Meses</option>
            {mesesDisponiveis.map(mes => (
              <option key={mes} value={mes}>{formatarMes(mes)}</option>
            ))}
          </select>
        </div>

        {/* Lista de Cards */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {itensFiltrados.length === 0 ? (
            <div className="text-center py-12 text-slate-600 text-base">Nenhum item encontrado</div>
          ) : (
            itensFiltrados.map(item => (
              <div
                key={item.id}
                onClick={() => handleEditarItem(item)}
                className="rounded-xl p-3.5 mb-3 cursor-pointer bg-slate-800 border border-slate-700"
                style={{
                  borderLeft: item.status === 'pendente' ? '6px solid #dc2626' : '6px solid #16a34a'
                }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        item.status === 'pendente'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-green-500/20 text-green-300'
                      }`}>
                        {item.status === 'pendente' ? 'PENDENTE' : 'CONCLUÍDO'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-base m-0 mb-2">{item.titulo}</h3>
                    {item.parecer && (
                      <p className="text-gray-400 text-sm m-0 mb-2">{item.parecer}</p>
                    )}
                    <span className="text-gray-500 text-xs">
                      {new Date(item.data_abertura).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAlterarStatus(item); }}
                      className={`px-3.5 py-2 rounded-lg font-bold text-xs border-none whitespace-nowrap text-white ${
                        item.status === 'pendente' ? 'bg-green-600' : 'bg-amber-600'
                      }`}
                    >
                      {item.status === 'pendente' ? 'CONCLUIR' : 'REABRIR'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletarItem(item.id); }}
                      className="px-3.5 py-2 rounded-lg font-bold text-xs border-none cursor-pointer bg-red-600/20 text-red-400 flex items-center justify-center gap-1"
                    >
                      <Trash2 size={12} />
                      EXCLUIR
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal simplificado */}
        {/* Modal Itens Relevantes - Estilo escuro */}
        {showModalItemRelevante && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-sm">
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <h2 className="text-white font-bold text-lg m-0">
                  {itemRelevanteEditando ? 'Editar Item' : 'Novo Item'}
                </h2>
                <button onClick={() => setShowModalItemRelevante(false)} className="p-2 bg-slate-700 rounded-full border-none">
                  <X size={18} className="text-white" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-slate-300 font-semibold text-sm block mb-2">TÍTULO *</label>
                  <input
                    type="text"
                    defaultValue={itemRelevanteEditando?.titulo || ''}
                    id="titulo-input"
                    placeholder="Digite o título..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-base text-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold text-sm block mb-2">OBSERVAÇÃO</label>
                  <textarea
                    defaultValue={itemRelevanteEditando?.parecer || ''}
                    id="obs-input"
                    placeholder="Digite a observação..."
                    rows={4}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-base text-white placeholder-slate-400 resize-none"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-slate-700 space-y-2">
                <button
                  onClick={() => {
                    const titulo = (document.getElementById('titulo-input') as HTMLInputElement)?.value;
                    const parecer = (document.getElementById('obs-input') as HTMLTextAreaElement)?.value;
                    if (!titulo?.trim()) { alert('Informe o título'); return; }
                    handleSalvarItem({ titulo, parecer });
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-xl font-bold text-base border-none shadow-lg"
                >
                  {itemRelevanteEditando ? 'SALVAR' : 'CRIAR ITEM'}
                </button>
                {itemRelevanteEditando && (
                  <button
                    onClick={() => handleDeletarItem(itemRelevanteEditando.id)}
                    className="w-full bg-red-500/20 text-red-400 p-4 rounded-xl font-bold text-base border border-red-500/50"
                  >
                    EXCLUIR
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
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
          {/* Botão Itens Relevantes */}
          <button
            onClick={() => setViewMode('itensRelevantes')}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl p-4 text-left hover:from-amber-500 hover:to-orange-500 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-white">Itens Relevantes</span>
                  <p className="text-sm text-white/80">
                    {itensRelevantes.filter(i => i.status === 'pendente').length} pendentes
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80" />
            </div>
          </button>

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

                    {/* Botão sempre visível - cor muda conforme status */}
                    <button
                      onClick={() => handleIniciarRonda(ronda.tipo)}
                      className={`px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2 ${
                        isPendente ? 'bg-red-600' : isAtencao ? 'bg-yellow-600' : 'bg-emerald-600'
                      }`}
                    >
                      <PlayCircle className="w-4 h-4" />
                      {isPendente || isAtencao ? 'Iniciar' : 'Fazer Nova'}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Botão Relatório Manual */}
            <div
              className="rounded-xl p-4 border bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/30 cursor-pointer hover:border-blue-400/50 transition-all"
              onClick={() => handleIniciarRonda('MANUAL')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/20">
                    <Camera className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <span className="font-medium text-white">Relatório Manual</span>
                    <p className="text-sm text-blue-300">Relatório fotográfico livre</p>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-lg font-medium text-white bg-blue-600 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Criar
                </button>
              </div>
            </div>
          </div>

          {/* Histórico recente */}
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Últimas Rondas</h2>
            {rondas.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhuma ronda registrada</p>
            ) : (
              <div className="space-y-2">
                {[...rondas].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 10).map(ronda => (
                  <button
                    key={ronda.id}
                    onClick={() => handleVerRonda(ronda)}
                    className="w-full bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-emerald-500/50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-white font-medium">{ronda.nome}</span>
                        <p className="text-sm text-gray-400 mt-1">
                          {ronda.checklistItems?.length || 0} itens verificados
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {new Date(ronda.data).toLocaleDateString('pt-BR')}
                        </span>
                        <ChevronRight className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Configurações */}
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Configurações</h2>
            <div className="flex gap-2">
              <button
                onClick={handleAbrirConfigEmail}
                className="flex-1 bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-purple-500/50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-medium">Configurar Emails</span>
                    <p className="text-sm text-gray-400">
                      {(() => {
                        const config = emailService.obterConfiguracaoEmail(contratoSelecionado.id);
                        return config && config.destinatarios.length > 0
                          ? `${config.destinatarios.length} destinatário(s)`
                          : 'Nenhum configurado';
                      })()}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400" />
                </div>
              </button>
              {/* Botão Histórico */}
              <button
                onClick={() => { carregarHistoricoEmails(); setShowHistoricoEmail(true); }}
                className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-blue-500/50 transition-all"
                title="Histórico de Envios"
              >
                <History className="w-6 h-6 text-blue-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Registrar Visita - Estilo escuro */}
        {showModalVisita && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
                <h2 className="text-white font-bold text-lg m-0">Registrar Visita</h2>
                <button onClick={() => setShowModalVisita(false)} className="p-2 bg-slate-700 rounded-full border-none">
                  <X size={18} className="text-white" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {/* Data */}
                <div>
                  <label className="text-slate-300 font-semibold text-sm block mb-2">DATA</label>
                  <input
                    type="date"
                    value={visitaData}
                    onChange={(e) => setVisitaData(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-base text-white"
                  />
                </div>
                {/* Tipo */}
                <div>
                  <label className="text-slate-300 font-semibold text-sm block mb-2">TIPO</label>
                  <select
                    value={visitaTipo}
                    onChange={(e) => setVisitaTipo(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-base text-white"
                  >
                    <option value="Vistoria Técnica">Vistoria Técnica</option>
                    <option value="Reunião">Reunião</option>
                    <option value="Conferência de Chamados">Conferência de Chamados</option>
                    <option value="Acompanhamento de Obra">Acompanhamento de Obra</option>
                    <option value="Treinamento">Treinamento</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                {/* Local */}
                <div>
                  <label className="text-slate-300 font-semibold text-sm block mb-2">LOCAL</label>
                  <input
                    type="text"
                    value={visitaLocal}
                    onChange={(e) => setVisitaLocal(e.target.value)}
                    placeholder="Ex: Portaria, Área comum..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-base text-white placeholder-slate-400"
                  />
                </div>
                {/* Problema */}
                <div>
                  <label className="text-slate-300 font-semibold text-sm block mb-2">PROBLEMA / DESCRIÇÃO</label>
                  <textarea
                    value={visitaProblema}
                    onChange={(e) => setVisitaProblema(e.target.value)}
                    placeholder="Descreva o problema ou situação encontrada..."
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-base text-white placeholder-slate-400 resize-none"
                  />
                </div>
                {/* Fotos */}
                <div>
                  <label className="text-slate-300 font-semibold text-sm block mb-2">
                    FOTOS {visitaFotos.length > 0 && <span className="text-blue-400">({visitaFotos.length})</span>}
                  </label>
                  {/* Grid de fotos já adicionadas */}
                  {visitaFotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {visitaFotos.map((foto, index) => (
                        <div key={index} className="relative aspect-square">
                          <img src={foto} alt={`Foto ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                          <button
                            onClick={() => setVisitaFotos(prev => prev.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Botão para adicionar mais fotos */}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadandoFotoVisita(true);
                        try {
                          // Comprimir imagem antes do upload para evitar crash
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            try {
                              const base64 = event.target?.result as string;
                              const comprimida = await comprimirImagem(base64, 800, 0.6);

                              // Converter base64 para blob
                              const response = await fetch(comprimida);
                              const blob = await response.blob();

                              const fileName = `visitas/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
                              const { error } = await supabase.storage
                                .from('fotos-rondas')
                                .upload(fileName, blob, {
                                  contentType: 'image/jpeg',
                                  upsert: true
                                });
                              if (error) {
                                console.error('Erro upload:', error);
                                alert(`Erro ao enviar: ${error.message}`);
                                return;
                              }
                              const { data: urlData } = supabase.storage.from('fotos-rondas').getPublicUrl(fileName);
                              setVisitaFotos(prev => [...prev, urlData.publicUrl]);
                            } catch (err: any) {
                              console.error('Erro ao processar foto:', err);
                              alert(`Erro: ${err?.message || 'Erro desconhecido'}`);
                            } finally {
                              setUploadandoFotoVisita(false);
                            }
                          };
                          reader.onerror = () => {
                            alert('Erro ao ler a foto');
                            setUploadandoFotoVisita(false);
                          };
                          reader.readAsDataURL(file);
                        } catch (err: any) {
                          console.error('Erro ao fazer upload:', err);
                          alert(`Erro: ${err?.message || 'Erro desconhecido'}`);
                          setUploadandoFotoVisita(false);
                        }
                        e.target.value = '';
                      }}
                      className="hidden"
                      id="foto-visita-input"
                    />
                    <label
                      htmlFor="foto-visita-input"
                      className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-600 rounded-xl p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
                    >
                      {uploadandoFotoVisita ? (
                        <span className="text-slate-400">Enviando...</span>
                      ) : (
                        <>
                          <Camera size={20} className="text-blue-400" />
                          <span className="text-slate-300">
                            {visitaFotos.length > 0 ? 'Adicionar mais fotos' : 'Tirar foto ou selecionar'}
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-700 sticky bottom-0 bg-slate-800">
                <button
                  onClick={handleSalvarVisita}
                  disabled={salvandoVisita || uploadandoFotoVisita}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-xl font-bold text-base border-none disabled:opacity-50 shadow-lg"
                >
                  {salvandoVisita ? 'SALVANDO...' : 'REGISTRAR VISITA'}
                </button>
              </div>
            </div>
          </div>
        )}
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
                const temAlteracoes = rondaEditando
                  ? JSON.stringify(checklistItems) !== JSON.stringify(rondaEditando.checklistItems || [])
                  : checklistItems.length > 0;

                if (temAlteracoes) {
                  if (confirm('Deseja cancelar? As alterações serão perdidas.')) {
                    setViewMode('contrato');
                    setTemplateSelecionado(null);
                    setChecklistItems([]);
                    setRondaEditando(null);
                  }
                } else {
                  setViewMode('contrato');
                  setTemplateSelecionado(null);
                  setRondaEditando(null);
                }
              }}
              className="p-2 -ml-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">
                {rondaEditando ? 'Editando: ' : ''}{config.nome}
              </h1>
              <p className="text-xs text-gray-400">
                {rondaEditando
                  ? `Editando ronda de ${new Date(rondaEditando.data).toLocaleDateString('pt-BR')}`
                  : `${checklistItems.length} itens adicionados`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Campo Objetivo - só para MANUAL */}
          {templateSelecionado === 'MANUAL' && (
            <div className="glass p-4 rounded-xl">
              <label className="block text-sm font-medium mb-2 text-gray-300">Objetivo do Relatório</label>
              <input
                type="text"
                value={objetivoManual}
                onChange={(e) => setObjetivoManual(e.target.value)}
                placeholder="Ex: Vistoria das escadarias, Verificação de vazamentos..."
                className="glass-input w-full"
              />
            </div>
          )}

          {/* Tipos de itens para adicionar - só mostra se NÃO for MANUAL */}
          {templateSelecionado !== 'MANUAL' && (
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
          )}

          {/* Botão Adicionar Item - para MANUAL */}
          {templateSelecionado === 'MANUAL' && (
            <button
              onClick={() => handleAdicionarItem('Item')}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-3 shadow-lg"
            >
              <Plus className="w-6 h-6" />
              <div className="text-left">
                <div>Adicionar Item</div>
                <div className="text-xs font-normal opacity-80">Fotos + Local + Pendência</div>
              </div>
            </button>
          )}

          {/* Botão de Adicionar Várias Fotos */}
          <div className="mt-6">
            <input
              ref={batchFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleBatchPhotos}
              className="hidden"
            />
            <button
              onClick={() => batchFileInputRef.current?.click()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-3 shadow-lg"
            >
              <Camera className="w-6 h-6" />
              <div className="text-left">
                <div>Adicionar Várias Fotos</div>
                <div className="text-xs font-normal opacity-80">Selecione múltiplas fotos e informe o local depois</div>
              </div>
            </button>
          </div>

          {/* Itens já adicionados */}
          {checklistItems.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
                Itens Adicionados ({checklistItems.length})
              </h2>
              <div className="space-y-2">
                {checklistItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`rounded-lg p-3 border ${
                      templateSelecionado === 'MANUAL'
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : item.status === 'OK'
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {templateSelecionado === 'MANUAL' ? (
                        <Camera className="w-5 h-5 text-blue-400 shrink-0" />
                      ) : item.status === 'OK' ? (
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
              // Para MANUAL, permite salvar só com objetivo (sem itens)
              if (templateSelecionado === 'MANUAL') {
                if (!objetivoManual.trim() && checklistItems.length === 0) {
                  alert('Escreva o objetivo ou adicione pelo menos um item');
                  return;
                }
              } else {
                if (checklistItems.length === 0) {
                  alert('Adicione pelo menos um item antes de finalizar');
                  return;
                }
              }
              setViewMode('checklist');
            }}
            disabled={templateSelecionado === 'MANUAL' ? (!objetivoManual.trim() && checklistItems.length === 0) : checklistItems.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-gray-500 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {templateSelecionado === 'MANUAL'
              ? `Finalizar Relatório${checklistItems.length > 0 ? ` (${checklistItems.length} itens)` : ''}`
              : `Finalizar Ronda (${checklistItems.length} itens)`
            }
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
              Fotos {formItem.fotos.length > 0 && <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{formItem.fotos.length}</span>}
            </label>

            {formItem.fotos.length > 0 && (
              <div className="space-y-2 mb-3">
                {/* Preview grande da primeira foto */}
                <div className="relative rounded-xl overflow-hidden bg-slate-800 border border-slate-600">
                  <img
                    src={formItem.fotos[0]}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => handleRemovePhoto(0)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  {formItem.fotos.length > 1 && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      1 de {formItem.fotos.length}
                    </div>
                  )}
                </div>

                {/* Miniaturas das outras fotos */}
                {formItem.fotos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {formItem.fotos.slice(1).map((foto, idx) => (
                      <div key={idx + 1} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-slate-600">
                        <img src={foto} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemovePhoto(idx + 1)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center py-0.5">
                          {idx + 2}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              {formItem.fotos.length > 0 ? `Adicionar mais fotos (${formItem.fotos.length})` : 'Tirar foto'}
            </button>
          </div>

          {/* Status - NÃO mostrar para Relatório Manual (já é pendência por padrão) */}
          {templateSelecionado !== 'MANUAL' && (
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
          )}

          {/* Teste de Funcionamento - Só para equipamentos (não para MANUAL) */}
          {templateSelecionado !== 'MANUAL' && tipoItemSelecionado && EQUIPAMENTOS_COM_TESTE.includes(tipoItemSelecionado) && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Teste de Funcionamento
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormItem(prev => ({ ...prev, testeFuncionamento: 'SIM' }))}
                  className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${
                    formItem.testeFuncionamento === 'SIM'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-slate-600 bg-slate-800 text-gray-400'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Feito</span>
                </button>
                <button
                  onClick={() => setFormItem(prev => ({ ...prev, testeFuncionamento: 'NAO' }))}
                  className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${
                    formItem.testeFuncionamento === 'NAO'
                      ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                      : 'border-slate-600 bg-slate-800 text-gray-400'
                  }`}
                >
                  <X className="w-5 h-5" />
                  <span className="font-medium">Não Feito</span>
                </button>
              </div>
              {formItem.testeFuncionamento === 'NAO' && (
                <p className="text-xs text-orange-400 mt-2">
                  * Este item não aparecerá no relatório
                </p>
              )}
            </div>
          )}

          {/* Observação/Problema */}
          <div>
            <label className={`block text-sm mb-2 ${
              templateSelecionado === 'MANUAL' ? 'text-orange-400' : (formItem.status === 'NAO_OK' ? 'text-red-400' : 'text-gray-400')
            }`}>
              {templateSelecionado === 'MANUAL' ? 'Problema / Pendência' : `Observação ${formItem.status === 'NAO_OK' ? '(descreva o problema)' : ''}`}
            </label>
            <textarea
              value={formItem.observacao}
              onChange={(e) => setFormItem(prev => ({ ...prev, observacao: e.target.value }))}
              placeholder={templateSelecionado === 'MANUAL' ? 'Descreva o problema ou pendência...' : (formItem.status === 'NAO_OK' ? 'Descreva o problema encontrado...' : 'Opcional')}
              rows={3}
              className={`w-full bg-slate-800 border rounded-lg px-4 py-3 text-white focus:outline-none ${
                templateSelecionado === 'MANUAL' ? 'border-orange-500/50 focus:border-orange-500' : (formItem.status === 'NAO_OK' ? 'border-red-500/50 focus:border-red-500' : 'border-slate-600 focus:border-emerald-500')
              }`}
            />
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <button
            onClick={handleSalvarItem}
            className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 ${
              templateSelecionado === 'MANUAL' ? 'bg-orange-600' : (formItem.status === 'OK' ? 'bg-emerald-600' : 'bg-red-600')
            }`}
          >
            <Save className="w-5 h-5" />
            Salvar {tipoItemSelecionado}
          </button>
        </div>
      </div>
    );
  }

  // Tela de Processamento de Fotos em Lote
  if (viewMode === 'batchPhotos' && arquivosOriginais.length > 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setArquivosOriginais([]);
                setFotoAtualProcessada('');
                setFotosPendentes([]);
                setFotoAtualIndex(0);
                resetFormItem();
                setViewMode('ronda');
              }}
              className="p-2 -ml-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">Processar Fotos</h1>
              <p className="text-xs text-gray-400">Foto {fotoAtualIndex + 1} de {arquivosOriginais.length}</p>
            </div>
            <div className="bg-blue-600 px-3 py-1 rounded-full text-sm font-bold text-white">
              {fotoAtualIndex + 1}/{arquivosOriginais.length}
            </div>
          </div>
        </div>

        {/* Foto atual */}
        <div className="p-4">
          <div className="aspect-video rounded-xl overflow-hidden bg-slate-800 border-2 border-blue-500/50">
            {fotoAtualProcessada ? (
              <img
                src={fotoAtualProcessada}
                alt={`Foto ${fotoAtualIndex + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>Carregando foto...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Formulário */}
        <div className="flex-1 overflow-auto px-4 pb-4 space-y-4">
          {/* Local */}
          <div>
            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Local / Descrição *
            </label>
            <input
              type="text"
              value={formItem.local}
              onChange={(e) => setFormItem(prev => ({ ...prev, local: e.target.value }))}
              placeholder="Ex: Hall do 3º Andar, Escada B, Extintor Torre 1..."
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Status - NÃO mostrar para Relatório Manual */}
          {templateSelecionado !== 'MANUAL' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormItem(prev => ({ ...prev, status: 'OK' }))}
                  className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${
                    formItem.status === 'OK'
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                      : 'border-slate-600 bg-slate-800 text-gray-400'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">OK</span>
                </button>
                <button
                  onClick={() => setFormItem(prev => ({ ...prev, status: 'NAO_OK' }))}
                  className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${
                    formItem.status === 'NAO_OK'
                      ? 'border-red-500 bg-red-500/20 text-red-400'
                      : 'border-slate-600 bg-slate-800 text-gray-400'
                  }`}
                >
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">NÃO OK</span>
                </button>
              </div>
            </div>
          )}

          {/* Problema/Pendência (para MANUAL) ou Observação (para outros) */}
          <div>
            <label className={`block text-sm mb-2 ${templateSelecionado === 'MANUAL' ? 'text-orange-400' : 'text-gray-400'}`}>
              {templateSelecionado === 'MANUAL' ? 'Problema / Pendência' : 'Observação'}
            </label>
            <textarea
              value={formItem.observacao}
              onChange={(e) => setFormItem(prev => ({ ...prev, observacao: e.target.value }))}
              placeholder={templateSelecionado === 'MANUAL' ? 'Descreva o problema ou pendência...' : 'Opcional...'}
              rows={2}
              className={`w-full bg-slate-800 border rounded-lg px-4 py-3 text-white focus:outline-none ${
                templateSelecionado === 'MANUAL' ? 'border-orange-500/50 focus:border-orange-500' : 'border-slate-600 focus:border-blue-500'
              }`}
            />
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <button
            onClick={handleSalvarFotoLote}
            disabled={!fotoAtualProcessada}
            className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 ${
              !fotoAtualProcessada ? 'bg-gray-600 cursor-not-allowed' : (templateSelecionado === 'MANUAL' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700')
            }`}
          >
            <Save className="w-5 h-5" />
            {fotoAtualIndex < arquivosOriginais.length - 1 ? (
              <>Salvar e Próxima Foto ({fotoAtualIndex + 2}/{arquivosOriginais.length})</>
            ) : (
              <>Salvar e Finalizar</>
            )}
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('ronda')}
              className="p-2 -ml-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Pré-visualização</h1>
              <p className="text-sm text-gray-400">{config.nome} - {checklistItems.length} itens</p>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="p-4">
          <div className="bg-gradient-to-r from-emerald-500/20 to-red-500/20 rounded-xl p-4 border border-slate-700">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-3xl font-bold text-emerald-400">{itensOk}</div>
                <div className="text-sm text-gray-400">OK</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-3xl font-bold text-red-400">{itensNaoOk}</div>
                <div className="text-sm text-gray-400">NÃO OK</div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de itens como cards com fotos */}
        <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="grid grid-cols-1 gap-4">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl overflow-hidden shadow-lg ${
                  item.status === 'OK'
                    ? 'ring-2 ring-emerald-500/50'
                    : 'ring-2 ring-red-500/50'
                }`}
              >
                {/* Header com nome do item - EM CIMA */}
                <div className={`px-4 py-3 flex items-center justify-between ${
                  item.status === 'OK'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700'
                    : 'bg-gradient-to-r from-red-600 to-red-700'
                }`}>
                  <div className="flex items-center gap-2">
                    {item.status === 'OK' ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-white" />
                    )}
                    <h3 className="font-bold text-white text-lg">{item.tipo}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.status === 'OK'
                      ? 'bg-white/20 text-white'
                      : 'bg-white/20 text-white'
                  }`}>
                    {item.status === 'OK' ? 'OK' : 'NÃO OK'}
                  </span>
                </div>

                {/* Foto do item */}
                {item.fotos.length > 0 ? (
                  <div className="aspect-video bg-slate-700 relative">
                    <img
                      src={item.fotos[0]}
                      alt={item.tipo}
                      className="w-full h-full object-cover"
                    />
                    {item.fotos.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        {item.fotos.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-700 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-slate-600" />
                  </div>
                )}

                {/* Informações do item - Local e Observação */}
                <div className="p-4 bg-slate-800">
                  <p className="text-sm text-gray-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium">{item.local}</span>
                  </p>
                  {item.observacao && (
                    <p className={`text-sm mt-3 p-3 rounded-lg ${
                      item.status === 'NAO_OK'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-slate-700 text-gray-300'
                    }`}>
                      {item.observacao}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 space-y-3">
          {/* Botão Preview */}
          <button
            onClick={() => setShowPreview(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
          >
            <Eye className="w-5 h-5" />
            Ver Preview do Relatório
          </button>

          {/* Botão Finalizar */}
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
                {rondaEditando ? 'Salvar Alterações' : 'Confirmar e Salvar Ronda'}
              </>
            )}
          </button>
          <p className="text-center text-xs text-gray-500">
            {rondaEditando ? 'Revise as alterações antes de salvar' : 'Revise os itens acima antes de salvar'}
          </p>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
