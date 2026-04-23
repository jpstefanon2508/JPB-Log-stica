'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, User, Building, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (typeof window !== 'undefined') window.location.href = '/';
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === 'Invalid login credentials') {
        setError('Acesso negado. Tente novamente ou cadastre-se.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      if (typeof window !== 'undefined') window.location.href = '/';
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !company) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!agreeTerms) {
      setError('Você deve concordar com os termos de serviço.');
      return;
    }
    
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: company,
        }
      }
    });

    if (error) {
      console.error('SignUp Error:', error);
      if (error.message.includes('User already registered')) {
        setError('Este e-mail já está cadastrado. Por favor, vá em "Entrar agora".');
      } else {
        setError(error.message + (error.status ? ` (Status: ${error.status})` : ''));
      }
      setLoading(false);
    } else {
      if (!data.session) {
        setSuccess('Contra criada. Confirme seu e-mail para fazer login.');
        setLoading(false);
      } else {
        setSuccess('Conta criada com sucesso! Redirecionando...');
        // Small delay to show success message
        setTimeout(() => {
          router.push('/complete-profile');
        }, 1500);
      }
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      {/* Left Side - Brand/Hero */}
      <div className="w-full md:w-1/2 bg-[#0F172A] relative flex flex-col justify-between p-12 md:p-20 text-white overflow-hidden">
        {/* Background Pattern/Image Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <Image 
            src="https://picsum.photos/seed/logistics/1920/1080?blur=10"
            alt="Background"
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#0F172A]/90 to-primary/30"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xl">JPB</span>
            </div>
            <span className="text-xl font-black tracking-widest uppercase">JPB Logística</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 font-headline">
              {mode === 'login' ? (
                <>Precision Thermal<br />Control Solutions.</>
              ) : (
                <>Thermal Control<br />at Your Fingertips.</>
              )}
            </h1>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              {mode === 'login' 
                ? 'Otimizando a cadeia de frio para entrega e monitoramento de gelo seco de alto desempenho.'
                : 'Junte-se ao líder da indústria em logística de precisão. Proteja sua cadeia de suprimentos com nossas soluções.'
              }
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0F172A] overflow-hidden">
                  <Image src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" width={40} height={40} referrerPolicy="no-referrer" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-[#0F172A] bg-primary flex items-center justify-center text-[10px] font-bold">
                +2k
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
              Confiança de parceiros globais
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 bg-white">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-3xl font-black text-slate-900 mb-2 font-headline">JPB Logística - Portal do Cliente</h2>
                <p className="text-slate-500 mb-8">Entre para gerenciar seus pedidos de gelo seco</p>

                <button 
                  onClick={handleGoogleLogin}
                  className="w-full border border-slate-200 rounded-xl py-3 flex items-center justify-center gap-3 font-bold text-slate-700 hover:bg-slate-50 transition-all mb-8 shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Fazer login com Google
                </button>

                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                    <span className="bg-white px-4">Ou use seu e-mail</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail Corporativo</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nome@empresa.com"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
                      <button type="button" className="text-[10px] font-bold text-primary hover:underline">Esqueceu a senha?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-12 pr-12 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-2">
                    <input type="checkbox" id="remember" className="rounded border-slate-300 text-primary focus:ring-primary" />
                    <label htmlFor="remember" className="text-sm text-slate-600 font-medium">Lembrar acesso neste dispositivo</label>
                  </div>

                  {error && <div className="bg-error/10 text-error text-xs font-bold p-3 rounded-lg text-center">{error}</div>}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Acessar Painel de Controle'}
                  </button>

                  <p className="text-center text-sm text-slate-500 mt-6">
                    Novo na JPB Logística?{' '}
                    <button 
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-primary font-bold hover:underline"
                    >
                      Solicite acesso à conta
                    </button>
                  </p>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-3xl font-black text-slate-900 mb-2 font-headline">Criar Conta</h2>
                <p className="text-slate-500 mb-8">Insira seus dados para começar a gerenciar sua logística.</p>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Alex Rivera"
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="JPB Comercial Inc."
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail Comercial</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="a.rivera@jpbcomercial.com"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-12 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmar Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 py-2">
                    <input 
                      type="checkbox" 
                      id="terms" 
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-1 rounded border-slate-300 text-primary focus:ring-primary" 
                    />
                    <label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed">
                      Eu concordo com os <button type="button" className="text-primary font-bold hover:underline">Termos de Serviço</button> e a <button type="button" className="text-primary font-bold hover:underline">Política de Privacidade</button>.
                    </label>
                  </div>

                  {error && <div className="bg-error/10 text-error text-xs font-bold p-3 rounded-lg text-center">{error}</div>}
                  {success && <div className="bg-green-50 text-green-700 text-xs font-bold p-3 rounded-lg text-center flex items-center justify-center gap-2"><CheckCircle2 size={16} /> {success}</div>}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'CRIAR CONTA GRATUITA'}
                  </button>

                  <p className="text-center text-sm text-slate-500 mt-6">
                    Já tenho uma conta?{' '}
                    <button 
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-primary font-bold hover:underline"
                    >
                      Entrar agora
                    </button>
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none md:pointer-events-auto">
        <span>© 2024 JPB LOGÍSTICA INC.</span>
        <button className="hover:text-slate-600">SUPORTE</button>
        <button className="hover:text-slate-600">TERMOS</button>
      </div>
    </div>
  );
}
