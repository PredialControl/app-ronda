import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Circle, Square, Move, Undo, Save, X } from 'lucide-react';

interface ImageEditorProps {
    imageUrl: string;
    onSave: (editedImageBlob: Blob) => void;
    onCancel: () => void;
}

type Tool = 'circle' | 'rectangle' | 'arrow' | 'none';

interface Annotation {
    type: 'circle' | 'rectangle' | 'arrow';
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    lineWidth: number;
}

export function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentTool, setCurrentTool] = useState<Tool>('none');
    const [isDrawing, setIsDrawing] = useState(false);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [lineWidth, setLineWidth] = useState<number>(6); // Espessura padrão aumentada

    // Carregar imagem
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setImage(img);
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                canvas.width = img.width;
                canvas.height = img.height;
                redrawCanvas(img, []);
            }
        };
        img.src = imageUrl;
    }, [imageUrl]);

    // Redesenhar canvas
    const redrawCanvas = (img: HTMLImageElement, annots: Annotation[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Limpar e desenhar imagem
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Desenhar anotações
        ctx.strokeStyle = '#EF4444'; // Vermelho
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // Vermelho transparente

        annots.forEach(annotation => {
            drawAnnotation(ctx, annotation);
        });
    };

    const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
        const { type, startX, startY, endX, endY, lineWidth: annotLineWidth } = annotation;
        ctx.lineWidth = annotLineWidth || 6; // Usar espessura da anotação

        ctx.beginPath();

        if (type === 'circle') {
            const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (type === 'rectangle') {
            const width = endX - startX;
            const height = endY - startY;
            ctx.strokeRect(startX, startY, width, height);
        } else if (type === 'arrow') {
            // Desenhar linha
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Desenhar ponta da seta
            const angle = Math.atan2(endY - startY, endX - startX);
            const arrowLength = 20;
            const arrowAngle = Math.PI / 6;

            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - arrowLength * Math.cos(angle - arrowAngle),
                endY - arrowLength * Math.sin(angle - arrowAngle)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - arrowLength * Math.cos(angle + arrowAngle),
                endY - arrowLength * Math.sin(angle + arrowAngle)
            );
            ctx.stroke();
        }
    };

    // Handlers de mouse
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (currentTool === 'none' || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        setIsDrawing(true);
        setCurrentAnnotation({
            type: currentTool as 'circle' | 'rectangle' | 'arrow',
            startX: x,
            startY: y,
            endX: x,
            endY: y,
            lineWidth: lineWidth,
        });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !currentAnnotation || !canvasRef.current || !image) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const updatedAnnotation = { ...currentAnnotation, endX: x, endY: y };
        setCurrentAnnotation(updatedAnnotation);

        // Redesenhar com anotação atual
        redrawCanvas(image, [...annotations, updatedAnnotation]);
    };

    const handleMouseUp = () => {
        if (!isDrawing || !currentAnnotation) return;

        setAnnotations([...annotations, currentAnnotation]);
        setCurrentAnnotation(null);
        setIsDrawing(false);
        setCurrentTool('none');
    };

    const handleUndo = () => {
        if (annotations.length === 0 || !image) return;
        const newAnnotations = annotations.slice(0, -1);
        setAnnotations(newAnnotations);
        redrawCanvas(image, newAnnotations);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.toBlob((blob) => {
            if (blob) {
                onSave(blob);
            }
        }, 'image/png');
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Adicionar Marcações na Foto</h3>
                    <Button
                        onClick={onCancel}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-gray-700 flex gap-2 flex-wrap">
                    <Button
                        onClick={() => setCurrentTool('circle')}
                        variant={currentTool === 'circle' ? 'default' : 'outline'}
                        size="sm"
                        className={currentTool === 'circle' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                        <Circle className="w-4 h-4 mr-2" />
                        Círculo
                    </Button>
                    <Button
                        onClick={() => setCurrentTool('rectangle')}
                        variant={currentTool === 'rectangle' ? 'default' : 'outline'}
                        size="sm"
                        className={currentTool === 'rectangle' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                        <Square className="w-4 h-4 mr-2" />
                        Retângulo
                    </Button>
                    <Button
                        onClick={() => setCurrentTool('arrow')}
                        variant={currentTool === 'arrow' ? 'default' : 'outline'}
                        size="sm"
                        className={currentTool === 'arrow' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                        <Move className="w-4 h-4 mr-2" />
                        Seta
                    </Button>

                    {/* Seletor de Espessura */}
                    <div className="flex items-center gap-2 mx-4 px-4 border-l border-r border-gray-600">
                        <span className="text-sm text-gray-300">Espessura:</span>
                        <select
                            value={lineWidth}
                            onChange={(e) => setLineWidth(Number(e.target.value))}
                            className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm"
                        >
                            <option value="2">Fina (2px)</option>
                            <option value="4">Média (4px)</option>
                            <option value="6">Normal (6px)</option>
                            <option value="8">Grossa (8px)</option>
                            <option value="10">Extra Grossa (10px)</option>
                            <option value="15">Super Grossa (15px)</option>
                        </select>
                    </div>

                    <div className="flex-1"></div>
                    <Button
                        onClick={handleUndo}
                        variant="outline"
                        size="sm"
                        disabled={annotations.length === 0}
                    >
                        <Undo className="w-4 h-4 mr-2" />
                        Desfazer
                    </Button>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 overflow-auto p-4 bg-gray-900 flex items-center justify-center">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className="max-w-full max-h-full cursor-crosshair border-2 border-gray-600"
                        style={{
                            cursor: currentTool !== 'none' ? 'crosshair' : 'default',
                            imageRendering: 'auto'
                        }}
                    />
                </div>

                {/* Instructions */}
                <div className="p-3 bg-gray-900 border-t border-gray-700">
                    <p className="text-sm text-gray-400 text-center">
                        {currentTool === 'none'
                            ? '💡 Selecione uma ferramenta acima para adicionar marcações'
                            : currentTool === 'circle'
                            ? '⭕ Clique e arraste para desenhar um círculo'
                            : currentTool === 'rectangle'
                            ? '▢ Clique e arraste para desenhar um retângulo'
                            : '➡️ Clique e arraste para desenhar uma seta'}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
                    <Button onClick={onCancel} variant="outline">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Foto com Marcações
                    </Button>
                </div>
            </div>
        </div>
    );
}
