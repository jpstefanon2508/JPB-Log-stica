'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus, Profile } from '@/types';
import { Package, MapPin, Scale, RefreshCw, Truck, CheckCircle2, XCircle, Edit2, Trash2, Eye, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MyOrdersView({ profile }: { profile: Profile }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  const [staffList, setStaffList] = useState<Profile[]>([]);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterClient, setFilterClient] = useState<string>('');
  const [filterStaff, setFilterStaff] = useState<string>('');

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome')
      .eq('perfil', 'FUNCIONARIO')
      .eq('status', 'ACTIVE');
    if (!error && data) setStaffList(data as unknown as Profile[]);
  };

  const fetchOrders = async () => {
    setLoading(true);
    console.log('MyOrdersView: Fetching orders for profile:', profile.id, profile.perfil);
    // Use explicit join syntax to avoid ambiguity with multiple foreign keys to profiles
    let query = supabase.from('orders').select('*, profiles!user_id(nome, empresa), assigned_profile:profiles!assigned_to(nome)');
    
    if (profile.perfil === 'CLIENTE' || profile.perfil === 'USER') {
      query = query.eq('user_id', profile.id);
    } else if (profile.perfil === 'FUNCIONARIO') {
      query = query.eq('assigned_to', profile.id);
    }
    // Admins see all

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data) {
      console.log('MyOrdersView: Orders fetched successfully. Count:', data.length);
      setOrders(data);
    } else if (error) {
      console.error('MyOrdersView: Error fetching orders details:', JSON.stringify(error, null, 2));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    if (profile.perfil === 'ADMIN' || profile.perfil === 'SUPER_ADMIN') {
      fetchStaff();
    }

    // Subscribe to real-time changes
    const channel = supabase
      .channel('orders_changes_my_orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id, profile.perfil]);

  const assignOrder = async (orderId: string, staffId: string | null) => {
    try {
      console.log(`MyOrdersView: Assigning order ${orderId} to staff ${staffId}`);
      const { error } = await supabase
        .from('orders')
        .update({ assigned_to: staffId })
        .eq('id', orderId);

      if (error) {
        console.error('MyOrdersView: Error assigning order:', JSON.stringify(error, null, 2));
        alert('Erro ao atribuir pedido: ' + error.message);
      } else {
        console.log('MyOrdersView: Order assigned successfully');
        fetchOrders();
      }
    } catch (err) {
      console.error('MyOrdersView: Unexpected error in assignOrder:', err);
    }
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      console.log(`MyOrdersView: Updating order ${orderId} to status ${newStatus}`);
      
      // We'll build the update object dynamically
      // We remove updated_at from client side to let DB trigger handle it
      const updateData: Record<string, string | number | boolean | null> = { 
        status: newStatus
      };

      // Add specific timestamps based on status
      // We use a try-catch or check if these columns exist if possible, 
      // but for now we'll just add them and handle the error if they don't exist
      if (newStatus === 'CONFIRMED') updateData.confirmed_at = new Date().toISOString();
      if (newStatus === 'IN_DELIVERY') updateData.in_delivery_at = new Date().toISOString();
      if (newStatus === 'DELIVERED') updateData.delivered_at = new Date().toISOString();
      if (newStatus === 'CANCELED') updateData.canceled_at = new Date().toISOString();

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('MyOrdersView: Error updating order status (full):', JSON.stringify(error, null, 2));
        
        // Fallback: Try updating ONLY the status if the full update fails
        // This handles cases where timestamp columns might be missing in the DB
        console.log('MyOrdersView: Attempting fallback update with only status...');
        const { error: fallbackError } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', orderId);
          
        if (fallbackError) {
          console.error('MyOrdersView: Fallback update also failed:', JSON.stringify(fallbackError, null, 2));
          alert('Erro ao atualizar pedido: ' + (fallbackError.message || 'Erro de permissão ou esquema'));
        } else {
          console.log('MyOrdersView: Fallback update successful');
          fetchOrders();
        }
      } else {
        console.log('MyOrdersView: Order status updated successfully');
        fetchOrders();
      }
    } catch (err) {
      console.error('MyOrdersView: Unexpected error in updateStatus:', err);
      alert('Erro inesperado ao atualizar pedido.');
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      setOrders(orders.filter(o => o.id !== orderId));
      setDeletingOrder(null);
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('Erro ao excluir pedido.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          quantidade_kg: editingOrder.quantidade_kg,
          data_solicitada: editingOrder.data_solicitada,
          local_entrega: editingOrder.local_entrega,
          observacoes: editingOrder.observacoes,
          status: editingOrder.status
        })
        .eq('id', editingOrder.id);

      if (error) throw error;
      fetchOrders();
      setEditingOrder(null);
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Erro ao atualizar pedido.');
    }
  };

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-50 text-amber-600';
      case 'CONFIRMED': return 'bg-blue-50 text-blue-600';
      case 'IN_DELIVERY': return 'bg-secondary/20 text-primary';
      case 'DELIVERED': return 'bg-green-50 text-green-600';
      case 'CANCELED': return 'bg-error/10 text-error';
      case 'OPEN': return 'bg-blue-50 text-blue-600';
      case 'IN_PROGRESS': return 'bg-secondary/20 text-primary';
      case 'COMPLETED': return 'bg-green-50 text-green-600';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'CONFIRMED': return 'Confirmado';
      case 'IN_DELIVERY': return 'Em Rota';
      case 'DELIVERED': return 'Entregue';
      case 'CANCELED': return 'Cancelado';
      case 'OPEN': return 'Aberto';
      case 'IN_PROGRESS': return 'Em Progresso';
      case 'COMPLETED': return 'Concluído';
      default: return status;
    }
  };

  const isAdmin = profile.perfil === 'ADMIN' || profile.perfil === 'SUPER_ADMIN';
  const isEmployee = profile.perfil === 'FUNCIONARIO';

  const filteredOrders = orders.filter(o => {
    if (filterStatus !== 'ALL' && o.status !== filterStatus) return false;
    if (filterStartDate && new Date(o.data_solicitada) < new Date(filterStartDate)) return false;
    if (filterEndDate && new Date(o.data_solicitada) > new Date(filterEndDate)) return false;
    
    if (filterClient) {
      const clientName = o.profiles?.nome?.toLowerCase() || '';
      const companyName = o.profiles?.empresa?.toLowerCase() || '';
      const query = filterClient.toLowerCase();
      if (!clientName.includes(query) && !companyName.includes(query)) return false;
    }
    
    if (filterStaff && o.assigned_to !== filterStaff) return false;
    
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black font-headline text-slate-900">
            {isAdmin ? 'Gestão de Pedidos' : isEmployee ? 'Minhas Entregas' : 'Meus Pedidos'}
          </h2>
          <p className="text-slate-500 mt-2">
            {isAdmin ? 'Visualize e gerencie todos os pedidos do sistema.' : 
             isEmployee ? 'Gerencie as entregas atribuídas a você.' : 
             'Acompanhe o status das suas solicitações em tempo real.'}
          </p>
        </div>
        <button 
          onClick={fetchOrders}
          className="p-3 hover:bg-slate-100 rounded-xl transition-all text-slate-500"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200/50 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Período De</label>
          <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Até</label>
          <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm appearance-none cursor-pointer">
            <option value="ALL">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="IN_DELIVERY">Em Rota</option>
            <option value="DELIVERED">Entregue</option>
            <option value="CANCELED">Cancelado</option>
          </select>
        </div>
        
        {isAdmin && (
          <>
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Empresa/Cliente</label>
              <input type="text" placeholder="Nome ou Empresa" value={filterClient} onChange={e => setFilterClient(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Motorista</label>
              <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm appearance-none cursor-pointer">
                <option value="">Todos os Motoristas</option>
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.nome}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <Package size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Nenhum pedido encontrado com esses filtros.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/50 overflow-visible">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-6 border-b border-slate-100">Código / Data</th>
                  {(isAdmin || isEmployee) && <th className="px-8 py-6 border-b border-slate-100">Cliente</th>}
                  <th className="px-8 py-6 border-b border-slate-100">Quantidade</th>
                  <th className="px-8 py-6 border-b border-slate-100">Local</th>
                  {isAdmin && <th className="px-8 py-6 border-b border-slate-100">Responsável</th>}
                  <th className="px-8 py-6 border-b border-slate-100">Status</th>
                  <th className="px-8 py-6 border-b border-slate-100 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => setTrackingOrder(order)}
                  >
                    <td className="px-8 py-6">
                      <p className="text-xs font-mono font-bold text-slate-900">
                        {order.codigo_pedido ? `#${order.codigo_pedido}` : `#${order.id.slice(0, 8).toUpperCase()}`}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">
                        {new Date(order.data_solicitada).toLocaleDateString('pt-BR')}
                      </p>
                    </td>
                    {(isAdmin || isEmployee) && (
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-700">{order.profiles?.nome}</p>
                        <p className="text-[10px] text-slate-500">{order.profiles?.empresa}</p>
                      </td>
                    )}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Scale size={14} className="text-slate-400" />
                        <span className="text-sm font-black text-slate-900">{order.quantidade_kg} kg</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 max-w-[200px]">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-600 truncate">{order.local_entrega}</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                        <select 
                          value={order.assigned_to || ''}
                          onChange={(e) => assignOrder(order.id, e.target.value || null)}
                          className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all w-full max-w-[150px]"
                        >
                          <option value="">Não atribuído</option>
                          {staffList.map(s => (
                            <option key={s.id} value={s.id}>{s.nome}</option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Status Action Buttons */}
                        {(isAdmin || isEmployee) && (
                          <div className="flex items-center gap-1 mr-2 pr-2 border-r border-slate-100">
                            {order.status === 'PENDING' && (isAdmin || isEmployee) && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'CONFIRMED'); }} 
                                className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-all" 
                                title="Aceitar"
                              >
                                <Check size={18} />
                              </button>
                            )}
                            {order.status === 'CONFIRMED' && (isAdmin || isEmployee) && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'IN_DELIVERY'); }} 
                                className="p-2 hover:bg-secondary/10 text-secondary rounded-lg transition-all" 
                                title="Sair para Entrega"
                              >
                                <Truck size={18} />
                              </button>
                            )}
                            {order.status === 'IN_DELIVERY' && (isAdmin || isEmployee) && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'DELIVERED'); }} 
                                className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-all" 
                                title="Entregue"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                            )}
                            {['PENDING', 'CONFIRMED'].includes(order.status) && (isAdmin || isEmployee) && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'CANCELED'); }} 
                                className="p-2 hover:bg-error/5 text-error rounded-lg transition-all" 
                                title="Recusar / Cancelar"
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                          </div>
                        )}

                        <button 
                          onClick={(e) => { e.stopPropagation(); setTrackingOrder(order); }}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
                          title="Rastreamento"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {isAdmin && (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditingOrder(order); }}
                              className="p-2 text-slate-400 hover:text-secondary hover:bg-secondary/5 rounded-lg transition-all"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDeletingOrder(order); }}
                              className="p-2 text-slate-400 hover:text-error hover:bg-error/5 rounded-lg transition-all"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      <AnimatePresence>
        {trackingOrder && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-900">Rastreamento {trackingOrder.codigo_pedido ? `#${trackingOrder.codigo_pedido}` : `#${trackingOrder.id.slice(0, 8).toUpperCase()}`}</h3>
                <button onClick={() => setTrackingOrder(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <TrackingStep label="Pedido Criado" date={trackingOrder.created_at} active={true} />
                  <TrackingStep label="Confirmado" date={trackingOrder.confirmed_at} active={!!trackingOrder.confirmed_at} />
                  <TrackingStep label="Em Rota" date={trackingOrder.in_delivery_at} active={!!trackingOrder.in_delivery_at} />
                  <TrackingStep label="Entregue" date={trackingOrder.delivered_at} active={!!trackingOrder.delivered_at} />
                  {trackingOrder.canceled_at && <TrackingStep label="Cancelado" date={trackingOrder.canceled_at} active={true} isError={true} />}
                </div>
                
                <div className="pt-6 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantidade</p>
                      <p className="text-sm font-bold text-slate-900">{trackingOrder.quantidade_kg} kg</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Solicitada</p>
                      <p className="text-sm font-bold text-slate-900">{new Date(trackingOrder.data_solicitada).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local de Entrega</p>
                    <p className="text-sm font-bold text-slate-900">{trackingOrder.local_entrega}</p>
                  </div>
                  {trackingOrder.observacoes && (
                    <div className="mt-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações</p>
                      <p className="text-sm text-slate-600 italic">&quot;{trackingOrder.observacoes}&quot;</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setTrackingOrder(null)}
                  className="w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-900">Editar Pedido {editingOrder.codigo_pedido ? `#${editingOrder.codigo_pedido}` : `#${editingOrder.id.slice(0, 8).toUpperCase()}`}</h3>
                <button onClick={() => setEditingOrder(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade (kg)</label>
                    <input 
                      type="number" 
                      value={editingOrder.quantidade_kg}
                      onChange={(e) => setEditingOrder({...editingOrder, quantidade_kg: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 outline-none font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Entrega</label>
                    <input 
                      type="date" 
                      value={editingOrder.data_solicitada}
                      onChange={(e) => setEditingOrder({...editingOrder, data_solicitada: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Local de Entrega</label>
                  <input 
                    type="text" 
                    value={editingOrder.local_entrega}
                    onChange={(e) => setEditingOrder({...editingOrder, local_entrega: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 outline-none font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status do Pedido</label>
                  <select 
                    value={editingOrder.status}
                    onChange={(e) => setEditingOrder({...editingOrder, status: e.target.value as OrderStatus})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 outline-none font-bold uppercase tracking-widest text-xs"
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="IN_DELIVERY">Em Rota</option>
                    <option value="DELIVERED">Entregue</option>
                    <option value="CANCELED">Cancelado</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações</label>
                  <textarea 
                    value={editingOrder.observacoes || ''}
                    onChange={(e) => setEditingOrder({...editingOrder, observacoes: e.target.value})}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-secondary/20 outline-none font-medium resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setEditingOrder(null)}
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
        {deletingOrder && (
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
              <h3 className="text-xl font-black text-slate-900 mb-2">Excluir Pedido?</h3>
              <p className="text-slate-500 text-sm mb-8">Esta ação é irreversível. O pedido <b>#{deletingOrder.id.slice(0, 8).toUpperCase()}</b> será removido permanentemente.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeletingOrder(null)}
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => deleteOrder(deletingOrder.id)}
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

function TrackingStep({ label, date, active, isError }: { label: string, date?: string, active: boolean, isError?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-2 h-2 rounded-full mt-1.5 ${active ? (isError ? 'bg-error' : 'bg-green-500') : 'bg-slate-200'}`} />
        <div className="w-px h-6 bg-slate-100" />
      </div>
      <div className="flex-1">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-slate-900' : 'text-slate-300'}`}>{label}</p>
        {active && date && (
          <p className="text-[9px] text-slate-400">{new Date(date).toLocaleString('pt-BR')}</p>
        )}
      </div>
    </div>
  );
}
