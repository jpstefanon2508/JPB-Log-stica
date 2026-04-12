'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Clock, 
  Building2, 
  Plus, 
  X, 
  Loader2, 
  ChevronRight,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Profile, Company, StaffAssignment, StaffSchedule } from '@/types';
import { motion, AnimatePresence } from 'motion/react';

const DAYS_OF_WEEK = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

export default function StaffView() {
  const [staff, setStaff] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Profile | null>(null);
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [showAssignModal, setShowAssignModal] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('perfil', 'FUNCIONARIO')
        .order('nome');
      
      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      console.error('StaffView: Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    const { data } = await supabase.from('companies').select('*').order('nome');
    setCompanies(data || []);
  };

  useEffect(() => {
    fetchStaff();
    fetchCompanies();
  }, []);

  const fetchStaffDetails = async (staffId: string) => {
    try {
      setLoadingDetails(true);
      
      // Fetch assignments with company details
      const { data: assignData, error: assignError } = await supabase
        .from('staff_assignments')
        .select('*, company:companies(*)')
        .eq('staff_id', staffId);
      
      if (assignError) throw assignError;
      setAssignments(assignData || []);

      // Fetch schedules
      const { data: schedData, error: schedError } = await supabase
        .from('staff_schedules')
        .select('*')
        .eq('staff_id', staffId)
        .order('day_of_week');
      
      if (schedError) throw schedError;
      setSchedules(schedData || []);

    } catch (err) {
      console.error('StaffView: Error fetching staff details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAssignCompany = async (companyId: string) => {
    if (!selectedStaff) return;
    try {
      const { error } = await supabase
        .from('staff_assignments')
        .insert([{ staff_id: selectedStaff.id, company_id: companyId }]);
      
      if (error) throw error;
      await fetchStaffDetails(selectedStaff.id);
      setShowAssignModal(false);
    } catch (err) {
      console.error('StaffView: Error assigning company:', err);
      alert('Erro ao associar empresa');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('staff_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      if (selectedStaff) await fetchStaffDetails(selectedStaff.id);
    } catch (err) {
      console.error('StaffView: Error removing assignment:', err);
    }
  };

  const handleUpdateSchedule = async (day: number, start: string, end: string) => {
    if (!selectedStaff) return;
    try {
      const { error } = await supabase
        .from('staff_schedules')
        .upsert({ 
          staff_id: selectedStaff.id, 
          day_of_week: day, 
          start_time: start, 
          end_time: end 
        }, { onConflict: 'staff_id,day_of_week' });
      
      if (error) throw error;
      await fetchStaffDetails(selectedStaff.id);
    } catch (err) {
      console.error('StaffView: Error updating schedule:', err);
    }
  };

  const filteredStaff = staff.filter(s => 
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black font-headline text-slate-900">Gestão de Funcionários</h2>
          <p className="text-slate-500 mt-1">Defina responsabilidades e horários para sua equipe operacional.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar funcionário..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Funcionário</th>
                <th className="px-8 py-5">E-mail</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto" size={32} />
                  </td>
                </tr>
              ) : filteredStaff.length > 0 ? (
                filteredStaff.map((person) => (
                  <tr 
                    key={person.id} 
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedStaff(person);
                      fetchStaffDetails(person.id);
                    }}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xs">
                          {person.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900">{person.nome}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-500 font-medium">{person.email}</td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${person.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {person.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-medium">Nenhum funcionário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Details Modal */}
      <AnimatePresence>
        {selectedStaff && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStaff(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-white shadow-lg shadow-secondary/20">
                    <Users size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{selectedStaff.nome}</h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Configurações de Equipe</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStaff(null)}
                  className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-600 transition-all shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-10">
                {loadingDetails ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="animate-spin text-primary" size={48} />
                  </div>
                ) : (
                  <>
                    {/* Assignments Section */}
                    <section className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <Building2 size={16} /> Empresas sob Responsabilidade
                        </h4>
                        <button 
                          onClick={() => setShowAssignModal(true)}
                          className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                        >
                          + Adicionar Empresa
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {assignments.length > 0 ? (
                          assignments.map((assign) => (
                            <div key={assign.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                                  <Building size={16} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">{assign.company?.nome}</span>
                              </div>
                              <button 
                                onClick={() => handleRemoveAssignment(assign.id)}
                                className="p-2 text-slate-300 hover:text-error hover:bg-error/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-sm text-slate-400 font-medium">Nenhuma empresa associada.</p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Schedule Section */}
                    <section className="space-y-4">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={16} /> Escala de Trabalho
                      </h4>
                      <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                        <div className="grid grid-cols-1 divide-y divide-slate-100">
                          {DAYS_OF_WEEK.map((day, index) => {
                            const sched = schedules.find(s => s.day_of_week === index);
                            return (
                              <div key={day} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white transition-colors">
                                <span className="text-sm font-bold text-slate-600 w-24">{day}</span>
                                <div className="flex items-center gap-3">
                                  <input 
                                    type="time" 
                                    defaultValue={sched?.start_time || '08:00'}
                                    onBlur={(e) => handleUpdateSchedule(index, e.target.value, sched?.end_time || '18:00')}
                                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none"
                                  />
                                  <span className="text-slate-300">até</span>
                                  <input 
                                    type="time" 
                                    defaultValue={sched?.end_time || '18:00'}
                                    onBlur={(e) => handleUpdateSchedule(index, sched?.start_time || '08:00', e.target.value)}
                                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  {sched ? (
                                    <span className="flex items-center gap-1 text-[10px] font-black text-green-500 uppercase tracking-widest">
                                      <CheckCircle2 size={12} /> Definido
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Não definido</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </section>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Company Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">Associar Empresa</h3>
                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-2">
                {companies.filter(c => !assignments.some(a => a.company_id === c.id)).map((company) => (
                  <button 
                    key={company.id}
                    onClick={() => handleAssignCompany(company.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <Building2 size={16} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{company.nome}</span>
                    </div>
                    <Plus size={18} className="text-slate-300 group-hover:text-primary" />
                  </button>
                ))}
                {companies.length === 0 && (
                  <p className="text-center text-slate-400 py-8">Nenhuma empresa disponível.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Building({ size }: { size: number }) {
  return <Building2 size={size} />;
}
