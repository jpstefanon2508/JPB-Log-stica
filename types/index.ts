export type UserProfile = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';
export type OrderStatus = 'PENDING' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  setor?: string;
  cidade?: string;
  perfil: UserProfile;
  status: UserStatus;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  quantidade_kg: number;
  data_solicitada: string;
  local_entrega: string;
  observacoes?: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_by: string;
  timestamp: string;
  observacao?: string;
}
