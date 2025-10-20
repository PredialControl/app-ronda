import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Mail, Settings, CheckCircle, AlertTriangle, TestTube, ExternalLink, Info, Key, Copy } from 'lucide-react';
import { emailJSService, EmailConfig } from '@/lib/emailJSService';

interface EmailJSConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailJSConfigModal({ isOpen, onClose }: EmailJSConfigModalProps) {
  const [formData, setFormData] = useState<EmailConfig>({
    serviceId: '',
    templateId: '',
    publicKey: '',
    ativo: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = emailJSService.obterConfiguracao();
      if (config) {
        setFormData(config);
      }
      setTestResult(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!formData.serviceId.trim()) {
      alert('Por favor, informe o Service ID.');
      return;
    }

    if (!formData.templateId.trim()) {
      alert('Por favor, informe o Template ID.');
      return;
    }

    if (!formData.publicKey.trim()) {
      alert('Por favor, informe a Public Key.');
      return;
    }

    setIsSaving(true);
    
    try {
      const sucesso = emailJSService.salvarConfiguracao(formData);
      
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
    if (!formData.serviceId.trim() || !formData.templateId.trim() || !formData.publicKey.trim()) {
      alert('Por favor, preencha todos os campos antes de testar.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Salvar temporariamente para teste
      emailJSService.salvarConfiguracao(formData);
      
      const sucesso = await emailJSService.testarConfiguracao();
      
      if (sucesso) {
        setTestResult('✅ Teste realizado! Verifique sua caixa de entrada.');
      } else {
        setTestResult('❌ Falha no teste. Verifique as configurações.');
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      setTestResult('❌ Erro durante o teste. Verifique a configuração.');
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('✅ Copiado para a área de transferência!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Configurar EmailJS</h2>
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
            emailJSService.estaConfigurado() 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {emailJSService.estaConfigurado() ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
              <span className={`font-medium ${
                emailJSService.estaConfigurado() ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {emailJSService.estaConfigurado() ? 'Email Configurado' : 'Email Não Configurado'}
              </span>
            </div>
            {emailJSService.estaConfigurado() && (
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
            <li>Usa o EmailJS (gratuito) para envio confiável de emails</li>
            <li>Emails chegam diretamente na caixa de entrada</li>
            <li>Funciona com qualquer provedor de email</li>
            <li>200 emails gratuitos por mês</li>
          </ul>
        </div>

        {/* Configuração pré-definida */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">🚀 Configuração Rápida:</h3>
          <p className="text-sm text-green-800 mb-3">
            Use estes valores pré-configurados para começar rapidamente:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium w-24">Service ID:</Label>
              <Input
                value="service_1234567"
                readOnly
                className="text-sm bg-gray-100"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard('service_1234567')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium w-24">Template ID:</Label>
              <Input
                value="template_1234567"
                readOnly
                className="text-sm bg-gray-100"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard('template_1234567')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium w-24">Public Key:</Label>
              <Input
                value="public_1234567"
                readOnly
                className="text-sm bg-gray-100"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard('public_1234567')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFormData({
                serviceId: 'service_1234567',
                templateId: 'template_1234567',
                publicKey: 'public_1234567',
                ativo: true
              });
            }}
            className="mt-3 text-green-600 border-green-300 hover:bg-green-50"
          >
            <Copy className="w-4 h-4 mr-2" />
            Usar Configuração Rápida
          </Button>
        </div>

        {/* Link para criar conta */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">🔑 Como obter suas próprias chaves:</h3>
          <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside mb-3">
            <li>Acesse <a href="https://emailjs.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">emailjs.com</a></li>
            <li>Crie uma conta gratuita</li>
            <li>Configure um serviço de email (Gmail, Outlook, etc.)</li>
            <li>Crie um template de email</li>
            <li>Copie as chaves geradas</li>
          </ol>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://emailjs.com', '_blank')}
            className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Criar Conta EmailJS
          </Button>
        </div>

        {/* Formulário */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Configuração Personalizada</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="serviceId" className="text-sm font-medium text-gray-700">
                Service ID *
              </Label>
              <Input
                id="serviceId"
                value={formData.serviceId}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                placeholder="service_xxxxxxxxx"
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                ID do serviço de email configurado no EmailJS
              </p>
            </div>
            
            <div>
              <Label htmlFor="templateId" className="text-sm font-medium text-gray-700">
                Template ID *
              </Label>
              <Input
                id="templateId"
                value={formData.templateId}
                onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
                placeholder="template_xxxxxxxxx"
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                ID do template de email criado no EmailJS
              </p>
            </div>

            <div>
              <Label htmlFor="publicKey" className="text-sm font-medium text-gray-700">
                Public Key *
              </Label>
              <Input
                id="publicKey"
                value={formData.publicKey}
                onChange={(e) => setFormData(prev => ({ ...prev, publicKey: e.target.value }))}
                placeholder="public_xxxxxxxxx"
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Chave pública gerada no painel do EmailJS
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
            disabled={isTesting || !formData.serviceId.trim() || !formData.templateId.trim() || !formData.publicKey.trim()}
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {isTesting ? 'Testando...' : 'Testar Sistema'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.serviceId.trim() || !formData.templateId.trim() || !formData.publicKey.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Settings className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </div>

        {/* Informações importantes */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">✅ Vantagens do EmailJS:</h4>
          <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
            <li>Emails chegam diretamente na caixa de entrada</li>
            <li>200 emails gratuitos por mês</li>
            <li>Fácil configuração</li>
            <li>Funciona com qualquer provedor</li>
            <li>Sem necessidade de servidor próprio</li>
          </ul>
        </div>
      </div>
    </div>
  );
}















