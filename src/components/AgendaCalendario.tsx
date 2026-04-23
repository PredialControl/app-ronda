import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, FileDown, Mail, Filter as FilterIcon } from 'lucide-react';
import { Ronda, Contrato } from '@/types';
import { parecerService } from '@/lib/parecerService';
import { kanbanEventoService, rondaService } from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import { emailService } from '@/lib/emailService';

interface AgendaCalendarioProps {
  rondas: Ronda[];
  contratos: Contrato[];
}

type Fonte = 'kanban' | 'ronda' | 'parecer' | 'manual';
type StatusEvento = 'programado' | 'executado';
type Filtro = 'todos' | 'implantacao' | 'supervisao';

interface AgendaEvento {
  id: string;
  data: string;
  titulo: string;
  descricao?: string;
  fonte: Fonte;
  status: StatusEvento;
  contrato?: string;
  contratoId?: string;
  sourceId?: string;
}

const CORES = {
  kanban:  { solid: 'bg-blue-600 text-white font-semibold',      outline: 'border-blue-500 text-blue-200 font-semibold',     dot: 'bg-blue-600',   label: 'Kanban (Implantação)' },
  ronda:   { solid: 'bg-yellow-500 text-black font-bold',        outline: 'border-yellow-400 text-yellow-100 font-bold',     dot: 'bg-yellow-500', label: 'Ronda (Supervisão)' },
  parecer: { solid: 'bg-green-600 text-white font-semibold',     outline: 'border-green-500 text-green-200 font-semibold',   dot: 'bg-green-600',  label: 'Parecer Técnico (Supervisão)' },
  manual:  { solid: 'bg-red-600 text-white font-semibold',       outline: 'border-red-500 text-red-200 font-semibold',       dot: 'bg-red-600',    label: 'Manual' },
} as const;

