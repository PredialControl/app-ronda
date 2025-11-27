import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlowingCard } from '@/components/ui/glowing-card';
import { Badge } from '@/components/ui/badge';
import { Ronda, Contrato, AreaTecnica } from '@/types';
import { BarChart3, AlertTriangle, Calendar, Wrench, XCircle, User } from 'lucide-react';

interface DashboardProps {
  contrato: Contrato;
  rondas: Ronda[];
  areasTecnicas: AreaTecnica[];
}

export function Dashboard({ contrato, rondas, areasTecnicas }: DashboardProps) {
  // Filtro por mês (AAAA-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Se o mês atual não tiver rondas, usar automaticamente o mês da última ronda
  useEffect(() => {
    const [anoStr, mesStr] = selectedMonth.split('-');
    const anoSelecionado = parseInt(anoStr, 10);
    const mesSelecionado = parseInt(mesStr, 10) - 1;
    const temNoMesAtual = rondas.some(r => {
      const d = new Date(r.data);
      return d.getFullYear() === anoSelecionado && d.getMonth() === mesSelecionado;
    });

    if (!temNoMesAtual && rondas.length > 0) {
      const maisRecente = [...rondas].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
      const d = new Date(maisRecente.data);
      const novo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (novo !== selectedMonth) setSelectedMonth(novo);
    }
  }, [rondas]);

  // Calcular métricas do dashboard com base no mês selecionado
  const metricas = useMemo(() => {
    const [anoStr, mesStr] = selectedMonth.split('-');
    const anoSelecionado = parseInt(anoStr, 10);
    const mesSelecionado = parseInt(mesStr, 10) - 1; // 0-based

    // Filtrar rondas do mês/ano selecionados
    const rondasMes = rondas.filter(ronda => {
      const dataRonda = new Date(ronda.data);
      return (
        dataRonda.getMonth() === mesSelecionado &&
        dataRonda.getFullYear() === anoSelecionado
      );
    });

    // Itens por criticidade/atenção (ajuste simples baseado no campo pendencia)
    const fotosMes = rondasMes.flatMap(ronda => ronda.fotosRonda || []);
    const itensCriticos = fotosMes.filter(f =>
      String(f.pendencia || '').toUpperCase().includes('URG') ||
      String(f.pendencia || '').toUpperCase() === 'CRÍTICA' ||
      String(f.pendencia || '').toUpperCase() === 'CRITICA'
    );
    // Atenção: considerar Áreas Técnicas com status "ATENÇÃO" no mês selecionado (itens únicos por área)
    const nomesAtencao = new Set<string>();
    rondasMes.forEach(r => {
      (r.areasTecnicas || [])
        .filter(at => String(at.status || '').toUpperCase().includes('ATEN'))
        .forEach(at => {
          if (at.nome) nomesAtencao.add(at.nome);
        });
    });
    const itensAtencao = Array.from(nomesAtencao);

    // Chamados abertos (qualquer foto com pendencia definida)
    const chamadosAbertos = fotosMes.filter(f => (f.pendencia || '').trim() !== '');

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
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .flatMap(r => {
        // Fotos de ronda (chamados antigos)
        const fotosChamados = (r.fotosRonda || [])
          .filter(f => (String(f.pendencia || f.observacoes || '').trim() !== ''))
          .map(f => ({
            id: `${r.id}-foto-${f.id}`,
            descricao: (f.observacoes && f.observacoes.trim() !== '') ? f.observacoes : (f.pendencia || ''),
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

    // Status da última visita: usar APENAS a última ronda inteira
    const statusEquipamentos = (() => {
      const rondaMaisRecente = [...rondas]
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
      const areas = rondaMaisRecente?.areasTecnicas || [];
      return areas.map((at) => ({
        id: at.id,
        nome: at.nome,
        ultimaVisita: rondaMaisRecente?.data || null,
        statusUltimaVisita: at.status || 'NÃO VISITADO',
        observacoes: at.observacoes || null
      }));
    })();

    return {
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
  }, [rondas, areasTecnicas, selectedMonth]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
        <div className="relative p-6 sm:p-10 lg:p-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">Dashboard</h1>
              <p className="mt-2 text-white/90">Visão geral do contrato <span className="font-semibold text-white">{contrato.nome}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-medium">Mês:</span>
              </div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-md bg-white/20 text-white placeholder-white/60 backdrop-blur px-3 py-2 text-sm ring-1 ring-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlowingCard className="border-l-4 border-l-blue-500" glowColor="from-blue-500/50 via-cyan-500/50 to-blue-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total de Rondas</CardTitle>
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

      {/* Chamados abertos por especialidade (mês filtrado) */}
      <GlowingCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Chamados Abertos por Especialidade (mês selecionado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metricas.chamadosPorEspecialidade.length === 0 ? (
            <div className="text-sm text-gray-600">Nenhum chamado aberto no período.</div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* Pizza chart */}
              {(() => {
                const radius = 64;
                const stroke = 22;
                const cx = 90;
                const cy = 90;
                const circumference = 2 * Math.PI * radius;
                const total = metricas.chamadosPorEspecialidade.reduce((sum, i) => sum + i.total, 0) || 1;
                let offset = 0;
                const palette: Record<string, string> = {
                  CIVIL: '#3b82f6', // blue
                  ELÉTRICA: '#22c55e', // green
                  ELETRICA: '#22c55e',
                  HIDRÁULICA: '#f59e0b', // amber
                  HIDRAULICA: '#f59e0b',
                  OUTROS: '#8b5cf6', // violet
                };
                const fallback = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];
                const circles = metricas.chamadosPorEspecialidade.map((item, idx) => {
                  const value = item.total / total;
                  const length = value * circumference;
                  const color = palette[(item.especialidade || '').toUpperCase()] || fallback[idx % fallback.length];
                  const circle = (
                    <circle
                      key={item.especialidade}
                      r={radius}
                      cx={cx}
                      cy={cy}
                      fill="transparent"
                      stroke={color}
                      strokeWidth={stroke}
                      strokeDasharray={`${length} ${circumference - length}`}
                      strokeDashoffset={-offset}
                      transform={`rotate(-90 ${cx} ${cy})`}
                      strokeLinecap="butt"
                    />
                  );
                  offset += length;
                  return circle;
                });
                return (
                  <div className="flex items-center justify-center">
                    <svg width={180} height={180} viewBox={`0 0 ${cx * 2} ${cy * 2}`}>
                      <circle r={radius} cx={cx} cy={cy} fill="#1e293b" stroke="#334155" strokeWidth={stroke} />
                      {circles}
                    </svg>
                  </div>
                );
              })()}

              {/* Legenda abaixo */}
              <div className="w-full max-w-md">
                <div className="grid grid-cols-1 gap-2 justify-items-center">
                  {metricas.chamadosPorEspecialidade.map((item, idx) => {
                    const palette: Record<string, string> = {
                      CIVIL: '#3b82f6', ELÉTRICA: '#22c55e', ELETRICA: '#22c55e', HIDRÁULICA: '#f59e0b', HIDRAULICA: '#f59e0b', OUTROS: '#8b5cf6'
                    };
                    const fallback = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];
                    const color = palette[(item.especialidade || '').toUpperCase()] || fallback[idx % fallback.length];
                    const totalAll = metricas.chamadosPorEspecialidade.reduce((s, i) => s + i.total, 0) || 1;
                    const percent = Math.round((item.total / totalAll) * 100);
                    return (
                      <div key={item.especialidade} className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                        <span className="font-medium text-gray-900">{item.especialidade}</span>
                        <span className="text-gray-600">— {item.total} ({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
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
                      <td className="py-2 px-3 text-gray-600">{new Date(c.data).toLocaleDateString('pt-BR')}</td>
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
                    ? new Date(equipamento.ultimaVisita as unknown as string).toLocaleDateString('pt-BR')
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
    </div>
  );
}
