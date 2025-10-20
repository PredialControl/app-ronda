import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Mail, User, Building2, Send, Settings } from 'lucide-react';
import { emailService, EmailConfig } from '@/lib/emailService';
import { Contrato } from '@/types';

interface EmailConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  contratos: Contrato[];
}

export function EmailConfigModal({ isOpen, onClose, contratos }: EmailConfigModalProps) {
  const [configuracoes, setConfiguracoes] = useState<EmailConfig[]>([]);
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);
  const [formData, setFormData] = useState({
    emailDestinatario: '',
    nomeDestinatario: ''
  });

  useEffect(() => {
    if (isOpen) {
      carregarConfiguracoes();
    }
  }, [isOpen]);

  const carregarConfiguracoes = () => {
    const configs = emailService.listarConfiguracoesEmail();
    setConfiguracoes(configs);
  };

  const handleSaveConfig = (contrato: Contrato) => {
    if (!formData.emailDestinatario.trim() || !formData.nomeDestinatario.trim()) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    const destinatario = {
      id: Date.now().toString(),
      email: formData.emailDestinatario.trim(),
      nome: formData.nomeDestinatario.trim(),
      ativo: true
    };

    emailService.configurarEmails(contrato.id, contrato.nome, [destinatario]);

    carregarConfiguracoes();
    setEditingConfig(null);
    setFormData({ emailDestinatario: '', nomeDestinatario: '' });
  };

  const handleEditConfig = (config: EmailConfig) => {
    setEditingConfig(config);
    if (config.destinatarios.length > 0) {
      setFormData({
        emailDestinatario: config.destinatarios[0].email,
        nomeDestinatario: config.destinatarios[0].nome
      });
    }
  };

  const handleDeleteConfig = (contratoId: string) => {
    if (confirm('Tem certeza que deseja remover a configuração de email para este contrato?')) {
      emailService.desativarEmail(contratoId);
      carregarConfiguracoes();
    }
  };

  const handleCancelEdit = () => {
    setEditingConfig(null);
    setFormData({ emailDestinatario: '', nomeDestinatario: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Configuração de Emails por Contrato</h2>
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

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">📧 Como funciona:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Configure um email diferente para cada contrato</li>
            <li>• Receba alertas automáticos sobre laudos vencidos ou próximos ao vencimento</li>
            <li>• Emails são enviados quando há laudos que precisam de atenção</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contratos.map(contrato => {
            const config = configuracoes.find(c => c.contratoId === contrato.id);
            const isEditing = editingConfig?.contratoId === contrato.id;

            return (
              <Card key={contrato.id} className="border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-600" />
                      <CardTitle className="text-sm font-medium text-gray-900">
                        {contrato.nome}
                      </CardTitle>
                    </div>
                    {config && (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        Configurado
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`email-${contrato.id}`} className="text-xs font-medium text-gray-700">
                          Email do Destinatário
                        </Label>
                        <Input
                          id={`email-${contrato.id}`}
                          type="email"
                          value={formData.emailDestinatario}
                          onChange={(e) => setFormData(prev => ({ ...prev, emailDestinatario: e.target.value }))}
                          placeholder="exemplo@empresa.com"
                          className="text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`nome-${contrato.id}`} className="text-xs font-medium text-gray-700">
                          Nome do Destinatário
                        </Label>
                        <Input
                          id={`nome-${contrato.id}`}
                          type="text"
                          value={formData.nomeDestinatario}
                          onChange={(e) => setFormData(prev => ({ ...prev, nomeDestinatario: e.target.value }))}
                          placeholder="Nome do responsável"
                          className="text-sm"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveConfig(contrato)}
                          className="bg-blue-600 hover:bg-blue-700 text-xs"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="text-xs"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {config ? (
                        <div className="space-y-2">
                          {config.destinatarios.map((dest, index) => (
                            <div key={dest.id} className="flex items-center gap-2 text-sm">
                              <User className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-700">{dest.nome}</span>
                              <Mail className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-700">{dest.email}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Nenhuma configuração de email</p>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditConfig(config || { 
                            id: '', 
                            contratoId: contrato.id, 
                            contratoNome: contrato.nome, 
                            destinatarios: [], 
                            ativo: true 
                          })}
                          className="text-xs"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          {config ? 'Editar' : 'Configurar'}
                        </Button>
                        {config && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteConfig(contrato.id)}
                            className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end mt-6">
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
