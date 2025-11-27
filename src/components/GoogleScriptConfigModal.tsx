import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Mail, Settings, CheckCircle, AlertTriangle, TestTube, Copy, ExternalLink, Play } from 'lucide-react';
import { googleScriptService } from '@/lib/googleScriptService';

interface GoogleScriptConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GoogleScriptConfigModal({ isOpen, onClose }: GoogleScriptConfigModalProps) {
    const [scriptUrl, setScriptUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const url = googleScriptService.obterUrl();
            setScriptUrl(url || '');
            setTestResult(null);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!scriptUrl.trim()) {
            alert('Por favor, informe a URL do Script.');
            return;
        }

        if (!scriptUrl.includes('script.google.com')) {
            alert('A URL parece inválida. Ela deve começar com https://script.google.com/...');
            return;
        }

        setIsSaving(true);
        googleScriptService.salvarUrl(scriptUrl);
        setIsSaving(false);
        alert('✅ Configuração salva com sucesso!');
        onClose();
    };

    const handleTest = async () => {
        if (!scriptUrl.trim()) {
            alert('Salve a URL antes de testar.');
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const sucesso = await googleScriptService.testarConfiguracao();

            if (sucesso) {
                setTestResult('✅ Teste realizado com sucesso! Verifique seu email.');
            } else {
                setTestResult('❌ Falha no teste. Verifique se o script foi implantado corretamente como "Web App" e com acesso "Qualquer pessoa".');
            }
        } catch (error) {
            console.error('Erro no teste:', error);
            setTestResult('❌ Erro durante o teste.');
        } finally {
            setIsTesting(false);
        }
    };

    const copyScript = () => {
        const code = `
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var destinatario = data.destinatario;
    var assunto = data.assunto;
    var corpo = data.corpo;
    
    MailApp.sendEmail({
      to: destinatario,
      subject: assunto,
      body: corpo
    });
    
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
    `.trim();

        navigator.clipboard.writeText(code);
        alert('✅ Código copiado!');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Mail className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Configurar Email via Google</h2>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Lado Esquerdo: Instruções */}
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                                <Play className="w-4 h-4" /> Passo 1: Criar Script
                            </h3>
                            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-2">
                                <li>Acesse <a href="https://script.google.com" target="_blank" className="underline font-medium">script.google.com</a></li>
                                <li>Clique em <strong>"Novo projeto"</strong></li>
                                <li>Apague todo o código que estiver lá</li>
                                <li>Copie e cole o código abaixo:</li>
                            </ol>
                            <Button
                                size="sm"
                                variant="outline"
                                className="mt-3 w-full bg-white text-blue-700 hover:bg-blue-50"
                                onClick={copyScript}
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar Código do Script
                            </Button>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                            <h3 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                                <Settings className="w-4 h-4" /> Passo 2: Implantar
                            </h3>
                            <ol className="list-decimal list-inside text-sm text-purple-800 space-y-2">
                                <li>Clique no botão azul <strong>"Implantar"</strong> {'>'} <strong>"Nova implantação"</strong></li>
                                <li>Selecione o tipo <strong>"App da Web"</strong> (engrenagem)</li>
                                <li>Descrição: "Email App Ronda"</li>
                                <li>Executar como: <strong>"Eu"</strong> (seu email)</li>
                                <li>Quem pode acessar: <strong>"Qualquer pessoa"</strong> (Importante!)</li>
                                <li>Clique em "Implantar" e autorize o acesso</li>
                                <li>Copie a <strong>URL do App da Web</strong> gerada</li>
                            </ol>
                        </div>
                    </div>

                    {/* Lado Direito: Configuração */}
                    <div className="space-y-6">
                        <div>
                            <Label className="text-base font-medium">Passo 3: Colar URL</Label>
                            <p className="text-sm text-gray-500 mb-3">Cole a URL que você copiou no final do Passo 2.</p>
                            <div className="flex gap-2">
                                <Input
                                    value={scriptUrl}
                                    onChange={(e) => setScriptUrl(e.target.value)}
                                    placeholder="https://script.google.com/macros/s/..."
                                    className="font-mono text-xs"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h3 className="font-medium text-gray-900 mb-2">Status da Conexão</h3>
                            <div className="flex items-center gap-2">
                                {googleScriptService.estaConfigurado() ? (
                                    <>
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="text-green-700 font-medium">Configurado</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                        <span className="text-yellow-700 font-medium">Aguardando configuração</span>
                                    </>
                                )}
                            </div>
                            {testResult && (
                                <div className={`mt-3 text-sm p-2 rounded ${testResult.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {testResult}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <Button
                                onClick={handleTest}
                                disabled={isTesting || !scriptUrl}
                                variant="outline"
                                className="w-full"
                            >
                                <TestTube className="w-4 h-4 mr-2" />
                                {isTesting ? 'Testando...' : 'Testar Conexão'}
                            </Button>

                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !scriptUrl}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Salvar Configuração
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
