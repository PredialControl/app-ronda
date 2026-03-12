import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
// Removido Dialog - usando modal customizado
import { Plus, Edit2, Trash2, UserCircle, Shield, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { hash } from 'bcryptjs';

interface Usuario {
  id: string;
  email: string;
  nome: string;
  cargo: string | null;
  is_admin: boolean;
  ativo: boolean;
  ultimo_acesso: string | null;
  created_at: string;
}

interface GerenciarUsuariosProps {
  usuarioLogado: any;
}

export function GerenciarUsuarios({ usuarioLogado }: GerenciarUsuariosProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);

  // Form state
  const [formEmail, setFormEmail] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formCargo, setFormCargo] = useState('');
  const [formSenha, setFormSenha] = useState('');
  const [formIsAdmin, setFormIsAdmin] = useState(false);
  const [formAtivo, setFormAtivo] = useState(true);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsuarios(data);
    }
    setLoading(false);
  };

  const abrirModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditando(usuario);
      setFormEmail(usuario.email);
      setFormNome(usuario.nome);
      setFormCargo(usuario.cargo || '');
      setFormSenha('');
      setFormIsAdmin(usuario.is_admin);
      setFormAtivo(usuario.ativo);
    } else {
      setEditando(null);
      setFormEmail('');
      setFormNome('');
      setFormCargo('');
      setFormSenha('');
      setFormIsAdmin(false);
      setFormAtivo(true);
    }
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditando(null);
  };

  const handleSalvar = async () => {
    try {
      if (editando) {
        // Atualizar usuário existente
        const updateData: any = {
          nome: formNome,
          cargo: formCargo,
          is_admin: formIsAdmin,
          ativo: formAtivo,
        };

        // Se mudou a senha, criptografar
        if (formSenha) {
          updateData.senha_hash = await hash(formSenha, 10);
        }

        const { error } = await supabase
          .from('usuarios')
          .update(updateData)
          .eq('id', editando.id);

        if (error) throw error;

        alert('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário
        if (!formSenha) {
          alert('Senha é obrigatória para novos usuários');
          return;
        }

        const senhaHash = await hash(formSenha, 10);

        const { error } = await supabase
          .from('usuarios')
          .insert([{
            email: formEmail.toLowerCase().trim(),
            senha_hash: senhaHash,
            nome: formNome,
            cargo: formCargo,
            is_admin: formIsAdmin,
            ativo: formAtivo,
          }]);

        if (error) throw error;

        alert('Usuário criado com sucesso!');
      }

      fecharModal();
      carregarUsuarios();
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      alert('Erro ao salvar usuário: ' + err.message);
    }
  };

  const handleDeletar = async (usuario: Usuario) => {
    if (usuario.id === usuarioLogado.id) {
      alert('Você não pode deletar seu próprio usuário!');
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar o usuário ${usuario.nome}?`)) {
      return;
    }

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', usuario.id);

    if (error) {
      alert('Erro ao deletar usuário: ' + error.message);
    } else {
      alert('Usuário deletado com sucesso!');
      carregarUsuarios();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Gerenciar Usuários</h2>
        <Button
          onClick={() => abrirModal()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-400">Carregando...</p>
      ) : (
        <div className="grid gap-4">
          {usuarios.map(usuario => (
            <Card key={usuario.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                      {usuario.is_admin ? (
                        <Shield className="w-6 h-6 text-yellow-500" />
                      ) : (
                        <UserCircle className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{usuario.nome}</h3>
                        {usuario.is_admin && (
                          <span className="px-2 py-1 text-xs bg-yellow-900/30 text-yellow-500 rounded border border-yellow-800">
                            Admin
                          </span>
                        )}
                        {!usuario.ativo && (
                          <span className="px-2 py-1 text-xs bg-red-900/30 text-red-500 rounded border border-red-800">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{usuario.email}</p>
                      {usuario.cargo && (
                        <p className="text-sm text-gray-500">{usuario.cargo}</p>
                      )}
                      {usuario.ultimo_acesso && (
                        <p className="text-xs text-gray-600 mt-1">
                          Último acesso: {new Date(usuario.ultimo_acesso).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => abrirModal(usuario)}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeletar(usuario)}
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-400 hover:bg-red-900/20"
                      disabled={usuario.id === usuarioLogado.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-800 border-gray-700 text-white max-w-md w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  {editando ? 'Editar Usuário' : 'Novo Usuário'}
                </CardTitle>
                <Button
                  onClick={fecharModal}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                disabled={!!editando}
                required
              />
            </div>

            <div>
              <Label htmlFor="nome" className="text-gray-300">Nome</Label>
              <Input
                id="nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="cargo" className="text-gray-300">Cargo</Label>
              <Input
                id="cargo"
                value={formCargo}
                onChange={(e) => setFormCargo(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="senha" className="text-gray-300">
                Senha {editando && '(deixe em branco para manter)'}
              </Label>
              <Input
                id="senha"
                type="password"
                value={formSenha}
                onChange={(e) => setFormSenha(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder={editando ? 'Nova senha (opcional)' : 'Senha'}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsAdmin}
                  onChange={(e) => setFormIsAdmin(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Administrador</span>
              </label>

              <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formAtivo}
                  onChange={(e) => setFormAtivo(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Ativo</span>
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                onClick={fecharModal}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSalvar}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editando ? 'Salvar' : 'Criar'}
              </Button>
            </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
