import { supabase } from '@/lib/supabase';
import { Order, OrderStatus } from '@/types';

export const OrderRepository = {
  async create(order: Partial<Order>) {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async list(filters?: { status?: OrderStatus; user_id?: string }) {
    let query = supabase.from('orders').select('*, profiles(nome, empresa)');
    
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.user_id) query = query.eq('user_id', filters.user_id);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: OrderStatus, changedBy: string, observation?: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log history
    await supabase.from('order_history').insert({
      order_id: id,
      status,
      changed_by: changedBy,
      observacao: observation
    });

    return data;
  }
};
