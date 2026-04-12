'use client';

import { Search, RefreshCw, Edit2, Trash2, X, CircleUser } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, UserStatus, UserProfile } from '@/types';
import { motion, AnimatePresence } from 'motion/react';

export default function UsersView() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('UsersView: Fetching users...');
      
      // Fetch users simply
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('UsersView: Error fetching users:', JSON.stringify(error, null, 2));
        throw error;
      } else {
        console.log('UsersView: Users fetched successfully:', data?.length);
        setUsers(data || []);
      }
    } catch (err) {
      console.error('UsersView: Fatal error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
    };
    loadData();
  }, []);

  const updateStatus = async (userId: string, status: UserStatus) => {
    try {
      console.log(`UsersView: Updating status for ${userId} to ${status}`);
      const updateData: { status: UserStatus } = { status };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
      
      if (error) {
        console.error('UsersView: Error updating status:', JSON.stringify(error, null, 2));
        alert('Erro ao atualizar status: ' + error.message);
      } else {
        console.log('UsersView: Status updated successfully');
        await fetchUsers();
      }
    } catch (err) {
      console.error('UsersView: Unexpected error in updateStatus:', err);
    }
  };

  const updateRole = async (userId: string, perfil: UserProfile) => {
    const { error } = await supabase
      .from('profiles')
      .update({ perfil })
      .eq('id', userId);
    
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, perfil } : u));
    }
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (!error) {
      setUsers(users.filter(u => u.id !== userId));
      setDeletingUser(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        nome: editingUser.nome,
        telefone: editingUser.telefone,
        empresa: editingUser.empresa,
        setor: editingUser.setor,
        cidade: editingUser.cidade,
        endereco: editingUser.endereco,
        perfil: editingUser.perfil
      })
      .eq('id', editingUser.id);

    if (!error) {
      fetchUsers();
      setEditingUser(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black font-headline text-slate-900">Gestão de Usuários</h2>
          <p className="text-slate-500 mt-2">Valide novos cadastros e gerencie permissões do sistema.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar usuários..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
            />
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); fetchUsers(); }}
            className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all text-slate-500"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/50 overflow-visible">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-6 border-b border-slate-100">Usuário</th>
                <th className="px-8 py-6 border-b border-slate-100">Empresa</th>
                <th className="px-8 py-6 border-b border-slate-100">Status</th>
                <th className="px-8 py-6 border-b border-slate-100 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-8 py-6 h-20 bg-slate-50/50"></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <Search size={32} />
                      </div>
                      <div>
                        <p className="text-slate-900 font-bold">Nenhum usuário encontrado</p>
                        <p className="text-slate-500 text-sm">Tente ajustar sua busca ou atualizar a lista.</p>
                      </div>
                      <button 
                        onClick={fetchUsers}
                        className="mt-2 px-6 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all"
                      >
                        Atualizar Lista
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-xs">
                          {user.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{user.nome}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-700">{user.empresa || 'N/A'}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-black uppercase tracking-widest rounded-lg px-3 py-1.5 ${
                        user.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 
                        user.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 
                        'bg-error/10 text-error'
                      }`}>
                        {user.status === 'ACTIVE' ? 'Validado' : user.status === 'PENDING' ? 'Pendente' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
                          title="Ver Perfil"
                        >
                          <CircleUser size={20} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeletingUser(user); }}
                          className="p-2 text-slate-400 hover:text-error hover:bg-error/5 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-sm">
                    {selectedUser.nome.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{selectedUser.nome}</h3>
                    <p className="text-xs text-slate-500 font-medium">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto">
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <DetailItem label="Empresa" value={selectedUser.empresa} />
                  <DetailItem label="Setor" value={selectedUser.setor} />
                  <DetailItem label="Telefone" value={selectedUser.telefone} />
                  <DetailItem label="Cidade" value={selectedUser.cidade} />
                  <DetailItem label="Endereço" value={selectedUser.endereco} className="md:col-span-2" />
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Management Section */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Configurações de Acesso</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil de Acesso</label>
                      <select 
                        value={selectedUser.perfil}
                        onChange={(e) => updateRole(selectedUser.id, e.target.value as UserProfile)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 outline-none font-bold uppercase tracking-widest text-xs"
                      >
                        <option value="CLIENTE">Cliente</option>
                        <option value="FUNCIONARIO">Funcionário</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status de Validação</label>
                      <select 
                        value={selectedUser.status}
                        onChange={(e) => updateStatus(selectedUser.id, e.target.value as UserStatus)}
                        className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 outline-none font-bold uppercase tracking-widest text-xs ${
                          selectedUser.status === 'ACTIVE' ? 'text-green-600' : 
                          selectedUser.status === 'PENDING' ? 'text-amber-600' : 'text-error'
                        }`}
                      >
                        <option value="PENDING">Pendente</option>
                        <option value="ACTIVE">Validado</option>
                        <option value="INACTIVE">Inativo</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <button 
                  onClick={() => { setDeletingUser(selectedUser); setSelectedUser(null); }}
                  className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest text-error hover:bg-error/5 rounded-xl transition-all"
                >
                  <Trash2 size={16} /> Excluir Usuário
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
                  >
                    Fechar
                  </button>
                  <button 
                    onClick={() => { setEditingUser(selectedUser); setSelectedUser(null); }}
                    className="px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                  >
                    <Edit2 size={16} /> Editar Dados
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-900">Editar Perfil: {editingUser.nome}</h3>
                <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input 
                      type="text" 
                      value={editingUser.nome}
                      onChange={(e) => setEditingUser({...editingUser, nome: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
                    <input 
                      type="text" 
                      value={editingUser.telefone || ''}
                      onChange={(e) => setEditingUser({...editingUser, telefone: e.target.value})}
                      placeholder="(00) 00000-0000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa</label>
                  <input 
                    type="text" 
                    value={editingUser.empresa || ''}
                    onChange={(e) => setEditingUser({...editingUser, empresa: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-5 px-4 focus:ring-2 focus:ring-secondary/20 outline-none text-lg font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                  <input 
                    type="text" 
                    value={editingUser.endereco || ''}
                    onChange={(e) => setEditingUser({...editingUser, endereco: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 outline-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Setor</label>
                    <input 
                      type="text" 
                      value={editingUser.setor || ''}
                      onChange={(e) => setEditingUser({...editingUser, setor: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade</label>
                    <input 
                      type="text" 
                      value={editingUser.cidade || ''}
                      onChange={(e) => setEditingUser({...editingUser, cidade: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil de Acesso</label>
                  <select 
                    value={editingUser.perfil}
                    onChange={(e) => setEditingUser({...editingUser, perfil: e.target.value as UserProfile})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 outline-none font-bold uppercase tracking-widest text-xs"
                  >
                    <option value="CLIENTE">Cliente</option>
                    <option value="FUNCIONARIO">Funcionário</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Excluir Usuário?</h3>
              <p className="text-slate-500 text-sm mb-8">Esta ação é irreversível. O usuário <b>{deletingUser.nome}</b> perderá acesso total ao sistema.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeletingUser(null)}
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => deleteUser(deletingUser.id)}
                  className="flex-1 py-4 bg-error text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-error/90 transition-all shadow-lg shadow-error/20"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({ label, value, className = "" }: { label: string, value: string | null | undefined, className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-900">{value || 'Não informado'}</p>
    </div>
  );
}
