import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  offlineRondaService,
  offlineAreaTecnicaService,
  offlineFotoRondaService,
  offlineOutroItemService,
  offlineContratoService,
} from '@/lib/offlineFirstService';
import { Contrato, AreaTecnica, FotoRonda, OutroItemCorrigido } from '@/types';
import { AREAS_TECNICAS_PREDEFINIDAS } from '@/data/areasTecnicas';
import {
  ArrowLeft, Camera, Plus, Check, Trash2,
  WifiOff, Wifi, MapPin,
  ClipboardList, Building2,
} from 'lucide-react';

type Step = 'select-contrato' | 'dados-ronda' | 'areas' | 'fotos-pendencias' | 'resumo';

export function ColetaOffline({ onVoltar }: { onVoltar: () => void }) {
  const { isOnline, syncStatus } = useOnlineStatus();

  // Estado geral
  const [step, setStep] = useState<Step>('select-contrato');
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [contratoSelecionado, setContratoSelecionado] = useState<Contrato | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  // Dados da ronda
  const [rondaId, setRondaId] = useState<string | null>(null);
  const [formRonda, setFormRonda] = useState({
    nome: 'VISITA TÉCNICA',
    data: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    tipoVisita: 'RONDA' as 'RONDA' | 'REUNIAO' | 'OUTROS',
    observacoesGerais: '',
  });

  // Áreas técnicas
  const [areas, setAreas] = useState<(AreaTecnica & { ronda_id?: string })[]>([]);
  const [showAddArea, setShowAddArea] = useState(false);
  const [novaArea, setNovaArea] = useState({ nome: '', status: 'ATIVO' as 'ATIVO' | 'EM MANUTENÇÃO' | 'ATENÇÃO', observacoes: '' });

  // Fotos/Pendências
  const [fotos, setFotos] = useState<(FotoRonda & { ronda_id?: string })[]>([]);
  const [itens, setItens] = useState<(OutroItemCorrigido & { ronda_id?: string })[]>([]);
  const [showAddFoto, setShowAddFoto] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputFotoRef = useRef<HTMLInputElement>(null);

  // Carregar contratos
  useEffect(() => {
    offlineContratoService.getAll().then(setContratos).catch(console.error);
  }, []);

  // Mostrar mensagem temporária
  function showMsg(msg: string) {
    setMensagem(msg);
    setTimeout(() => setMensagem(null), 3000);
  }

  // Comprimir foto capturada
  async function compressPhoto(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const maxW = 1200;
        if (width > maxW) {
          height = (height * maxW) / width;
          width = maxW;
        }
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  }

  // ============================================
  // Step 1: Selecionar contrato
  // ============================================
  function renderSelectContrato() {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Selecionar Condomínio
        </h2>
        {contratos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <WifiOff className="w-8 h-8 mx-auto mb-2" />
            <p>Nenhum contrato disponível.</p>
            <p className="text-sm">Conecte-se à internet para carregar os contratos.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contratos.map(c => (
              <button
                key={c.id}
                className="w-full text-left p-4 rounded-lg border-2 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                onClick={() => {
                  setContratoSelecionado(c);
                  setStep('dados-ronda');
                }}
              >
                <div className="font-semibold text-sm">{c.nome}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {c.endereco}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // Step 2: Dados da ronda
  // ============================================
  function renderDadosRonda() {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Dados da Visita</h2>

        <div>
          <Label className="text-sm font-medium">Tipo de Visita</Label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {(['RONDA', 'REUNIAO', 'OUTROS'] as const).map(tipo => (
              <button
                key={tipo}
                className={`py-2 px-3 rounded-lg text-xs font-medium border-2 transition-colors ${
                  formRonda.tipoVisita === tipo
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'
                }`}
                onClick={() => {
                  let nome = formRonda.nome;
                  if (tipo === 'RONDA') nome = 'VISITA TÉCNICA';
                  else if (tipo === 'REUNIAO') nome = 'REUNIÃO DE ALINHAMENTO';
                  setFormRonda(prev => ({ ...prev, tipoVisita: tipo, nome }));
                }}
              >
                {tipo === 'RONDA' ? 'Ronda' : tipo === 'REUNIAO' ? 'Reunião' : 'Outros'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Nome da Visita</Label>
          <Input
            value={formRonda.nome}
            onChange={e => setFormRonda(prev => ({ ...prev, nome: e.target.value }))}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium">Data</Label>
            <Input
              type="date"
              value={formRonda.data}
              onChange={e => setFormRonda(prev => ({ ...prev, data: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Hora</Label>
            <Input
              type="time"
              value={formRonda.hora}
              onChange={e => setFormRonda(prev => ({ ...prev, hora: e.target.value }))}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Observações Gerais</Label>
          <Textarea
            value={formRonda.observacoesGerais}
            onChange={e => setFormRonda(prev => ({ ...prev, observacoesGerais: e.target.value }))}
            placeholder="Observações da visita..."
            className="mt-1"
            rows={3}
          />
        </div>

        <Button
          className="w-full"
          onClick={async () => {
            if (!formRonda.nome.trim()) {
              showMsg('Informe o nome da visita');
              return;
            }
            // Criar ronda (offline ou online)
            setSalvando(true);
            try {
              const ronda = await offlineRondaService.create({
                nome: formRonda.nome,
                contrato: contratoSelecionado!.nome,
                data: formRonda.data,
                hora: formRonda.hora,
                tipoVisita: formRonda.tipoVisita,
                responsavel: '',
                observacoesGerais: formRonda.observacoesGerais,
                areasTecnicas: [],
                fotosRonda: [],
                outrosItensCorrigidos: [],
              });
              setRondaId(ronda.id);
              showMsg('Visita criada com sucesso!');
              setStep('areas');
            } catch (err) {
              showMsg('Erro ao criar visita');
              console.error(err);
            } finally {
              setSalvando(false);
            }
          }}
          disabled={salvando}
        >
          {salvando ? 'Criando...' : 'Continuar →'}
        </Button>
      </div>
    );
  }

  // ============================================
  // Step 3: Áreas Técnicas
  // ============================================
  function renderAreas() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Áreas Técnicas</h2>
          <span className="text-xs text-gray-500">{areas.length} área(s)</span>
        </div>

        {/* Lista de áreas adicionadas */}
        {areas.map((area, i) => (
          <div key={area.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{area.nome}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  area.status === 'ATIVO' ? 'bg-green-100 text-green-700' :
                  area.status === 'EM MANUTENÇÃO' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {area.status}
                </span>
                <button
                  onClick={() => {
                    offlineAreaTecnicaService.delete(area.id);
                    setAreas(prev => prev.filter((_, idx) => idx !== i));
                  }}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {area.observacoes && (
              <p className="text-xs text-gray-500">{area.observacoes}</p>
            )}
            {area.foto && (
              <img src={area.foto} alt="" className="w-16 h-16 object-cover rounded" />
            )}
          </div>
        ))}

        {/* Adicionar área */}
        {showAddArea ? (
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-3 space-y-3">
            <div>
              <Label className="text-xs font-medium">Nome da Área</Label>
              <select
                className="w-full mt-1 border rounded-lg p-2 text-sm"
                value={novaArea.nome}
                onChange={e => setNovaArea(prev => ({ ...prev, nome: e.target.value }))}
              >
                <option value="">Selecione ou digite...</option>
                {AREAS_TECNICAS_PREDEFINIDAS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <Input
                placeholder="Ou digite um nome personalizado"
                value={novaArea.nome}
                onChange={e => setNovaArea(prev => ({ ...prev, nome: e.target.value }))}
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Status</Label>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {(['ATIVO', 'EM MANUTENÇÃO', 'ATENÇÃO'] as const).map(s => (
                  <button
                    key={s}
                    className={`py-1.5 px-2 rounded text-xs font-medium border transition-colors ${
                      novaArea.status === s
                        ? s === 'ATIVO' ? 'border-green-500 bg-green-50 text-green-700'
                          : s === 'EM MANUTENÇÃO' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-500'
                    }`}
                    onClick={() => setNovaArea(prev => ({ ...prev, status: s }))}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium">Observações</Label>
              <Textarea
                value={novaArea.observacoes}
                onChange={e => setNovaArea(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={2}
                className="mt-1 text-sm"
              />
            </div>

            {/* Foto da área */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const compressed = await compressPhoto(file);
                    // Salvar área com foto
                    const area = await offlineAreaTecnicaService.create({
                      ronda_id: rondaId!,
                      nome: novaArea.nome,
                      status: novaArea.status,
                      contrato: contratoSelecionado!.nome,
                      endereco: contratoSelecionado!.endereco,
                      data: formRonda.data,
                      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                      foto: compressed,
                      observacoes: novaArea.observacoes,
                    });
                    setAreas(prev => [...prev, area]);
                    setNovaArea({ nome: '', status: 'ATIVO', observacoes: '' });
                    setShowAddArea(false);
                    showMsg('Área adicionada!');
                  } catch (err) {
                    console.error(err);
                    showMsg('Erro ao processar foto');
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-2" /> Tirar Foto da Área
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={async () => {
                  if (!novaArea.nome.trim()) {
                    showMsg('Informe o nome da área');
                    return;
                  }
                  const area = await offlineAreaTecnicaService.create({
                    ronda_id: rondaId!,
                    nome: novaArea.nome,
                    status: novaArea.status,
                    contrato: contratoSelecionado!.nome,
                    endereco: contratoSelecionado!.endereco,
                    data: formRonda.data,
                    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    foto: null,
                    observacoes: novaArea.observacoes,
                  });
                  setAreas(prev => [...prev, area]);
                  setNovaArea({ nome: '', status: 'ATIVO', observacoes: '' });
                  setShowAddArea(false);
                  showMsg('Área adicionada!');
                }}
              >
                <Check className="w-4 h-4 mr-1" /> Salvar sem Foto
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddArea(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setShowAddArea(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Adicionar Área Técnica
          </Button>
        )}

        <Button className="w-full" onClick={() => setStep('fotos-pendencias')}>
          Continuar para Pendências →
        </Button>
      </div>
    );
  }

  // ============================================
  // Step 4: Fotos e Pendências
  // ============================================
  const [novaFoto, setNovaFoto] = useState({
    local: '',
    pendencia: '',
    especialidade: 'CIVIL',
    responsavel: 'CONDOMÍNIO' as 'CONSTRUTORA' | 'CONDOMÍNIO',
    observacoes: '',
    criticidade: 'Média' as 'Baixa' | 'Média' | 'Alta',
    fotoData: '' as string,
  });

  const [novoItem, setNovoItem] = useState({
    nome: '',
    descricao: '',
    local: '',
    tipo: 'CIVIL' as OutroItemCorrigido['tipo'],
    prioridade: 'MÉDIA' as OutroItemCorrigido['prioridade'],
    status: 'PENDENTE' as OutroItemCorrigido['status'],
    responsavel: '',
    observacoes: '',
    categoria: 'CHAMADO' as 'CHAMADO' | 'CORRIGIDO',
    fotos: [] as string[],
  });

  function renderFotosPendencias() {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Fotos e Pendências</h2>

        {/* Fotos de registro */}
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Camera className="w-4 h-4" />
            Fotos de Registro ({fotos.length})
          </h3>

          {fotos.map((foto, i) => (
            <div key={foto.id} className="border rounded-lg p-2 mb-2 flex gap-2">
              {foto.foto && (
                <img src={foto.foto} alt="" className="w-16 h-16 object-cover rounded flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{foto.local}</div>
                <div className="text-xs text-gray-500 truncate">{foto.pendencia}</div>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  foto.criticidade === 'Alta' || foto.criticidade === 'ALTA' ? 'bg-red-100 text-red-700' :
                  foto.criticidade === 'Média' || foto.criticidade === 'MÉDIA' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {foto.criticidade}
                </span>
              </div>
              <button onClick={() => {
                offlineFotoRondaService.delete(foto.id);
                setFotos(prev => prev.filter((_, idx) => idx !== i));
              }} className="text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {showAddFoto ? (
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-3 space-y-3">
              <input
                ref={fileInputFotoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const compressed = await compressPhoto(file);
                  setNovaFoto(prev => ({ ...prev, fotoData: compressed }));
                }}
              />
              <Button variant="outline" size="sm" className="w-full" onClick={() => fileInputFotoRef.current?.click()}>
                <Camera className="w-4 h-4 mr-2" />
                {novaFoto.fotoData ? 'Trocar Foto' : 'Tirar Foto'}
              </Button>
              {novaFoto.fotoData && (
                <img src={novaFoto.fotoData} alt="" className="w-24 h-24 object-cover rounded mx-auto" />
              )}

              <Input placeholder="Local" value={novaFoto.local} onChange={e => setNovaFoto(prev => ({ ...prev, local: e.target.value }))} className="text-sm" />
              <Input placeholder="Pendência / Descrição" value={novaFoto.pendencia} onChange={e => setNovaFoto(prev => ({ ...prev, pendencia: e.target.value }))} className="text-sm" />

              <div className="grid grid-cols-2 gap-2">
                <select className="border rounded p-1.5 text-xs" value={novaFoto.especialidade} onChange={e => setNovaFoto(prev => ({ ...prev, especialidade: e.target.value }))}>
                  {['CIVIL', 'ELÉTRICA', 'HIDRÁULICA', 'MECÂNICA'].map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <select className="border rounded p-1.5 text-xs" value={novaFoto.responsavel} onChange={e => setNovaFoto(prev => ({ ...prev, responsavel: e.target.value as any }))}>
                  <option value="CONDOMÍNIO">CONDOMÍNIO</option>
                  <option value="CONSTRUTORA">CONSTRUTORA</option>
                </select>
              </div>

              <div>
                <Label className="text-xs">Criticidade</Label>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {(['Baixa', 'Média', 'Alta'] as const).map(c => (
                    <button key={c} className={`py-1 text-xs rounded border ${
                      novaFoto.criticidade === c
                        ? c === 'Alta' ? 'border-red-500 bg-red-50 text-red-700'
                          : c === 'Média' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200'
                    }`} onClick={() => setNovaFoto(prev => ({ ...prev, criticidade: c }))}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea placeholder="Observações" value={novaFoto.observacoes} onChange={e => setNovaFoto(prev => ({ ...prev, observacoes: e.target.value }))} rows={2} className="text-sm" />

              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={async () => {
                  if (!novaFoto.local.trim()) { showMsg('Informe o local'); return; }
                  const result = await offlineFotoRondaService.create({
                    ronda_id: rondaId!,
                    foto: novaFoto.fotoData,
                    local: novaFoto.local,
                    pendencia: novaFoto.pendencia,
                    especialidade: novaFoto.especialidade,
                    responsavel: novaFoto.responsavel,
                    observacoes: novaFoto.observacoes,
                    data: formRonda.data,
                    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    criticidade: novaFoto.criticidade,
                  } as any);
                  setFotos(prev => [...prev, result]);
                  setNovaFoto({ local: '', pendencia: '', especialidade: 'CIVIL', responsavel: 'CONDOMÍNIO', observacoes: '', criticidade: 'Média', fotoData: '' });
                  setShowAddFoto(false);
                  showMsg('Foto adicionada!');
                }}>
                  <Check className="w-4 h-4 mr-1" /> Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddFoto(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setShowAddFoto(true)}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar Foto
            </Button>
          )}
        </div>

        {/* Itens / Pendências */}
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <ClipboardList className="w-4 h-4" />
            Itens / Pendências ({itens.length})
          </h3>

          {itens.map((item, i) => (
            <div key={item.id} className="border rounded-lg p-2 mb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{item.nome || item.descricao}</span>
                <button onClick={() => {
                  offlineOutroItemService.delete(item.id);
                  setItens(prev => prev.filter((_, idx) => idx !== i));
                }} className="text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-gray-500">{item.local} - {item.tipo}</div>
              <div className="flex gap-1 mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  item.prioridade === 'ALTA' ? 'bg-red-100 text-red-700' :
                  item.prioridade === 'MÉDIA' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>{item.prioridade}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100">{item.status}</span>
              </div>
            </div>
          ))}

          {showAddItem ? (
            <div className="border-2 border-dashed border-orange-300 rounded-lg p-3 space-y-3">
              <Input placeholder="Nome do item" value={novoItem.nome} onChange={e => setNovoItem(prev => ({ ...prev, nome: e.target.value }))} className="text-sm" />
              <Textarea placeholder="Descrição" value={novoItem.descricao} onChange={e => setNovoItem(prev => ({ ...prev, descricao: e.target.value }))} rows={2} className="text-sm" />
              <Input placeholder="Local" value={novoItem.local} onChange={e => setNovoItem(prev => ({ ...prev, local: e.target.value }))} className="text-sm" />

              <div className="grid grid-cols-2 gap-2">
                <select className="border rounded p-1.5 text-xs" value={novoItem.tipo} onChange={e => setNovoItem(prev => ({ ...prev, tipo: e.target.value as any }))}>
                  {['CIVIL', 'ELÉTRICA', 'HIDRÁULICA', 'MECÂNICA', 'MANUTENÇÃO', 'OUTRO'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select className="border rounded p-1.5 text-xs" value={novoItem.prioridade} onChange={e => setNovoItem(prev => ({ ...prev, prioridade: e.target.value as any }))}>
                  {['BAIXA', 'MÉDIA', 'ALTA'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select className="border rounded p-1.5 text-xs" value={novoItem.status} onChange={e => setNovoItem(prev => ({ ...prev, status: e.target.value as any }))}>
                  {['PENDENTE', 'EM ANDAMENTO', 'CONCLUÍDO'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="border rounded p-1.5 text-xs" value={novoItem.categoria} onChange={e => setNovoItem(prev => ({ ...prev, categoria: e.target.value as any }))}>
                  <option value="CHAMADO">CHAMADO</option>
                  <option value="CORRIGIDO">CORRIGIDO</option>
                </select>
              </div>

              <Input placeholder="Responsável" value={novoItem.responsavel} onChange={e => setNovoItem(prev => ({ ...prev, responsavel: e.target.value }))} className="text-sm" />
              <Textarea placeholder="Observações" value={novoItem.observacoes} onChange={e => setNovoItem(prev => ({ ...prev, observacoes: e.target.value }))} rows={2} className="text-sm" />

              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={async () => {
                  if (!novoItem.local.trim()) { showMsg('Informe o local'); return; }
                  const result = await offlineOutroItemService.create({
                    ronda_id: rondaId!,
                    nome: novoItem.nome || `Item - ${novoItem.local}`,
                    descricao: novoItem.descricao,
                    local: novoItem.local,
                    tipo: novoItem.tipo,
                    prioridade: novoItem.prioridade,
                    status: novoItem.status,
                    contrato: contratoSelecionado!.nome,
                    endereco: contratoSelecionado!.endereco,
                    responsavel: novoItem.responsavel,
                    observacoes: novoItem.observacoes,
                    foto: null,
                    fotos: novoItem.fotos,
                    categoria: novoItem.categoria,
                    data: formRonda.data,
                    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                  });
                  setItens(prev => [...prev, result]);
                  setNovoItem({ nome: '', descricao: '', local: '', tipo: 'CIVIL', prioridade: 'MÉDIA', status: 'PENDENTE', responsavel: '', observacoes: '', categoria: 'CHAMADO', fotos: [] });
                  setShowAddItem(false);
                  showMsg('Item adicionado!');
                }}>
                  <Check className="w-4 h-4 mr-1" /> Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddItem(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setShowAddItem(true)}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar Item/Pendência
            </Button>
          )}
        </div>

        <Button className="w-full" onClick={() => setStep('resumo')}>
          Ver Resumo →
        </Button>
      </div>
    );
  }

  // ============================================
  // Step 5: Resumo
  // ============================================
  function renderResumo() {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          Resumo da Coleta
        </h2>

        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="text-sm"><strong>Condomínio:</strong> {contratoSelecionado?.nome}</div>
          <div className="text-sm"><strong>Visita:</strong> {formRonda.nome}</div>
          <div className="text-sm"><strong>Data:</strong> {formRonda.data} às {formRonda.hora}</div>
          <div className="text-sm"><strong>Tipo:</strong> {formRonda.tipoVisita}</div>
          {formRonda.observacoesGerais && (
            <div className="text-sm"><strong>Obs:</strong> {formRonda.observacoesGerais}</div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">{areas.length}</div>
            <div className="text-xs text-gray-600">Áreas</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-600">{fotos.length}</div>
            <div className="text-xs text-gray-600">Fotos</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-600">{itens.length}</div>
            <div className="text-xs text-gray-600">Pendências</div>
          </div>
        </div>

        {!isOnline && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
            <WifiOff className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>Dados salvos localmente. Serão sincronizados quando a internet voltar.</span>
          </div>
        )}

        {isOnline && syncStatus.pendingCount === 0 && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>Todos os dados foram sincronizados com o servidor.</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => {
            // Nova coleta
            setStep('select-contrato');
            setContratoSelecionado(null);
            setRondaId(null);
            setAreas([]);
            setFotos([]);
            setItens([]);
            setFormRonda({
              nome: 'VISITA TÉCNICA',
              data: new Date().toISOString().split('T')[0],
              hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              tipoVisita: 'RONDA',
              observacoesGerais: '',
            });
          }}>
            <Plus className="w-4 h-4 mr-1" /> Nova Coleta
          </Button>
          <Button className="flex-1" onClick={onVoltar}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao App
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // Layout principal
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {step !== 'select-contrato' && (
              <button
                onClick={() => {
                  const steps: Step[] = ['select-contrato', 'dados-ronda', 'areas', 'fotos-pendencias', 'resumo'];
                  const currentIdx = steps.indexOf(step);
                  if (currentIdx > 0) setStep(steps[currentIdx - 1]);
                }}
                className="p-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="font-bold text-base">Coleta em Campo</h1>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-500" />
            )}
            {syncStatus.pendingCount > 0 && (
              <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                {syncStatus.pendingCount}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex h-1">
          {['select-contrato', 'dados-ronda', 'areas', 'fotos-pendencias', 'resumo'].map((s, i) => {
            const steps: Step[] = ['select-contrato', 'dados-ronda', 'areas', 'fotos-pendencias', 'resumo'];
            const currentIdx = steps.indexOf(step);
            return (
              <div
                key={s}
                className={`flex-1 ${i <= currentIdx ? 'bg-blue-500' : 'bg-gray-200'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Mensagem toast */}
      {mensagem && (
        <div className="fixed top-16 left-4 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm text-center animate-in fade-in">
          {mensagem}
        </div>
      )}

      {/* Conteúdo */}
      <div className="p-4 pb-20 max-w-lg mx-auto">
        {step === 'select-contrato' && renderSelectContrato()}
        {step === 'dados-ronda' && renderDadosRonda()}
        {step === 'areas' && renderAreas()}
        {step === 'fotos-pendencias' && renderFotosPendencias()}
        {step === 'resumo' && renderResumo()}
      </div>
    </div>
  );
}
