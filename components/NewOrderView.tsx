'use client';

import React, { useState, useEffect } from 'react';
import { Scale, MapPin, Calendar, Clock, FileText, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';

export default function NewOrderView({ profile }: { profile: Profile }) {
  const [kg, setKg] = useState('');
  
  // Date and Time settings
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  
  const [location, setLocation] = useState(profile.endereco || '');
  const [obs, setObs] = useState('');
  
  // Recurring
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('WEEKLY');
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Set default date and time on mount
  useEffect(() => {
    const now = new Date();
    
    // Default Date is today
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);

    // Default time is now + 1 hour
    now.setHours(now.getHours() + 1);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    setTime(`${hh}:${min}`);
  }, []);

  const quickAdd = (amount: number) => {
    const current = parseFloat(kg) || 0;
    setKg((current + amount).toString());
  };

  const handleDayToggle = (day: string) => {
    setRecurringDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profile.status !== 'ACTIVE' && profile.perfil !== 'SUPER_ADMIN') {
      setMessage({ type: 'error', text: 'Sua conta ainda não foi validada para realizar pedidos.' });
      return;
    }

    const quantity = parseFloat(kg);
    if (isNaN(quantity) || quantity <= 0) {
      setMessage({ type: 'error', text: 'Por favor, insira uma quantidade válida.' });
      return;
    }

    // Time validation: Minimum 1 hour ahead
    const selectedDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const minAllowedTime = new Date(now.getTime() + 60 * 60 * 1000); // Now + 1h
    
    if (selectedDateTime < minAllowedTime) {
      setMessage({ type: 'error', text: 'O horário de entrega deve ser de no mínimo 1 hora a partir de agora.' });
      return;
    }

    if (isRecurring && frequency === 'WEEKLY' && recurringDays.length === 0) {
      setMessage({ type: 'error', text: 'Para pedidos semanais, por favor selecione ao menos um dia da semana.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.from('orders').insert({
      user_id: profile.id,
      quantidade_kg: quantity,
      data_solicitada: date,
      time_solicitada: time,
      local_entrega: location,
      observacoes: obs,
      status: 'PENDING',
      is_recurring: isRecurring,
      frequency: isRecurring ? frequency : null,
      recurring_days: isRecurring && frequency === 'WEEKLY' ? recurringDays : null
    });

    if (error) {
      console.error('NewOrderView: Error creating order:', error);
      let errorMsg = error.message;
      if (!errorMsg || Object.keys(error).length === 0) {
        errorMsg = JSON.stringify(error);
        if (errorMsg === '{}') {
           errorMsg = 'Erro desconhecido. Verifique se você rodou as migrations recentes no Supabase (time_solicitada, recurring_days).';
        }
      } else if (errorMsg.includes('Could not find the') || error.code === 'PGRST204') {
         errorMsg = 'O banco de dados está desatualizado. Você precisa ir no seu Dashboard do Supabase > SQL Editor e rodar o script de atualização de colunas (time_solicitada, recurring_days).';
      }

      setMessage({ 
        type: 'error', 
        text: `Falha: ${errorMsg}` 
      });
    } else {
      setMessage({ type: 'success', text: 'Pedido agendado com sucesso!' });
      setKg('');
      setObs('');
      setIsRecurring(false);
      setRecurringDays([]);
      
      // Reset times to +1h default
      const n = new Date();
      n.setHours(n.getHours() + 1);
      setTime(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-black font-headline text-slate-900">Novo Pedido</h2>
        <p className="text-slate-500 mt-2">Solicite gelo seco com controle térmico garantido.</p>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit} 
        className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/50 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Scale size={14} /> Quantidade (kg)
              </label>
              <input 
                type="number" 
                required
                value={kg}
                onChange={(e) => setKg(e.target.value)}
                placeholder="Ex: 50"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 5, 20, 100].map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => quickAdd(amount)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-secondary/10 hover:text-secondary text-slate-600 rounded-lg text-xs font-bold transition-all active:scale-95"
                >
                  +{amount}kg
                </button>
              ))}
              <button
                type="button"
                onClick={() => setKg('')}
                className="px-3 py-1.5 bg-error/5 hover:bg-error/10 text-error rounded-lg text-xs font-bold transition-all active:scale-95"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={14} /> Data Solicitada
              </label>
              <input 
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Clock size={14} /> Horário de Entrega
              </label>
              <input 
                type="time" 
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <MapPin size={14} /> Local de Entrega
          </label>
          <input 
            type="text" 
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Endereço completo da empresa/setor"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
          />
        </div>

        {/* Recurring Option */}
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/50 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-slate-300 bg-white checked:border-secondary checked:bg-secondary transition-all"
              />
              <CheckCircle2 className="absolute h-6 w-6 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none p-1" />
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">Marcar como pedido recorrente</span>
          </label>

          {isRecurring && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-4 border-t border-slate-200 space-y-4"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequência</label>
                <select 
                  value={frequency}
                  onChange={(e) => {
                    setFrequency(e.target.value);
                    if (e.target.value !== 'WEEKLY') {
                      setRecurringDays([]); // Reset days if not weekly
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all font-bold text-sm"
                >
                  <option value="WEEKLY">Semanal</option>
                  <option value="BIWEEKLY">Quinzenal</option>
                  <option value="MONTHLY">Mensal</option>
                </select>
              </div>

              {frequency === 'WEEKLY' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dias da Semana</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'MONDAY', label: 'Seg' },
                      { id: 'TUESDAY', label: 'Ter' },
                      { id: 'WEDNESDAY', label: 'Qua' },
                      { id: 'THURSDAY', label: 'Qui' },
                      { id: 'FRIDAY', label: 'Sex' },
                      { id: 'SATURDAY', label: 'Sáb' },
                      { id: 'SUNDAY', label: 'Dom' },
                    ].map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => handleDayToggle(day.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          recurringDays.includes(day.id)
                            ? 'bg-secondary text-white shadow-md'
                            : 'bg-white border text-slate-500 border-slate-200 hover:border-secondary'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-[10px] text-slate-500 italic mt-2">O pedido será gerado automaticamente com base nesta frequência e no horário definido acima.</p>
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <FileText size={14} /> Observações Adicionais
          </label>
          <textarea 
            rows={4}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Alguma instrução especial para a entrega?"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all resize-none"
          />
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-error/10 text-error'}`}>
            {message.text}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || (profile.status !== 'ACTIVE' && profile.perfil !== 'SUPER_ADMIN')}
          className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          Confirmar Pedido
        </button>
      </motion.form>
    </div>
  );
}
