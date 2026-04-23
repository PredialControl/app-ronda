import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react';
import { Ronda, Contrato } from '@/types';
import { parecerService } from '@/lib/parecerService';
import { kanbanEventoService } from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';

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
  kanban:  { solid: 'bg-blue-600 text-white',     outline: 'border-blue-500 text-blue-300',     dot: 'bg-blue-600',   label: 'Kanban (Implantação)' },
  ronda:   { solid: 'bg-yellow-500 text-black',   outline: 'border-yellow-400 text-yellow-300', dot: 'bg-yellow-500', label: 'Ronda (Supervisão)' },
  parecer: { solid: 'bg-green-600 text-white',    outline: 'border-green-500 text-green-300',   dot: 'bg-green-600',  label: 'Parecer Técnico (Supervisão)' },
  manual:  { solid: 'bg-red-600 text-white',      outline: 'border-red-500 text-red-300',       dot: 'bg-red-600',    label: 'Manual' },
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

  const [showNovoModal, setShowNovoModal] = useState(false);
  const [novoEvento, setNovoEvento] = useState({
    data: fmtDateLocal(new Date()),
    titulo: '',
    descricao: '',
    contratoId: '',
    status: 'programado' as StatusEvento,
  });

  const [selectedEvento, setSelectedEvento] = useState<AgendaEvento | null>(null);

  const carregarEventos = async () => {
    setLoading(true);
    try {
      const lista: AgendaEvento[] = [];

      // 1) RONDAS
      rondas.forEach(r => {
        if (r.data) {
          lista.push({
            id: `ronda-${r.id}`,
            data: r.data,
            titulo: `Ronda: ${r.contrato}`,
            descricao: r.responsavel ? `Responsável: ${r.responsavel}` : undefined,
            fonte: 'ronda',
            status: 'executado',
            contrato: r.contrato,
            sourceId: r.id,
          });
        }
      });

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
  }, [rondas, contratos]);

  const eventosFiltrados = eventos.filter(e => {
    if (filtro === 'todos') return true;
    if (filtro === 'implantacao') return e.fonte === 'kanban' || e.fonte === 'manual';
    if (filtro === 'supervisao') return e.fonte === 'ronda' || e.fonte === 'parecer';
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
              className={`min-h-[110px] bg-gray-900 rounded p-1.5 border ${hoje ? 'border-orange-500' : 'border-gray-700'}`}
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
    </div>
  );
}
