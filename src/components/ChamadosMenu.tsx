import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Filter, X, Save, Trash2, Camera, MessageSquare,
  Building2, Clock, AlertCircle, HardHat, FileSpreadsheet,
  Calendar, User as UserIcon, Edit2, RefreshCw, Eye, ChevronLeft, ChevronRight,
  History, Download, PlusCircle, ClipboardList, CheckCircle
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

// Badges estilo outline: borda + texto colorido, fundo transparente (igual o outro app)
const STATUS_CONFIG: Record<ChamadoStatus, { label: string; bg: string; text: string; dot: string; chart: string }> = {
  itens_apontados:     { label: 'Itens Apontados',     bg: 'bg-transparent border border-blue-400',   text: 'text-blue-400',   dot: 'bg-blue-400',   chart: '#3b82f6' },
  em_andamento:        { label: 'Em andamento',        bg: 'bg-transparent border border-yellow-400', text: 'text-yellow-400', dot: 'bg-yellow-400', chart: '#eab308' },
  improcedente:        { label: 'Improcedente',        bg: 'bg-transparent border border-orange-400', text: 'text-orange-400', dot: 'bg-orange-400', chart: '#f97316' },
  aguardando_vistoria: { label: 'Aguardando vistoria', bg: 'bg-transparent border border-purple-400', text: 'text-purple-400', dot: 'bg-purple-400', chart: '#a855f7' },
  concluido:           { label: 'Concluído',           bg: 'bg-transparent border border-green-400',  text: 'text-green-400',  dot: 'bg-green-400',  chart: '#22c55e' },
  f_indevido:          { label: 'F. Indevido',         bg: 'bg-transparent border border-red-400',    text: 'text-red-400',    dot: 'bg-red-400',    chart: '#ef4444' },
};

const UPDATE_TYPE_CONFIG: Record<ChamadoUpdateType, { label: string; icon: string; cls: string }> = {
  construtora: { label: 'Construtora', icon: '🏗️', cls: 'bg-orange-50 border-orange-200 text-orange-800' },
  condominio:  { label: 'Condomínio',  icon: '🏢', cls: 'bg-blue-50 border-blue-200 text-blue-800' },
  engenharia:  { label: 'Engenharia',  icon: '⚙️', cls: 'bg-purple-50 border-purple-200 text-purple-800' },
};

interface ChamadosMenuProps {
  onNavigate?: (destination: string) => void;
}

function DonutChart({ data, thickness = 36 }: {
  data: Array<{ label: string; value: number; color: string }>;
  thickness?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm aspect-square w-full max-w-[240px]">
        Sem dados
      </div>
    );
  }
  // Viewbox fixo em 220x220, svg escalado com width 100%
  const VB = 220;
  const rOuter = VB / 2 - 4;
  const rInner = rOuter - thickness;
  const cx = VB / 2;
  const cy = VB / 2;
  let cumulative = 0;
  const arcs = data.filter(d => d.value > 0).map((d, i) => {
    const startAngle = (cumulative / total) * 2 * Math.PI;
    cumulative += d.value;
    const endAngle = (cumulative / total) * 2 * Math.PI;
    const x1o = cx + rOuter * Math.sin(startAngle);
    const y1o = cy - rOuter * Math.cos(startAngle);
    const x2o = cx + rOuter * Math.sin(endAngle);
    const y2o = cy - rOuter * Math.cos(endAngle);
    const x1i = cx + rInner * Math.sin(endAngle);
    const y1i = cy - rInner * Math.cos(endAngle);
    const x2i = cx + rInner * Math.sin(startAngle);
    const y2i = cy - rInner * Math.cos(startAngle);
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    const pathD = [
      `M ${x1o} ${y1o}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2o} ${y2o}`,
      `L ${x1i} ${y1i}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${x2i} ${y2i}`,
      'Z',
    ].join(' ');
    return <path key={i} d={pathD} fill={d.color} stroke="#111827" strokeWidth={1.5} />;
  });
  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} className="w-full h-auto max-w-[240px]" preserveAspectRatio="xMidYMid meet">
      {arcs}
    </svg>
  );
}

