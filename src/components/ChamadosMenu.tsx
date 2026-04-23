import { useState } from 'react';
import { ExternalLink, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';

interface ChamadosMenuProps {
  onNavigate?: (destination: string) => void;
}

const CHAMADOS_URL = 'https://registro-de-chamados.vercel.app';

export function ChamadosMenu({ onNavigate: _onNavigate }: ChamadosMenuProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const recarregar = () => setIframeKey(k => k + 1);
  const abrirExterno = () => window.open(CHAMADOS_URL, '_blank', 'noopener,noreferrer');

  return (
    <div className={`w-full flex flex-col ${fullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Barra de acoes */}
      <div className="flex items-center justify-between gap-3 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Registro de Chamados</h2>
          <p className="text-xs text-gray-500">Sistema integrado — login separado do App Ronda</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={recarregar}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            title="Recarregar"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Recarregar</span>
          </button>
          <button
            onClick={() => setFullscreen(f => !f)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            title={fullscreen ? 'Sair tela cheia' : 'Tela cheia'}
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{fullscreen ? 'Sair' : 'Tela cheia'}</span>
          </button>
          <button
            onClick={abrirExterno}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
            title="Abrir em nova aba"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Nova aba</span>
          </button>
        </div>
      </div>

      {/* Iframe */}
      <div className={`flex-1 bg-gray-50 ${fullscreen ? 'h-[calc(100vh-60px)]' : 'h-[calc(100vh-180px)] min-h-[600px]'}`}>
        <iframe
          key={iframeKey}
          src={CHAMADOS_URL}
          title="Registro de Chamados"
          className="w-full h-full border-0"
          allow="camera; microphone; clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
