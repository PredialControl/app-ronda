import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Ronda, Contrato, ItemRelevante } from '@/types';
import { itemRelevanteService, visitaService, VisitaRealizada } from '@/lib/supabaseService';

interface AgendaCalendarioProps {
  rondas: Ronda[];
  contratos: Contrato[];
}

export function AgendaCalendario({ rondas, contratos }: AgendaCalendarioProps) {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [filtro, setFiltro] = useState<'todos' | 'implantacao' | 'supervisao'>('todos');
  const [todosItensRelevantes, setTodosItensRelevantes] = useState<ItemRelevante[]>([]);
  const [visitas, setVisitas] = useState<VisitaRealizada[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [eventoData, setEventoData] = useState(new Date().toISOString().split('T')[0]);
  const [eventoTitulo, setEventoTitulo] = useState('');
  const [eventoDescricao, setEventoDescricao] = useState('');

  // Carregar dados
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar itens relevantes de todos os contratos
        const todosItens: ItemRelevante[] = [];
        for (const contrato of contratos) {
          const itens = await itemRelevanteService.getByContrato(contrato.nome);
          todosItens.push(...itens);
        }
        setTodosItensRelevantes(todosItens);

        // Carregar visitas
        const visitasData = await visitaService.getAll();
        setVisitas(visitasData || []);
      } catch (error) {
        console.error('Erro ao carregar dados da agenda:', error);
      }
    };
    carregarDados();
  }, [contratos]);

  // Gerar dias do mês
  const getDiasDoMes = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const hoje = new Date();
    const cells = [];

    // Células vazias antes do primeiro dia
    for (let i = 0; i < primeiroDia; i++) {
      cells.push({ dia: 0, data: null });
    }

    // Dias do mês
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const isHoje = new Date(ano, mes, dia).toDateString() === hoje.toDateString();
      cells.push({ dia, data: dataStr, isHoje });
    }

    return cells;
  };

  // Contar eventos de um dia
  const getEventosDoDia = (dataStr: string) => {
    const mostrarImplantacao = filtro === 'todos' || filtro === 'implantacao';
    const mostrarSupervisao = filtro === 'todos' || filtro === 'supervisao';

    const eventosRonda = mostrarSupervisao ? rondas.filter(r => r.data === dataStr).length : 0;
    const eventosVisita = mostrarSupervisao ? visitas.filter(v => v.data === dataStr).length : 0;
    const eventosKanban = mostrarImplantacao ? todosItensRelevantes.filter(i => i.data_abertura === dataStr).length : 0;

    return { eventosRonda, eventosVisita, eventosKanban };
  };

  const dias = getDiasDoMes();

  const salvarEvento = async () => {
    if (!eventoTitulo.trim()) {
      alert('Informe o titulo do evento');
      return;
    }
    try {
      await visitaService.create({
        contrato_nome: 'Evento Manual',
        usuario_login: 'admin',
        data: eventoData,
        tipo: eventoTitulo,
        descricao: eventoDescricao
      });
      setShowModal(false);
      setEventoTitulo('');
      setEventoDescricao('');
      // Recarregar visitas
      const visitasData = await visitaService.getAll();
      setVisitas(visitasData || []);
      alert('Evento adicionado!');
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Erro ao salvar evento');
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      {/* Navegação do Mês */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold text-white capitalize">
          {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFiltro('todos')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtro === 'todos' ? 'bg-white text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFiltro('implantacao')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtro === 'implantacao' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          Implantacao
        </button>
        <button
          onClick={() => setFiltro('supervisao')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtro === 'supervisao' ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          Supervisao
        </button>
      </div>

      {/* Legenda */}
      <div className="flex gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <span className="text-gray-400">Rondas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full" />
          <span className="text-gray-400">Visitas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span className="text-gray-400">Kanban</span>
        </div>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
          <div key={d} className="text-center text-sm text-gray-400 py-2 font-medium">{d}</div>
        ))}
      </div>

      {/* Grid do calendário */}
      <div className="grid grid-cols-7 gap-2">
        {dias.map((cell, index) => {
          if (cell.dia === 0) {
            return <div key={`empty-${index}`} className="h-20 bg-slate-900/50 rounded-lg" />;
          }

          const eventos = getEventosDoDia(cell.data!);
          const temEventos = eventos.eventosRonda > 0 || eventos.eventosVisita > 0 || eventos.eventosKanban > 0;

          return (
            <div
              key={cell.dia}
              className={`h-20 p-2 rounded-lg border transition-colors cursor-pointer hover:border-blue-500 ${
                cell.isHoje
                  ? 'bg-emerald-500/20 border-emerald-500'
                  : 'bg-slate-700 border-slate-600'
              }`}
            >
              <div className={`text-sm font-bold mb-1 ${cell.isHoje ? 'text-emerald-400' : 'text-white'}`}>
                {cell.dia}
              </div>
              {temEventos && (
                <div className="flex gap-1 flex-wrap">
                  {eventos.eventosRonda > 0 && (
                    <div className="flex items-center gap-0.5">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span className="text-[10px] text-yellow-400">{eventos.eventosRonda}</span>
                    </div>
                  )}
                  {eventos.eventosVisita > 0 && (
                    <div className="flex items-center gap-0.5">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span className="text-[10px] text-emerald-400">{eventos.eventosVisita}</span>
                    </div>
                  )}
                  {eventos.eventosKanban > 0 && (
                    <div className="flex items-center gap-0.5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-[10px] text-blue-400">{eventos.eventosKanban}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botão Adicionar Evento */}
      <div className="mt-6">
        <button
          onClick={() => {
            setEventoData(new Date().toISOString().split('T')[0]);
            setShowModal(true);
          }}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Adicionar Evento
        </button>
      </div>

      {/* Modal Adicionar Evento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Adicionar Evento</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                <input
                  type="date"
                  value={eventoData}
                  onChange={e => setEventoData(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titulo</label>
                <input
                  type="text"
                  value={eventoTitulo}
                  onChange={e => setEventoTitulo(e.target.value)}
                  placeholder="Ex: Reuniao com sindico"
                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descricao</label>
                <textarea
                  value={eventoDescricao}
                  onChange={e => setEventoDescricao(e.target.value)}
                  placeholder="Detalhes do evento..."
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEvento}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