function VerticalBarChart({ data }: {
  data: Array<{ label: string; value: number; color: string }>;
}) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const steps = 4;
  const niceMax = Math.ceil(maxVal / steps) * steps || steps;
  const ticks = Array.from({ length: steps + 1 }, (_, i) => Math.round((niceMax / steps) * (steps - i)));
  return (
    <div className="flex flex-col w-full h-full min-h-[220px]">
      <div className="flex flex-1 min-h-[180px]">
        {/* Eixo Y */}
        <div className="flex flex-col justify-between text-xs text-gray-500 pr-2 text-right w-8 shrink-0">
          {ticks.map((t, i) => <div key={i}>{t}</div>)}
        </div>
        {/* Area das barras */}
        <div className="flex-1 relative border-l border-b border-gray-700 min-w-0">
          {/* Grid */}
          {ticks.map((_, i) => (
            <div key={i}
              className="absolute left-0 right-0 border-t border-dashed border-gray-700/60"
              style={{ top: `${(i / steps) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end justify-around px-2 gap-2">
            {data.map((d, i) => {
              const h = (d.value / niceMax) * 100;
              return (
                <div key={i} className="flex-1 max-w-[70px] flex flex-col items-center">
                  <div className="w-full rounded-t transition-all"
                    style={{ height: `${h}%`, backgroundColor: d.color, minHeight: d.value > 0 ? 3 : 0 }}
                    title={`${d.label}: ${d.value}`} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Labels eixo X */}
      <div className="flex pl-8 mt-1">
        <div className="flex-1 flex items-start justify-around px-2 gap-2">
          {data.map((d, i) => (
            <div key={i} className="flex-1 max-w-[70px] text-center">
              <span className="text-[11px] text-gray-300 font-semibold truncate block">{d.label}</span>
              <span className="text-[10px] text-gray-500">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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

  // Sub-aba da aba Chamados:
  //   'abrir'        = formulario pra usuario solicitar chamado
  //   'solicitacoes' = painel MP com solicitacoes pendentes (is_registered=false) pra registrar
  //   'painel'       = lista/gestao dos chamados ja registrados (is_registered=true)
  const [subView, setSubView] = useState<'abrir' | 'solicitacoes' | 'painel'>('solicitacoes');
  const [registrarFor, setRegistrarFor] = useState<Chamado | null>(null);
  const [predioSolicitacoes, setPredioSolicitacoes] = useState<string | null>(null);

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

  // Solicitacoes = chamados abertos por usuarios mas ainda sem numero da construtora
  const solicitacoesPendentes = useMemo(() => chamados.filter(c => c.isRegistered === false), [chamados]);

  const filtrados = useMemo(() => {
    // Tabela geral mostra TODOS (inclusive pendentes de numero). Ao registrar num, sai do Painel de Solicitacoes mas fica aqui.
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
    // "Itens Apontados" é a somatoria total (todos os chamados contam como item apontado)
    base.itens_apontados = fonte.length;
    return { counts: base, total: fonte.length };
  }, [chamados, contratoFiltro]);

  // Dados dos gráficos — com base nos filtrados. "Itens Apontados" = total geral
  const chartStatusData = useMemo(() => {
    return (Object.keys(STATUS_CONFIG) as ChamadoStatus[]).map(k => ({
      label: STATUS_CONFIG[k].label,
      value: k === 'itens_apontados' ? filtrados.length : filtrados.filter(c => c.status === k).length,
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
      isRegistered: dados.isRegistered !== undefined ? dados.isRegistered : false,
      criadoPorNome: usuario?.nome || null,
    });
    if (novo) {
      setChamados(prev => [novo, ...prev]);
      setShowNovo(false);
    } else alert('Erro ao criar chamado.');
  };

  // MP "Registra" uma solicitacao: preenche num construtora, responsavel, prazo -> vira registered
  const registrarChamado = async (id: string, numeroTicket: string, responsavel: ChamadoResponsavel, prazo: string | null) => {
    if (!numeroTicket.trim()) { alert('Preencha o número do chamado da construtora.'); return; }
    const patch: Partial<Chamado> = {
      numeroTicket: numeroTicket.trim(),
      responsavel,
      prazo,
      isRegistered: true,
    };
    const ok = await chamadoService.update(id, patch);
    if (ok) {
      setChamados(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
      setRegistrarFor(null);
    } else alert('Erro ao registrar.');
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

      {/* Sub-abas: Abrir / Painel de Solicitacoes / Chamados registrados */}
      <div className="flex gap-2 bg-gray-900 rounded-xl p-1.5 border border-gray-800">
        <button
          onClick={() => setSubView('abrir')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
            subView === 'abrir'
              ? 'bg-orange-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          Abrir
        </button>
        <button
          onClick={() => setSubView('solicitacoes')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all relative ${
            subView === 'solicitacoes'
              ? 'bg-red-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <AlertCircle className="w-5 h-5" />
          Painel de Solicitações
          {solicitacoesPendentes.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full min-w-[24px] h-6 px-1.5 flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
              {solicitacoesPendentes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubView('painel')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
            subView === 'painel'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          Todos os Chamados
        </button>
      </div>

      {/* View: Painel de Solicitacoes — grid de predios com pendentes piscando */}
      {subView === 'solicitacoes' && !predioSolicitacoes && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Solicitações aguardando registro
            </h3>
            <span className="text-xs text-gray-400">
              {solicitacoesPendentes.length} pendente(s) em {contratos.filter(ct => solicitacoesPendentes.some(s => s.contratoId === ct.id)).length} prédio(s)
            </span>
          </div>
          {solicitacoesPendentes.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-3" />
              <p className="text-lg font-semibold text-white">Nenhuma solicitação pendente</p>
              <p className="text-sm text-gray-400 mt-1">Todos os chamados foram registrados na construtora.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {contratos
                .map(ct => ({
                  ct,
                  pendentes: solicitacoesPendentes.filter(s => s.contratoId === ct.id).length,
                  total: chamados.filter(c => c.contratoId === ct.id).length,
                }))
                .filter(x => x.pendentes > 0)
                .sort((a, b) => b.pendentes - a.pendentes)
                .map(({ ct, pendentes, total }) => (
                  <button
                    key={ct.id}
                    onClick={() => setPredioSolicitacoes(ct.id)}
                    className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-red-500 rounded-xl p-5 text-left transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-gray-800 group-hover:bg-red-600/20 rounded-lg transition-colors">
                        <Building2 className="w-6 h-6 text-gray-400 group-hover:text-red-400" />
                      </div>
                    </div>
                    <div className="flex justify-center py-3">
                      <div className="flex items-center gap-2 px-5 py-2 bg-red-500/15 text-red-400 rounded-2xl border-2 border-red-500/60 shadow-lg shadow-red-500/20 animate-pulse">
                        <AlertCircle className="w-6 h-6" />
                        <span className="text-2xl font-black uppercase tracking-tighter italic">
                          {pendentes} {pendentes === 1 ? 'PENDENTE' : 'PENDENTES'}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white line-clamp-2 mt-2">{ct.nome}</h3>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-[11px] font-medium text-gray-400">
                        Total: <span className="text-white font-bold">{total}</span>
                      </span>
                      <span className="text-[11px] font-bold text-red-400 group-hover:translate-x-1 transition-transform">
                        REGISTRAR →
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* View: Painel de Solicitacoes — lista dos pendentes de um predio */}
      {subView === 'solicitacoes' && predioSolicitacoes && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3 flex-wrap">
            <button onClick={() => setPredioSolicitacoes(null)}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white font-semibold">
              <ChevronLeft className="w-5 h-5" /> Voltar para lista de prédios
            </button>
            <div className="text-right">
              <h3 className="text-lg font-bold text-white">{contratoNome(predioSolicitacoes)}</h3>
              <p className="text-xs text-gray-400">
                {solicitacoesPendentes.filter(s => s.contratoId === predioSolicitacoes).length} solicitação(ões) pendente(s)
              </p>
            </div>
          </div>
          {solicitacoesPendentes.filter(s => s.contratoId === predioSolicitacoes).length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
              <p className="text-base font-semibold text-white">Este prédio não tem mais solicitações pendentes</p>
              <button onClick={() => setPredioSolicitacoes(null)} className="text-blue-400 text-sm mt-2 underline">
                Voltar para lista de prédios
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {solicitacoesPendentes
                .filter(s => s.contratoId === predioSolicitacoes)
                .map(c => (
                <div key={c.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-gray-400">
                          <UserIcon className="w-3 h-3 inline mr-1" />
                          {c.criadoPorNome || 'N/A'}
                        </span>
                        <span className="text-gray-500">·</span>
                        <span className="text-xs text-gray-400">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white mb-1">{c.local}</p>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{c.descricao}</p>
                      {c.fotoUrls.length > 0 && (
                        <span className="inline-flex items-center gap-1 mt-2 text-xs text-gray-400">
                          <Camera className="w-3 h-3" /> {c.fotoUrls.length} foto(s)
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setDetalhe(c)}
                        className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                        <Eye className="w-4 h-4 mr-1" /> Ver detalhes
                      </Button>
                      <Button size="sm" onClick={() => setRegistrarFor(c)}
                        className="bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle className="w-4 h-4 mr-1" /> Registrar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View "Abrir Chamado" — formulario rapido inline */}
      {subView === 'abrir' && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Abrir novo chamado</h3>
              <p className="text-xs text-gray-500">Registre um novo chamado para o prédio</p>
            </div>
          </div>
          <NovoChamadoInline contratos={contratos}
            defaultContratoId={contratoFiltro === 'todos' ? '' : contratoFiltro}
            onSalvar={async (dados) => {
              await criarChamado(dados);
              setSubView('painel'); // volta ao painel apos salvar
            }} />
        </div>
      )}

      {subView === 'painel' && (
      <>
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

      {/* Resumo de Chamados — 3 colunas: progress bars / donut / bar chart */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h3 className="text-lg font-bold text-white mb-4">Resumo de Chamados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {/* Coluna 1: Progress bars */}
          <div className="space-y-3 min-w-0">
            {chartStatusData.map((d, i) => {
              const maxVal = Math.max(...chartStatusData.map(x => x.value), 1);
              const pct = (d.value / maxVal) * 100;
              return (
                <div key={i} className="min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-sm font-semibold text-white truncate">{d.label}</span>
                    <span className="text-sm font-bold text-white shrink-0">{d.value}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: d.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coluna 2: Donut chart responsivo */}
          <div className="flex flex-col items-center justify-center min-w-0">
            <DonutChart data={chartStatusData.filter(d => d.label !== 'Itens Apontados')} thickness={36} />
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3 text-xs">
              {chartStatusData.filter(d => d.value > 0 && d.label !== 'Itens Apontados').map((d, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }}></span>
                  <span className="text-gray-300">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna 3: Bar chart vertical responsivo */}
          <div className="min-w-0 lg:col-span-1 md:col-span-2 flex flex-col">
            <VerticalBarChart
              data={[
                { label: 'Construtora', value: filtrados.filter(x => x.responsavel === 'Construtora' || !x.responsavel).length, color: '#ef4444' },
                { label: 'Condomínio',  value: filtrados.filter(x => x.responsavel === 'Condominio').length, color: '#3b82f6' },
              ]}
            />
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

      {/* Tabela — tema escuro igual ao outro app */}
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700">
                <th className="px-3 py-3 text-center font-bold text-white uppercase text-xs tracking-wider border-x border-gray-800">Nº</th>
                <th className="px-3 py-3 text-left font-bold text-white uppercase text-xs tracking-wider border-x border-gray-800">Local</th>
                <th className="px-3 py-3 text-left font-bold text-white uppercase text-xs tracking-wider border-x border-gray-800">Descrição</th>
                <th className="px-3 py-3 text-center font-bold text-white uppercase text-xs tracking-wider border-x border-gray-800">Foto</th>
                <th className="px-3 py-3 text-left font-bold text-white uppercase text-xs tracking-wider border-x border-gray-800">Criado Por</th>
                <th className="px-3 py-3 text-center font-bold text-white uppercase text-xs tracking-wider border-x border-gray-800">Abertura</th>
                <th className="px-3 py-3 text-center font-bold text-white uppercase text-xs tracking-wider border-x border-gray-800">Responsável</th>
                <th className="px-3 py-3 text-center font-bold text-white uppercase text-xs tracking-wider border-x border-gray-800">Status</th>
                <th className="px-3 py-3 text-center font-bold text-white uppercase text-xs tracking-wider border-x border-gray-800">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> Carregando...
                </td></tr>
              ) : pagina.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">
                  <Filter className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                  Nenhum chamado encontrado com os filtros atuais.
                </td></tr>
              ) : (
                pagina.map(c => {
                  const cfg = STATUS_CONFIG[c.status];
                  const vencido = isVencido(c);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-gray-800/50 transition-colors cursor-pointer ${
                        vencido ? 'border-l-4 border-l-red-500' : ''
                      }`}
                      onClick={() => setDetalhe(c)}
                    >
                      {/* Nº */}
                      <td className="px-3 py-3 text-center border-x border-gray-800">
                        <div className="text-white text-xs font-bold">{c.numeroTicket || '-'}</div>
                      </td>
                      {/* Local */}
                      <td className="px-3 py-3 border-x border-gray-800">
                        <div className="text-white text-xs truncate max-w-[150px]" title={c.local}>{c.local}</div>
                      </td>
                      {/* Descrição */}
                      <td className="px-3 py-3 border-x border-gray-800">
                        <div className="text-gray-300 text-xs line-clamp-2 max-w-[250px]" title={c.descricao}>{c.descricao}</div>
                      </td>
                      {/* Foto */}
                      <td className="px-3 py-3 text-center border-x border-gray-800" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                          <button
                            className="relative w-12 h-12 rounded-md border border-gray-600 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all flex items-center justify-center bg-gray-800 hover:bg-gray-700 overflow-hidden"
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
                              <Camera className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>
                      {/* Criado Por */}
                      <td className="px-3 py-3 text-xs border-x border-gray-800">
                        <div className="text-white font-medium truncate max-w-[140px]" title={c.criadoPorNome || 'N/A'}>
                          {c.criadoPorNome || <span className="text-gray-500 italic">N/A</span>}
                        </div>
                      </td>
                      {/* Abertura */}
                      <td className="px-3 py-3 text-center text-gray-300 text-xs border-x border-gray-800">
                        <span>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</span>
                      </td>
                      {/* Responsável */}
                      <td className="px-3 py-3 text-center border-x border-gray-800">
                        <div className="text-xs font-medium text-white">{c.responsavel || 'Construtora'}</div>
                      </td>
                      {/* Status */}
                      <td className="px-3 py-3 text-center border-x border-gray-800">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </td>
                      {/* Ações */}
                      <td className="px-3 py-3 border-x border-gray-800" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => setDetalhe(c)}
                            className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => excluirChamado(c.id)}
                              className="p-1.5 text-red-400 hover:bg-red-900/30 rounded transition-colors"
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
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-800 bg-gray-900 text-xs">
            <span className="text-gray-300">
              {startIdx + 1}–{Math.min(startIdx + itemsPerPage, filtrados.length)} de {filtrados.length}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-2 text-white font-medium">{currentPage} / {totalPages}</span>
              <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      </>
      )}

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
      {registrarFor && (
        <RegistrarChamadoModal chamado={registrarFor}
          contratoNome={contratoNome(registrarFor.contratoId)}
          onClose={() => setRegistrarFor(null)}
          onSalvar={(num, resp, prazo) => registrarChamado(registrarFor.id, num, resp, prazo)} />
      )}
    </div>
  );
}

