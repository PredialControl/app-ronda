import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Ronda, Contrato, ItemRelevante } from '@/types';
import { itemRelevanteService, visitaService, VisitaRealizada } from '@/lib/supabaseService';

interface AgendaCalendarioProps {
  rondas: Ronda[];
  contratos: Contrato[];
}

// Cores por usuário
const CORES_USUARIOS: { [key: string]: { bg: string; text: string; border: string } } = {
  'tiago': { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' },
  'ricardo': { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' },
  'jessica': { bg: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500' },
  'admin': { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500' },
};

const getCorUsuario = (nome: string) => {
  const nomeNormalizado = nome.toLowerCase().split(' ')[0];
  return CORES_USUARIOS[nomeNormalizado] || { bg: 'bg-gray-500', text: 'text-gray-400', border: 'border-gray-500' };
};

interface Evento {
  id: string;
  data: string;
  usuario: string;
  tipo: 'ronda' | 'implantacao' | 'visita';
  descricao: string;
  contrato: string;
}

export function AgendaCalendario({ rondas, contratos }: AgendaCalendarioProps) {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [visualizacao, setVisualizacao] = useState<'dia' | 'semana' | 'mes' | 'ano'>('mes');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'implantacao' | 'supervisao'>('todos');
  const [todosItensRelevantes, setTodosItensRelevantes] = useState<ItemRelevante[]>([]);
  const [visitas, setVisitas] = useState<VisitaRealizada[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [eventoData, setEventoData] = useState(new Date().toISOString().split('T')[0]);
  const [eventoTitulo, setEventoTitulo] = useState('');
  const [eventoDescricao, setEventoDescricao] = useState('');
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

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

  // Montar lista de eventos
  useEffect(() => {
    const listaEventos: Evento[] = [];

    // Adicionar rondas
    rondas.forEach(ronda => {
      if (ronda.data) {
        listaEventos.push({
          id: `ronda-${ronda.id}`,
          data: ronda.data,
          usuario: ronda.responsavel || 'Sistema',
          tipo: 'ronda',
          descricao: `Ronda ${ronda.templateRonda || ''}`,
          contrato: ronda.contrato
        });
      }
    });

    // Adicionar itens relevantes (implantação)
    todosItensRelevantes.forEach(item => {
      if (item.data_abertura) {
        listaEventos.push({
          id: `impl-${item.id}`,
          data: item.data_abertura,
          usuario: 'Implantacao',
          tipo: 'implantacao',
          descricao: item.titulo,
          contrato: item.contrato_nome
        });
      }
    });

    // Adicionar visitas
    visitas.forEach(visita => {
      listaEventos.push({
        id: `visita-${visita.id}`,
        data: visita.data,
        usuario: visita.usuario_login,
        tipo: 'visita',
        descricao: visita.tipo,
        contrato: visita.contrato_nome
      });
    });

    setEventos(listaEventos);
  }, [rondas, todosItensRelevantes, visitas]);

  // Filtrar eventos
  const eventosFiltrados = eventos.filter(e => {
    if (filtroTipo === 'implantacao') return e.tipo === 'implantacao';
    if (filtroTipo === 'supervisao') return e.tipo === 'ronda' || e.tipo === 'visita';
    return true;
  });

  // Eventos do dia
  const getEventosDoDia = (dataStr: string) => {
    return eventosFiltrados.filter(e => e.data === dataStr);
  };

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

  const dias = getDiasDoMes();

  // Navegação
  const navegar = (direcao: number) => {
    if (visualizacao === 'mes') {
      setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + direcao, 1));
    } else if (visualizacao === 'ano') {
      setMesAtual(new Date(mesAtual.getFullYear() + direcao, mesAtual.getMonth(), 1));
    } else if (visualizacao === 'semana') {
      setMesAtual(new Date(mesAtual.getTime() + direcao * 7 * 24 * 60 * 60 * 1000));
    } else {
      setMesAtual(new Date(mesAtual.getTime() + direcao * 24 * 60 * 60 * 1000));
    }
  };

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
      const visitasData = await visitaService.getAll();
      setVisitas(visitasData || []);
      alert('Evento adicionado!');
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Erro ao salvar evento');
    }
  };

  // Renderizar eventos de um dia (para visualização mês)
  const renderEventosDoDia = (dataStr: string, limite: number = 3) => {
    const eventosHoje = getEventosDoDia(dataStr);
    return (
      <div className="space-y-0.5 mt-1">
        {eventosHoje.slice(0, limite).map(evento => {
          const cor = getCorUsuario(evento.usuario);
          return (
            <div
              key={evento.id}
              className={`text-[10px] px-1 py-0.5 rounded truncate ${cor.bg} text-white`}
              title={`${evento.usuario}: ${evento.descricao} - ${evento.contrato}`}
            >
              <span className="font-bold">{evento.usuario.split(' ')[0]}</span>
              {': '}
              {evento.descricao.length > 12 ? evento.descricao.substring(0, 12) + '...' : evento.descricao}
            </div>
          );
        })}
        {eventosHoje.length > limite && (
          <div className="text-[10px] text-gray-400 text-center">
            +{eventosHoje.length - limite} mais
          </div>
        )}
      </div>
    );
  };

  // Renderizar visualização do dia
  const renderVisualizacaoDia = () => {
    const dataStr = mesAtual.toISOString().split('T')[0];
    const eventosHoje = getEventosDoDia(dataStr);

    return (
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white">
          {mesAtual.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </h3>
        {eventosHoje.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Nenhum evento neste dia</p>
        ) : (
          <div className="space-y-2">
            {eventosHoje.map(evento => {
              const cor = getCorUsuario(evento.usuario);
              return (
                <div key={evento.id} className={`p-3 rounded-lg border-l-4 bg-slate-700 ${cor.border}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${cor.bg} flex items-center justify-center text-white font-bold text-sm`}>
                      {evento.usuario.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-bold ${cor.text}`}>{evento.usuario}</p>
                      <p className="text-white">{evento.descricao}</p>
                      <p className="text-sm text-gray-400">{evento.contrato}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Renderizar visualização da semana
  const renderVisualizacaoSemana = () => {
    const inicioSemana = new Date(mesAtual);
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());

    const diasSemana = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(dia.getDate() + i);
      diasSemana.push(dia);
    }

    return (
      <div>
        <div className="grid grid-cols-7 gap-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
            <div key={d} className="text-center text-sm text-gray-400 py-2 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map(dia => {
            const dataStr = dia.toISOString().split('T')[0];
            const isHoje = dia.toDateString() === new Date().toDateString();
            const eventosHoje = getEventosDoDia(dataStr);

            return (
              <div
                key={dataStr}
                className={`min-h-[200px] p-2 rounded-lg border ${
                  isHoje ? 'bg-emerald-500/20 border-emerald-500' : 'bg-slate-700 border-slate-600'
                }`}
              >
                <div className={`text-sm font-bold mb-2 ${isHoje ? 'text-emerald-400' : 'text-white'}`}>
                  {dia.getDate()}
                </div>
                <div className="space-y-1">
                  {eventosHoje.map(evento => {
                    const cor = getCorUsuario(evento.usuario);
                    return (
                      <div key={evento.id} className={`text-xs p-1 rounded ${cor.bg} text-white`}>
                        <span className="font-bold">{evento.usuario.split(' ')[0]}</span>
                        <br />
                        {evento.descricao.substring(0, 15)}...
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar visualização do mês
  const renderVisualizacaoMes = () => (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
          <div key={d} className="text-center text-sm text-gray-400 py-2 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {dias.map((cell, index) => {
          if (cell.dia === 0) {
            return <div key={`empty-${index}`} className="h-24 bg-slate-900/50 rounded-lg" />;
          }

          const eventosHoje = getEventosDoDia(cell.data!);

          return (
            <div
              key={cell.dia}
              onClick={() => {
                setDiaSelecionado(cell.data);
                setMesAtual(new Date(cell.data + 'T12:00:00'));
                setVisualizacao('dia');
              }}
              className={`h-24 p-1 rounded-lg border cursor-pointer hover:border-blue-500 transition-colors overflow-hidden ${
                cell.isHoje
                  ? 'bg-emerald-500/20 border-emerald-500'
                  : 'bg-slate-700 border-slate-600'
              }`}
            >
              <div className={`text-sm font-bold ${cell.isHoje ? 'text-emerald-400' : 'text-white'}`}>
                {cell.dia}
              </div>
              {renderEventosDoDia(cell.data!, 2)}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Renderizar visualização do ano
  const renderVisualizacaoAno = () => {
    const meses = [];
    for (let m = 0; m < 12; m++) {
      meses.push(new Date(mesAtual.getFullYear(), m, 1));
    }

    return (
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {meses.map(mes => {
          const nomeMes = mes.toLocaleDateString('pt-BR', { month: 'short' });
          const eventosDoMes = eventosFiltrados.filter(e => {
            const dataEvento = new Date(e.data + 'T12:00:00');
            return dataEvento.getMonth() === mes.getMonth() && dataEvento.getFullYear() === mes.getFullYear();
          });

          return (
            <div
              key={mes.getMonth()}
              onClick={() => {
                setMesAtual(mes);
                setVisualizacao('mes');
              }}
              className="p-4 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors"
            >
              <h4 className="text-white font-bold capitalize mb-2">{nomeMes}</h4>
              <p className="text-2xl font-bold text-blue-400">{eventosDoMes.length}</p>
              <p className="text-xs text-gray-400">eventos</p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      {/* Header com navegação */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navegar(-1)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold text-white capitalize">
          {visualizacao === 'ano'
            ? mesAtual.getFullYear()
            : visualizacao === 'dia'
            ? mesAtual.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
            : mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={() => navegar(1)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Filtros de visualização */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['dia', 'semana', 'mes', 'ano'] as const).map(v => (
          <button
            key={v}
            onClick={() => setVisualizacao(v)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              visualizacao === v ? 'bg-blue-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Filtros de tipo */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFiltroTipo('todos')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtroTipo === 'todos' ? 'bg-white text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFiltroTipo('implantacao')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtroTipo === 'implantacao' ? 'bg-pink-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          Implantacao
        </button>
        <button
          onClick={() => setFiltroTipo('supervisao')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtroTipo === 'supervisao' ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          Supervisao
        </button>
      </div>

      {/* Legenda de usuários */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        {Object.entries(CORES_USUARIOS).map(([nome, cor]) => (
          <div key={nome} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${cor.bg}`} />
            <span className="text-gray-400 capitalize">{nome}</span>
          </div>
        ))}
      </div>

      {/* Conteúdo do calendário */}
      {visualizacao === 'dia' && renderVisualizacaoDia()}
      {visualizacao === 'semana' && renderVisualizacaoSemana()}
      {visualizacao === 'mes' && renderVisualizacaoMes()}
      {visualizacao === 'ano' && renderVisualizacaoAno()}

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
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={salvarEvento} className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
