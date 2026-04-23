import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlowingCard } from '@/components/ui/glowing-card';
import { Badge } from '@/components/ui/badge';
import { Ronda, Contrato, AreaTecnica } from '@/types';
import { BarChart3, AlertTriangle, Calendar, Wrench, XCircle, User, FileText, Trash2, Plus, X, Building2, Kanban as KanbanIcon, ClipboardCheck, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { laudoService } from '@/lib/laudoService';
import { rondaService, areaTecnicaService, itemRelevanteService } from '@/lib/supabaseService';
import { kanbanEventoService, kanbanItemsService } from '@/lib/supabaseService';

interface DashboardProps {
  contrato: Contrato | null;
  rondas: Ronda[];
  areasTecnicas: AreaTecnica[];
  contratos?: Contrato[];
  onSelectContrato?: (c: Contrato) => void;
}

export function Dashboard({ contrato, rondas, areasTecnicas, contratos, onSelectContrato }: DashboardProps) {
  // Tela "selecione um prédio" quando ainda não há contrato
  if (!contrato) {
    return (
      <div className="space-y-4 sm:space-y-8">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
          <div className="relative p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">Dashboard</h1>
                <p className="mt-1 text-white/90 text-sm sm:text-base">Selecione um prédio para ver os indicadores.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const alvo = contratos?.find(c => c.id === e.target.value);
                    if (alvo && onSelectContrato) onSelectContrato(alvo);
                  }}
                  className="rounded-md bg-white/20 text-white backdrop-blur px-3 py-2 text-sm ring-1 ring-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-all min-w-[260px]"
                >
                  <option value="" className="bg-gray-800">— Selecione o prédio —</option>
                  {(contratos || []).map(c => (
                    <option key={c.id} value={c.id} className="bg-gray-800 text-white">{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">🏢</div>
          <p className="text-lg">Escolha um prédio no seletor acima</p>
          <p className="text-sm mt-2">Os indicadores aparecerão aqui assim que um prédio for selecionado.</p>
        </div>
      </div>
    );
  }
  console.log('🔍 DEBUG DASHBOARD - Contrato:', contrato.nome);
  console.log('🔍 DEBUG DASHBOARD - Total de rondas recebidas:', rondas.length);
  console.log('🔍 DEBUG DASHBOARD - Rondas:', rondas.map(r => ({
    nome: r.nome,
    data: r.data,
    areasTecnicas: r.areasTecnicas?.length || 0,
    fotosRonda: r.fotosRonda?.length || 0
  })));

  // Filtro por PERÍODO (data inicial / final)
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  // Lista de meses (YYYY-MM) tocados pela faixa — pra consultar itens_relevantes_relatorio
  const mesesNaFaixa = useMemo(() => {
    const [ys, ms] = startDate.split('-').map(Number);
    const [ye, me] = endDate.split('-').map(Number);
    const out: string[] = [];
    let y = ys, m = ms;
    while (y < ye || (y === ye && m <= me)) {
      out.push(`${y}-${String(m).padStart(2, '0')}`);
      m++;
      if (m > 12) { m = 1; y++; }
    }
    return out;
  }, [startDate, endDate]);

  // Fallback para código legado que usa selectedMonth (ex: salvar novo item)
  const selectedMonth = mesesNaFaixa[mesesNaFaixa.length - 1] || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // Estados para indicadores de IMPLANTAÇÃO (kanban + laudos)
  const [kanbanStats, setKanbanStats] = useState({
    total: 0,
    aguardando: 0,
    emAndamento: 0,
    emCorrecao: 0,
    finalizados: 0,
  });
  const [laudosStats, setLaudosStats] = useState({ total: 0, vencidos: 0, emAnalise: 0, emDia: 0 });
  const [kanbanItemsList, setKanbanItemsList] = useState<any[]>([]);
  const [loadingCount, setLoadingCount] = useState(0);

  // Load de Itens Relevantes da aba Supervisão
  useEffect(() => {
    if (!contrato) return;
    setLoadingCount(n => n + 1);
    (async () => {
      try {
        const items = await itemRelevanteService.getByContrato(contrato.nome);
        setItensRelevantesSupervisor(items || []);
      } catch (e) {
        console.warn('[Dashboard] erro ao ler itens relevantes:', e);
        setItensRelevantesSupervisor([]);
      } finally {
        setLoadingCount(n => Math.max(0, n - 1));
      }
    })();
  }, [contrato?.id, contrato?.nome]);

  // Fetch direto das rondas do banco com match tolerante (case-insensitive, trim)
  // — evita problemas de grafia do contrato nas rondas salvas
  const [rondasDoContrato, setRondasDoContrato] = useState<Ronda[]>([]);
  const [itensRelevantesSupervisor, setItensRelevantesSupervisor] = useState<any[]>([]);
  useEffect(() => {
    if (!contrato) return;
    setLoadingCount(n => n + 1);
    const load = async () => {
      try {
        // Query direta com colunas mínimas — resiliente caso algumas colunas novas não existam
        const { data: all, error: errRondas } = await supabase
          .from('rondas')
          .select('id, nome, contrato, data, hora, responsavel, observacoes_gerais')
          .order('data', { ascending: false });
        if (errRondas) { console.warn('[Dashboard] erro na query rondas:', errRondas); return; }
        const nomeBusca = (contrato.nome || '').trim().toLowerCase();
        const matched = (all || []).filter((r: any) => (r.contrato || '').trim().toLowerCase() === nomeBusca);
        console.log('[Dashboard] Rondas total no banco:', all.length, '→ do contrato', contrato.nome, ':', matched.length);
        // Carregar áreas técnicas de cada ronda em paralelo para alimentar Status de Equipamentos
        const comAreas = await Promise.all(matched.map(async (r: any) => {
          try {
            const areas = await areaTecnicaService.getByRonda(r.id);
            return { ...r, areasTecnicas: areas || [] };
          } catch (err) {
            console.warn('[Dashboard] falha buscando areas da ronda', r.id, err);
            return r;
          }
        }));
        console.log('[Dashboard] Rondas com areasTecnicas carregadas. Total de areas:',
          comAreas.reduce((acc, r: any) => acc + (r.areasTecnicas?.length || 0), 0));
        setRondasDoContrato(comAreas as Ronda[]);
      } catch (e) {
        console.warn('[Dashboard] erro ao carregar rondas direto:', e);
      } finally {
        setLoadingCount(n => Math.max(0, n - 1));
      }
    };
    load();
  }, [contrato?.id, contrato?.nome]);

  // Auto-sync localStorage -> Supabase uma vez ao abrir o Dashboard
  useEffect(() => {
    if (!contratos || contratos.length === 0) return;
    contratos.forEach(ct => {
      try {
        const raw = localStorage.getItem(`kanban_items_${ct.id}`);
        if (!raw) return;
        const items = JSON.parse(raw);
        if (Array.isArray(items) && items.length > 0) {
          // Sync shadow (datas/status) e full (state completo)
          kanbanEventoService.syncContrato(ct.id, ct.nome, items);
          kanbanItemsService.saveAll(ct.id, items);
        }
      } catch {}
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratos?.length]);

  // Carregar dados de implantação quando mudar contrato
  useEffect(() => {
    if (!contrato) return;
    setLoadingCount(n => n + 1);
    const carregarImplantacao = async () => {
      try {
        // Kanban — preferir kanban_items_full (state completo); fallback para kanban_eventos (shadow)
        let items: any[] = [];
        try {
          const remote = await kanbanItemsService.loadByContrato(contrato.id);
          if (remote && Array.isArray(remote)) items = remote;
        } catch {}
        // Se vazio no kanban_items_full, tentar ler localStorage deste device
        if (items.length === 0) {
          try {
            const raw = localStorage.getItem(`kanban_items_${contrato.id}`);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) items = parsed;
            }
          } catch {}
        }
        console.log('[Dashboard] Kanban items deste contrato:', items.length);
        setKanbanStats({
          total: items.length,
          aguardando: items.filter((it: any) => it.status === 'aguardando').length,
          emAndamento: items.filter((it: any) => it.status === 'em_andamento').length,
          emCorrecao: items.filter((it: any) => it.status === 'em_correcao').length,
          finalizados: items.filter((it: any) => it.status === 'finalizado').length,
        });
      } catch (err) {
        console.warn('Erro ao carregar kanban stats:', err);
      }
      try {
        const laudos = await laudoService.getByContrato(contrato.id);
        setLaudosStats({
          total: laudos.length,
          vencidos: laudos.filter(l => l.status === 'vencidos').length,
          emAnalise: laudos.filter(l => l.status === 'em-analise').length,
          emDia: laudos.filter(l => l.status === 'em-dia').length,
        });
      } catch (err) {
        console.warn('Erro ao carregar laudos stats:', err);
      }
      setLoadingCount(n => Math.max(0, n - 1));
    };
    carregarImplantacao();
  }, [contrato?.id]);

  // Se o mês atual não tiver rondas, usar automaticamente o mês da última ronda
  // Removido useEffect que alterava o mês automaticamente se não houvesse rondas
  // para garantir que o mês atual seja sempre o padrão inicial.

  // Filtrar rondas dentro da faixa de datas selecionada
  const rondasMes = useMemo(() => {
    console.log('🔍 FILTRO RONDAS - período:', startDate, '→', endDate);
    const resultado = rondasDoContrato.filter(ronda => {
      if (!ronda.data) return false;
      return ronda.data >= startDate && ronda.data <= endDate;
    });
    resultado.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    console.log('🔍 FILTRO - Rondas filtradas:', resultado.length);
    return resultado;
  }, [rondasDoContrato, startDate, endDate]);

  // Calcular métricas do dashboard com base no mês selecionado
  const metricas = useMemo(() => {
    console.log('🔄 RECALCULANDO MÉTRICAS - Mês selecionado:', selectedMonth);
    console.log('🔄 Rondas do mês ANTES do cálculo:', rondasMes.length);

    // Itens por criticidade/atenção (ajuste simples baseado no campo pendencia)
    const fotosMes = rondasMes.flatMap(ronda => ronda.fotosRonda || []);
    const itensCriticos = fotosMes.filter(f =>
      String(f.pendencia || '').toUpperCase().includes('URG') ||
      String(f.pendencia || '').toUpperCase() === 'CRÍTICA' ||
      String(f.pendencia || '').toUpperCase() === 'CRITICA'
    );
    // Atenção: considerar Áreas Técnicas com status "ATENÇÃO" no mês selecionado (itens únicos por área)
    const nomesAtencao = new Set<string>();
    console.log('🔍 DEBUG ATENÇÃO - Rondas do mês:', rondasMes.length);
    rondasMes.forEach(r => {
      console.log('🔍 Ronda:', r.nome, 'Data:', r.data, 'Áreas:', r.areasTecnicas?.length || 0);
      (r.areasTecnicas || [])
        .filter(at => {
          const temAtencao = String(at.status || '').toUpperCase().includes('ATEN');
          console.log('🔍 Área:', at.nome, 'Status:', at.status, 'Tem ATENÇÃO?', temAtencao);
          return temAtencao;
        })
        .forEach(at => {
          if (at.nome) {
            console.log('✅ Adicionando área com ATENÇÃO:', at.nome);
            nomesAtencao.add(at.nome);
          }
        });
    });
    const itensAtencao = Array.from(nomesAtencao);
    console.log('🔍 Total de itens de ATENÇÃO únicos:', itensAtencao.length, itensAtencao);

    // Chamados abertos (todas as fotos de ronda são consideradas chamados)
    const chamadosAbertos = fotosMes;

    // Agrupar chamados por especialidade
    const mapaEspecialidade: Record<string, number> = {};
    chamadosAbertos.forEach(f => {
      const esp = (f.especialidade || 'Sem especialidade').trim();
      mapaEspecialidade[esp] = (mapaEspecialidade[esp] || 0) + 1;
    });
    const chamadosPorEspecialidade = Object.entries(mapaEspecialidade)
      .sort((a, b) => b[1] - a[1])
      .map(([especialidade, total]) => ({ especialidade, total }));

    // Lista detalhada de chamados do mês (incluindo itens de outrosItensCorrigidos)
    const chamadosLista = rondasMes
      .sort((a, b) => a.data.localeCompare(b.data))
      .flatMap(r => {
        // Fotos de ronda (TODAS as fotos são chamados)
        const fotosChamados = (r.fotosRonda || [])
          .map(f => ({
            id: `${r.id}-foto-${f.id}`,
            descricao: f.observacoes || f.pendencia || f.local || 'Chamado sem descrição',
            data: f.data || r.data,
            especialidade: f.especialidade || '—',
            responsavel: (f.responsavel || '—').toUpperCase()
          }));

        // Itens de abertura de chamado (outrosItensCorrigidos com categoria CHAMADO)
        const itensChamados = (r.outrosItensCorrigidos || [])
          .filter((item: any) => item.categoria === 'CHAMADO')
          .map((item: any) => ({
            id: `${r.id}-item-${item.id}`,
            descricao: item.descricao || item.observacoes || 'Item de chamado',
            data: item.data || r.data,
            especialidade: item.nome || '—',
            responsavel: (item.responsavel || '—').toUpperCase()
          }));

        return [...fotosChamados, ...itensChamados];
      });

    // Itens corrigidos (tabela de outros_itens_corrigidos)
    const itensCorrigidos = rondasMes
      .flatMap(ronda => ronda.outrosItensCorrigidos || [])
      .filter(i => String(i.status || '').toUpperCase().includes('CONCLU'));

    // Contagem por responsável (Condomínio vs Construtora vs Outros)
    const contagemResponsavel = rondasMes
      .flatMap(r => r.fotosRonda || [])
      .reduce(
        (acc, f) => {
          const resp = (f.responsavel || '').toUpperCase();
          if (resp.includes('CONDOM')) acc.condominio += 1;
          else if (resp.includes('CONSTR')) acc.construtora += 1;
          else acc.outros += 1;
          return acc;
        },
        { condominio: 0, construtora: 0, outros: 0 }
      );

    // Status da última visita de CADA equipamento — usar TODAS as rondas do contrato (não só o período)
    // Para cada equipamento (nome), pegar o status da ronda mais recente que o visitou.
    const statusEquipamentos = (() => {
      const porEquipamento: Record<string, { nome: string; ultimaVisita: string | null; statusUltimaVisita: string; observacoes: string | null; id: string }> = {};

      // Ordenar todas as rondas do MAIS ANTIGO para o MAIS RECENTE, e sobrescrever, assim no final fica o mais recente por equipamento
      const rondasOrdenadas = [...rondasDoContrato].sort((a, b) => a.data.localeCompare(b.data));
      console.log('[Status] Rondas ordenadas (asc):', rondasOrdenadas.map(r => ({data: r.data, areasCount: r.areasTecnicas?.length || 0})));

      rondasOrdenadas.forEach(r => {
        const areasCount = (r.areasTecnicas || []).length;
        const checkCount = ((r as any).checklistItems || []).length;
        console.log('[Status] Processando ronda', r.data, '- areas:', areasCount, '| checklist:', checkCount);
        // 1) Áreas técnicas clássicas
        (r.areasTecnicas || []).forEach(at => {
          const chave = (at.nome || '').trim();
          if (!chave) return;
          porEquipamento[chave] = {
            id: at.id || `${r.id}-${chave}`,
            nome: at.nome,
            ultimaVisita: r.data || null,
            statusUltimaVisita: at.status || 'NÃO VISITADO',
            observacoes: at.observacoes || null,
          };
        });
        // 2) Checklist items (Ronda Semanal/Mensal/Bimestral) - também atualizam o equipamento
        ((r as any).checklistItems || []).forEach((ci: any) => {
          const chave = (ci.tipo || ci.objetivo || '').trim();
          if (!chave) return;
          const statusMap: Record<string, string> = {
            'OK': 'ATIVO',
            'NAO_OK': 'ATENÇÃO',
          };
          porEquipamento[chave] = {
            id: ci.id || `${r.id}-${chave}`,
            nome: chave,
            ultimaVisita: r.data || ci.data || null,
            statusUltimaVisita: statusMap[ci.status] || ci.status || 'NÃO VISITADO',
            observacoes: ci.observacao || null,
          };
        });
      });

      // Também mesclar todas as areasTecnicas do contrato (prop) que talvez não tenham visita ainda
      areasTecnicas.forEach(at => {
        const chave = (at.nome || '').trim();
        if (!chave) return;
        if (!porEquipamento[chave]) {
          porEquipamento[chave] = {
            id: at.id || chave,
            nome: at.nome,
            ultimaVisita: null,
            statusUltimaVisita: 'NÃO VISITADO',
            observacoes: null,
          };
        }
      });

      const resultado = Object.values(porEquipamento).sort((a, b) => a.nome.localeCompare(b.nome));
      console.log('🔍 Status equipamentos (merge todas as rondas):', resultado.length, 'equipamentos');
      return resultado;
    })();

    const metricas = {
      totalRondasMes: rondasMes.length,
      itensCriticos: itensCriticos.length,
      itensAtencao: itensAtencao.length,
      chamadosAbertos: chamadosAbertos.length,
      itensCorrigidos: itensCorrigidos.length,
      statusEquipamentos,
      tendenciaChamados: chamadosAbertos.length > itensCorrigidos.length ? 'aumentando' : 'diminuindo',
      chamadosPorEspecialidade,
      contagemResponsavel,
      chamadosLista
    };

    console.log('📊 MÉTRICAS FINAIS:', {
      totalRondasMes: metricas.totalRondasMes,
      statusEquipamentos: metricas.statusEquipamentos.length,
      statusDetalhes: metricas.statusEquipamentos
    });

    return metricas;
  }, [rondasMes, startDate, endDate, rondasDoContrato, areasTecnicas]);

  // Estado para lista de itens relevantes (agora do Supabase)
  const [reportItemsList, setReportItemsList] = useState<Array<{ id: string; descricao: string; data: string }>>([]);
  const [novoItem, setNovoItem] = useState('');
  const [loadingItems, setLoadingItems] = useState(false);

  // Carregar itens relevantes do Supabase ao mudar mês ou contrato
  useEffect(() => {
    const carregarItensRelevantes = async () => {
      setLoadingItems(true);
      try {
        const { data, error } = await supabase
          .from('itens_relevantes_relatorio')
          .select('*')
          .eq('contrato_id', contrato.id)
          .in('mes', mesesNaFaixa)
          .order('data', { ascending: false });

        if (error) {
          console.error('❌ Erro ao carregar itens relevantes:', error);
          return;
        }

        if (data) {
          setReportItemsList(data.map(item => ({
            id: item.id,
            descricao: item.descricao,
            data: item.data
          })));
        }
      } catch (err) {
        console.error('❌ Erro ao carregar itens relevantes:', err);
      } finally {
        setLoadingItems(false);
      }
    };

    carregarItensRelevantes();
  }, [contrato?.id, mesesNaFaixa.join(',')]);

  // Função para adicionar novo item (salvando no Supabase)
  const handleAddItem = async () => {
    if (!novoItem.trim()) return;

    try {
      const { data, error } = await supabase
        .from('itens_relevantes_relatorio')
        .insert({
          contrato_id: contrato.id,
          mes: selectedMonth,
          descricao: novoItem.trim(),
          data: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao adicionar item:', error);
        alert('Erro ao adicionar item. Verifique o console.');
        return;
      }

      if (data) {
        setReportItemsList(prev => [...prev, {
          id: data.id,
          descricao: data.descricao,
          data: data.data
        }]);
        setNovoItem('');
      }
    } catch (err) {
      console.error('❌ Erro ao adicionar item:', err);
      alert('Erro ao adicionar item. Verifique o console.');
    }
  };

  // Função para remover item (deletando do Supabase)
  const handleRemoveItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este item?')) return;

    try {
      const { error } = await supabase
        .from('itens_relevantes_relatorio')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao remover item:', error);
        alert('Erro ao remover item. Verifique o console.');
        return;
      }

      setReportItemsList(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('❌ Erro ao remover item:', err);
      alert('Erro ao remover item. Verifique o console.');
    }
  };

  const handleExportarPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header com logo + titulo + info (replicando o padrao dos outros PDFs)
    const drawHeader = async () => {
      const headerH = 22;
      const logoW = pageWidth * 0.15;
      const titleW = pageWidth * 0.55;
      // Bordas
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(10, 10, pageWidth - 20, headerH);
      doc.line(10 + logoW, 10, 10 + logoW, 10 + headerH);
      doc.line(10 + logoW + titleW, 10, 10 + logoW + titleW, 10 + headerH);
      // Tentar carregar logo
      try {
        const resp = await fetch('/logo-header.png');
        if (resp.ok) {
          const blob = await resp.blob();
          const dataUrl: string = await new Promise((res) => {
            const r = new FileReader(); r.onloadend = () => res(r.result as string); r.readAsDataURL(blob);
          });
          doc.addImage(dataUrl, 'PNG', 12, 12, logoW - 4, headerH - 4);
        }
      } catch {}
      // Titulo central
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DASHBOARD - RELATORIO GERENCIAL', 10 + logoW + titleW / 2, 22, { align: 'center' });
      // Info direita
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('Condominio', 10 + logoW + titleW + 3, 14);
      doc.setFont('helvetica', 'normal');
      doc.text((contrato?.nome || '—').substring(0, 35), 10 + logoW + titleW + 3, 19);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 10 + logoW + titleW + 3, 24);
      doc.text(`Periodo: ${new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')}`, 10 + logoW + titleW + 3, 29);
    };
    await drawHeader();

    let y = 38;
    const addSection = (titulo: string, cor: [number, number, number]) => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(cor[0], cor[1], cor[2]);
      doc.text(titulo, 14, y); y += 6;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
    };
    const addLine = (texto: string) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(texto, 14, y); y += 4.5;
    };
    const addLines = (texto: string, maxWidth = 180) => {
      const linhas = doc.splitTextToSize(texto, maxWidth);
      linhas.forEach((ln: string) => addLine(ln));
    };

    // === Supervisao ===
    addSection('INDICADORES DE SUPERVISAO', [0, 128, 0]);
    addLine(`- Total de Visitas: ${metricas.totalRondasMes}`);
    addLine(`- Itens Criticos: ${metricas.itensCriticos}`);
    addLine(`- Itens de Atencao: ${metricas.itensAtencao}`);
    addLine(`- Responsavel Construtora: ${metricas.contagemResponsavel.construtora}`);
    addLine(`- Responsavel Condominio: ${metricas.contagemResponsavel.condominio}`);
    addLine(`- Responsavel Outros: ${metricas.contagemResponsavel.outros}`);
    y += 4;

    // === Implantacao ===
    addSection('INDICADORES DE IMPLANTACAO', [0, 0, 200]);
    addLine(`- Kanban - Aguardando: ${kanbanStats.aguardando}`);
    addLine(`- Kanban - Em Andamento: ${kanbanStats.emAndamento}`);
    addLine(`- Kanban - Em Correcao: ${kanbanStats.emCorrecao}`);
    addLine(`- Kanban - Finalizados: ${kanbanStats.finalizados}`);
    addLine(`- Laudos Vencidos: ${laudosStats.vencidos} de ${laudosStats.total}`);
    addLine(`- Laudos Em Analise: ${laudosStats.emAnalise}`);
    addLine(`- Laudos Em Dia: ${laudosStats.emDia}`);
    y += 4;

    // === Cards do Kanban detalhados ===
    if (kanbanItemsList.length > 0) {
      const agrupados: Record<string, any[]> = {
        aguardando: [], em_andamento: [], em_correcao: [], finalizado: []
      };
      kanbanItemsList.forEach(it => {
        const key = (it.status || 'aguardando') as string;
        if (!agrupados[key]) agrupados[key] = [];
        agrupados[key].push(it);
      });
      const labels: Record<string, string> = {
        aguardando: 'AGUARDANDO (VISTORIAS/EQUIPAMENTOS FALTANTES)',
        em_andamento: 'EM ANDAMENTO',
        em_correcao: 'EM CORRECAO',
        finalizado: 'FINALIZADOS (JA VISTORIADOS)',
      };
      const cores: Record<string, [number, number, number]> = {
        aguardando: [200, 100, 0], em_andamento: [200, 150, 0], em_correcao: [200, 50, 50], finalizado: [0, 150, 0]
      };
      ['aguardando', 'em_andamento', 'em_correcao', 'finalizado'].forEach(key => {
        const lista = agrupados[key] || [];
        if (lista.length === 0) return;
        addSection(`${labels[key]} (${lista.length})`, cores[key]);
        // ordenar alfabetico por title
        lista.sort((a: any, b: any) => (a.title || '').localeCompare(b.title || ''));
        lista.forEach((it: any) => {
          const cat = it.category || '-';
          addLines(`  - [${cat}] ${it.title || 'Sem titulo'}`);
          const datas: string[] = [];
          if (it.dataVistoria) datas.push('Vistoria: ' + new Date(it.dataVistoria + 'T00:00:00').toLocaleDateString('pt-BR'));
          if (it.dataRecebimento) datas.push('Recebimento: ' + new Date(it.dataRecebimento + 'T00:00:00').toLocaleDateString('pt-BR'));
          if (it.dataAndamento) datas.push('Andamento: ' + new Date(it.dataAndamento + 'T00:00:00').toLocaleDateString('pt-BR'));
          if (it.dataCorrecao) datas.push('Correcao: ' + new Date(it.dataCorrecao + 'T00:00:00').toLocaleDateString('pt-BR'));
          if (datas.length > 0) {
            doc.setFontSize(8);
            addLines('     ' + datas.join(' | '), 175);
            doc.setFontSize(9);
          }
          if (it.oQueFalta) {
            doc.setFontSize(8);
            addLines(`     O que falta: ${it.oQueFalta}`, 175);
            doc.setFontSize(9);
          }
          if (it.pendencias && it.pendencias.length > 0) {
            doc.setFontSize(8);
            addLine(`     Pendencias: ${it.pendencias.length}`);
            doc.setFontSize(9);
          }
        });
        y += 3;
      });
    }

    // === Visitas do periodo ===
    if (rondasMes.length > 0) {
      addSection('VISITAS DO PERIODO', [0, 100, 100]);
      rondasMes.forEach((r: any) => {
        const dt = new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR');
        addLine(`${dt} - ${r.nome || 'Sem nome'} (${r.responsavel || '-'})`);
      });
      y += 4;
    }

    // === Status equipamentos ===
    if (metricas.statusEquipamentos && metricas.statusEquipamentos.length > 0) {
      addSection('STATUS ULTIMA VISITA - AREAS TECNICAS', [100, 0, 100]);
      metricas.statusEquipamentos.forEach((at: any) => {
        const dt = at.ultimaVisita ? new Date(at.ultimaVisita + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
        addLine(`${at.nome || '-'} | ${dt} | ${at.statusUltimaVisita || '-'}`);
      });
      y += 4;
    }

    // === Itens relevantes ===
    if (itensRelevantesSupervisor.length > 0) {
      addSection('ITENS RELEVANTES (SUPERVISAO)', [80, 0, 150]);
      itensRelevantesSupervisor.forEach((it: any) => {
        const dt = it.data_abertura ? new Date(it.data_abertura + 'T00:00:00').toLocaleDateString('pt-BR') : (it.created_at ? new Date(it.created_at).toLocaleDateString('pt-BR') : '-');
        const st = it.status === 'concluido' ? 'CONCLUIDO' : it.status === 'em_andamento' ? 'EM ANDAMENTO' : 'PENDENTE';
        const desc = it.descricao || it.titulo || '-';
        addLines(`${dt} [${st}] ${desc}`, 180);
      });
    }

    const fname = `dashboard_${(contrato?.nome || 'contrato').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fname);
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Overlay de loading durante troca de prédio */}
      {loadingCount > 0 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-lg p-8 shadow-2xl flex flex-col items-center gap-4 border border-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="text-white text-lg font-semibold">Carregando dados do prédio...</p>
            <p className="text-gray-400 text-sm">{contrato?.nome}</p>
          </div>
        </div>
      )}
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
        <div className="relative p-4 sm:p-10 lg:p-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">Dashboard</h1>
              <p className="mt-1 sm:mt-2 text-white/90 text-sm sm:text-base truncate">{contrato.nome}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
              {/* Filtro de Prédio (contrato) */}
              {contratos && contratos.length > 0 && onSelectContrato && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <select
                    value={contrato.id}
                    onChange={(e) => {
                      const alvo = contratos.find(c => c.id === e.target.value);
                      if (alvo) onSelectContrato(alvo);
                    }}
                    className="rounded-md bg-white/20 text-white backdrop-blur px-2 sm:px-3 py-1.5 sm:py-2 text-sm ring-1 ring-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-all max-w-[200px]"
                  >
                    {contratos.map(c => (
                      <option key={c.id} value={c.id} className="bg-gray-800 text-white">{c.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Filtro de PERÍODO (data inicial → data final) */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <input
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-md bg-white/20 text-white backdrop-blur px-2 sm:px-3 py-1.5 sm:py-2 text-sm ring-1 ring-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-all"
                  title="Data inicial"
                />
                <span className="text-white text-sm">até</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-md bg-white/20 text-white backdrop-blur px-2 sm:px-3 py-1.5 sm:py-2 text-sm ring-1 ring-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-all"
                  title="Data final"
                />
              </div>
              {/* Atalhos rápidos */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => {
                    const now = new Date();
                    setStartDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
                    setEndDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`);
                  }}
                  className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white"
                >Este mês</button>
                <button
                  onClick={() => {
                    const now = new Date();
                    setStartDate(`${now.getFullYear()}-01-01`);
                    setEndDate(`${now.getFullYear()}-12-31`);
                  }}
                  className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white"
                >Este ano</button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const lastDay = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
                    setStartDate(`${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`);
                    setEndDate(`${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`);
                  }}
                  className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white"
                >Mês passado</button>
                <button
                  onClick={handleExportarPDF}
                  className="text-xs px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1 ml-1"
                  title="Baixar PDF do Dashboard com o contrato e periodo filtrados"
                >
                  <FileDown className="w-3.5 h-3.5" /> Exportar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======== SUPERVISÃO ======== */}
      <div className="flex items-center gap-2 mt-4">
        <div className="h-8 w-1.5 rounded bg-emerald-500" />
        <h2 className="text-lg sm:text-xl font-bold text-gray-100">Indicadores de Supervisão</h2>
      </div>
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <GlowingCard className="border-l-4 border-l-blue-500" glowColor="from-blue-500/50 via-cyan-500/50 to-blue-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total de Visitas</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metricas.totalRondasMes}</div>
            <p className="text-xs text-gray-600">Este mês</p>
          </CardContent>
        </GlowingCard>

        <GlowingCard className="border-l-4 border-l-red-500" glowColor="from-red-500/50 via-orange-500/50 to-red-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Itens Críticos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metricas.itensCriticos}</div>
            <p className="text-xs text-gray-600">Este mês</p>
          </CardContent>
        </GlowingCard>

        <GlowingCard className="border-l-4 border-l-orange-500" glowColor="from-orange-500/50 via-yellow-500/50 to-orange-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Itens Atenção</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metricas.itensAtencao}</div>
            <p className="text-xs text-gray-600">Este mês</p>
          </CardContent>
        </GlowingCard>

        {/* Card: Responsável dos chamados (mês) */}
        <GlowingCard className="border-l-4 border-l-purple-500" glowColor="from-purple-500/50 via-pink-500/50 to-purple-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Responsável (mês)</CardTitle>
            <User className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 space-y-1">
              <div className="flex items-center justify-between">
                <span>Construtora</span>
                <span className="font-semibold text-purple-600">{metricas.contagemResponsavel.construtora}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Condomínio</span>
                <span className="font-semibold text-purple-600">{metricas.contagemResponsavel.condominio}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Outros</span>
                <span className="font-semibold text-purple-600">{metricas.contagemResponsavel.outros}</span>
              </div>
            </div>
          </CardContent>
        </GlowingCard>
      </div>

      {/* ======== IMPLANTAÇÃO ======== */}
      <div className="flex items-center gap-2 mt-4">
        <div className="h-8 w-1.5 rounded bg-blue-500" />
        <h2 className="text-lg sm:text-xl font-bold text-gray-100">Indicadores de Implantação</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <GlowingCard className="border-l-4 border-l-gray-400" glowColor="from-gray-400/50 via-slate-400/50 to-gray-400/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Aguardando</CardTitle>
            <KanbanIcon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{kanbanStats.aguardando}</div>
            <p className="text-xs text-gray-600">cards parados</p>
          </CardContent>
        </GlowingCard>

        <GlowingCard className="border-l-4 border-l-yellow-500" glowColor="from-yellow-500/50 via-amber-500/50 to-yellow-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Em Andamento</CardTitle>
            <KanbanIcon className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{kanbanStats.emAndamento}</div>
            <p className="text-xs text-gray-600">sendo trabalhados</p>
          </CardContent>
        </GlowingCard>

        <GlowingCard className="border-l-4 border-l-orange-500" glowColor="from-orange-500/50 via-red-500/50 to-orange-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Em Correção</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kanbanStats.emCorrecao}</div>
            <p className="text-xs text-gray-600">retorno para correcao</p>
          </CardContent>
        </GlowingCard>

        <GlowingCard className="border-l-4 border-l-green-500" glowColor="from-green-500/50 via-emerald-500/50 to-green-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Finalizados</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kanbanStats.finalizados}</div>
            <p className="text-xs text-gray-600">{kanbanStats.total > 0 ? `${Math.round((kanbanStats.finalizados / kanbanStats.total) * 100)}% do total` : 'total finalizado'}</p>
          </CardContent>
        </GlowingCard>
      </div>

      {/* Linha extra: Laudos (sempre snapshot atual, não filtram por período) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <GlowingCard className="border-l-4 border-l-red-500" glowColor="from-red-500/50 via-pink-500/50 to-red-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Laudos Vencidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{laudosStats.vencidos}</div>
            <p className="text-xs text-gray-600">de {laudosStats.total} documentos</p>
          </CardContent>
        </GlowingCard>
        <GlowingCard className="border-l-4 border-l-indigo-500" glowColor="from-indigo-500/50 via-violet-500/50 to-indigo-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Laudos Em Análise</CardTitle>
            <FileText className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{laudosStats.emAnalise}</div>
            <p className="text-xs text-gray-600">snapshot atual</p>
          </CardContent>
        </GlowingCard>
        <GlowingCard className="border-l-4 border-l-emerald-500" glowColor="from-emerald-500/50 via-green-500/50 to-emerald-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Laudos Em Dia</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{laudosStats.emDia}</div>
            <p className="text-xs text-gray-600">snapshot atual</p>
          </CardContent>
        </GlowingCard>
        <GlowingCard className="border-l-4 border-l-blue-500" glowColor="from-blue-500/50 via-sky-500/50 to-blue-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Documentos</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{laudosStats.total}</div>
            <p className="text-xs text-gray-600">do prédio</p>
          </CardContent>
        </GlowingCard>
      </div>

      {/* Tabela de visitas do mês */}
      <GlowingCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Calendar className="w-5 h-5 text-blue-600" />
            Visitas do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rondasMes.length === 0 ? (
            <div className="text-sm text-gray-600">Nenhuma visita registrada neste mês.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="py-2 px-3 text-gray-700 font-medium">Tipo</th>
                    <th className="py-2 px-3 text-gray-700 font-medium">Nome</th>
                    <th className="py-2 px-3 text-gray-700 font-medium">Data</th>
                    <th className="py-2 px-3 text-gray-700 font-medium">Responsável</th>
                    <th className="py-2 px-3 text-gray-700 font-medium">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {rondasMes.map((ronda) => {
                    const tipoVisita = ronda.tipoVisita || 'RONDA';
                    const tipoConfig = {
                      RONDA: { label: '🔍 Ronda', color: 'text-blue-700' },
                      REUNIAO: { label: '👥 Reunião', color: 'text-green-700' },
                      OUTROS: { label: '📋 Outros', color: 'text-purple-700' }
                    };
                    const config = tipoConfig[tipoVisita as keyof typeof tipoConfig] || tipoConfig.RONDA;

                    return (
                      <tr key={ronda.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-3">
                          <span className={`text-sm font-bold ${config.color}`}>
                            {config.label}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-900 font-medium">{ronda.nome}</td>
                        <td className="py-2 px-3 text-gray-600">{ronda.data ? ronda.data.split('-').reverse().join('/') : '—'}</td>
                        <td className="py-2 px-3 text-gray-600">{ronda.responsavel || '—'}</td>
                        <td className="py-2 px-3 text-gray-600 max-w-[300px] truncate" title={ronda.observacoesGerais}>
                          {ronda.observacoesGerais || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </GlowingCard>


      {/* Tabela de chamados do mês */}
      <GlowingCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Chamados do Mês — Detalhamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metricas.chamadosLista.length === 0 ? (
            <div className="text-sm text-gray-600">Nenhum chamado registrado neste mês.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="py-2 px-3 text-gray-700 font-medium">Descrição</th>
                    <th className="py-2 px-3 text-gray-700 font-medium">Data</th>
                    <th className="py-2 px-3 text-gray-700 font-medium">Especialidade</th>
                    <th className="py-2 px-3 text-gray-700 font-medium">Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.chamadosLista.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-3 text-gray-900 max-w-[520px] truncate" title={c.descricao}>{c.descricao || '—'}</td>
                      <td className="py-2 px-3 text-gray-600">{c.data ? (typeof c.data === 'string' ? c.data.split('-').reverse().join('/') : new Date(c.data).toLocaleDateString('pt-BR')) : '—'}</td>
                      <td className="py-2 px-3 text-gray-600">{c.especialidade}</td>
                      <td className="py-2 px-3 text-gray-600">{c.responsavel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </GlowingCard>

      {/* Status dos Equipamentos - Tabela */}
      <GlowingCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Wrench className="w-5 h-5 text-gray-700" />
            Status da Última Visita nas Áreas Técnicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="py-2 px-3 text-gray-700 font-medium">Área</th>
                  <th className="py-2 px-3 text-gray-700 font-medium">Data</th>
                  <th className="py-2 px-3 text-gray-700 font-medium">Status</th>
                  <th className="py-2 px-3 text-gray-700 font-medium">Observações</th>
                </tr>
              </thead>
              <tbody>
                {metricas.statusEquipamentos.map((equipamento) => {
                  const dataFormatada = equipamento.ultimaVisita
                    ? (equipamento.ultimaVisita as unknown as string).split('-').reverse().join('/')
                    : '—';
                  const status = equipamento.statusUltimaVisita || 'NÃO VISITADO';
                  const variant = status === 'ATIVO' ? 'success' : /MANUT|ATEN/.test(status) ? 'attention' : 'destructive';
                  return (
                    <tr key={equipamento.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-3 text-gray-900">{equipamento.nome}</td>
                      <td className="py-2 px-3 text-gray-600">{dataFormatada}</td>
                      <td className="py-2 px-3">
                        <Badge variant={variant as any}>{status}</Badge>
                      </td>
                      <td className="py-2 px-3 text-gray-600">{equipamento.observacoes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </GlowingCard>

      {/* Resumo Executivo */}
      <GlowingCard className="border-l-4 border-l-blue-500" glowColor="from-blue-900/50 via-blue-800/50 to-blue-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-400">
            <BarChart3 className="w-6 h-6" />
            📊 Resumo Executivo do Mês
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{metricas.itensCriticos}</div>
              <div className="text-sm text-red-400">Itens Críticos</div>
              <div className="text-xs text-red-500/70">Requerem ação imediata</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">{metricas.itensAtencao}</div>
              <div className="text-sm text-orange-400">Itens Atenção</div>
              <div className="text-xs text-orange-500/70">Monitorar de perto</div>
            </div>
          </div>
        </CardContent>
      </GlowingCard>
      <GlowingCard className="border-l-4 border-l-indigo-500" glowColor="from-indigo-500/50 via-purple-500/50 to-indigo-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 text-sm sm:text-base">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
            <span>Itens Relevantes (da aba Supervisão)</span>
          </CardTitle>
          <p className="text-xs text-gray-500 mt-1">Somente leitura. Edite em Supervisão → Itens Relevantes.</p>
        </CardHeader>
        <CardContent>
          {itensRelevantesSupervisor.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-300">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Nenhum item relevante cadastrado para este prédio.</p>
              <p className="text-xs text-gray-400 mt-1">Adicione em Supervisão → Itens Relevantes.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-2 px-3 text-gray-700 font-medium w-24">Data</th>
                    <th className="text-left py-2 px-3 text-gray-700 font-medium">Descrição</th>
                    <th className="text-left py-2 px-3 text-gray-700 font-medium w-32">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {itensRelevantesSupervisor.map((item: any, index: number) => {
                    const statusConfig: Record<string, { label: string; cls: string }> = {
                      pendente: { label: 'Pendente', cls: 'bg-yellow-500 text-black font-bold' },
                      em_andamento: { label: 'Em andamento', cls: 'bg-blue-500 text-white font-bold' },
                      concluido: { label: 'Concluído', cls: 'bg-green-500 text-black font-bold' },
                    };
                    const cfg = statusConfig[item.status as string] || { label: item.status || '—', cls: 'bg-gray-100 text-gray-700' };
                    return (
                      <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="py-2 px-3 text-gray-600">
                          {item.data_abertura ? String(item.data_abertura).split('-').reverse().join('/') : (item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '—')}
                        </td>
                        <td className="py-2 px-3 text-gray-900">{item.descricao || item.titulo || '—'}</td>
                        <td className="py-2 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2 text-right">Total: {itensRelevantesSupervisor.length} {itensRelevantesSupervisor.length === 1 ? 'item' : 'itens'}</p>
        </CardContent>
      </GlowingCard>
    </div>
  );
}
