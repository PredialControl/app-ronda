import { useState } from 'react';
import { ItemRelevante } from '@/types';
import { itemRelevanteService } from '@/lib/supabaseService';
import { Plus, X, Trash2 } from 'lucide-react';

interface ItensRelevantesViewProps {
  contratoNome: string;
  itens: ItemRelevante[];
  onRefresh: () => void;
}

export function ItensRelevantesView({ contratoNome, itens, onRefresh }: ItensRelevantesViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [itemEditando, setItemEditando] = useState<ItemRelevante | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'concluido'>('todos');
  const [filtroMes, setFiltroMes] = useState<string>('todos');

  const mesesDisponiveis = [...new Set(itens.map(item => {
    const data = new Date(item.data_abertura);
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
  }))].sort().reverse();

  const itensFiltrados = itens.filter(item => {
    const passaStatus = filtroStatus === 'todos' || item.status === filtroStatus;
    const passaMes = filtroMes === 'todos' || item.data_abertura.startsWith(filtroMes);
    return passaStatus && passaMes;
  }).sort((a, b) => new Date(b.data_abertura).getTime() - new Date(a.data_abertura).getTime());

  const handleNovoItem = () => { setItemEditando(null); setShowModal(true); };
  const handleEditarItem = (item: ItemRelevante) => { setItemEditando(item); setShowModal(true); };

  const handleSalvarItem = async (dados: { titulo: string; parecer: string }) => {
    try {
      if (itemEditando) {
        await itemRelevanteService.update(itemEditando.id, dados);
      } else {
        await itemRelevanteService.create({
          contrato_nome: contratoNome,
          titulo: dados.titulo,
          parecer: dados.parecer,
          data_abertura: new Date().toISOString().split('T')[0],
          responsabilidade: 'a_definir',
          status: 'pendente'
        });
      }
      onRefresh();
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      alert('Erro ao salvar item');
    }
  };

  const handleAlterarStatus = async (item: ItemRelevante) => {
    const novoStatus = item.status === 'pendente' ? 'concluido' : 'pendente';
    try {
      await itemRelevanteService.updateStatus(item.id, novoStatus);
      onRefresh();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleDeletarItem = async (id: string) => {
    if (confirm('Excluir este item?')) {
      try {
        await itemRelevanteService.delete(id);
        onRefresh();
        setShowModal(false);
      } catch (error) {
        console.error('Erro ao deletar item:', error);
      }
    }
  };

  const formatarMes = (mesAno: string) => {
    const [ano, mes] = mesAno.split('-');
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[parseInt(mes) - 1]}/${ano}`;
  };

  const totalPendentes = itens.filter(i => i.status === 'pendente').length;
  const totalConcluidos = itens.filter(i => i.status === 'concluido').length;

  return (
    <div className="p-6 bg-white min-h-screen itens-relevantes-page">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold m-0" style={{color: '#000000'}}>Itens Relevantes</h1>
          <p className="text-sm mt-1 m-0" style={{color: '#374151'}}>{contratoNome}</p>
        </div>
        <button
          onClick={handleNovoItem}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 rounded-lg font-bold text-sm cursor-pointer border-none hover:bg-blue-700 texto-branco"
        >
          <Plus size={20} />
          Novo Item
        </button>
      </div>

      {/* Resumo */}
      <div className="flex gap-4 mb-6">
        <div className="px-5 py-3 bg-red-600 rounded-lg texto-branco">
          <span className="font-bold text-base">{totalPendentes} PENDENTES</span>
        </div>
        <div className="px-5 py-3 bg-green-600 rounded-lg texto-branco">
          <span className="font-bold text-base">{totalConcluidos} CONCLUÍDOS</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-lg" style={{backgroundColor: '#f0f9ff', border: '2px solid #1e3a5f'}}>
        <span className="font-bold text-base flex items-center filtro-label">FILTROS:</span>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as any)}
          className="px-4 py-2.5 rounded-lg font-semibold text-sm filtro-select"
        >
          <option value="todos">Todos Status</option>
          <option value="pendente">Pendentes</option>
          <option value="concluido">Concluídos</option>
        </select>
        <select
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          className="px-4 py-2.5 rounded-lg font-semibold text-sm filtro-select"
        >
          <option value="todos">Todos os Meses</option>
          {mesesDisponiveis.map(mes => (
            <option key={mes} value={mes}>{formatarMes(mes)}</option>
          ))}
        </select>
      </div>

      {/* Lista de Cards */}
      <div>
        {itensFiltrados.length === 0 ? (
          <div className="text-center py-12 text-base" style={{color: '#374151'}}>
            Nenhum item encontrado
          </div>
        ) : (
          itensFiltrados.map(item => (
            <div
              key={item.id}
              onClick={() => handleEditarItem(item)}
              className="rounded-xl p-4 mb-3 cursor-pointer bg-slate-800 border border-slate-700 hover:border-emerald-500/50 transition-all"
              style={{
                borderLeft: item.status === 'pendente' ? '6px solid #dc2626' : '6px solid #16a34a'
              }}
            >
              <div className="flex justify-between items-start gap-4">
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
                  <h3 className="font-semibold text-white text-lg m-0 mb-2">
                    {item.titulo}
                  </h3>
                  {item.parecer && (
                    <p className="text-gray-400 text-sm m-0 mb-2">
                      {item.parecer}
                    </p>
                  )}
                  <span className="text-gray-500 text-xs">
                    {new Date(item.data_abertura).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAlterarStatus(item); }}
                    className={`px-4 py-2 rounded-lg font-bold text-xs border-none cursor-pointer whitespace-nowrap text-white ${
                      item.status === 'pendente' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {item.status === 'pendente' ? 'CONCLUIR' : 'REABRIR'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeletarItem(item.id); }}
                    className="px-4 py-2 rounded-lg font-bold text-xs border-none cursor-pointer bg-red-600/20 text-red-400 hover:bg-red-600/40 flex items-center justify-center gap-1"
                  >
                    <Trash2 size={14} />
                    EXCLUIR
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-4 border-b-2 border-slate-300 flex justify-between items-center">
              <h2 className="font-bold text-xl m-0" style={{color: '#000000'}}>
                {itemEditando ? 'Editar Item' : 'Novo Item'}
              </h2>
              <button onClick={() => setShowModal(false)} className="bg-transparent border-none cursor-pointer p-1">
                <X size={24} color="#000000" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="font-bold text-base block mb-2" style={{color: '#000000'}}>
                  TÍTULO *
                </label>
                <input
                  type="text"
                  id="titulo-desktop"
                  defaultValue={itemEditando?.titulo || ''}
                  placeholder="Digite o título..."
                  className="w-full border-2 border-slate-400 rounded-lg p-3.5 text-base box-border focus:border-blue-500 focus:outline-none"
                  style={{color: '#000000'}}
                />
              </div>
              <div>
                <label className="font-bold text-base block mb-2" style={{color: '#000000'}}>
                  OBSERVAÇÃO
                </label>
                <textarea
                  id="obs-desktop"
                  defaultValue={itemEditando?.parecer || ''}
                  placeholder="Digite a observação..."
                  rows={4}
                  className="w-full border-2 border-slate-400 rounded-lg p-3.5 text-base resize-none box-border focus:border-blue-500 focus:outline-none"
                  style={{color: '#000000'}}
                />
              </div>
            </div>
            <div className="p-4 border-t-2 border-slate-200">
              <button
                onClick={() => {
                  const titulo = (document.getElementById('titulo-desktop') as HTMLInputElement)?.value;
                  const parecer = (document.getElementById('obs-desktop') as HTMLTextAreaElement)?.value;
                  if (!titulo?.trim()) { alert('Informe o título'); return; }
                  handleSalvarItem({ titulo, parecer });
                }}
                className="w-full bg-blue-600 p-4 rounded-lg font-bold text-base border-none cursor-pointer mb-2 hover:bg-blue-700 texto-branco"
              >
                {itemEditando ? 'SALVAR' : 'CRIAR ITEM'}
              </button>
              {itemEditando && (
                <button
                  onClick={() => handleDeletarItem(itemEditando.id)}
                  className="w-full bg-red-50 text-red-600 p-4 rounded-lg font-bold text-base border-2 border-red-600 cursor-pointer hover:bg-red-100"
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
