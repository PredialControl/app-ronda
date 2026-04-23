import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Filter, X, Save, Trash2, Camera, MessageSquare,
  Building2, Clock, AlertCircle, HardHat, FileSpreadsheet,
  Calendar, User as UserIcon, Edit2, RefreshCw, Eye, ChevronLeft, ChevronRight,
  History, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  chamadoService,
  type Chamado,
  type ChamadoStatus,
  type ChamadoResponsavel,
  type ChamadoUpdateType,
  contratoService,
} from '@/lib/supabaseService';
import type { Contrato } from '@/types';
import { authService } from '@/lib/auth';
import ExcelJS from 'exceljs';

type StatusFilter = ChamadoStatus | 'todos';

const STATUS_CONFIG: Record<ChamadoStatus, { label: string; bg: string; text: string; dot: string; chart: string }> = {
  itens_apontados:     { label: 'Itens Apontados',     bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    chart: '#3b82f6' },
  em_andamento:        { label: 'Em andamento',        bg: 'bg-yellow-50',  text: 'text-yellow-700',  dot: 'bg-yellow-500',  chart: '#eab308' },
  improcedente:        { label: 'Improcedente',        bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500',  chart: '#f97316' },
  aguardando_vistoria: { label: 'Aguardando vistoria', bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500',  chart: '#a855f7' },
  concluido:           { label: 'Concluído',           bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500',   chart: '#22c55e' },
  f_indevido:          { label: 'F. Indevido',         bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500',     chart: '#ef4444' },
};

const UPDATE_TYPE_CONFIG: Record<ChamadoUpdateType, { label: string; icon: string; cls: string }> = {
  construtora: { label: 'Construtora', icon: '🏗️', cls: 'bg-orange-50 border-orange-200 text-orange-800' },
  condominio:  { label: 'Condomínio',  icon: '🏢', cls: 'bg-blue-50 border-blue-200 text-blue-800' },
  engenharia:  { label: 'Engenharia',  icon: '⚙️', cls: 'bg-purple-50 border-purple-200 text-purple-800' },
};

interface ChamadosMenuProps {
  onNavigate?: (destination: string) => void;
}

function PieChart({ data, size = 160 }: { data: Array<{ label: string; value: number; color: string }>; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ width: size, height: size }}>
        Sem dados
      </div>
    );
  }
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  let cumulative = 0;
  const paths = data.filter(d => d.value > 0).map((d, i) => {
    const startAngle = (cumulative / total) * 2 * Math.PI;
    cumulative += d.value;
    const endAngle = (cumulative / total) * 2 * Math.PI;
    const x1 = cx + r * Math.sin(startAngle);
    const y1 = cy - r * Math.cos(startAngle);
    const x2 = cx + r * Math.sin(endAngle);
    const y2 = cy - r * Math.cos(endAngle);
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    const percent = Math.round((d.value / total) * 100);
    const midAngle = (startAngle + endAngle) / 2;
    const lx = cx + (r * 0.6) * Math.sin(midAngle);
    const ly = cy - (r * 0.6) * Math.cos(midAngle);
    return (
      <g key={i}>
        <path
          d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
          fill={d.color}
          stroke="white"
          strokeWidth={1}
        />
        {percent >= 5 && (
          <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="10" fontWeight="bold">
            {percent}%
          </text>
        )}
      </g>
    );
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths}
    </svg>
  );
}

export function ChamadosMenu({ onNavigate: _onNavigate }: ChamadosMenuProps) {
  const usuario = authService.getUsuarioAtual();
  const isAdmin = usuario?.is_admin || false;
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(false);

  const [contratoFiltro, setContratoFiltro] = useState<string>('todos');
  const [statusFiltro, setStatusFiltro] = useState<StatusFilter>('todos');
  const [busca, setBusca] = useState('');
  const [buscaTicket, setBuscaTicket] = useState('');
  const [responsavelFiltro, setResponsavelFiltro] = useState<string>('todos');
  const [dataFiltro, setDataFiltro] = useState<string>('todos');
  const [mesFiltro, setMesFiltro] = useState<string>('todos');
  const [somenteVencidos, setSomenteVencidos] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [showNovo, setShowNovo] = useState(false);
  const [detalhe, setDetalhe] = useState<Chamado | null>(null);
  const [addUpdateFor, setAddUpdateFor] = useState<Chamado | null>(null);
  const [reprogramarFor, setReprogramarFor] = useState<Chamado | null>(null);
  const [showHistorico, setShowHistorico] = useState<Chamado | null>(null);
  const [galeriaFotos, setGaleriaFotos] = useState<Chamado | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cs, chs] = await Promise.all([
          contratoService.getAll(),
          chamadoService.getAll(),
        ]);
        setContratos(cs);
        setChamados(chs);
      } catch (e) { console.warn(e); }
      setLoading(false);
    })();
  }, []);

  const recarregar = async () => {
    setLoading(true);
    const chs = await chamadoService.getAll();
    setChamados(chs);
    setLoading(false);
  };

  const contratoNome = (id: string) => contratos.find(c => c.id === id)?.nome || '—';

  const isVencido = (c: Chamado) =>
    !!c.prazo && new Date(c.prazo) < new Date() && c.status !== 'concluido' && c.status !== 'f_indevido';

  // Meses disponíveis
  const mesesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    chamados.forEach(c => { if (c.createdAt) set.add(c.createdAt.substring(0, 7)); });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [chamados]);

  const filtrados = useMemo(() => {
    return chamados.filter(c => {
      if (contratoFiltro !== 'todos' && c.contratoId !== contratoFiltro) return false;
      if (statusFiltro !== 'todos' && c.status !== statusFiltro) return false;
      if (responsavelFiltro !== 'todos' && (c.responsavel || '') !== responsavelFiltro) return false;
      if (dataFiltro !== 'todos' && c.createdAt.substring(0, 10) !== dataFiltro) return false;
      if (mesFiltro !== 'todos' && c.createdAt.substring(0, 7) !== mesFiltro) return false;
      if (somenteVencidos && !isVencido(c)) return false;
      if (buscaTicket.trim() && !(c.numeroTicket || '').toLowerCase().includes(buscaTicket.trim().toLowerCase())) return false;
      if (busca.trim()) {
        const q = busca.trim().toLowerCase();
        const hay = `${c.descricao} ${c.local}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [chamados, contratoFiltro, statusFiltro, responsavelFiltro, dataFiltro, mesFiltro, somenteVencidos, busca, buscaTicket]);

  const stats = useMemo(() => {
    const base: Record<ChamadoStatus, number> = {
      itens_apontados: 0, em_andamento: 0, improcedente: 0,
      aguardando_vistoria: 0, concluido: 0, f_indevido: 0,
    };
    const fonte = chamados.filter(c => contratoFiltro === 'todos' || c.contratoId === contratoFiltro);
    fonte.forEach(c => { base[c.status] = (base[c.status] || 0) + 1; });
    return { counts: base, total: fonte.length };
  }, [chamados, contratoFiltro]);

  // Dados dos gráficos — com base nos filtrados
  const chartStatusData = useMemo(() => {
    return (Object.keys(STATUS_CONFIG) as ChamadoStatus[]).map(k => ({
      label: STATUS_CONFIG[k].label,
      value: filtrados.filter(c => c.status === k).length,
      color: STATUS_CONFIG[k].chart,
    }));
  }, [filtrados]);

  const chartRespData = useMemo(() => {
    const c = filtrados.filter(x => x.responsavel === 'Construtora').length;
    const b = filtrados.filter(x => x.responsavel === 'Condominio').length;
    return [
      { label: 'Construtora', value: c, color: '#f97316' },
      { label: 'Condomínio', value: b, color: '#3b82f6' },
    ];
  }, [filtrados]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filtrados.length / itemsPerPage));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const pagina = filtrados.slice(startIdx, startIdx + itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [contratoFiltro, statusFiltro, responsavelFiltro, dataFiltro, mesFiltro, somenteVencidos, busca, buscaTicket]);

  // CRUD
  const criarChamado = async (dados: Partial<Chamado>) => {
    if (!dados.contratoId || !dados.descricao?.trim() || !dados.local?.trim()) {
      alert('Preencha prédio, local e descrição.');
      return;
    }
    const novo = await chamadoService.create({
      contratoId: dados.contratoId,
      usuarioId: usuario?.id || null,
      numeroTicket: dados.numeroTicket || null,
      local: dados.local.trim(),
      descricao: dados.descricao.trim(),
      status: dados.status || 'aguardando_vistoria',
      responsavel: dados.responsavel || null,
      prazo: dados.prazo || null,
      fotoUrls: dados.fotoUrls || [],
      historicoReprogramacao: [],
      atualizacoes: [],
    });
    if (novo) {
      setChamados(prev => [novo, ...prev]);
      setShowNovo(false);
    } else alert('Erro ao criar chamado.');
  };

  const atualizarChamado = async (id: string, patch: Partial<Chamado>) => {
    const ok = await chamadoService.update(id, patch);
    if (ok) {
      setChamados(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
      if (detalhe?.id === id) setDetalhe({ ...detalhe, ...patch });
    } else alert('Erro ao atualizar.');
  };

  const excluirChamado = async (id: string) => {
    if (!confirm('Excluir este chamado? Esta ação não pode ser desfeita.')) return;
    const ok = await chamadoService.remove(id);
    if (ok) {
      setChamados(prev => prev.filter(c => c.id !== id));
      setDetalhe(null);
    }
  };

  const adicionarParecer = async (chamadoId: string, tipo: ChamadoUpdateType, mensagem: string) => {
    if (!mensagem.trim()) return;
    const ok = await chamadoService.addUpdate(chamadoId, {
      type: tipo, message: mensagem.trim(), createdBy: usuario?.nome || 'Sistema',
    });
    if (ok) { await recarregar(); setAddUpdateFor(null); }
  };

  const salvarReprogramacao = async (chamado: Chamado, novaData: string, motivo: string) => {
    if (!novaData || !motivo.trim()) { alert('Preencha nova data e motivo.'); return; }
    const hist = [...chamado.historicoReprogramacao, {
      date: novaData, reason: motivo.trim(), updatedAt: new Date().toISOString(),
    }];
    await atualizarChamado(chamado.id, { prazo: novaData, reprogramacaoData: novaData, historicoReprogramacao: hist });
    setReprogramarFor(null);
  };

  // Excel export
  const exportarExcel = async () => {
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Chamados');
      ws.columns = [
        { header: 'Nº Ticket', key: 'numero', width: 12 },
        { header: 'Data', key: 'data', width: 12 },
        { header: 'Prédio', key: 'predio', width: 28 },
        { header: 'Local', key: 'local', width: 28 },
        { header: 'Descrição', key: 'descricao', width: 50 },
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Responsável', key: 'resp', width: 15 },
        { header: 'Prazo', key: 'prazo', width: 12 },
        { header: 'Atualizações', key: 'updates', width: 10 },
      ];
      ws.getRow(1).font = { bold: true };
      ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } } as any;
      ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      filtrados.forEach(c => {
        ws.addRow({
          numero: c.numeroTicket || '',
          data: new Date(c.createdAt).toLocaleDateString('pt-BR'),
          predio: contratoNome(c.contratoId),
          local: c.local,
          descricao: c.descricao,
          status: STATUS_CONFIG[c.status].label,
          resp: c.responsavel || '—',
          prazo: c.prazo ? new Date(c.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : '',
          updates: c.atualizacoes.length,
        });
      });
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chamados_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Erro ao exportar Excel.');
    }
  };

  const predioNomeBanner = contratoFiltro === 'todos'
    ? 'Todos os Prédios'
    : contratoNome(contratoFiltro);

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-none">Chamados</h1>
              <p className="text-xs text-gray-500 leading-none mt-1">Sistema de Gestão — {stats.total} registros</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={exportarExcel} variant="outline" size="sm" className="gap-1 bg-green-50 hover:bg-green-100 border-green-300 text-green-700">
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button onClick={recarregar} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => setShowNovo(true)} className="bg-orange-600 hover:bg-orange-700 text-white gap-1" size="sm">
              <Plus className="w-4 h-4" /> Novo
            </Button>
          </div>
        </div>

        <div className="text-center mt-3">
          <h2 className="text-base md:text-2xl font-black text-blue-600 uppercase tracking-tight truncate">
            {predioNomeBanner}
          </h2>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {(Object.keys(STATUS_CONFIG) as ChamadoStatus[]).map(k => {
          const cfg = STATUS_CONFIG[k];
          const n = stats.counts[k];
          const active = statusFiltro === k;
          return (
            <button
              key={k}
              onClick={() => setStatusFiltro(s => s === k ? 'todos' : k)}
              className={`text-left p-3 rounded-lg border transition-all ${
                active
                  ? 'border-orange-500 ring-2 ring-orange-500/30 ' + cfg.bg
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot}`}></span>
                <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{n}</div>
            </button>
          );
        })}
      </div>

      {/* Graficos Pizza */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Distribuição por Status</h3>
          <div className="flex items-center gap-4">
            <PieChart data={chartStatusData} />
            <div className="flex-1 space-y-1">
              {chartStatusData.filter(d => d.value > 0).map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }}></span>
                  <span className="text-gray-700 flex-1">{d.label}</span>
                  <span className="font-bold text-gray-900">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Responsabilidade</h3>
          <div className="flex items-center gap-4">
            <PieChart data={chartRespData} />
            <div className="flex-1 space-y-1">
              {chartRespData.filter(d => d.value > 0).map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }}></span>
                  <span className="text-gray-700 flex-1">{d.label}</span>
                  <span className="font-bold text-gray-900">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-3 border border-gray-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2">
          <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
            <Building2 className="w-3 h-3" /> Prédio
          </label>
          <select value={contratoFiltro} onChange={(e) => setContratoFiltro(e.target.value)} className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm">
            <option value="todos">Todos os prédios</option>
            {contratos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
            <HardHat className="w-3 h-3" /> Responsável
          </label>
          <select value={responsavelFiltro} onChange={(e) => setResponsavelFiltro(e.target.value)} className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm">
            <option value="todos">Todos</option>
            <option value="Construtora">Construtora</option>
            <option value="Condominio">Condomínio</option>
            <option value="">Sem resp.</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3" /> Mês
          </label>
          <select value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm">
            <option value="todos">Todos</option>
            {mesesDisponiveis.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3" /> Dia específico
          </label>
          <Input type="date" value={dataFiltro === 'todos' ? '' : dataFiltro} onChange={(e) => setDataFiltro(e.target.value || 'todos')} className="text-sm h-8" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
            <Search className="w-3 h-3" /> Nº Ticket
          </label>
          <Input placeholder="Ticket..." value={buscaTicket} onChange={(e) => setBuscaTicket(e.target.value)} className="text-sm h-8" />
        </div>
        <div className="md:col-span-2 lg:col-span-4">
          <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
            <Search className="w-3 h-3" /> Buscar na descrição/local
          </label>
          <Input placeholder="Palavra-chave..." value={busca} onChange={(e) => setBusca(e.target.value)} className="text-sm h-8" />
        </div>
        <div className="lg:col-span-2 flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={somenteVencidos} onChange={(e) => setSomenteVencidos(e.target.checked)} className="w-4 h-4 accent-red-600" />
            <AlertCircle className="w-4 h-4 text-red-600" /> Somente vencidos
          </label>
          <Button
            variant="outline" size="sm"
            onClick={() => {
              setContratoFiltro('todos'); setStatusFiltro('todos'); setResponsavelFiltro('todos');
              setDataFiltro('todos'); setMesFiltro('todos'); setSomenteVencidos(false);
              setBusca(''); setBuscaTicket('');
            }}
          >
            <X className="w-4 h-4 mr-1" /> Limpar
          </Button>
        </div>
      </div>

      {/* Tabela — mesma disposição do registro-de-chamados */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-3 text-center font-bold text-gray-800 uppercase text-xs tracking-wider border-x border-gray-200">Nº</th>
                <th className="px-3 py-3 text-left font-bold text-gray-800 uppercase text-xs tracking-wider border-x border-gray-200">Local</th>
                <th className="px-3 py-3 text-left font-bold text-gray-800 uppercase text-xs tracking-wider border-x border-gray-200">Descrição</th>
                <th className="px-3 py-3 text-center font-bold text-gray-800 uppercase text-xs tracking-wider border-x border-gray-200">Foto</th>
                <th className="px-3 py-3 text-left font-bold text-gray-800 uppercase text-xs tracking-wider border-x border-gray-200">Criado Por</th>
                <th className="px-3 py-3 text-center font-bold text-gray-800 uppercase text-xs tracking-wider border-x border-gray-200">Abertura</th>
                <th className="px-3 py-3 text-center font-bold text-gray-800 uppercase text-xs tracking-wider border-x border-gray-200">Responsável</th>
                <th className="px-3 py-3 text-center font-bold text-gray-800 uppercase text-xs tracking-wider border-x border-gray-200">Status</th>
                <th className="px-3 py-3 text-center font-bold text-gray-800 uppercase text-xs tracking-wider border-x border-gray-200">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> Carregando...
                </td></tr>
              ) : pagina.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-500">
                  <Filter className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  Nenhum chamado encontrado com os filtros atuais.
                </td></tr>
              ) : (
                pagina.map(c => {
                  const cfg = STATUS_CONFIG[c.status];
                  const vencido = isVencido(c);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer bg-white ${
                        vencido ? 'border-l-4 border-l-red-600 bg-red-50/30' : ''
                      }`}
                      onClick={() => setDetalhe(c)}
                    >
                      {/* Nº */}
                      <td className="px-3 py-3 text-center border-x border-gray-200">
                        <div className="text-gray-900 text-xs font-bold">{c.numeroTicket || '-'}</div>
                      </td>
                      {/* Local */}
                      <td className="px-3 py-3 border-x border-gray-200">
                        <div className="text-gray-900 text-xs truncate max-w-[150px]" title={c.local}>{c.local}</div>
                      </td>
                      {/* Descrição */}
                      <td className="px-3 py-3 border-x border-gray-200">
                        <div className="text-gray-600 text-xs line-clamp-2 max-w-[250px]" title={c.descricao}>{c.descricao}</div>
                      </td>
                      {/* Foto */}
                      <td className="px-3 py-3 text-center border-x border-gray-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                          <button
                            className="relative w-12 h-12 rounded-md border border-gray-300 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all flex items-center justify-center bg-gray-100 hover:bg-gray-200 overflow-hidden"
                            onClick={() => setGaleriaFotos(c)}
                            title="Clique para ver as fotos"
                          >
                            {c.fotoUrls.length > 0 ? (
                              <>
                                <img src={c.fotoUrls[0]} className="w-full h-full object-cover" />
                                {c.fotoUrls.length > 1 && (
                                  <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] px-1 rounded-tl">
                                    {c.fotoUrls.length}
                                  </span>
                                )}
                              </>
                            ) : (
                              <Camera className="w-5 h-5 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </td>
                      {/* Criado Por */}
                      <td className="px-3 py-3 text-xs border-x border-gray-200">
                        <div className="text-gray-900 font-medium truncate max-w-[120px]" title={c.usuarioId || 'N/A'}>
                          {c.usuarioId ? (c.usuarioId.substring(0, 8) + '...') : 'N/A'}
                        </div>
                      </td>
                      {/* Abertura */}
                      <td className="px-3 py-3 text-center text-gray-500 text-xs border-x border-gray-200">
                        <span>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</span>
                      </td>
                      {/* Responsável */}
                      <td className="px-3 py-3 text-center border-x border-gray-200">
                        <div className="text-xs font-medium">{c.responsavel || 'Construtora'}</div>
                      </td>
                      {/* Status */}
                      <td className="px-3 py-3 text-center border-x border-gray-200">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </td>
                      {/* Ações */}
                      <td className="px-3 py-3 border-x border-gray-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => setDetalhe(c)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => excluirChamado(c.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs">
            <span className="text-gray-600">
              {startIdx + 1}–{Math.min(startIdx + itemsPerPage, filtrados.length)} de {filtrados.length}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-2 text-gray-700 font-medium">{currentPage} / {totalPages}</span>
              <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Galeria de Fotos */}
      {galeriaFotos && (
        <GaleriaFotosModal chamado={galeriaFotos} onClose={() => setGaleriaFotos(null)} />
      )}

      {/* Modais */}
      {showNovo && (
        <NovoChamadoModal contratos={contratos} defaultContratoId={contratoFiltro === 'todos' ? '' : contratoFiltro}
          onClose={() => setShowNovo(false)} onSalvar={criarChamado} />
      )}
      {detalhe && (
        <DetalheChamadoModal chamado={detalhe} contratoNome={contratoNome(detalhe.contratoId)}
          isAdmin={isAdmin}
          onClose={() => setDetalhe(null)}
          onUpdate={(patch) => atualizarChamado(detalhe.id, patch)}
          onExcluir={() => excluirChamado(detalhe.id)}
          onAddParecer={() => setAddUpdateFor(detalhe)}
          onReprogramar={() => setReprogramarFor(detalhe)}
          onVerHistorico={() => setShowHistorico(detalhe)}
        />
      )}
      {addUpdateFor && (
        <AddParecerModal onClose={() => setAddUpdateFor(null)}
          onSalvar={(tipo, msg) => adicionarParecer(addUpdateFor.id, tipo, msg)} />
      )}
      {reprogramarFor && (
        <ReprogramarModal chamado={reprogramarFor}
          onClose={() => setReprogramarFor(null)}
          onSalvar={(data, motivo) => salvarReprogramacao(reprogramarFor, data, motivo)} />
      )}
      {showHistorico && (
        <HistoricoModal chamado={showHistorico} onClose={() => setShowHistorico(null)} />
      )}
    </div>
  );
}

// ==================== Modais ====================

function NovoChamadoModal({ contratos, defaultContratoId, onClose, onSalvar }: {
  contratos: Contrato[]; defaultContratoId: string;
  onClose: () => void; onSalvar: (dados: Partial<Chamado>) => void;
}) {
  const [contratoId, setContratoId] = useState(defaultContratoId || (contratos[0]?.id || ''));
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [numeroTicket, setNumeroTicket] = useState('');
  const [responsavel, setResponsavel] = useState<ChamadoResponsavel>('Construtora');
  const [prazo, setPrazo] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onloadend = () => setFotos(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-bold text-gray-900">Novo Chamado</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Prédio *</label>
            <select value={contratoId} onChange={(e) => setContratoId(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 text-sm">
              <option value="">— Selecione —</option>
              {contratos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Local *</label>
            <Input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex.: Apto 302, Hall 3° andar" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Descrição *</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva o problema apontado" rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Número do ticket</label>
              <Input value={numeroTicket} onChange={(e) => setNumeroTicket(e.target.value)} placeholder="Opcional" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Prazo</label>
              <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Responsável</label>
            <div className="flex gap-2 mt-1">
              {(['Construtora', 'Condominio'] as const).map(r => (
                <button key={r} onClick={() => setResponsavel(r)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm border ${
                    responsavel === r ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                  {r === 'Condominio' ? 'Condomínio' : r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Fotos</label>
            <input type="file" accept="image/*" multiple onChange={handleFoto} className="mt-1 text-sm" />
            {fotos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {fotos.map((f, i) => (
                  <div key={i} className="relative">
                    <img src={f} className="w-full aspect-square object-cover rounded" />
                    <button onClick={() => setFotos(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white"
            onClick={() => onSalvar({ contratoId, local, descricao, numeroTicket, responsavel, prazo: prazo || null, fotoUrls: fotos, status: 'aguardando_vistoria' })}>
            <Save className="w-4 h-4 mr-1" /> Criar chamado
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetalheChamadoModal({ chamado, contratoNome, isAdmin, onClose, onUpdate, onExcluir, onAddParecer, onReprogramar, onVerHistorico }: {
  chamado: Chamado; contratoNome: string; isAdmin: boolean;
  onClose: () => void; onUpdate: (patch: Partial<Chamado>) => void;
  onExcluir: () => void; onAddParecer: () => void;
  onReprogramar: () => void; onVerHistorico: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [local, setLocal] = useState(chamado.local);
  const [descricao, setDescricao] = useState(chamado.descricao);
  const [status, setStatus] = useState<ChamadoStatus>(chamado.status);
  const [responsavel, setResponsavel] = useState<ChamadoResponsavel>(chamado.responsavel || null);
  const [prazo, setPrazo] = useState(chamado.prazo || '');
  const [numeroTicket, setNumeroTicket] = useState(chamado.numeroTicket || '');

  const salvarEdicao = () => {
    onUpdate({ local, descricao, status, responsavel, prazo: prazo || null, numeroTicket });
    setEditMode(false);
  };

  const cfg = STATUS_CONFIG[chamado.status];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>{cfg.label}
            </span>
            <h3 className="text-lg font-bold text-gray-900">Chamado {chamado.numeroTicket ? `#${chamado.numeroTicket}` : ''}</h3>
          </div>
          <div className="flex items-center gap-1">
            {!editMode && (
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                <Edit2 className="w-4 h-4 mr-1" /> Editar
              </Button>
            )}
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={onExcluir} className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded ml-1">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Info label="Prédio" value={contratoNome} />
            <Info label="Criado em" value={new Date(chamado.createdAt).toLocaleString('pt-BR')} />
          </div>
          {editMode ? (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700">Local</label>
                <Input value={local} onChange={(e) => setLocal(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nº Ticket</label>
                  <Input value={numeroTicket} onChange={(e) => setNumeroTicket(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Prazo</label>
                  <Input type="date" value={prazo || ''} onChange={(e) => setPrazo(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as ChamadoStatus)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 text-sm">
                  {(Object.keys(STATUS_CONFIG) as ChamadoStatus[]).map(k => (
                    <option key={k} value={k}>{STATUS_CONFIG[k].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Responsável</label>
                <div className="flex gap-2 mt-1">
                  {(['Construtora', 'Condominio'] as const).map(r => (
                    <button key={r} onClick={() => setResponsavel(r)}
                      className={`flex-1 px-3 py-2 rounded-md text-sm border ${
                        responsavel === r ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                      {r === 'Condominio' ? 'Condomínio' : r}
                    </button>
                  ))}
                  <button onClick={() => setResponsavel(null)}
                    className={`px-3 py-2 rounded-md text-sm border ${
                      !responsavel ? 'bg-gray-200 text-gray-700 border-gray-400'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>—</button>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={salvarEdicao}>
                  <Save className="w-4 h-4 mr-1" /> Salvar
                </Button>
              </div>
            </>
          ) : (
            <>
              <Info label="Local" value={chamado.local} />
              <Info label="Descrição" value={chamado.descricao} pre />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <Info label="Responsável" value={chamado.responsavel || '—'} />
                <Info label="Prazo" value={chamado.prazo ? new Date(chamado.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : '—'} />
                <Info label="Nº Ticket" value={chamado.numeroTicket || '—'} />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={onReprogramar}>
                  <Calendar className="w-4 h-4 mr-1" /> Reprogramar
                </Button>
                {chamado.historicoReprogramacao.length > 0 && (
                  <Button size="sm" variant="outline" onClick={onVerHistorico}>
                    <History className="w-4 h-4 mr-1" /> Histórico ({chamado.historicoReprogramacao.length})
                  </Button>
                )}
              </div>
            </>
          )}
          {chamado.fotoUrls.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Fotos</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {chamado.fotoUrls.map((f, i) => (
                  <a key={i} href={f} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={f} className="w-full aspect-square object-cover rounded" />
                  </a>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Atualizações e pareceres</label>
              <Button size="sm" variant="outline" onClick={onAddParecer}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar parecer
              </Button>
            </div>
            {chamado.atualizacoes.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nenhum parecer registrado.</p>
            ) : (
              <div className="space-y-2">
                {chamado.atualizacoes.map(u => {
                  const uc = UPDATE_TYPE_CONFIG[u.type];
                  return (
                    <div key={u.id} className={`p-3 rounded-md border ${uc.cls}`}>
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold flex items-center gap-1">
                          <span>{uc.icon}</span> {uc.label}
                        </span>
                        <span className="text-xs text-gray-600 flex items-center gap-2">
                          <UserIcon className="w-3 h-3" /> {u.createdBy}
                          <Clock className="w-3 h-3" /> {new Date(u.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{u.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, pre }: { label: string; value: string; pre?: boolean }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className={`text-sm text-gray-900 ${pre ? 'whitespace-pre-wrap' : ''}`}>{value || '—'}</div>
    </div>
  );
}

function AddParecerModal({ onClose, onSalvar }: {
  onClose: () => void; onSalvar: (tipo: ChamadoUpdateType, msg: string) => void;
}) {
  const [tipo, setTipo] = useState<ChamadoUpdateType>('construtora');
  const [msg, setMsg] = useState('');
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Adicionar parecer</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo de parecer</label>
            <div className="flex gap-2">
              {(Object.keys(UPDATE_TYPE_CONFIG) as ChamadoUpdateType[]).map(t => {
                const c = UPDATE_TYPE_CONFIG[t];
                return (
                  <button key={t} onClick={() => setTipo(t)}
                    className={`flex-1 px-3 py-2 rounded-md text-sm border flex items-center justify-center gap-1 ${
                      tipo === t ? c.cls + ' border-2' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                    <span>{c.icon}</span> {c.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Mensagem</label>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4}
              placeholder="Descreva o parecer, retorno ou observação..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white" disabled={!msg.trim()}
            onClick={() => onSalvar(tipo, msg)}>
            <MessageSquare className="w-4 h-4 mr-1" /> Salvar parecer
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReprogramarModal({ chamado, onClose, onSalvar }: {
  chamado: Chamado; onClose: () => void; onSalvar: (data: string, motivo: string) => void;
}) {
  const [novaData, setNovaData] = useState('');
  const [motivo, setMotivo] = useState('');
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Reprogramar prazo</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
            Prazo atual: <strong>{chamado.prazo ? new Date(chamado.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : 'sem prazo'}</strong>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nova data *</label>
            <Input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Motivo *</label>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3}
              placeholder="Por que o prazo esta sendo reprogramado?"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white" disabled={!novaData || !motivo.trim()}
            onClick={() => onSalvar(novaData, motivo)}>
            <Save className="w-4 h-4 mr-1" /> Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

function HistoricoModal({ chamado, onClose }: { chamado: Chamado; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-bold text-gray-900">Historico de reprogramacoes</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-4 space-y-2">
          {chamado.historicoReprogramacao.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Nenhuma reprogramacao registrada.</p>
          ) : (
            chamado.historicoReprogramacao.map((h, i) => (
              <div key={i} className="p-3 rounded-md border border-orange-200 bg-orange-50">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-bold text-orange-800">
                    Nova data: {new Date(h.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(h.updatedAt).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{h.reason}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function GaleriaFotosModal({ chamado, onClose }: { chamado: Chamado; onClose: () => void }) {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const fotos = chamado.fotoUrls || [];
  if (fotos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[80] p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-700">Este chamado nao possui fotos.</p>
          <Button variant="outline" className="mt-4" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[80] p-4" onClick={onClose}>
      <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="text-white text-sm mb-2">
          Foto {indiceAtual + 1} de {fotos.length}
        </div>
        <div className="relative w-full flex items-center justify-center">
          {fotos.length > 1 && (
            <button
              onClick={() => setIndiceAtual(i => (i - 1 + fotos.length) % fotos.length)}
              className="absolute left-0 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <img src={fotos[indiceAtual]} className="max-w-full max-h-[70vh] object-contain rounded" />
          {fotos.length > 1 && (
            <button
              onClick={() => setIndiceAtual(i => (i + 1) % fotos.length)}
              className="absolute right-0 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap justify-center">
          {fotos.map((f, i) => (
            <button key={i} onClick={() => setIndiceAtual(i)} className={`w-16 h-16 rounded overflow-hidden border-2 ${i === indiceAtual ? 'border-blue-500' : 'border-transparent'}`}>
              <img src={f} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        <a
          href={fotos[indiceAtual]}
          download={`chamado_${chamado.numeroTicket || chamado.id}_${indiceAtual + 1}.jpg`}
          className="mt-3 inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="w-4 h-4" /> Baixar foto atual
        </a>
      </div>
    </div>
  );
}
