import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Filter, X, Save, Trash2, Camera, MessageSquare,
  Building2, Clock, AlertCircle, HardHat,
  Calendar, User as UserIcon, Edit2, RefreshCw
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

type StatusFilter = ChamadoStatus | 'todos';

const STATUS_CONFIG: Record<ChamadoStatus, { label: string; bg: string; text: string; dot: string }> = {
  itens_apontados:     { label: 'Itens Apontados',     bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  em_andamento:        { label: 'Em andamento',        bg: 'bg-yellow-50',  text: 'text-yellow-700',  dot: 'bg-yellow-500' },
  improcedente:        { label: 'Improcedente',        bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500' },
  aguardando_vistoria: { label: 'Aguardando vistoria', bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500' },
  concluido:           { label: 'Concluído',           bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500' },
  f_indevido:          { label: 'F. Indevido',         bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500' },
};

const UPDATE_TYPE_CONFIG: Record<ChamadoUpdateType, { label: string; icon: string; cls: string }> = {
  construtora: { label: 'Construtora', icon: '🏗️', cls: 'bg-orange-50 border-orange-200 text-orange-800' },
  condominio:  { label: 'Condomínio',  icon: '🏢', cls: 'bg-blue-50 border-blue-200 text-blue-800' },
  engenharia:  { label: 'Engenharia',  icon: '⚙️', cls: 'bg-purple-50 border-purple-200 text-purple-800' },
};

interface ChamadosMenuProps {
  onNavigate?: (destination: string) => void;
}

export function ChamadosMenu({ onNavigate: _onNavigate }: ChamadosMenuProps) {
  const usuario = authService.getUsuarioAtual();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(false);

  const [contratoFiltro, setContratoFiltro] = useState<string>('todos');
  const [statusFiltro, setStatusFiltro] = useState<StatusFilter>('todos');
  const [busca, setBusca] = useState('');
  const [responsavelFiltro, setResponsavelFiltro] = useState<string>('todos');

  const [showNovo, setShowNovo] = useState(false);
  const [detalhe, setDetalhe] = useState<Chamado | null>(null);
  const [addUpdateFor, setAddUpdateFor] = useState<Chamado | null>(null);

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
      } catch (e) {
        console.warn(e);
      }
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

  const filtrados = useMemo(() => {
    return chamados.filter(c => {
      if (contratoFiltro !== 'todos' && c.contratoId !== contratoFiltro) return false;
      if (statusFiltro !== 'todos' && c.status !== statusFiltro) return false;
      if (responsavelFiltro !== 'todos' && (c.responsavel || '') !== responsavelFiltro) return false;
      if (busca.trim()) {
        const q = busca.trim().toLowerCase();
        const hay = `${c.descricao} ${c.local} ${c.numeroTicket || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [chamados, contratoFiltro, statusFiltro, responsavelFiltro, busca]);

  const stats = useMemo(() => {
    const base: Record<ChamadoStatus, number> = {
      itens_apontados: 0, em_andamento: 0, improcedente: 0,
      aguardando_vistoria: 0, concluido: 0, f_indevido: 0,
    };
    const fonte = chamados.filter(c =>
      (contratoFiltro === 'todos' || c.contratoId === contratoFiltro)
    );
    fonte.forEach(c => { base[c.status] = (base[c.status] || 0) + 1; });
    return { counts: base, total: fonte.length };
  }, [chamados, contratoFiltro]);

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
    } else {
      alert('Erro ao criar chamado.');
    }
  };

  const atualizarChamado = async (id: string, patch: Partial<Chamado>) => {
    const ok = await chamadoService.update(id, patch);
    if (ok) {
      setChamados(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
      if (detalhe?.id === id) setDetalhe({ ...detalhe, ...patch });
    } else {
      alert('Erro ao atualizar.');
    }
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
      type: tipo,
      message: mensagem.trim(),
      createdBy: usuario?.nome || 'Sistema',
    });
    if (ok) {
      await recarregar();
      setAddUpdateFor(null);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 mb-4 border border-gray-200">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Chamados</h2>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie os chamados dos prédios — {stats.total} total.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={recarregar} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Recarregar
            </Button>
            <Button onClick={() => setShowNovo(true)} className="bg-orange-600 hover:bg-orange-700 text-white" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Novo Chamado
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
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

      <div className="bg-white rounded-xl p-3 sm:p-4 mb-4 border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
            <Building2 className="w-3 h-3" /> Prédio
          </label>
          <select value={contratoFiltro} onChange={(e) => setContratoFiltro(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm">
            <option value="todos">Todos os prédios</option>
            {contratos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
            <HardHat className="w-3 h-3" /> Responsável
          </label>
          <select value={responsavelFiltro} onChange={(e) => setResponsavelFiltro(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm">
            <option value="todos">Todos</option>
            <option value="Construtora">Construtora</option>
            <option value="Condominio">Condomínio</option>
            <option value="">Sem responsável</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
            <Search className="w-3 h-3" /> Buscar
          </label>
          <Input placeholder="Descrição, local ou número do ticket" value={busca}
            onChange={(e) => setBusca(e.target.value)} className="text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          Carregando chamados...
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <Filter className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">Nenhum chamado encontrado com os filtros atuais.</p>
          <Button onClick={() => setShowNovo(true)} variant="outline" className="mt-3">
            <Plus className="w-4 h-4 mr-1" /> Criar o primeiro
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(c => {
            const cfg = STATUS_CONFIG[c.status];
            const prazoAtrasado = c.prazo && new Date(c.prazo) < new Date() && c.status !== 'concluido';
            return (
              <div key={c.id} onClick={() => setDetalhe(c)}
                className="bg-white rounded-lg border border-gray-200 p-3 hover:border-orange-300 hover:shadow-sm cursor-pointer transition-all">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>{cfg.label}
                      </span>
                      {c.responsavel && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          <HardHat className="w-3 h-3" /> {c.responsavel}
                        </span>
                      )}
                      {c.numeroTicket && <span className="text-xs text-gray-500">#{c.numeroTicket}</span>}
                      {prazoAtrasado && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <AlertCircle className="w-3 h-3" /> Atrasado
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{c.descricao}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {contratoNome(c.contratoId)}
                      </span>
                      <span>•</span><span>{c.local}</span>
                      {c.prazo && (
                        <>
                          <span>•</span>
                          <span className={`flex items-center gap-1 ${prazoAtrasado ? 'text-red-600 font-medium' : ''}`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(c.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        </>
                      )}
                      {c.atualizacoes.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {c.atualizacoes.length}</span>
                        </>
                      )}
                      {c.fotoUrls.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Camera className="w-3 h-3" /> {c.fotoUrls.length}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400 shrink-0">
                    {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNovo && (
        <NovoChamadoModal contratos={contratos}
          defaultContratoId={contratoFiltro === 'todos' ? '' : contratoFiltro}
          onClose={() => setShowNovo(false)} onSalvar={criarChamado} />
      )}
      {detalhe && (
        <DetalheChamadoModal chamado={detalhe}
          contratoNome={contratoNome(detalhe.contratoId)}
          onClose={() => setDetalhe(null)}
          onUpdate={(patch) => atualizarChamado(detalhe.id, patch)}
          onExcluir={() => excluirChamado(detalhe.id)}
          onAddParecer={() => setAddUpdateFor(detalhe)} />
      )}
      {addUpdateFor && (
        <AddParecerModal onClose={() => setAddUpdateFor(null)}
          onSalvar={(tipo, msg) => adicionarParecer(addUpdateFor.id, tipo, msg)} />
      )}
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
            <select value={contratoId} onChange={(e) => setContratoId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 text-sm">
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
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o problema apontado" rows={4}
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
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
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

function DetalheChamadoModal({ chamado, contratoNome, onClose, onUpdate, onExcluir, onAddParecer }: {
  chamado: Chamado; contratoNome: string; onClose: () => void;
  onUpdate: (patch: Partial<Chamado>) => void; onExcluir: () => void; onAddParecer: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [local, setLocal] = useState(chamado.local);
  const [descricao, setDescricao] = useState(chamado.descricao);
  const [status, setStatus] = useState<ChamadoStatus>(chamado.status);
  const [responsavel, setResponsavel] = useState<ChamadoResponsavel>(chamado.responsavel || null);
  const [prazo, setPrazo] = useState(chamado.prazo || '');
  const [numeroTicket, setNumeroTicket] = useState(chamado.numeroTicket || '');
  const isAdmin = authService.getUsuarioAtual()?.is_admin || false;

  const salvarEdicao = () => {
    onUpdate({ local, descricao, status, responsavel, prazo: prazo || null, numeroTicket });
    setEditMode(false);
  };

  const cfg = STATUS_CONFIG[chamado.status];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
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
