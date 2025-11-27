import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Mail, Plus, Edit, Trash2, Save, Info } from 'lucide-react';
import { emailService, EmailDestinatario } from '@/lib/emailService';

interface ContratoEmailConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  contrato: { id: string; nome: string } | null;
}

export function ContratoEmailConfigModal({ isOpen, onClose, contrato }: ContratoEmailConfigModalProps) {
  const [destinatarios, setDestinatarios] = useState<EmailDestinatario[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setName] = useState('');
  const [editDestinatarioId, setEditDestinatarioId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && contrato) {
      const config = emailService.obterConfiguracaoEmail(contrato.id);
      if (config) {
        setDestinatarios(config.destinatarios);
      } else {
        setDestinatarios([]);
      }
      setNewEmail('');
      setName('');
      setEditDestinatarioId(null);
    }
  }, [isOpen, contrato]);

  const handleAddDestinatario = () => {
    if (!newEmail.trim() || !newName.trim()) {
      alert('Por favor, preencha email e nome.');
      return;
    }

    const novoDestinatario: EmailDestinatario = {
      id: Date.now().toString(),
      email: newEmail.trim(),
      nome: newName.trim(),
      ativo: true
    };

    setDestinatarios(prev => [...prev, novoDestinatario]);
    setNewEmail('');
    setName('');
  };

  const handleRemoveDestinatario = (id: string) => {
    if (confirm('Tem certeza que deseja remover este destinatário?')) {
      setDestinatarios(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleSaveConfig = () => {
    if (!contrato) return;

    if (destinatarios.length === 0) {
      alert('Adicione pelo menos um destinatário.');
      return;
    }

    emailService.configurarEmails(contrato.id, contrato.nome, destinatarios);
    alert('✅ Configuração de emails salva com sucesso!');
    onClose();
  };

  if (!isOpen || !contrato) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Configurar Emails - {contrato.nome}
            </h2>
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



        {/* Adicionar novo destinatário */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Adicionar Destinatário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                />
              </div>
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={newName}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do destinatário"
                />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleAddDestinatario} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Destinatário
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de destinatários */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Destinatários ({destinatarios.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {destinatarios.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhum destinatário configurado
              </p>
            ) : (
              <div className="space-y-3">
                {destinatarios.map((destinatario) => (
                  <div
                    key={destinatario.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{destinatario.nome}</span>
                        <Badge variant={destinatario.ativo ? 'default' : 'secondary'}>
                          {destinatario.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{destinatario.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditDestinatarioId(destinatario.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveDestinatario(destinatario.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSaveConfig} className="bg-purple-600 hover:bg-purple-700">
            <Save className="w-4 h-4 mr-2" />
            Salvar Configuração
          </Button>
        </div>

        {/* Informações */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">📧 Informações:</h4>
          <ul className="text-sm text-gray-800 space-y-1 list-disc list-inside">
            <li>Configure pelo menos 2 destinatários por contrato</li>
            <li>Os emails serão enviados para todos os destinatários ativos</li>
            <li>Você pode editar ou remover destinatários a qualquer momento</li>
          </ul>
        </div>
      </div>
    </div>
  );
}