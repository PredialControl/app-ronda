import { AlertTriangle, Copy, X } from 'lucide-react';
import { Button } from './ui/button';

interface ErrorModalProps {
  isOpen: boolean;
  error: Error | null;
  onClose: () => void;
  onRetry?: () => void;
  onRestore?: () => void;
  hasBackup?: boolean;
}

export function ErrorModal({ isOpen, error, onClose, onRetry, onRestore, hasBackup = false }: ErrorModalProps) {
  if (!isOpen || !error) return null;

  const copyErrorToClipboard = () => {
    let errorText = `Erro: ${error.message}`;
    if ((error as any).code) errorText += `\n\nCódigo: ${(error as any).code}`;
    if ((error as any).details) errorText += `\n\nDetalhes: ${(error as any).details}`;
    if ((error as any).hint) errorText += `\n\nDica: ${(error as any).hint}`;
    if (error.stack) errorText += `\n\nStack: ${error.stack}`;

    navigator.clipboard.writeText(errorText);
    alert('Erro copiado! Envie para o suporte técnico.');
  };

  const getErrorMessage = (error: Error): string => {
    const message = error.message.toLowerCase();

    // Erros de rede
    if (message.includes('network') || message.includes('fetch')) {
      return 'Erro de conexão com a internet. Verifique sua conexão e tente novamente.';
    }

    // Erros de timeout
    if (message.includes('timeout') || message.includes('aborted')) {
      return 'A operação demorou muito tempo. A internet pode estar lenta.';
    }

    // Erros de permissão
    if (message.includes('permission') || message.includes('denied')) {
      return 'Você não tem permissão para realizar esta operação.';
    }

    // Erros do Supabase
    if (message.includes('duplicate') || message.includes('unique')) {
      return 'Já existe um registro com estes dados.';
    }

    if (message.includes('foreign key') || message.includes('violates')) {
      return 'Erro de integridade dos dados. Alguns dados relacionados podem estar faltando.';
    }

    // Erro genérico com mensagem original
    return error.message || 'Erro desconhecido ao salvar os dados.';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-800 border-2 border-red-500/50 rounded-lg max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="bg-red-600 p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Erro ao Salvar</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Mensagem amigável */}
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
            <p className="text-white text-lg font-medium mb-2">
              {getErrorMessage(error)}
            </p>
            {hasBackup && (
              <p className="text-yellow-300 text-sm">
                ⚠️ Seus dados foram salvos localmente. Você pode restaurá-los clicando no botão abaixo.
              </p>
            )}
          </div>

          {/* Detalhes técnicos (expansível) */}
          <details className="bg-gray-900 rounded-lg">
            <summary className="p-3 cursor-pointer text-gray-400 hover:text-white transition-colors">
              Ver detalhes técnicos (enviar para o suporte)
            </summary>
            <div className="p-4 border-t border-gray-700">
              <div className="bg-black rounded p-3 font-mono text-xs text-red-400 overflow-auto max-h-40">
                <p className="mb-2">
                  <strong>Erro:</strong> {error.message}
                </p>
                {(error as any).code && (
                  <p className="mb-2">
                    <strong>Código:</strong> {(error as any).code}
                  </p>
                )}
                {(error as any).details && (
                  <p className="mb-2">
                    <strong>Detalhes:</strong> {(error as any).details}
                  </p>
                )}
                {(error as any).hint && (
                  <p className="mb-2">
                    <strong>Dica:</strong> {(error as any).hint}
                  </p>
                )}
                {error.stack && (
                  <pre className="whitespace-pre-wrap break-words mt-3">
                    <strong>Stack:</strong><br/>
                    {error.stack}
                  </pre>
                )}
              </div>
              <button
                onClick={copyErrorToClipboard}
                className="mt-3 flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copiar erro para área de transferência
              </button>
            </div>
          </details>

          {/* O que fazer */}
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
            <h3 className="font-bold text-white mb-2">O que você pode fazer:</h3>
            <ul className="space-y-1 text-gray-300 text-sm">
              <li>1. Verifique sua conexão com a internet</li>
              <li>2. Clique em "Tentar Novamente" para salvar de novo</li>
              {hasBackup && <li>3. Se o erro persistir, clique em "Restaurar Backup Local"</li>}
              <li>{hasBackup ? '4' : '3'}. Se nada funcionar, copie o erro e envie para o suporte</li>
            </ul>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="p-4 bg-gray-900 rounded-b-lg flex gap-3 justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            Fechar
          </Button>

          {hasBackup && onRestore && (
            <Button
              onClick={onRestore}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Restaurar Backup Local
            </Button>
          )}

          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Tentar Novamente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
