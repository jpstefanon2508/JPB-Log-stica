import { OrderRepository } from '@/repositories/order.repository';
import { supabase } from '@/lib/supabase';
import { Order } from '@/types';

export const OrderService = {
  async createOrder(orderData: Partial<Order>) {
    // 1. Check user status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', orderData.user_id)
      .single();

    if (profileError || !profile) {
      throw new Error('Usuário não encontrado.');
    }

    if (profile.status !== 'ACTIVE') {
      throw new Error('Apenas usuários ativos podem criar pedidos.');
    }

    // 2. Validate quantity
    if (!orderData.quantidade_kg || orderData.quantidade_kg <= 0) {
      throw new Error('A quantidade deve ser maior que zero.');
    }

    // 3. Create order
    return await OrderRepository.create(orderData);
  },

  async cancelOrder(orderId: string, userId: string, isAdmin: boolean) {
    // Logic to check if user owns the order or is admin
    const { data: order, error } = await supabase
      .from('orders')
      .select('user_id, status')
      .eq('id', orderId)
      .single();

    if (error || !order) throw new Error('Pedido não encontrado.');

    if (!isAdmin && order.user_id !== userId) {
      throw new Error('Sem permissão para cancelar este pedido.');
    }

    if (order.status === 'COMPLETED') {
      throw new Error('Pedidos finalizados não podem ser cancelados.');
    }

    return await OrderRepository.updateStatus(orderId, 'CANCELED', userId, 'Cancelado pelo usuário');
  }
};
