import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileText, Plus, Calendar, ClipboardList, CheckCircle } from 'lucide-react';
import { Contrato } from '@/types';

// Templates de Ronda com roteiros pré-definidos (SIMPLIFICADOS)
const TEMPLATES_RONDA = {
  SEMANAL: {
    id: 'SEMANAL',
    nome: 'Ronda Semanal',
    emoji: '📅',
    cor: 'emerald',
    descricao: 'Vistoria geral dos equipamentos',
    roteiro: [
      'Verificar gerador',
      'Verificar bombas de recalque',
      'Verificar quadros elétricos',
      'Verificar iluminação de emergência',
      'Verificar sistema de CFTV',
      'Verificar portões e cancelas',
    ],
    areasTecnicas: [],
    objetivoRelatorio: `O presente relatório tem como objetivo registrar a vistoria semanal dos equipamentos essenciais do empreendimento, verificando seu funcionamento operacional e estado de conservação.

Durante esta ronda foram inspecionados: grupo gerador, bombas de recalque, quadros elétricos, sistema de iluminação de emergência, sistema de CFTV e portões/cancelas automatizados.

As constatações identificadas durante a inspeção estão detalhadas nos registros abaixo, indicando o status de cada item verificado e eventuais pendências que necessitam de atenção ou manutenção.`
  },
  MENSAL: {
    id: 'MENSAL',
    nome: 'Ronda Mensal',
    emoji: '🗓️',
    cor: 'blue',
    descricao: 'Vistoria dos equipamentos de incêndio',
    roteiro: [
      'Verificar extintores (validade e conservação)',
      'Verificar mangueiras de incêndio',
      'Verificar hidrantes',
      'Verificar sinalização de emergência',
      'Verificar portas corta-fogo',
    ],
    areasTecnicas: [],
    objetivoRelatorio: `O presente relatório tem como objetivo documentar a inspeção mensal dos sistemas de prevenção e combate a incêndio do empreendimento, em conformidade com as normas técnicas vigentes (NBR 12693, NBR 13714, NBR 17240).

Durante esta vistoria foram verificados: extintores de incêndio (validade, lacre, manômetro e estado de conservação), mangueiras de incêndio (integridade e acondicionamento), hidrantes (acessibilidade e funcionamento), sinalização de emergência e portas corta-fogo (vedação e fechamento automático).

Os apontamentos realizados visam garantir que todos os equipamentos estejam em plenas condições de uso em caso de emergência, conforme exigido pelo Corpo de Bombeiros e legislação aplicável.`
  },
  BIMESTRAL: {
    id: 'BIMESTRAL',
    nome: 'Ronda Bimestral',
    emoji: '🏢',
    cor: 'purple',
    descricao: 'Vistoria das áreas comuns',
    roteiro: [
      'Verificar halls de entrada',
      'Verificar iluminação dos corredores',
      'Verificar escadarias',
      'Verificar corrimãos e guarda-corpos',
      'Verificar pisos e revestimentos',
    ],
    areasTecnicas: [],
    objetivoRelatorio: `O presente relatório tem como objetivo registrar a vistoria bimestral das áreas comuns do empreendimento, avaliando o estado de conservação, segurança e funcionalidade dos espaços de circulação.

Durante esta inspeção foram verificados: halls de entrada (limpeza, iluminação e acabamentos), corredores (iluminação e sinalização), escadarias (condições de segurança e iluminação), corrimãos e guarda-corpos (fixação e integridade) e pisos/revestimentos (desgaste, trincas ou irregularidades).

As pendências identificadas serão listadas abaixo com indicação de criticidade, permitindo o planejamento adequado das ações de manutenção preventiva e corretiva necessárias.`
  },
  PERSONALIZADA: {
    id: 'PERSONALIZADA',
    nome: 'Ronda Personalizada',
    emoji: '✏️',
    cor: 'gray',
    descricao: 'Configure sua própria ronda',
    roteiro: [],
    areasTecnicas: [],
    objetivoRelatorio: ''
  }
};

type TemplateKey = keyof typeof TEMPLATES_RONDA;

interface NovaRondaScreenProps {
  contrato: Contrato;
  onVoltar: () => void;
  onSalvar: (rondaData: {
    nome: string;
    data: string;
    hora: string;
    observacoesGerais?: string;
    tipoVisita?: 'RONDA' | 'REUNIAO' | 'OUTROS';
    templateRonda?: string;
    roteiro?: string[];
    areasTecnicasSugeridas?: string[];
    objetivoRelatorio?: string;
  }) => void;
  templateInicial?: 'SEMANAL' | 'MENSAL' | 'BIMESTRAL'; // Template pré-selecionado
}

