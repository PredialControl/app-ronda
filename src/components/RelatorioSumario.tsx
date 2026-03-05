import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, List, X, GripVertical } from 'lucide-react';
import { Button } from './ui/button';

interface SecaoSumario {
  id: string;
  ordem: number;
  titulo: string;
  subsecoes?: SubsecaoSumario[];
}

interface SubsecaoSumario {
  id: string;
  ordem: number;
  titulo: string;
}

interface RelatorioSumarioProps {
  secoes: SecaoSumario[];
  onNavigate: (secaoId: string, subsecaoId?: string) => void;
  activeSecaoId?: string;
}

export function RelatorioSumario({ secoes, onNavigate, activeSecaoId }: RelatorioSumarioProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedSecoes, setExpandedSecoes] = useState<Set<string>>(new Set());
  const [position, setPosition] = useState({ x: 16, y: 80 }); // left-4 = 16px, top-20 = 80px
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  // Expandir todas as seções por padrão
  useEffect(() => {
    setExpandedSecoes(new Set(secoes.map(s => s.id)));
  }, [secoes]);

  // Carregar posição salva do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sumario_position');
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        setPosition(pos);
      } catch (e) {
        console.error('Erro ao carregar posição do sumário:', e);
      }
    }
  }, []);

  // Salvar posição no localStorage
  useEffect(() => {
    localStorage.setItem('sumario_position', JSON.stringify(position));
  }, [position]);

  const toggleSecao = (secaoId: string) => {
    const newExpanded = new Set(expandedSecoes);
    if (newExpanded.has(secaoId)) {
      newExpanded.delete(secaoId);
    } else {
      newExpanded.add(secaoId);
    }
    setExpandedSecoes(newExpanded);
  };

  // Handlers de drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      const newX = dragRef.current.initialX + deltaX;
      const newY = dragRef.current.initialY + deltaY;

      // Limitar aos bounds da tela
      const maxX = window.innerWidth - 320; // 320px = largura do sumário
      const maxY = window.innerHeight - 200; // altura mínima

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) {
    return (
      <div className="fixed top-20 left-4 z-40">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-gray-800 hover:bg-gray-700 text-white shadow-lg"
          size="sm"
        >
          <List className="w-4 h-4 mr-2" />
          Sumário
        </Button>
      </div>
    );
  }

  return (
    <div
      className="fixed z-40 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-80 max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'auto',
      }}
    >
      {/* Header - Arrastável */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-500" />
          <List className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-white">Sumário</h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de seções */}
      <div className="flex-1 overflow-y-auto p-2">
        {secoes.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            Nenhuma seção criada
          </p>
        ) : (
          <div className="space-y-1">
            {secoes.map((secao) => {
              const isExpanded = expandedSecoes.has(secao.id);
              const isActive = activeSecaoId === secao.id;
              const hasSubsecoes = (secao.subsecoes?.length || 0) > 0;

              return (
                <div key={secao.id}>
                  {/* Seção */}
                  <div
                    className={`flex items-center gap-1 px-2 py-2 rounded cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {hasSubsecoes && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSecao(secao.id);
                        }}
                        className="flex-shrink-0 text-gray-400 hover:text-white"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {!hasSubsecoes && <div className="w-5" />}

                    <div
                      onClick={() => onNavigate(secao.id)}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xs font-bold ${isActive ? 'text-blue-200' : 'text-blue-400'}`}>
                          {secao.ordem + 1}.
                        </span>
                        <span className="text-sm font-medium truncate">
                          {secao.titulo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Subseções */}
                  {hasSubsecoes && isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {secao.subsecoes!.map((subsecao) => (
                        <div
                          key={subsecao.id}
                          onClick={() => onNavigate(secao.id, subsecao.id)}
                          className="flex items-baseline gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        >
                          <span className="text-xs font-medium text-gray-500">
                            {secao.ordem + 1}.{subsecao.ordem + 1}
                          </span>
                          <span className="text-sm truncate">
                            {subsecao.titulo}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer com contador */}
      <div className="p-2 border-t border-gray-700 bg-gray-900 text-xs text-gray-500 text-center">
        {secoes.length} {secoes.length === 1 ? 'seção' : 'seções'}
      </div>
    </div>
  );
}