const NOMES_MES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const NOMES_DIA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function fmtDateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function AgendaCalendario({ rondas, contratos }: AgendaCalendarioProps) {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [eventos, setEventos] = useState<AgendaEvento[]>([]);
  const [loading, setLoading] = useState(false);
  const [contratoFiltro, setContratoFiltro] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  const [showNovoModal, setShowNovoModal] = useState(false);
  const [novoEvento, setNovoEvento] = useState({
    data: fmtDateLocal(new Date()),
    titulo: '',
    descricao: '',
    contratoId: '',
    status: 'programado' as StatusEvento,
  });

  const [selectedEvento, setSelectedEvento] = useState<AgendaEvento | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  const carregarEventos = async () => {
    setLoading(true);
    try {
      const lista: AgendaEvento[] = [];

      // 1) RONDAS — buscar TODAS do banco (incluindo supervisor/outros logins), não usar o prop filtrado
      try {
        const todasRondas: any[] = await rondaService.getAll();
        todasRondas.forEach((r: any) => {
          if (!r || !r.data || !r.id) return;
          lista.push({
            id: `ronda-${r.id}`,
            data: r.data,
            titulo: `Ronda: ${r.contrato || 'Sem contrato'}`,
            descricao: r.responsavel ? `Responsável: ${r.responsavel}` : undefined,
            fonte: 'ronda',
            status: 'executado',
            contrato: r.contrato,
            sourceId: r.id,
          });
        });
      } catch (e) {
        console.warn('[Agenda] falha lendo rondas:', e);
      }

      // 2) KANBAN (Supabase — compartilhado entre todos os devices/logins)
      try {
        const kanbanEventos = await kanbanEventoService.getAll();
        kanbanEventos.forEach((ke: any) => {
          const data: string | null | undefined =
            ke.data_andamento || ke.data_vistoria || ke.data_recebimento || ke.data_correcao;
          if (!data) return;
          lista.push({
            id: `kanban-${ke.contrato_id}-${ke.kanban_item_id}`,
            data,
            titulo: ke.titulo || 'Sem título',
            descricao: `${ke.categoria || ''} · ${ke.contrato_nome || ''}`,
            fonte: 'kanban',
            status: ke.status === 'finalizado' ? 'executado' : 'programado',
            contrato: ke.contrato_nome || undefined,
            contratoId: ke.contrato_id,
            sourceId: ke.kanban_item_id,
          });
        });
      } catch (e) {
        console.warn('[Agenda] falha lendo kanban_eventos do Supabase:', e);
      }

      // 3) PARECERES TÉCNICOS
      for (const c of contratos) {
        try {
          const pareceres = await parecerService.getAll(c.id);
          pareceres.forEach((p: any) => {
            if (!p.created_at) return;
            lista.push({
              id: `parecer-${p.id}`,
              data: String(p.created_at).split('T')[0],
              titulo: `Parecer: ${p.titulo || 'Sem título'}`,
              descricao: `${c.nome}`,
              fonte: 'parecer',
              status: 'executado',
              contrato: c.nome,
              contratoId: c.id,
              sourceId: p.id,
            });
          });
        } catch {
          // ignore
        }
      }

      // 4) MANUAIS
      try {
        const { data: manuais, error } = await supabase.from('agenda_eventos').select('*');
        if (!error && manuais) {
          manuais.forEach((m: any) => {
            lista.push({
              id: `manual-${m.id}`,
              data: m.data,
              titulo: m.titulo,
              descricao: m.descricao || undefined,
              fonte: 'manual',
              status: (m.status === 'executado' ? 'executado' : 'programado'),
              contrato: m.contrato_nome || undefined,
              contratoId: m.contrato_id || undefined,
              sourceId: m.id,
            });
          });
        }
      } catch (e) {
        console.warn('[Agenda] tabela agenda_eventos pode não existir ainda:', e);
      }

      setEventos(lista);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEventos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratos]);

  const eventosFiltrados = eventos.filter(e => {
    if (filtro === 'implantacao' && !(e.fonte === 'kanban' || e.fonte === 'manual')) return false;
    if (filtro === 'supervisao' && !(e.fonte === 'ronda' || e.fonte === 'parecer')) return false;
    if (contratoFiltro) {
      const alvo = contratos.find(c => c.id === contratoFiltro);
      const nomeAlvo = (alvo?.nome || '').trim().toLowerCase();
      if (e.contratoId && e.contratoId !== contratoFiltro) return false;
      if (!e.contratoId && (e.contrato || '').trim().toLowerCase() !== nomeAlvo) return false;
    }
    if (startDate && e.data < startDate) return false;
    if (endDate && e.data > endDate) return false;
    return true;
  });

  const eventosPorDia: Record<string, AgendaEvento[]> = {};
  eventosFiltrados.forEach(ev => {
    if (!eventosPorDia[ev.data]) eventosPorDia[ev.data] = [];
    eventosPorDia[ev.data].push(ev);
  });

  const primeiroDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
  const ultimoDia  = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);
  const diaSemanaInicio = primeiroDia.getDay();

  const dias: Array<Date | null> = [];
  for (let i = 0; i < diaSemanaInicio; i++) dias.push(null);
  for (let i = 1; i <= ultimoDia.getDate(); i++) {
    dias.push(new Date(mesAtual.getFullYear(), mesAtual.getMonth(), i));
  }

  const hojeStr = fmtDateLocal(new Date());

  const handleExportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Relatório da Agenda', 14, 18);
    doc.setFontSize(10);
    const dtIni = startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '(início)';
    const dtFim = endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR') : '(fim)';
    const contratoNome = contratoFiltro ? (contratos.find(c => c.id === contratoFiltro)?.nome || '') : 'Todos os contratos';
    doc.text(`Período: ${dtIni} até ${dtFim}`, 14, 25);
    doc.text(`Contrato: ${contratoNome}`, 14, 31);
    doc.text(`Filtro: ${filtro === 'todos' ? 'Todos' : filtro === 'implantacao' ? 'Implantação' : 'Supervisão'}`, 14, 37);
    doc.text(`Total de eventos: ${eventosFiltrados.length}`, 14, 43);
    let y = 52;
    const ordenados = [...eventosFiltrados].sort((a, b) => a.data.localeCompare(b.data));
    ordenados.forEach(ev => {
      if (y > 275) { doc.addPage(); y = 20; }
      const statusLabel = ev.status === 'executado' ? '[EXECUTADO]' : '[PROGRAMADO]';
      const fonteLabel = ev.fonte.toUpperCase();
      const dt = new Date(ev.data + 'T00:00:00').toLocaleDateString('pt-BR');
      doc.setFontSize(10);
      doc.text(`${dt}  ${statusLabel}  [${fonteLabel}]`, 14, y);
      y += 5;
      doc.setFontSize(11);
      doc.text(`  ${ev.titulo}`, 14, y);
      y += 5;
      if (ev.descricao) {
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(`  ${ev.descricao}`, 180);
        doc.text(lines, 14, y);
        y += lines.length * 4;
      }
      y += 2;
    });
    const fname = `agenda_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fname);
  };

  const handleEnviarEmail = async () => {
    if (!contratoFiltro) {
      alert('Selecione um contrato no filtro antes de enviar. O email vai para os destinatários cadastrados desse contrato.');
      return;
    }
    const config = emailService.obterConfiguracaoEmail(contratoFiltro);
    if (!config || !config.destinatarios || config.destinatarios.length === 0) {
      alert('Não há destinatários cadastrados para este contrato. Cadastre em Documentos do Condomínio → Configurar Email.');
      return;
    }
    setEnviandoEmail(true);
    try {
      const dtIni = startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
      const dtFim = endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
      const ordenados = [...eventosFiltrados].sort((a, b) => a.data.localeCompare(b.data));
      const linhas = ordenados.map(ev => {
        const dt = new Date(ev.data + 'T00:00:00').toLocaleDateString('pt-BR');
        const st = ev.status === 'executado' ? 'EXECUTADO' : 'PROGRAMADO';
        return `${dt} - [${st}] ${ev.titulo}${ev.descricao ? ' | ' + ev.descricao : ''}`;
      }).join('\n');
      const texto = `Agenda do contrato ${(config as any).contratoNome || ''}\nPeríodo: ${dtIni} a ${dtFim}\nTotal de eventos: ${eventosFiltrados.length}\n\n${linhas}`;
      const dest = config.destinatarios.filter((d: any) => d.ativo).map((d: any) => d.email);
      if (dest.length === 0) { alert('Nenhum destinatário ativo.'); return; }
      const subject = encodeURIComponent(`Agenda ${(config as any).contratoNome || ''} - ${dtIni} a ${dtFim}`);
      const body = encodeURIComponent(texto);
      window.location.href = `mailto:${dest.join(',')}?subject=${subject}&body=${body}`;
      alert(`Email preparado no seu cliente padrão para ${dest.length} destinatário(s).`);
    } catch (e: any) {
      console.error('Erro ao enviar email:', e);
      alert('Erro ao enviar email: ' + (e.message || e));
    } finally {
      setEnviandoEmail(false);
    }
  };

  const handleSalvarManual = async () => {
    if (!novoEvento.titulo.trim() || !novoEvento.data) return;
    try {
      const payload: any = {
        data: novoEvento.data,
        titulo: novoEvento.titulo.trim(),
        descricao: novoEvento.descricao.trim() || null,
        status: novoEvento.status,
        contrato_id: novoEvento.contratoId || null,
        contrato_nome: novoEvento.contratoId ? contratos.find(c => c.id === novoEvento.contratoId)?.nome : null,
      };
      const { data, error } = await supabase.from('agenda_eventos').insert(payload).select().single();
      if (error) throw error;
      setEventos(prev => [...prev, {
        id: `manual-${data.id}`,
        data: data.data,
        titulo: data.titulo,
        descricao: data.descricao || undefined,
        fonte: 'manual',
        status: data.status,
        contrato: data.contrato_nome || undefined,
        contratoId: data.contrato_id || undefined,
        sourceId: data.id,
      }]);
      setShowNovoModal(false);
      setNovoEvento({
        data: fmtDateLocal(new Date()),
        titulo: '',
        descricao: '',
        contratoId: '',
        status: 'programado',
      });
    } catch (e: any) {
      console.error('Erro ao salvar evento manual:', e);
      alert(`Erro ao salvar evento. Verifique se a tabela agenda_eventos existe no Supabase.\n\nDetalhe: ${e.message || e}`);
    }
  };

  const handleAlternarStatus = async (evento: AgendaEvento) => {
    if (evento.fonte !== 'manual') return;
    const novoStatus: StatusEvento = evento.status === 'programado' ? 'executado' : 'programado';
    try {
      const { error } = await supabase.from('agenda_eventos').update({ status: novoStatus }).eq('id', evento.sourceId);
      if (error) throw error;
      setEventos(prev => prev.map(e => e.id === evento.id ? { ...e, status: novoStatus } : e));
      setSelectedEvento(prev => prev && prev.id === evento.id ? { ...prev, status: novoStatus } : prev);
    } catch (e) {
      console.error('Erro ao alternar status:', e);
    }
  };

  const handleDeletarManual = async (evento: AgendaEvento) => {
    if (evento.fonte !== 'manual') return;
    if (!confirm('Apagar este evento manual?')) return;
    try {
      await supabase.from('agenda_eventos').delete().eq('id', evento.sourceId);
      setEventos(prev => prev.filter(e => e.id !== evento.id));
      setSelectedEvento(null);
    } catch (e) {
      console.error('Erro ao deletar:', e);
    }
  };

  const renderEventoPill = (ev: AgendaEvento) => {
    const cor = CORES[ev.fonte];
    const executado = ev.status === 'executado';
    const clsExec = `${cor.solid} border border-transparent`;
    const clsProg = `bg-transparent border-2 ${cor.outline}`;
    return (
      <div
        key={ev.id}
        onClick={(e) => { e.stopPropagation(); setSelectedEvento(ev); }}
        title={`${ev.titulo}${ev.descricao ? '\n' + ev.descricao : ''} — ${executado ? 'Executado' : 'Programado'}`}
        className={`text-[10px] leading-tight px-1.5 py-0.5 rounded cursor-pointer truncate ${executado ? clsExec : clsProg} hover:opacity-80`}
      >
        {ev.titulo}
      </div>
    );
  };

  return (
    <div className="relative pb-24">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h3 className="text-xl font-semibold text-white min-w-[200px] text-center">
            {NOMES_MES[mesAtual.getMonth()]} {mesAtual.getFullYear()}
          </h3>
          <button
            onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => setMesAtual(new Date())}
            className="text-sm px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded"
          >
            Hoje
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400 font-semibold tracking-wider">FILTRO</span>
          <div className="flex gap-1 bg-gray-800 rounded p-1">
            {([
              { v: 'todos' as const, l: 'Todos' },
              { v: 'implantacao' as const, l: 'Implantação' },
              { v: 'supervisao' as const, l: 'Supervisão' },
            ]).map(opt => (
              <button
                key={opt.v}
                onClick={() => setFiltro(opt.v)}
                className={`text-sm px-3 py-1.5 rounded transition-all ${filtro === opt.v ? 'bg-white text-gray-900 font-semibold' : 'text-gray-300 hover:text-white'}`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Barra de filtros extras: contrato, período, PDF, Email */}
      <div className="flex flex-wrap items-end gap-3 mb-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 font-semibold">Contrato</label>
          <select
            value={contratoFiltro}
            onChange={(e) => setContratoFiltro(e.target.value)}
            className="bg-gray-900 text-white border border-gray-600 rounded px-2 py-1.5 text-sm min-w-[200px]"
          >
            <option value="">Todos os contratos</option>
            {contratos.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 font-semibold">De</label>
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-900 text-white border border-gray-600 rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 font-semibold">Até</label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-900 text-white border border-gray-600 rounded px-2 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={() => { setContratoFiltro(''); setStartDate(''); setEndDate(''); setFiltro('todos'); }}
          className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded flex items-center gap-1"
          title="Limpar todos os filtros"
        >
          <FilterIcon className="w-4 h-4" /> Limpar
        </button>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleExportarPDF}
            disabled={eventosFiltrados.length === 0}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-sm font-semibold px-3 py-1.5 rounded flex items-center gap-1"
            title="Exportar os eventos filtrados como PDF"
          >
            <FileDown className="w-4 h-4" /> Exportar PDF
          </button>
          <button
            onClick={handleEnviarEmail}
            disabled={enviandoEmail || eventosFiltrados.length === 0 || !contratoFiltro}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm font-semibold px-3 py-1.5 rounded flex items-center gap-1"
            title={contratoFiltro ? 'Enviar para os destinatários cadastrados deste contrato' : 'Selecione um contrato para habilitar o envio por email'}
          >
            <Mail className="w-4 h-4" /> {enviandoEmail ? 'Enviando…' : 'Enviar Email'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-gray-300">
        {(Object.keys(CORES) as Fonte[]).map(k => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${CORES[k].dot}`} />
            <span>{CORES[k].label}</span>
          </div>
        ))}
        <div className="text-gray-500 italic">· Preenchido = Executado · Contorno = Programado</div>
      </div>

      {loading && <div className="text-center text-gray-400 text-sm mb-2">Carregando eventos...</div>}

      <div className="grid grid-cols-7 gap-1 bg-gray-800 p-2 rounded-lg">
        {NOMES_DIA.map(dn => (
          <div key={dn} className="text-center text-xs font-semibold text-gray-400 py-2 uppercase">{dn}</div>
        ))}
        {dias.map((d, idx) => {
          if (!d) return <div key={`blank-${idx}`} className="min-h-[110px]" />;
          const dataStr = fmtDateLocal(d);
          const eventosDia = eventosPorDia[dataStr] || [];
          const hoje = dataStr === hojeStr;
          return (
            <div
              key={dataStr}
              onClick={() => { if (eventosDia.length > 0) setDiaSelecionado(dataStr); }}
              className={`min-h-[110px] bg-gray-900 rounded p-1.5 border cursor-pointer transition-colors hover:border-orange-400 ${hoje ? 'border-orange-500' : 'border-gray-700'}`}
            >
              <div className={`text-xs font-semibold mb-1 ${hoje ? 'text-orange-400' : 'text-gray-400'}`}>
                {d.getDate()}
              </div>
              <div className="space-y-1">
                {eventosDia.slice(0, 4).map(renderEventoPill)}
                {eventosDia.length > 4 && (
                  <div className="text-[10px] text-gray-400 pl-1">+{eventosDia.length - 4} outros</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowNovoModal(true)}
        className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-3 rounded-full shadow-xl flex items-center gap-2 z-40"
      >
        <Plus className="w-5 h-5" />
        Adicionar Evento
      </button>

      {showNovoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowNovoModal(false)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Adicionar Evento Manual</h3>
              <button onClick={() => setShowNovoModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Data</label>
                <input
                  type="date"
                  value={novoEvento.data}
                  onChange={e => setNovoEvento(p => ({ ...p, data: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Título</label>
                <input
                  type="text"
                  value={novoEvento.titulo}
                  onChange={e => setNovoEvento(p => ({ ...p, titulo: e.target.value }))}
                  placeholder="Ex: Entregar relatório A"
                  className="w-full bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Descrição (opcional)</label>
                <textarea
                  value={novoEvento.descricao}
                  onChange={e => setNovoEvento(p => ({ ...p, descricao: e.target.value }))}
                  rows={2}
                  className="w-full bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Contrato (opcional)</label>
                <select
                  value={novoEvento.contratoId}
                  onChange={e => setNovoEvento(p => ({ ...p, contratoId: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                >
                  <option value="">— sem contrato —</option>
                  {contratos.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNovoEvento(p => ({ ...p, status: 'programado' }))}
                    className={`flex-1 px-3 py-2 rounded text-sm ${novoEvento.status === 'programado' ? 'bg-transparent border-2 border-red-500 text-red-300 font-semibold' : 'bg-gray-700 text-gray-400 border border-gray-600'}`}
                  >
                    Programado (contorno)
                  </button>
                  <button
                    onClick={() => setNovoEvento(p => ({ ...p, status: 'executado' }))}
                    className={`flex-1 px-3 py-2 rounded text-sm ${novoEvento.status === 'executado' ? 'bg-red-600 text-white font-semibold' : 'bg-gray-700 text-gray-400 border border-gray-600'}`}
                  >
                    Executado (preenchido)
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowNovoModal(false)} className="px-4 py-2 text-gray-300 hover:text-white text-sm">Cancelar</button>
              <button
                onClick={handleSalvarManual}
                disabled={!novoEvento.titulo.trim()}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded font-semibold text-sm"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEvento && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setSelectedEvento(null)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4 gap-3">
              <div className="flex items-start gap-2 flex-1">
                <div className={`w-3 h-3 rounded ${CORES[selectedEvento.fonte].dot} mt-1.5 flex-shrink-0`} />
                <h3 className="text-lg font-semibold text-white break-words">{selectedEvento.titulo}</h3>
              </div>
              <button onClick={() => setSelectedEvento(null)} className="text-gray-400 hover:text-white flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <div><span className="text-gray-500">Data:</span> <strong className="text-white">{new Date(selectedEvento.data + 'T00:00:00').toLocaleDateString('pt-BR')}</strong></div>
              <div><span className="text-gray-500">Fonte:</span> <strong className="text-white">{CORES[selectedEvento.fonte].label}</strong></div>
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                <strong className={selectedEvento.status === 'executado' ? 'text-green-400' : 'text-orange-400'}>
                  {selectedEvento.status === 'executado' ? 'Executado' : 'Programado'}
                </strong>
              </div>
              {selectedEvento.contrato && (
                <div><span className="text-gray-500">Contrato:</span> <strong className="text-white">{selectedEvento.contrato}</strong></div>
              )}
              {selectedEvento.descricao && (
                <div><span className="text-gray-500">Descrição:</span> <span className="text-white">{selectedEvento.descricao}</span></div>
              )}
            </div>
            {selectedEvento.fonte === 'manual' ? (
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => handleAlternarStatus(selectedEvento)}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-semibold text-sm"
                >
                  Alternar para {selectedEvento.status === 'programado' ? 'Executado' : 'Programado'}
                </button>
                <button
                  onClick={() => handleDeletarManual(selectedEvento)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-5 text-xs text-gray-500 italic">
                Eventos de {CORES[selectedEvento.fonte].label} não são editáveis aqui. Edite o registro original.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal do Dia: lista tudo maior */}
      {diaSelecionado && (() => {
        const lista = eventosPorDia[diaSelecionado] || [];
        const dataObj = new Date(diaSelecionado + 'T00:00:00');
        const weekday = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
        const dataStr = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        return (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setDiaSelecionado(null)}
          >
            <div
              className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-gray-600 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-5 gap-3 pb-3 border-b border-gray-700">
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{weekday}</div>
                  <h3 className="text-2xl font-bold text-white">{dataStr}</h3>
                  <div className="text-sm text-gray-400 mt-1">{lista.length} {lista.length === 1 ? 'evento' : 'eventos'}</div>
                </div>
                <button onClick={() => setDiaSelecionado(null)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-3">
                {lista.length === 0 && (
                  <div className="text-center text-gray-500 py-8">Nenhum evento neste dia</div>
                )}
                {lista.map(ev => {
                  const cor = CORES[ev.fonte];
                  const exec = ev.status === 'executado';
                  return (
                    <div
                      key={ev.id}
                      onClick={() => { setSelectedEvento(ev); setDiaSelecionado(null); }}
                      className={`rounded-lg p-4 cursor-pointer transition-all hover:ring-2 hover:ring-white ${
                        exec ? cor.solid : `bg-transparent border-2 ${cor.outline}`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-bold break-words">{ev.titulo}</div>
                          {ev.descricao && (
                            <div className="text-sm mt-1 opacity-90">{ev.descricao}</div>
                          )}
                          {ev.contrato && !ev.descricao?.includes(ev.contrato) && (
                            <div className="text-xs mt-1 opacity-75">Contrato: {ev.contrato}</div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{cor.label}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            exec ? 'bg-black/30' : 'bg-white/10'
                          }`}>
                            {exec ? '✓ Executado' : '○ Programado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