function RegistrarChamadoModal({ chamado, contratoNome, onClose, onSalvar }: {
  chamado: Chamado; contratoNome: string;
  onClose: () => void;
  onSalvar: (numeroTicket: string, responsavel: ChamadoResponsavel, prazo: string | null) => void;
}) {
  const [numeroTicket, setNumeroTicket] = useState('');
  const [responsavel, setResponsavel] = useState<ChamadoResponsavel>('Construtora');
  const [prazo, setPrazo] = useState('');
  const [fotos, setFotos] = useState<string[]>(chamado.fotoUrls || []);
  const [carregandoFotos, setCarregandoFotos] = useState(false);
  const [baixandoFotos, setBaixandoFotos] = useState(false);
  const [verFotos, setVerFotos] = useState(false);

  useEffect(() => {
    if ((chamado.fotoUrls || []).length === 0 && chamado.id) {
      setCarregandoFotos(true);
      chamadoService.getFotos(chamado.id)
        .then(urls => { setFotos(urls); setCarregandoFotos(false); })
        .catch(() => setCarregandoFotos(false));
    }
  }, [chamado.id]);

  const baixarTodasFotos = async () => {
    if (fotos.length === 0) { alert('Esse chamado não tem fotos.'); return; }
    setBaixandoFotos(true);
    try {
      for (let i = 0; i < fotos.length; i++) {
        const url = fotos[i];
        const a = document.createElement('a');
        a.href = url;
        a.download = `chamado_${chamado.numeroTicket || chamado.id.substring(0, 8)}_foto${i + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Pequeno delay pra não travar o browser
        await new Promise(r => setTimeout(r, 150));
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao baixar fotos.');
    }
    setBaixandoFotos(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full border border-gray-700 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" /> Registrar chamado
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-gray-800 rounded-md p-3 border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Solicitação original</p>
            <p className="text-sm text-white font-semibold">{contratoNome} · {chamado.local}</p>
            <p className="text-sm text-gray-300 line-clamp-2 mt-1">{chamado.descricao}</p>
          </div>

          {/* Fotos — botoes grandes e visiveis */}
          <div className="bg-blue-500/10 border-2 border-blue-500/40 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-white flex items-center gap-1">
                <Camera className="w-4 h-4 text-blue-400" /> Fotos do chamado
                <span className="ml-1 text-blue-300">({carregandoFotos ? '...' : fotos.length})</span>
              </p>
            </div>
            {carregandoFotos ? (
              <div className="text-xs text-gray-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Carregando fotos...
              </div>
            ) : fotos.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Sem fotos neste chamado.</p>
            ) : (
              <div className="space-y-2">
                {/* Thumbnails */}
                <div className="grid grid-cols-4 gap-2">
                  {fotos.slice(0, 8).map((f, i) => (
                    <a key={i} href={f} target="_blank" rel="noopener noreferrer"
                      className="block aspect-square rounded overflow-hidden border border-blue-400/40 hover:border-blue-400 transition">
                      <img src={f} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
                {/* Botoes de acao */}
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" onClick={() => setVerFotos(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-full">
                    <Eye className="w-4 h-4 mr-1" /> Ver em tela cheia
                  </Button>
                  <Button size="sm" onClick={baixarTodasFotos} disabled={baixandoFotos}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold w-full">
                    {baixandoFotos ? (
                      <><RefreshCw className="w-4 h-4 mr-1 animate-spin" /> Baixando...</>
                    ) : (
                      <><Download className="w-4 h-4 mr-1" /> Baixar todas ({fotos.length})</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-white mb-1 block">Número do chamado na Construtora *</label>
            <Input value={numeroTicket} onChange={(e) => setNumeroTicket(e.target.value)}
              placeholder="Ex.: 123456" className="bg-gray-800 border-gray-700 text-blue-400 font-bold" autoFocus />
          </div>
          <div>
            <label className="text-sm font-semibold text-white mb-1 block">Responsável</label>
            <div className="flex gap-2">
              {(['Construtora', 'Condominio'] as const).map(r => (
                <button key={r} onClick={() => setResponsavel(r)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm border font-medium ${
                    responsavel === r ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700'}`}>
                  {r === 'Condominio' ? 'Condomínio' : r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-white mb-1 block">Prazo (opcional)</label>
            <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-700 sticky bottom-0 bg-gray-900">
          <Button variant="outline" onClick={onClose} className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">Cancelar</Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={!numeroTicket.trim()}
            onClick={() => onSalvar(numeroTicket, responsavel, prazo || null)}>
            <CheckCircle className="w-4 h-4 mr-1" /> Registrar
          </Button>
        </div>
      </div>
      {verFotos && (
        <GaleriaFotosModal chamado={{ ...chamado, fotoUrls: fotos }} onClose={() => setVerFotos(false)} />
      )}
    </div>
  );
}

// ==================== Modais ====================

// Formulario inline (sem modal) pra aba "Abrir Chamado"
function NovoChamadoInline({ contratos, defaultContratoId, onSalvar }: {
  contratos: Contrato[]; defaultContratoId: string;
  onSalvar: (dados: Partial<Chamado>) => Promise<void> | void;
}) {
  const [contratoId, setContratoId] = useState(defaultContratoId || (contratos[0]?.id || ''));
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

  const MAX_FOTOS = 3;

  // Comprime imagem grande (>1280px) pra evitar payload gigante
  const comprimirImagem = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('erro ao ler'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('erro ao carregar imagem'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const MAX = 1280;
        if (w > MAX || h > MAX) {
          if (w > h) { h = (h / w) * MAX; w = MAX; }
          else       { w = (w / h) * MAX; h = MAX; }
        }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('ctx')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const espaco = MAX_FOTOS - fotos.length;
    if (espaco <= 0) {
      alert(`Máximo de ${MAX_FOTOS} fotos por chamado. Remova uma foto pra adicionar outra.`);
      return;
    }
    const slice = files.slice(0, espaco);
    for (const f of slice) {
      try {
        const dataUrl = await comprimirImagem(f);
        setFotos(prev => [...prev, dataUrl]);
      } catch { /* ignora */ }
    }
    // limpar input pra poder selecionar mesmo arquivo de novo
    e.target.value = '';
  };

  const removerFoto = (i: number) => setFotos(prev => prev.filter((_, j) => j !== i));

  const handleSalvar = async () => {
    if (fotos.length === 0) {
      alert('Adicione pelo menos 1 foto do problema.');
      return;
    }
    setSalvando(true);
    await onSalvar({ contratoId, local, descricao, responsavel: null, prazo: null, fotoUrls: fotos, status: 'aguardando_vistoria' });
    setSalvando(false);
  };

  const podeSalvar = contratoId && local.trim() && descricao.trim() && fotos.length >= 1 && !salvando;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-gray-700">Prédio *</label>
        <select value={contratoId} onChange={(e) => setContratoId(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 text-sm">
          <option value="">— Selecione —</option>
          {contratos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700">Local do problema *</label>
        <Input value={local} onChange={(e) => setLocal(e.target.value)}
          placeholder="Ex.: Hall de entrada, Elevador 2, Apto 302" className="mt-1" />
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700">Descrição *</label>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva o problema detalhadamente..." rows={5}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 text-sm resize-none" />
      </div>

      {/* Fotos — obrigatorio 1 a 3, com dois botoes grandes: tirar foto / galeria */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            Fotos do problema
            <span className="text-[10px] text-red-600 font-bold uppercase tracking-widest">
              (Obrigatório 1-{MAX_FOTOS})
            </span>
          </label>
          <span className={`text-xs font-bold ${fotos.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {fotos.length}/{MAX_FOTOS} fotos
          </span>
        </div>

        {/* Previews */}
        {fotos.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-3">
            {fotos.map((f, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                <img src={f} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                <button onClick={() => removerFoto(i)}
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Botoes Tirar foto / Galeria — só se ainda cabe foto */}
        {fotos.length < MAX_FOTOS && (
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group">
              <Camera className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-blue-600">Tirar Foto</span>
              <span className="text-[10px] text-gray-500">Abrir câmera</span>
            </button>
            <button type="button" onClick={() => galleryInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group">
              <Download className="w-10 h-10 text-green-600 rotate-180 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-green-700">Da Galeria</span>
              <span className="text-[10px] text-gray-500">Escolher arquivo</span>
            </button>
          </div>
        )}

        <input type="file" accept="image/*" capture="environment"
          ref={cameraInputRef} className="hidden" onChange={handleFoto} />
        <input type="file" accept="image/*" multiple
          ref={galleryInputRef} className="hidden" onChange={handleFoto} />
      </div>

      <div className="flex justify-end pt-3 border-t border-gray-200">
        <Button onClick={handleSalvar} disabled={!podeSalvar}
          className={`gap-2 px-6 py-4 text-base font-bold w-full sm:w-auto ${
            podeSalvar ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}>
          {salvando ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {salvando ? 'Enviando...' : 'Abrir Chamado'}
        </Button>
      </div>
    </div>
  );
}

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
  const [editando, setEditando] = useState(false);
  const [status, setStatus] = useState<ChamadoStatus>(chamado.status);
  const [responsavel, setResponsavel] = useState<ChamadoResponsavel>(chamado.responsavel || 'Construtora');
  const [prazo, setPrazo] = useState(chamado.prazo || '');
  const [numeroTicket, setNumeroTicket] = useState(chamado.numeroTicket || '');
  const [fotosOpen, setFotosOpen] = useState(false);

  const cfg = STATUS_CONFIG[chamado.status];
  const vencido = !!chamado.prazo && new Date(chamado.prazo) < new Date() && chamado.status !== 'concluido' && chamado.status !== 'f_indevido';

  const salvarEdicao = () => {
    onUpdate({ status, responsavel, prazo: prazo || null, numeroTicket });
    setEditando(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-700 rounded-xl bg-gray-900" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex flex-row items-center justify-between bg-gray-900">
          <div className="flex-1">
            <div className="text-lg font-bold text-white flex items-center gap-2">
              Detalhes do Chamado
              {chamado.numeroTicket && (
                <span className="text-sm bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                  Nº {chamado.numeroTicket}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs mt-1">{contratoNome}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 bg-gray-900 text-white">
          {/* Localização */}
          <div>
            <label className="text-sm font-semibold text-white">Localização</label>
            <p className="text-sm text-gray-300 mt-1">{chamado.local || '--'}</p>
          </div>

          {/* Descrição */}
          <div>
            <label className="text-sm font-semibold text-white">Descrição</label>
            <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">{chamado.descricao || '--'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-white">Número do Chamado</label>
              <p className="text-sm text-blue-400 mt-1 font-bold">{chamado.numeroTicket || 'SEM Nº'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-white">Criado Por</label>
              <p className="text-sm text-gray-300 mt-1">{(chamado as any).criadoPorNome || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-white">Abertura</label>
              <p className="text-sm text-gray-300 mt-1">{new Date(chamado.createdAt).toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-white">Responsável</label>
              <p className="text-sm text-gray-300 mt-1">{chamado.responsavel || 'Construtora'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-white">Prazo</label>
              <p className={`text-sm mt-1 ${vencido ? 'text-red-400 font-bold' : 'text-gray-300'}`}>
                {chamado.prazo ? new Date(chamado.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não definido'}
                {vencido && <span className="ml-2">⚠️ Vencido</span>}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-white">Status</label>
              <div className="mt-1">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
            </div>
          </div>

          {/* Fotos */}
          <div>
            <label className="text-sm font-semibold text-white block mb-2">Fotos</label>
            <Button size="sm" variant="outline" onClick={() => setFotosOpen(true)} className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
              <Camera className="w-4 h-4 mr-1" /> Ver fotos
            </Button>
          </div>

          {/* Editar (admin) */}
          {isAdmin && (
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">📝 Editar Chamado</h3>
                {!editando && (
                  <Button size="sm" variant="outline" onClick={() => setEditando(true)} className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                    <Edit2 className="w-4 h-4 mr-1" /> Editar
                  </Button>
                )}
              </div>
              {editando && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold text-white">Número do Chamado</label>
                    <Input value={numeroTicket} onChange={(e) => setNumeroTicket(e.target.value)} className="mt-1 bg-gray-800 border-gray-600 text-blue-400 font-bold" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-white">Responsável</label>
                    <div className="flex gap-2 mt-1">
                      {(['Construtora', 'Condominio'] as const).map(r => (
                        <button key={r} onClick={() => setResponsavel(r)}
                          className={`flex-1 px-3 py-2 rounded-md text-sm border font-medium ${
                            responsavel === r ? 'bg-orange-600 text-white border-orange-600'
                              : 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700'}`}>
                          {r === 'Condominio' ? 'Condomínio' : r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-white">Prazo</label>
                    <Input type="date" value={prazo || ''} onChange={(e) => setPrazo(e.target.value)} className="mt-1 bg-gray-800 border-gray-600 text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-white">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as ChamadoStatus)}
                      className="w-full border border-gray-600 bg-gray-800 text-white rounded-md px-3 py-2 mt-1 text-sm">
                      {(Object.keys(STATUS_CONFIG) as ChamadoStatus[]).map(k => (
                        <option key={k} value={k}>{STATUS_CONFIG[k].label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setEditando(false)} className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">Cancelar</Button>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={salvarEdicao}>
                      <Save className="w-4 h-4 mr-1" /> Salvar alterações
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-3 flex-wrap">
                <Button size="sm" variant="outline" onClick={onReprogramar} className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                  <Calendar className="w-4 h-4 mr-1" /> Reprogramar prazo
                </Button>
                {chamado.historicoReprogramacao.length > 0 && (
                  <Button size="sm" variant="outline" onClick={onVerHistorico} className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                    <History className="w-4 h-4 mr-1" /> Histórico ({chamado.historicoReprogramacao.length})
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={onExcluir} className="bg-red-900/40 border-red-700 text-red-300 hover:bg-red-900/60 ml-auto">
                  <Trash2 className="w-4 h-4 mr-1" /> Excluir
                </Button>
              </div>
            </div>
          )}

          {/* Pareceres / Atualizações — igual ao outro app */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Histórico de Pareceres
                <span className="text-xs font-normal text-gray-400">({chamado.atualizacoes?.length || 0})</span>
              </h3>
              <Button size="sm" onClick={onAddParecer} className="bg-orange-600 hover:bg-orange-700 text-white">
                <Plus className="w-4 h-4 mr-1" /> Novo parecer
              </Button>
            </div>

            {/* Cards com contagem por tipo */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(Object.keys(UPDATE_TYPE_CONFIG) as ChamadoUpdateType[]).map(t => {
                const c = UPDATE_TYPE_CONFIG[t];
                const qtd = (chamado.atualizacoes || []).filter(u => u.type === t).length;
                return (
                  <div key={t} className="p-3 rounded-md border border-gray-700 bg-gray-800 text-center">
                    <div className="text-2xl">{c.icon}</div>
                    <div className="text-xs font-bold text-white">{c.label}</div>
                    <div className="text-xl font-bold text-white">{qtd}</div>
                  </div>
                );
              })}
            </div>

            {/* Lista de pareceres */}
            {(chamado.atualizacoes || []).length === 0 ? (
              <div className="text-center py-6 bg-gray-800/50 rounded-md border border-dashed border-gray-700">
                <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nenhum parecer registrado ainda.</p>
                <p className="text-xs text-gray-500 mt-1">Clique em &quot;Novo parecer&quot; para adicionar retorno da Construtora, Condomínio ou Engenharia.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(chamado.atualizacoes || []).map((u, idx) => {
                  const uc = UPDATE_TYPE_CONFIG[u.type] || UPDATE_TYPE_CONFIG.construtora;
                  return (
                    <div key={u.id || idx} className="p-3 rounded-md border-2 border-gray-700 bg-gray-800">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${uc.cls}`}>
                          <span>{uc.icon}</span> {uc.label}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-2">
                          <UserIcon className="w-3 h-3" /> {u.createdBy || 'Sistema'}
                          <Clock className="w-3 h-3 ml-1" /> {u.createdAt ? new Date(u.createdAt).toLocaleString('pt-BR') : '--'}
                        </span>
                      </div>
                      <p className="text-sm text-white whitespace-pre-wrap">{u.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Galeria de fotos aberta por dentro do modal */}
      {fotosOpen && (
        <GaleriaFotosModal chamado={chamado} onClose={() => setFotosOpen(false)} />
      )}
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
    <div className="fixed inset-0 bg-gray-900/95 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border-2 border-gray-300" onClick={(e) => e.stopPropagation()}>
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
    <div className="fixed inset-0 bg-gray-900/95 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto border-2 border-gray-300" onClick={(e) => e.stopPropagation()}>
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
  const [fotos, setFotos] = useState<string[]>(chamado.fotoUrls || []);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if ((chamado.fotoUrls || []).length === 0 && chamado.id) {
      setCarregando(true);
      chamadoService.getFotos(chamado.id)
        .then(urls => { setFotos(urls); setCarregando(false); })
        .catch(() => setCarregando(false));
    }
  }, [chamado.id]);

  if (carregando) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[80] p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <RefreshCw className="w-8 h-8 text-gray-500 mx-auto mb-2 animate-spin" />
          <p className="text-gray-700">Carregando fotos...</p>
        </div>
      </div>
    );
  }
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
        <div className="text-white text-sm mb-2">Foto {indiceAtual + 1} de {fotos.length}</div>
        <div className="relative w-full flex items-center justify-center">
          {fotos.length > 1 && (
            <button onClick={() => setIndiceAtual(i => (i - 1 + fotos.length) % fotos.length)}
              className="absolute left-0 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full z-10">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <img src={fotos[indiceAtual]} className="max-w-full max-h-[70vh] object-contain rounded" />
          {fotos.length > 1 && (
            <button onClick={() => setIndiceAtual(i => (i + 1) % fotos.length)}
              className="absolute right-0 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full z-10">
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap justify-center">
          {fotos.map((f, i) => (
            <button key={i} onClick={() => setIndiceAtual(i)}
              className={`w-16 h-16 rounded overflow-hidden border-2 ${i === indiceAtual ? 'border-blue-500' : 'border-transparent'}`}>
              <img src={f} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        <a href={fotos[indiceAtual]} download={`foto_${indiceAtual + 1}.jpg`}
          className="mt-3 inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold text-sm"
          onClick={(e) => e.stopPropagation()}>
          <Download className="w-4 h-4" /> Baixar foto atual
        </a>
      </div>
    </div>
  );
}
