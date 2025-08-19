import React, { forwardRef } from 'react';
import { AreaTecnica } from '@/types';
import { Ronda } from '@/types';
import { Contrato } from '@/types';
import { AreaTecnicaCard } from './AreaTecnicaCard';
import { FotoRondaCard } from './FotoRondaCard';
import { LogoPrint } from './LogoPrint';

interface PrintRondaProps {
  ronda: Ronda;
  contrato: Contrato;
  areasTecnicas: AreaTecnica[];
}

export const PrintRonda = forwardRef<HTMLDivElement, PrintRondaProps>(
  ({ ronda, contrato, areasTecnicas }, ref) => {
    return (
      <div ref={ref} className="print-container p-8 bg-white">
        {/* Cabeçalho da Ronda */}
        <div className="mb-8">
          {/* Cabeçalho Azul Escuro - Ocupando toda a largura */}
          <div className="bg-blue-800 p-6 mb-6">
            <div className="flex items-center justify-between">
              {/* Logo e Nome da Empresa - Lado Esquerdo */}
              <LogoPrint size="lg" />
              
              {/* Informações do Relatório - Lado Direito */}
              <div className="text-right text-white">
                <div className="text-sm font-medium">Relatório de Ronda Técnica</div>
                <div className="text-xs opacity-90 mt-1">
                  {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>
          </div>
          
          {/* Área Branca com Detalhes do Contrato - Borda Pontilhada */}
          <div className="border-2 border-dashed border-gray-300 p-6 bg-white rounded-lg">
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-800 mb-2">
                {contrato.nome}
              </div>
              <div className="text-lg text-gray-600">
                {ronda.nome}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Responsável: {ronda.responsavel || 'Não informado'} | 
                Data: {new Date().toLocaleDateString('pt-BR')} | 
                Hora: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* Informações do Contrato */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Informações do Contrato
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Síndico:</span> {contrato.sindico}
            </div>
            <div>
              <span className="font-medium">Endereço:</span> {contrato.endereco}
            </div>
            <div>
              <span className="font-medium">Periodicidade:</span> {contrato.periodicidade}
            </div>
            <div>
              <span className="font-medium">Data de Criação:</span> {new Date(contrato.dataCriacao).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Observações Gerais */}
        {ronda.observacoesGerais && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-blue-800">
              Observações Gerais da Ronda
            </h3>
            <p className="text-blue-700">{ronda.observacoesGerais}</p>
          </div>
        )}

        {/* Áreas Técnicas */}
        <div className="mb-6 print-section">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 print-section-title">
            Áreas Técnicas Verificadas
          </h2>
          <div className="grid grid-cols-2 gap-4 print-grid">
            {areasTecnicas.map((area, index) => (
              <div key={area.id} className="print-card-container">
                <AreaTecnicaCard
                  areaTecnica={area}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isPrintMode={true}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Itens Abertura de Chamado */}
        {ronda.fotosRonda.length > 0 && (
          <div className="mb-6 print-section">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 print-section-title">
              Itens Abertura de Chamado
            </h2>
            <div className="grid grid-cols-2 gap-4 print-grid">
              {ronda.fotosRonda.map((foto, index) => (
                <div key={foto.id} className="print-card-container">
                  <FotoRondaCard
                    fotoRonda={foto}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    isPrintMode={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outros Itens Corrigidos */}
        {ronda.outrosItensCorrigidos && ronda.outrosItensCorrigidos.length > 0 && (
          <div className="mb-6 print-section">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 print-section-title">
              Outros Itens Corrigidos
            </h2>
            <div className="grid grid-cols-2 gap-4 print-grid">
              {ronda.outrosItensCorrigidos.map((item, index) => (
                <div key={item.id} className="print-card-container">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg">{item.nome}</h3>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {item.tipo}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                          {item.prioridade}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {item.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-700 text-sm">{item.descricao}</p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">📍 Local:</span> {item.local}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">📅 Data:</span> {new Date(item.data).toLocaleDateString('pt-BR')}
                        </div>
                        <div>
                          <span className="font-medium">🕐 Hora:</span> {item.hora}
                        </div>
                      </div>

                      {item.responsavel && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">👤 Responsável:</span> {item.responsavel}
                        </div>
                      )}

                      {item.observacoes && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">📝 Observações:</span> {item.observacoes}
                          </p>
                        </div>
                      )}

                      {item.foto && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="mb-2">
                            <span className="font-medium text-sm text-gray-600">📷 Foto:</span>
                          </div>
                          <div className="relative">
                            <img 
                              src={item.foto} 
                              alt={`Foto do item - ${item.nome}`}
                              className="w-full h-32 object-cover rounded-lg border shadow-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📊 Resumo Executivo – Pontos Críticos */}
        <div className="mt-8 mb-6 print-section">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📊</span>
              <h2 className="text-2xl font-bold text-red-900">Resumo Executivo – Pontos Críticos</h2>
            </div>
            
            {/* Estatísticas em Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Total de Áreas */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">{areasTecnicas.length}</div>
                <div className="text-sm font-medium text-gray-600">Total de Áreas</div>
              </div>

              {/* Áreas Ativas */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {areasTecnicas.filter(area => area.status === 'ATIVO').length}
                </div>
                <div className="text-sm font-medium text-gray-600">Áreas Ativas</div>
              </div>

              {/* Áreas com Problemas */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200 text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {areasTecnicas.filter(area => area.status === 'EM MANUTENÇÃO' || area.status === 'ATENÇÃO').length}
                </div>
                <div className="text-sm font-medium text-gray-600">Áreas Críticas</div>
              </div>

              {/* Itens Pendentes */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {ronda.fotosRonda.length + ronda.outrosItensCorrigidos.length}
                </div>
                <div className="text-sm font-medium text-gray-600">Itens Pendentes</div>
              </div>
            </div>

            {/* Análise de Criticidade */}
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <h3 className="text-lg font-semibold text-red-800 mb-3">🚨 Análise de Criticidade</h3>
              
              {/* Status das Áreas Técnicas */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">Status das Áreas Técnicas:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>ATIVO: {areasTecnicas.filter(area => area.status === 'ATIVO').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>ATENÇÃO: {areasTecnicas.filter(area => area.status === 'ATENÇÃO').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>EM MANUTENÇÃO: {areasTecnicas.filter(area => area.status === 'EM MANUTENÇÃO').length}</span>
                  </div>
                </div>
              </div>

              {/* Pontos Críticos Identificados */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">Pontos Críticos Identificados:</h4>
                <div className="space-y-2">
                  {(() => {
                    const areasCriticas = areasTecnicas.filter(area => 
                      area.status === 'EM MANUTENÇÃO' || area.status === 'ATENÇÃO'
                    );
                    
                    if (areasCriticas.length > 0) {
                      return areasCriticas.map((area, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="text-red-600">⚠️</span>
                          <span className="font-medium">{area.nome}:</span>
                          <span className="text-red-600 font-medium">{area.status}</span>
                          {area.observacoes && (
                            <span className="text-gray-600">- {area.observacoes}</span>
                          )}
                        </div>
                      ));
                    } else {
                      return (
                        <div className="text-green-600 text-sm">
                          ✅ Nenhum ponto crítico identificado. Todas as áreas técnicas estão funcionando normalmente.
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Recomendações */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">📋 Recomendações:</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  {(() => {
                    const areasCriticas = areasTecnicas.filter(area => 
                      area.status === 'EM MANUTENÇÃO' || area.status === 'ATENÇÃO'
                    );
                    
                    if (areasCriticas.length > 0) {
                      return (
                        <>
                          <div>• Verificar imediatamente as áreas com status ATENÇÃO</div>
                          <div>• Programar manutenção para áreas em EM MANUTENÇÃO</div>
                          <div>• Documentar todas as correções realizadas</div>
                          <div>• Agendar nova verificação após correções</div>
                        </>
                      );
                    } else {
                      return (
                        <div>• Manter rotina de verificações preventivas</div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-8 pt-4">
          {/* Logo no rodapé - Cabeçalho Completo */}
          <div className="bg-blue-800 p-4 rounded-lg shadow-lg mb-3">
            <div className="flex items-center justify-between">
              <LogoPrint size="sm" />
              <div className="text-right text-white text-xs opacity-90">
                <div>App Ronda - Sistema de Gestão de Rondas Técnicas</div>
                <div className="mt-1">Relatório gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</div>
              </div>
            </div>
          </div>
         
         {/* Informações adicionais do rodapé */}
         <div className="text-center text-sm text-gray-500">
           <p className="font-medium text-blue-800">MANUTENÇÃO PREDIAL</p>
         </div>
       </div>
      </div>
    );
  }
);

PrintRonda.displayName = 'PrintRonda';
