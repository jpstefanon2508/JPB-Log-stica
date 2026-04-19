'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Phone, Building2, FileText, MapPin, Loader2, Save, ChevronRight, CheckCircle2, Lock } from 'lucide-react';

export default function CompleteProfilePage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [cancelling, setCancelling] = useState(false);
  
  const [formData, setFormData] = useState({
    telefone: '',
    empresa: '',
    company_id: '',
    tax_id: '',
    endereco: '',
  });
  const [newCompany, setNewCompany] = useState(false);

  const router = useRouter();

  const [companies, setCompanies] = useState<{ id: string, nome: string }[]>([]);
  
  useEffect(() => {
    let mounted = true;
    
    const fetchCompanies = async () => {
      const { data, error } = await supabase.from('companies').select('id, nome').order('nome');
      if (!error && mounted && data) {
        setCompanies(data);
      }
    };
    fetchCompanies();

    
    // Safety timeout
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('CompleteProfile: Safety timeout reached');
        setFetching(false);
      }
    }, 5000);

    const checkProfile = async () => {
      console.log('CompleteProfile: Checking profile...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('CompleteProfile: No session, redirecting to login');
        router.push('/login');
        return;
      }

      const { data: profileResult, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('CompleteProfile: Error fetching profile:', fetchError.message || fetchError);
      }

      let profile = profileResult;

      if (!profile) {
        console.log('CompleteProfile: Profile missing, creating...');
        // Create profile if missing (fallback for trigger)
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: session.user.id,
            nome: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
            email: session.user.email!,
            empresa: session.user.user_metadata?.company_name || '',
            status: 'PENDING',
            perfil: 'CLIENTE'
          }])
          .select()
          .single();
        
        if (insertError) {
          if (insertError.code === '23505' || (insertError.message && insertError.message.includes('duplicate key'))) {
            console.log('CompleteProfile: Profile already created by trigger. Refetching...');
            const { data: refetchedProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            profile = refetchedProfile;
          } else {
            console.error('CompleteProfile: Error creating profile:', insertError.message || insertError);
            setError('Erro ao criar perfil inicial: ' + (insertError.message || 'Erro desconhecido'));
          }
        } else {
          profile = newProfile;
        }
      }

      if (profile) {
        console.log('CompleteProfile: Profile found/created');
        setFormData({
          telefone: profile.telefone || '',
          empresa: profile.empresa || '',
          company_id: profile.company_id || '',
          tax_id: profile.tax_id || '',
          endereco: profile.endereco || '',
        });
      }
      
      if (mounted) {
        setFetching(false);
        clearTimeout(timeoutId);
      }
    };

    checkProfile();
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [router]);

  const handleCancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('CompleteProfile: Clearing profile data before logout...');
        // Clear the pending info in the profile table
        await supabase
          .from('profiles')
          .update({
            telefone: null,
            setor: null,
            tax_id: null,
            endereco: null
          })
          .eq('id', session.user.id);
      }

      console.log('CompleteProfile: Signing out...');
      await supabase.auth.signOut();
      
      // Clear any local storage or session data that might persist
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        window.sessionStorage.clear();
      }

      router.replace('/login');
    } catch (err) {
      console.error('CompleteProfile: Error in handleCancel:', err);
      // Force redirect even on error
      router.replace('/login');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    let finalCompanyId = formData.company_id || null;

    // Se ele escolheu escrever uma nova empresa, criamos no banco de empresas
    if (newCompany && formData.empresa) {
      const { data: newCompData, error: compError } = await supabase
        .from('companies')
        .insert([{ nome: formData.empresa }])
        .select('id')
        .single();
        
      if (!compError && newCompData) {
        finalCompanyId = newCompData.id;
      } else {
        console.error('Error creating new company:', compError);
        // We will continue even if it fails, and just save string in profile
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        telefone: formData.telefone,
        empresa: formData.empresa,
        company_id: finalCompanyId,
        tax_id: formData.tax_id,
        endereco: formData.endereco,
        status: 'PENDING', // Keep as pending until admin approves if that's the flow
      })
      .eq('id', session.user.id);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-start mb-8 w-full">
          <button 
            type="button"
            onClick={handleCancel}
            disabled={cancelling || loading}
            className="text-slate-400 font-bold hover:text-error transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {cancelling ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <ChevronRight className="rotate-180" size={18} />
            )}
            {cancelling ? 'Saindo...' : 'Voltar para Login'}
          </button>
          
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Lock size={12} /> Conexão Segura
          </div>
        </div>

        <div className="flex flex-col items-center mb-12">
          <div className="w-12 h-12 bg-[#0F172A] rounded-xl flex items-center justify-center mb-4">
             <span className="text-white font-black text-xl">JPB</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 font-headline">Finalize Seu Perfil</h1>
          <p className="text-slate-500 text-center max-w-lg leading-relaxed">
            Complete seus dados para acessar o painel administrativo da JPB Logística.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <form onSubmit={handleSubmit} className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="tel" 
                    required
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="+55 (21) 00000-0000"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa Vinculada</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    required={!newCompany}
                    value={newCompany ? 'new' : formData.company_id}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'new') {
                        setNewCompany(true);
                        setFormData({...formData, company_id: '', empresa: ''});
                      } else {
                        setNewCompany(false);
                        const comp = companies.find(c => c.id === val);
                        setFormData({...formData, company_id: val, empresa: comp?.nome || ''});
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none"
                  >
                    <option value="">Selecione sua empresa</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                    <option value="new">Outra / Nenhuma das opções</option>
                  </select>
                </div>
              </div>

              {newCompany && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Nova Empresa</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      value={formData.empresa}
                      onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                      placeholder="Qual o nome da sua empresa?"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificação Fiscal (CNPJ/CPF)</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    value={formData.tax_id}
                    onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                    placeholder="00.000.000/0000-00"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Principal de Entrega</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    placeholder="Rua, número, complemento, CEP..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {error && <div className="bg-error/10 text-error text-sm font-bold p-4 rounded-xl text-center mb-8">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 text-sm font-bold p-4 rounded-xl text-center mb-8 flex items-center justify-center gap-2"><CheckCircle2 size={20} /> Perfil atualizado com sucesso! Redirecionando...</div>}

            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-8 gap-4">
              <button 
                type="button"
                onClick={() => router.push('/')}
                className="text-primary font-bold hover:underline flex items-center gap-2"
              >
                Salvar Rascunho
              </button>
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                <span>Concluir Cadastro</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </form>
        </div>

        <div className="mt-12 flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <div className="flex gap-6">
            <span className="flex items-center gap-2"><Lock size={12} /> Criptografia de Ponta a Ponta</span>
            <span className="flex items-center gap-2"><Phone size={12} /> Suporte Prioritário 24/7</span>
          </div>
          <span>© 2024 JPB LOGÍSTICA SYSTEMS V4.2</span>
        </div>
      </div>
    </div>
  );
}