export function NovaRondaScreen({
  contrato,
  onVoltar,
  onSalvar,
  templateInicial
}: NovaRondaScreenProps) {
  const [templateSelecionado, setTemplateSelecionado] = React.useState<TemplateKey | null>(templateInicial || null);
  const [formData, setFormData] = React.useState({
    nome: '',
    data: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    observacoesGerais: '',
    tipoVisita: 'RONDA' as 'RONDA' | 'REUNIAO' | 'OUTROS'
  });

  const handleSelectTemplate = (templateKey: TemplateKey) => {
    setTemplateSelecionado(templateKey);
    const template = TEMPLATES_RONDA[templateKey];

    if (templateKey !== 'PERSONALIZADA') {
      setFormData(prev => ({
        ...prev,
        nome: template.nome,
        tipoVisita: 'RONDA'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        nome: '',
        tipoVisita: 'RONDA'
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      alert('Por favor, informe o nome da ronda');
      return;
    }

    const template = templateSelecionado ? TEMPLATES_RONDA[templateSelecionado] : null;

    onSalvar({
      ...formData,
      templateRonda: templateSelecionado || undefined,
      roteiro: template?.roteiro || [],
      areasTecnicasSugeridas: template?.areasTecnicas || [],
      objetivoRelatorio: template?.objetivoRelatorio || undefined
    });
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'tipoVisita') {
      if (value === 'REUNIAO') {
        setFormData(prev => ({ ...prev, nome: 'REUNIÃO DE ALINHAMENTO', [field]: value as any }));
        setTemplateSelecionado(null);
      } else if (value === 'OUTROS') {
        setFormData(prev => ({ ...prev, nome: '', [field]: value as any }));
        setTemplateSelecionado(null);
      }
    }
  };

  const templateAtual = templateSelecionado ? TEMPLATES_RONDA[templateSelecionado] : null;

  const getCorClasse = (cor: string, isSelected: boolean) => {
    if (!isSelected) return 'border-white/10 hover:border-white/30 bg-white/5';

    switch (cor) {
      case 'emerald': return 'border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/20';
      case 'blue': return 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20';
      case 'purple': return 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20';
      default: return 'border-gray-500 bg-gray-500/20';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onVoltar} variant="outline" size="sm" className="glass-button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Nova Ronda de Supervisão</h1>
          <p className="text-gray-400">Contrato: {contrato.nome}</p>
        </div>
      </div>

      {/* Seleção de Template */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Selecione o Tipo de Ronda</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(TEMPLATES_RONDA) as TemplateKey[]).map((key) => {
            const template = TEMPLATES_RONDA[key];
            const isSelected = templateSelecionado === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectTemplate(key)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${getCorClasse(template.cor, isSelected)}`}
              >
                <div className="text-2xl mb-2">{template.emoji}</div>
                <div className="font-medium text-white text-sm">{template.nome}</div>
                <div className="text-xs text-gray-400 mt-1">{template.descricao}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Roteiro da Ronda (se template selecionado) */}
      {templateAtual && templateAtual.roteiro.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Roteiro da {templateAtual.nome}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {templateAtual.roteiro.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <p className="text-sm text-emerald-300">
              Ao criar a ronda, você poderá registrar cada item acima indicando <strong>Andar</strong>, <strong>Local</strong> e se está <strong>OK</strong> ou <strong>NÃO OK</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Formulário */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Dados da Ronda</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Visita (se não selecionou template) */}
          {!templateSelecionado && (
            <div className="space-y-2">
              <Label className="text-gray-300">Tipo de Visita</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['RONDA', 'REUNIAO', 'OUTROS'] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => handleInputChange('tipoVisita', tipo)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.tipoVisita === tipo
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                        : 'glass-button'
                    }`}
                  >
                    {tipo === 'RONDA' && '🔍 Ronda'}
                    {tipo === 'REUNIAO' && '👥 Reunião'}
                    {tipo === 'OUTROS' && '📋 Outros'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-gray-300">Nome da Ronda *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Ex: Ronda Semanal, Vistoria Mensal"
                required
                className="glass-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data" className="text-gray-300">Data *</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => handleInputChange('data', e.target.value)}
                required
                className="glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hora" className="text-gray-300">Hora *</Label>
              <Input
                id="hora"
                type="time"
                value={formData.hora}
                onChange={(e) => handleInputChange('hora', e.target.value)}
                required
                className="glass-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Responsável</Label>
              <div className="text-sm text-gray-300 glass-input p-3 opacity-70">
                Ricardo Oliveira
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-gray-300">Observações Gerais (Opcional)</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoesGerais}
              onChange={(e) => handleInputChange('observacoesGerais', e.target.value)}
              placeholder="Observações gerais sobre a ronda..."
              rows={3}
              className="glass-input"
            />
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onVoltar} className="flex-1 glass-button">
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/30"
                disabled={!formData.nome.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Ronda
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
