export type UserProfile = 'CLIENTE' | 'FUNCIONARIO' | 'ADMIN' | 'SUPER_ADMIN' | 'USER';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_DELIVERY' | 'DELIVERED' | 'CANCELED' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  company_id?: string;
  setor?: string;
  cidade?: string;
  tax_id?: string;
  endereco?: string;
  perfil: UserProfile;
  status: UserStatus;
  validated_at?: string;
  validated_by?: string;
  validator?: { nome: string };
  created_at: string;
}

export interface Company {
  id: string;
  nome: string;
  tax_id?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffAssignment {
  id: string;
  staff_id: string;
  company_id: string;
  created_at: string;
  company?: Company;
}

export interface StaffSchedule {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
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
  assigned_to?: string;
  is_recurring?: boolean;
  frequency?: string;
  confirmed_at?: string;
  in_delivery_at?: string;
  delivered_at?: string;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  profiles?: {
    nome: string;
    empresa?: string;
  };
  assigned_profile?: {
    nome: string;
  };
}

export interface OrderHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_by: string;
  timestamp: string;
  observacao?: string;
}
