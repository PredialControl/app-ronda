import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlowingCard } from '@/components/ui/glowing-card';
import { Badge } from '@/components/ui/badge';
import { Ronda, Contrato, AreaTecnica } from '@/types';
import { BarChart3, AlertTriangle, Calendar, Wrench, XCircle, User, FileText, Trash2, Plus, X, Building2, Kanban as KanbanIcon, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { laudoService } from '@/lib/laudoService';
import { kanbanEventoService } from '@/lib/supabaseService';

interface DashboardProps {
  contrato: Contrato;
  rondas: Ronda[];
  areasTecnicas: AreaTecnica[];
  contratos?: Contrato[];
  onSelectContrato?: (c: Contrato) => void;
}

export function Dashboard({ contrato, rondas, areasTecnicas, contratos, onSelectContrato }: DashboardProps) {
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

  // Carregar dados de implantação quando mudar contrato OU o período
  useEffect(() => {
    const carregarImplantacao = async () => {
      try {
        // Kanban — filtrar pelo contrato E pelo período (qualquer data do card dentro da faixa)
        const kanbanEventos = await kanbanEventoService.getAll();
        const doContrato = kanbanEventos.filter((ke: any) => {
          if (ke.contrato_id !== contrato.id) return false;
          const datas = [ke.data_andamento, ke.data_vistoria, ke.data_recebimento, ke.data_correcao].filter(Boolean) as string[];
          if (datas.length === 0) return false;
          // Entra se QUALQUER data do card estiver dentro da faixa
          return datas.some(d => d >= startDate && d <= endDate);
        });
        setKanbanStats({
          total: doContrato.length,
          aguardando: doContrato.filter((ke: any) => ke.status === 'aguardando').length,
          emAndamento: doContrato.filter((ke: any) => ke.status === 'em_andamento').length,
          emCorrecao: doContrato.filter((ke: any) => ke.status === 'em_correcao').length,
          finalizados: doContrato.filter((ke: any) => ke.status === 'finalizado').length,
        });
      } catch (err) {
        console.warn('Erro ao carregar kanban stats:', err);
      }
      try {
        // Laudos são snapshot atual, não filtram por período
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
    };
    carregarImplantacao();
  }, [contrato.id, startDate, endDate]);

  // Se o mês atual não tiver rondas, usar automaticamente o mês da última ronda
  // Removido useEffect que alterava o mês automaticamente se não houvesse rondas
  // para garantir que o mês atual seja sempre o padrão inicial.

  // Filtrar rondas dentro da faixa de datas selecionada
  const rondasMes = useMemo(() => {
    console.log('🔍 FILTRO RONDAS - período:', startDate, '→', endDate);
    const resultado = rondas.filter(ronda => {
      if (!ronda.data) return false;
      return ronda.data >= startDate && ronda.data <= endDate;
    });
    resultado.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    console.log('🔍 FILTRO - Rondas filtradas:', resultado.length);
    return resultado;
  }, [rondas, startDate, endDate]);

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

    // Status da última visita: usar APENAS a última ronda DO MÊS FILTRADO
    const statusEquipamentos = (() => {
      console.log('🔍 ===== CALCULANDO STATUS EQUIPAMENTOS =====');
      console.log('🔍 DEBUG STATUS EQUIPAMENTOS - Rondas do mês filtrado:', rondasMes.length);
      console.log('🔍 Mês selecionado:', selectedMonth);
      console.log('🔍 TODAS as rondas do mês:', rondasMes.map(r => ({
        id: r.id,
        nome: r.nome,
        data: r.data,
        areasCount: r.areasTecnicas?.length || 0
      })));

      const rondaMaisRecente = [...rondasMes]
        .sort((a, b) => b.data.localeCompare(a.data))[0];

      console.log('🔍 Ronda mais recente DO MÊS:', {
        id: rondaMaisRecente?.id,
        nome: rondaMaisRecente?.nome,
        data: rondaMaisRecente?.data,
        temAreasTecnicas: !!rondaMaisRecente?.areasTecnicas,
        quantidadeAreas: rondaMaisRecente?.areasTecnicas?.length || 0
      });

      const areas = rondaMaisRecente?.areasTecnicas || [];
      console.log('🔍 Áreas técnicas da última ronda do mês:', areas.length);
      console.log('🔍 Detalhes das áreas:', areas);

      areas.forEach((at, index) => {
        console.log(`🔍 Área ${index + 1}:`, {
          id: at.id,
          nome: at.nome,
          status: at.status,
          observacoes: at.observacoes
        });
      });

      const resultado = areas.map((at) => ({
        id: at.id,
        nome: at.nome,
        ultimaVisita: rondaMaisRecente?.data || null,
        statusUltimaVisita: at.status || 'NÃO VISITADO',
        observacoes: at.observacoes || null
      }));

      console.log('🔍 Status equipamentos RESULTADO FINAL (do mês filtrado):', resultado);
      console.log('🔍 ===== FIM DO CÁLCULO =====');
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
  }, [rondasMes, startDate, endDate]);

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
  }, [contrato.id, mesesNaFaixa.join(',')]);

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

  return (
    <div className="space-y-4 sm:space-y-8">
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
            <p className="text-xs text-gray-600">no período filtrado</p>
          </CardContent>
        </GlowingCard>

        <GlowingCard className="border-l-4 border-l-yellow-500" glowColor="from-yellow-500/50 via-amber-500/50 to-yellow-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Em Andamento</CardTitle>
            <KanbanIcon className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{kanbanStats.emAndamento}</div>
            <p className="text-xs text-gray-600">no período filtrado</p>
          </CardContent>
        </GlowingCard>

        <GlowingCard className="border-l-4 border-l-orange-500" glowColor="from-orange-500/50 via-red-500/50 to-orange-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Em Correção</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kanbanStats.emCorrecao}</div>
            <p className="text-xs text-gray-600">no período filtrado</p>
          </CardContent>
        </GlowingCard>

        <GlowingCard className="border-l-4 border-l-green-500" glowColor="from-green-500/50 via-emerald-500/50 to-green-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Finalizados</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kanbanStats.finalizados}</div>
            <p className="text-xs text-gray-600">{kanbanStats.total > 0 ? `${Math.round((kanbanStats.finalizados / kanbanStats.total) * 100)}% do total` : 'no período filtrado'}</p>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-sm sm:text-base">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
              <span className="truncate">Itens Relevantes</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (confirm('⚠️ Tem certeza que deseja limpar todos os itens relevantes?\n\nEsta ação não pode ser desfeita!')) {
                  try {
                    const { error } = await supabase
                      .from('itens_relevantes_relatorio')
                      .delete()
                      .eq('contrato_id', contrato.id)
                      .in('mes', mesesNaFaixa);

                    if (error) {
                      console.error('❌ Erro ao limpar itens:', error);
                      alert('Erro ao limpar itens. Verifique o console.');
                      return;
                    }

                    setReportItemsList([]);
                  } catch (err) {
                    console.error('❌ Erro ao limpar itens:', err);
                    alert('Erro ao limpar itens. Verifique o console.');
                  }
                }
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Limpar Tudo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input para adicionar novo item */}
          <div className="flex gap-2">
            <Input
              value={novoItem}
              onChange={(e) => setNovoItem(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem();
                }
              }}
              placeholder="Digite um item relevante e pressione Enter ou clique em Adicionar..."
              className="flex-1"
            />
            <Button
              onClick={handleAddItem}
              disabled={!novoItem.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>

          {/* Tabela de itens */}
          {loadingItems ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm">Carregando itens...</p>
            </div>
          ) : reportItemsList.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-2 px-3 text-gray-700 font-medium w-20">Data</th>
                    <th className="text-left py-2 px-3 text-gray-700 font-medium">Descrição</th>
                    <th className="text-right py-2 px-3 text-gray-700 font-medium w-20">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {reportItemsList.map((item, index) => (
                    <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="py-2 px-3 text-gray-600">
                        {item.data.split('-').reverse().join('/')}
                      </td>
                      <td className="py-2 px-3 text-gray-900">
                        {item.descricao}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-300">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Nenhum item adicionado ainda</p>
              <p className="text-xs text-gray-400 mt-1">Use o campo acima para adicionar itens relevantes</p>
            </div>
          )}

          <p className="text-xs text-gray-500 flex items-center justify-between">
            <span>💡 Pressione Enter para adicionar rapidamente</span>
            <span>Total: {reportItemsList.length} {reportItemsList.length === 1 ? 'item' : 'itens'}</span>
          </p>
        </CardContent>
      </GlowingCard>
    </div>
  );
}
