import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Mail, Settings, CheckCircle, AlertTriangle, TestTube, ExternalLink, Info, Key } from 'lucide-react';
import { resendEmailService, EmailConfig } from '@/lib/resendEmailService';

interface ResendEmailConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResendEmailConfigModal({ isOpen, onClose }: ResendEmailConfigModalProps) {
  const [formData, setFormData] = useState<EmailConfig>({
    apiKey: '',
    fromEmail: '',
    ativo: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = resendEmailService.obterConfiguracao();
      if (config) {
        setFormData(config);
      }
      setTestResult(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!formData.apiKey.trim()) {
      alert('Por favor, informe sua API Key do Resend.');
      return;
    }

    if (!formData.fromEmail.trim()) {
      alert('Por favor, informe seu email de envio.');
      return;
    }

    setIsSaving(true);
    
    try {
      const sucesso = resendEmailService.salvarConfiguracao(formData);
      
      if (sucesso) {
        alert('✅ Configuração salva com sucesso!');
        onClose();
      } else {
        alert('❌ Erro ao salvar configuração.');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('❌ Erro ao salvar configuração.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!formData.apiKey.trim()) {
      alert('Por favor, informe sua API Key antes de testar.');
      return;
    }

    if (!formData.fromEmail.trim()) {
      alert('Por favor, informe seu email de envio antes de testar.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Salvar temporariamente para teste
      resendEmailService.salvarConfiguracao(formData);
      
      const sucesso = await resendEmailService.testarConfiguracao();
      
      if (sucesso) {
        setTestResult('✅ Teste realizado! Verifique sua caixa de entrada.');
      } else {
        setTestResult('❌ Falha no teste. Verifique a API Key e email.');
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      setTestResult('❌ Erro durante o teste. Verifique a configuração.');
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Configurar Email Resend</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Status da Configuração */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Status da Configuração</h3>
          <div className={`p-4 rounded-lg border ${
            resendEmailService.estaConfigurado() 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {resendEmailService.estaConfigurado() ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
              <span className={`font-medium ${
                resendEmailService.estaConfigurado() ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {resendEmailService.estaConfigurado() ? 'Email Configurado' : 'Email Não Configurado'}
              </span>
            </div>
            {resendEmailService.estaConfigurado() && (
              <p className="text-sm text-green-800">
                ✅ Sistema ativo e pronto para enviar emails
              </p>
            )}
          </div>
        </div>

        {/* Como funciona */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">📧 Como funciona:</h3>
          <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
            <li>Usa a API do Resend para envio confiável de emails</li>
            <li>Emails chegam diretamente na caixa de entrada</li>
            <li>Funciona com qualquer provedor de email</li>
            <li>Sem limites de envio (até 3.000 emails/mês grátis)</li>
          </ul>
        </div>

        {/* Link para criar conta */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">🔑 Como obter API Key:</h3>
          <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside mb-3">
            <li>Acesse <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">resend.com</a></li>
            <li>Crie uma conta gratuita</li>
            <li>Vá em "API Keys" e crie uma nova chave</li>
            <li>Copie a chave e cole aqui</li>
          </ol>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://resend.com', '_blank')}
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Criar Conta Resend
          </Button>
        </div>

        {/* Formulário */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Configuração</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey" className="text-sm font-medium text-gray-700">
                API Key do Resend *
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Chave de API obtida no painel do Resend
              </p>
            </div>
            
            <div>
              <Label htmlFor="fromEmail" className="text-sm font-medium text-gray-700">
                Email de Envio *
              </Label>
              <Input
                id="fromEmail"
                type="email"
                value={formData.fromEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, fromEmail: e.target.value }))}
                placeholder="seuemail@seudominio.com"
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email que aparecerá como remetente (deve estar verificado no Resend)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="ativo" className="text-sm text-gray-700">
                Ativar sistema de email
              </Label>
            </div>
          </div>
        </div>

        {/* Resultado do Teste */}
        {testResult && (
          <div className="mb-6 p-4 rounded-lg border bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-2">Resultado do Teste</h4>
            <p className={`text-sm ${
              testResult.includes('✅') ? 'text-green-700' : 'text-red-700'
            }`}>
              {testResult}
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || !formData.apiKey.trim() || !formData.fromEmail.trim()}
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {isTesting ? 'Testando...' : 'Testar Sistema'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.apiKey.trim() || !formData.fromEmail.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Settings className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </div>

        {/* Informações importantes */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">✅ Vantagens do Resend:</h4>
          <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
            <li>Emails chegam diretamente na caixa de entrada</li>
            <li>API confiável e rápida</li>
            <li>3.000 emails gratuitos por mês</li>
            <li>Funciona com qualquer provedor</li>
            <li>Sem configuração complexa</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

