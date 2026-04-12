'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { User, Phone, Building, MapPin, Shield, Save, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function ProfileView({ profile, onUpdate }: { profile: Profile, onUpdate: () => void }) {
  const [nome, setNome] = useState(profile.nome);
  const [telefone, setTelefone] = useState(profile.telefone || '');
  const [empresa, setEmpresa] = useState(profile.empresa || '');
  const [setor, setSetor] = useState(profile.setor || '');
  const [cidade, setCidade] = useState(profile.cidade || '');
  const [endereco, setEndereco] = useState(profile.endereco || '');
  const [tax_id, setTaxId] = useState(profile.tax_id || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone length (11 digits)
    const phoneDigits = telefone.replace(/\D/g, '');
    if (phoneDigits.length > 0 && phoneDigits.length !== 11) {
      setMessage({ type: 'error', text: 'O telefone deve conter exatamente 11 dígitos (DDD + número).' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        nome,
        telefone,
        empresa,
        setor,
        cidade,
        endereco,
        tax_id
      })
      .eq('id', profile.id);

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      onUpdate();
    }
    setLoading(false);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      let formatted = numbers;
      if (numbers.length > 2) {
        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      }
      if (numbers.length > 7) {
        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
      }
      return formatted;
    }
    return value.slice(0, 15); // Limit to formatted length
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setTelefone(formatted);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black font-headline text-slate-900">Meu Perfil</h2>
          <p className="text-slate-500 mt-2">Gerencie suas informações pessoais e da empresa.</p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
          ['SUPER_ADMIN', 'ADMIN'].includes(profile.perfil) ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'bg-slate-100 text-slate-500'
        }`}>
          <Shield size={14} /> {profile.perfil === 'SUPER_ADMIN' ? 'Super Admin' : profile.perfil === 'ADMIN' ? 'Administrador' : profile.perfil === 'FUNCIONARIO' ? 'Funcionário' : 'Cliente'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/50 text-center sticky top-24">
            <div className="w-24 h-24 rounded-3xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-3xl mx-auto mb-4">
              {profile.nome.slice(0, 2).toUpperCase()}
            </div>
            <h3 className="text-xl font-black text-slate-900">{profile.nome}</h3>
            <p className="text-sm text-slate-500 mb-6">{profile.email}</p>
            <div className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
              profile.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'
            }`}>
              Status: {profile.status === 'ACTIVE' ? 'Ativo' : 'Pendente'}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-3">
          <motion.form 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleUpdate} 
            className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200/50 space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <User size={14} /> Nome Completo
                </label>
                <input 
                  type="text" 
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-6 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-lg font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Phone size={14} /> Telefone
                </label>
                <input 
                  type="text" 
                  value={telefone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-6 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-lg font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Building size={14} /> Empresa
              </label>
              <input 
                type="text" 
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Nome da sua empresa"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-6 px-6 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-xl font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Building size={14} /> Identificação Fiscal (CNPJ/CPF)
              </label>
              <input 
                type="text" 
                value={tax_id}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-6 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-lg font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <MapPin size={14} /> Endereço Completo
              </label>
              <input 
                type="text" 
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, bairro, CEP"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-6 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-lg font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Shield size={14} /> Setor
                </label>
                <input 
                  type="text" 
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  placeholder="Ex: Logística / TI"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-6 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-lg font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MapPin size={14} /> Cidade
                </label>
                <input 
                  type="text" 
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Sua cidade"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-6 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-lg font-medium"
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-2xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-error/10 text-error'}`}>
                {message.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-black py-6 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Salvar Alterações
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
