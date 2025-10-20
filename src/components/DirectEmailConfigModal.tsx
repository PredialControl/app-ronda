import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Mail, Settings, CheckCircle, AlertTriangle, TestTube, ExternalLink, Info } from 'lucide-react';
import { directEmailService, EmailConfig } from '@/lib/directEmailService';

interface DirectEmailConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DirectEmailConfigModal({ isOpen, onClose }: DirectEmailConfigModalProps) {
  const [formData, setFormData] = useState<EmailConfig>({
    email: '',
    senhaApp: '',
    ativo: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = directEmailService.obterConfiguracao();
      if (config) {
        setFormData(config);
      }
      setTestResult(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!formData.email.trim()) {
      alert('Por favor, informe seu email.');
      return;
    }

    setIsSaving(true);
    
    try {
      const sucesso = directEmailService.salvarConfiguracao(formData);
      
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
    if (!formData.email.trim()) {
      alert('Por favor, informe seu email antes de testar.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Salvar temporariamente para teste
      directEmailService.salvarConfiguracao(formData);
      
      const sucesso = await directEmailService.testarConfiguracao();
      
      if (sucesso) {
        setTestResult('✅ Teste realizado! O sistema abrirá seu cliente de email padrão.');
      } else {
        setTestResult('❌ Falha no teste. Verifique a configuração.');
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
            <h2 className="text-xl font-semibold text-gray-900">Configurar Email</h2>
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
            directEmailService.estaConfigurado() 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {directEmailService.estaConfigurado() ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
              <span className={`font-medium ${
                directEmailService.estaConfigurado() ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {directEmailService.estaConfigurado() ? 'Email Configurado' : 'Email Não Configurado'}
              </span>
            </div>
            {directEmailService.estaConfigurado() && (
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
            <li>O sistema abre seu cliente de email padrão (Outlook, Gmail, etc.)</li>
            <li>O email já vem preenchido com destinatário, assunto e conteúdo</li>
            <li>Você só precisa clicar em "Enviar" no seu cliente de email</li>
            <li>Funciona com qualquer provedor de email</li>
          </ul>
        </div>

        {/* Formulário */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Configuração</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Seu Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="seuemail@gmail.com"
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email que aparecerá como remetente
              </p>
            </div>
            
            <div>
              <Label htmlFor="senhaApp" className="text-sm font-medium text-gray-700">
                Senha de App (Opcional)
              </Label>
              <Input
                id="senhaApp"
                type="password"
                value={formData.senhaApp}
                onChange={(e) => setFormData(prev => ({ ...prev, senhaApp: e.target.value }))}
                placeholder="Deixe vazio se não souber"
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Para Gmail: senha de app. Para outros: pode deixar vazio.
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
            disabled={isTesting || !formData.email.trim()}
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {isTesting ? 'Testando...' : 'Testar Sistema'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.email.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Settings className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </div>

        {/* Informações importantes */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">✅ Vantagens deste sistema:</h4>
          <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
            <li>Funciona com qualquer provedor de email</li>
            <li>Não precisa de APIs externas</li>
            <li>Usa seu cliente de email padrão</li>
            <li>Mais confiável e simples</li>
            <li>Sem limites de envio</li>
          </ul>
        </div>
      </div>
    </div>
  );
}