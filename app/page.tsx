'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Building2,
  Briefcase,
  CircleUser, 
  Search, 
  TriangleAlert,
  ListFilter,
  CircleCheck,
  Truck,
  Scale,
  EllipsisVertical,
  Menu,
  LogOut,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

import { Profile, Order } from '@/types';

// Components
import NewOrderView from '@/components/NewOrderView';
import MyOrdersView from '@/components/MyOrdersView';
import UsersView from '@/components/UsersView';
import CompaniesView from '@/components/CompaniesView';
import StaffView from '@/components/StaffView';
import ProfileView from '@/components/ProfileView';
import GlobalNotifications from '@/components/GlobalNotifications';

type Tab = 'dashboard' | 'new-order' | 'my-orders' | 'users' | 'companies' | 'staff' | 'profile';

export default function Dashboard() {
  const { user, profile, loading, signOut, isProfileComplete } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (typeof window !== 'undefined') window.location.href = '/login';
      } else if (!isProfileComplete()) {
        if (typeof window !== 'undefined') window.location.href = '/complete-profile';
      }
    }
  }, [user, loading, router, isProfileComplete]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center text-white p-6 text-center">
        <Loader2 className="animate-spin text-secondary mb-4" size={48} />
        <p className="font-headline font-bold tracking-widest uppercase text-sm">Carregando JPB Logística...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-sm">Redirecionando...</p>
      </div>
    );
  }

  const isAdmin = profile.perfil === 'ADMIN' || profile.perfil === 'SUPER_ADMIN';
  const isEmployee = profile.perfil === 'FUNCIONARIO';

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ADMIN': return 'Administrador';
      case 'FUNCIONARIO': return 'Funcionário';
      case 'CLIENTE': return 'Cliente';
      default: return 'Usuário';
    }
  };

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        className="fixed left-0 top-0 h-screen bg-white text-slate-600 flex flex-col z-50 transition-all duration-300 ease-in-out border-r border-slate-200 shadow-xl"
      >
        <div className="h-20 flex items-center px-6 overflow-hidden border-b border-slate-100">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div 
                key="full-logo"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="whitespace-nowrap"
              >
                <h1 className="text-xl font-black tracking-widest uppercase font-headline text-primary">JPB Logística</h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-[0.2em] uppercase mt-0.5">Thermal Control</p>
              </motion.div>
            ) : (
              <motion.div 
                key="short-logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-full flex justify-center"
              >
                <span className="text-2xl font-black text-secondary">JPB</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <nav className="flex-grow px-3 py-4 space-y-1">
          <NavItem 
            icon={<LayoutDashboard size={22} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('dashboard')}
          />
          {!isEmployee && (
            <NavItem 
              icon={<ShoppingCart size={22} />} 
              label="Novo Pedido" 
              active={activeTab === 'new-order'} 
              collapsed={!isSidebarOpen}
              onClick={() => setActiveTab('new-order')}
            />
          )}
          <NavItem 
            icon={<Package size={22} />} 
            label={isAdmin ? 'Pedidos' : isEmployee ? 'Entregas' : 'Meus Pedidos'} 
            active={activeTab === 'my-orders'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('my-orders')}
          />
          {isAdmin && (
            <>
              <NavItem 
                icon={<Users size={22} />} 
                label="Usuários" 
                active={activeTab === 'users'} 
                collapsed={!isSidebarOpen}
                onClick={() => setActiveTab('users')}
              />
              <NavItem 
                icon={<Building2 size={22} />} 
                label="Empresas" 
                active={activeTab === 'companies'} 
                collapsed={!isSidebarOpen}
                onClick={() => setActiveTab('companies')}
              />
              <NavItem 
                icon={<Briefcase size={22} />} 
                label="Equipe" 
                active={activeTab === 'staff'} 
                collapsed={!isSidebarOpen}
                onClick={() => setActiveTab('staff')}
              />
            </>
          )}
          <NavItem 
            icon={<CircleUser size={22} />} 
            label="Perfil" 
            active={activeTab === 'profile'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('profile')}
          />
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-slate-100">
          <button 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-error/5 hover:text-error transition-all duration-200 group ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
            onClick={signOut}
          >
            <LogOut size={22} className="shrink-0" />
            {isSidebarOpen && <span className="font-bold font-headline tracking-tight">Sair</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main 
        animate={{ marginLeft: isSidebarOpen ? 256 : 80 }}
        className="flex-grow flex flex-col transition-all duration-300 ease-in-out"
      >
        {/* Header */}
        <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex justify-between items-center px-8 h-20">
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleSidebar}
              className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-600 active:scale-95"
            >
              <Menu size={24} />
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <h2 className="text-lg font-bold text-primary-container capitalize">
              {activeTab === 'dashboard' ? 'Início' : 
               activeTab === 'new-order' ? 'Novo Pedido' :
               activeTab === 'my-orders' ? (isAdmin ? 'Pedidos' : isEmployee ? 'Minhas Entregas' : 'Meus Pedidos') :
               activeTab === 'users' ? 'Usuários' : 
               activeTab === 'companies' ? 'Empresas Clientes' :
               activeTab === 'staff' ? 'Gestão de Equipe' : 'Perfil'}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-secondary/20 transition-all"
              />
            </div>

            <GlobalNotifications profile={profile} />

            <div className="h-10 w-px bg-slate-200"></div>

            {/* Profile Button in Header */}
            <button 
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-3 p-1.5 pr-4 hover:bg-slate-100 rounded-2xl transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-xs border-2 border-transparent group-hover:border-secondary transition-all">
                {profile.nome.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">{profile.nome}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{getRoleLabel(profile.perfil)}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && <DashboardView profile={profile} />}
          {activeTab === 'new-order' && <NewOrderView profile={profile} />}
          {activeTab === 'my-orders' && <MyOrdersView profile={profile} />}
          {activeTab === 'users' && isAdmin && <UsersView />}
          {activeTab === 'companies' && isAdmin && <CompaniesView />}
          {activeTab === 'staff' && isAdmin && <StaffView />}
          {activeTab === 'profile' && <ProfileView profile={profile} onUpdate={() => {}} />}
        </div>
      </motion.main>
    </div>
  );
}

function DashboardView({ profile }: { profile: Profile }) {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalKg: 0,
    pendingKg: 0,
    activeUsers: 0,
    deliveriesToday: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartFilter, setChartFilter] = useState<'WEEK' | 'MONTH' | 'YEAR'>('MONTH');
  const [chartMetric, setChartMetric] = useState<'COUNT' | 'KG'>('KG');
  const [chartDateType, setChartDateType] = useState<'CREATED' | 'DELIVERY'>('CREATED');
  const [chartData, setChartData] = useState<{ label: string, value: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        console.log('Dashboard: Fetching stats for profile:', profile.id, profile.perfil);
        // Use explicit join to avoid ambiguity if multiple FKs exist
        let ordersQuery = supabase.from('orders').select('*, profiles!user_id(nome, empresa)');
        
        // Filter based on role
        if (profile.perfil === 'CLIENTE' || profile.perfil === 'USER') {
          ordersQuery = ordersQuery.eq('user_id', profile.id);
        } else if (profile.perfil === 'FUNCIONARIO') {
          ordersQuery = ordersQuery.eq('assigned_to', profile.id);
        }

        const { data: orders, error: ordersError } = await ordersQuery.order('created_at', { ascending: false });

        if (ordersError) {
          console.error('Dashboard: Supabase error details:', {
            message: ordersError.message,
            details: ordersError.details,
            hint: ordersError.hint,
            code: ordersError.code
          });
          throw ordersError;
        }
        console.log('Dashboard: Orders fetched successfully. Count:', orders?.length);

        const today = new Date().toISOString().split('T')[0];
        
        const newStats = {
          totalOrders: orders?.length || 0,
          activeOrders: orders?.filter(o => !['DELIVERED', 'CANCELED', 'COMPLETED'].includes(o.status)).length || 0,
          completedOrders: orders?.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).length || 0,
          totalKg: orders?.reduce((acc, o) => acc + (o.quantidade_kg || 0), 0) || 0,
          pendingKg: orders?.filter(o => !['DELIVERED', 'CANCELED', 'COMPLETED'].includes(o.status)).reduce((acc, o) => acc + (o.quantidade_kg || 0), 0) || 0,
          activeUsers: 0,
          deliveriesToday: orders?.filter(o => o.data_solicitada === today).length || 0
        };

        if (profile.perfil === 'ADMIN' || profile.perfil === 'SUPER_ADMIN') {
          const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');
          newStats.activeUsers = count || 0;
        }

        setStats(newStats);
        setRecentOrders(orders?.slice(0, 5) || []);

        // Process Chart Data
        if (orders) {
          const now = new Date();
          const labels: string[] = [];
          const groupedData: { [key: string]: number } = {};

          if (chartFilter === 'WEEK') {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
              const d = new Date();
              d.setDate(now.getDate() - i);
              const label = d.toLocaleDateString('pt-BR', { weekday: 'short' });
              const key = d.toISOString().split('T')[0];
              labels.push(label);
              groupedData[key] = 0;
            }
            orders.forEach(o => {
              const dateStr = chartDateType === 'CREATED' ? o.created_at : o.data_solicitada;
              const key = dateStr.split('T')[0];
              if (groupedData[key] !== undefined) {
                groupedData[key] += chartMetric === 'KG' ? o.quantidade_kg : 1;
              }
            });
          } else if (chartFilter === 'MONTH') {
            // Last 6 months
            for (let i = 5; i >= 0; i--) {
              const d = new Date();
              d.setMonth(now.getMonth() - i);
              const label = d.toLocaleDateString('pt-BR', { month: 'short' });
              const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
              labels.push(label);
              groupedData[key] = 0;
            }
            orders.forEach(o => {
              const dateStr = chartDateType === 'CREATED' ? o.created_at : o.data_solicitada;
              const d = new Date(dateStr);
              const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
              if (groupedData[key] !== undefined) {
                groupedData[key] += chartMetric === 'KG' ? o.quantidade_kg : 1;
              }
            });
          } else {
            // Last 5 years
            for (let i = 4; i >= 0; i--) {
              const year = now.getFullYear() - i;
              labels.push(year.toString());
              groupedData[year.toString()] = 0;
            }
            orders.forEach(o => {
              const dateStr = chartDateType === 'CREATED' ? o.created_at : o.data_solicitada;
              const year = new Date(dateStr).getFullYear().toString();
              if (groupedData[year] !== undefined) {
                groupedData[year] += chartMetric === 'KG' ? o.quantidade_kg : 1;
              }
            });
          }

          setChartData(Object.keys(groupedData).map((key, i) => ({
            label: labels[i],
            value: groupedData[key]
          })));
        }

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
      }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, chartFilter, chartMetric, chartDateType]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-secondary" size={32} />
      </div>
    );
  }

  const isAdmin = profile.perfil === 'ADMIN' || profile.perfil === 'SUPER_ADMIN';
  const isEmployee = profile.perfil === 'FUNCIONARIO';
  const maxChartValue = Math.max(...chartData.map(d => d.value), 1);

  const handleOrderAction = (order: Order, type: 'REPEAT' | 'EDIT') => {
    if (type === 'REPEAT') {
      // Logic to pre-fill NewOrderView
      // We can pass state via props or use a shared context if needed
      // For now, let's just switch to the tab and we might need to handle the pre-fill logic in NewOrderView
      console.log('Repeating order:', order);
      // We need a way to communicate with the parent Dashboard component to change tab and pass data
    } else {
      console.log('Editing order:', order);
    }
  };

  return (
    <>
      {/* Alert Banner */}
      {profile.status === 'PENDING' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error-container/40 border-l-4 border-error p-6 rounded-2xl flex items-start gap-4 shadow-sm"
        >
          <TriangleAlert className="text-error" size={24} />
          <div>
            <h3 className="font-bold text-on-error-container text-lg">Usuário não validado</h3>
            <p className="text-on-error-container/80 text-sm mt-1">Sua conta está em análise. Você poderá fazer pedidos após a validação da nossa equipe técnica.</p>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {isAdmin ? (
          <>
            <KPICard icon={<ListFilter size={20} />} label="Total de pedidos" value={stats.totalOrders.toString()} />
            <KPICard icon={<TriangleAlert size={20} />} label="Pedidos ativos" value={stats.activeOrders.toString()} status="Sistema" />
            <KPICard icon={<CircleCheck size={20} />} label="Concluídos" value={stats.completedOrders.toString()} />
            <KPICard icon={<Scale size={20} />} label="Volume Total (kg)" value={stats.totalKg.toLocaleString()} />
            <KPICard icon={<Users size={20} />} label="Usuários Ativos" value={stats.activeUsers.toString()} />
          </>
        ) : isEmployee ? (
          <>
            <KPICard icon={<Truck size={20} />} label="Entregas Realizadas" value={stats.completedOrders.toString()} />
            <KPICard icon={<LayoutDashboard size={20} />} label="Entregas do Dia" value={stats.deliveriesToday.toString()} />
            <KPICard icon={<TriangleAlert size={20} />} label="Em Andamento" value={stats.activeOrders.toString()} />
            <KPICard icon={<Scale size={20} />} label="Kg Transportados" value={stats.totalKg.toLocaleString()} />
            <KPICard icon={<CircleCheck size={20} />} label="Eficiência" value="98%" />
          </>
        ) : (
          <>
            <KPICard icon={<ListFilter size={20} />} label="Meus Pedidos" value={stats.totalOrders.toString()} />
            <KPICard icon={<TriangleAlert size={20} />} label="Pedidos Ativos" value={stats.activeOrders.toString()} />
            <KPICard icon={<CircleCheck size={20} />} label="Concluídos" value={stats.completedOrders.toString()} />
            <KPICard icon={<Scale size={20} />} label="Total Pedido (kg)" value={stats.totalKg.toLocaleString()} />
            <KPICard icon={<Truck size={20} />} label="Kg em Rota" value={stats.pendingKg.toLocaleString()} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Chart */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h3 className="font-bold text-xl">Volume de Pedidos</h3>
              <p className="text-slate-500 text-sm">Análise de demanda temporal</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {(['CREATED', 'DELIVERY'] as const).map(t => (
                  <button 
                    key={t}
                    onClick={() => setChartDateType(t)}
                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${chartDateType === t ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {t === 'CREATED' ? 'Data Pedido' : 'Data Entrega'}
                  </button>
                ))}
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {(['WEEK', 'MONTH', 'YEAR'] as const).map(f => (
                  <button 
                    key={f}
                    onClick={() => setChartFilter(f)}
                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${chartFilter === f ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {f === 'WEEK' ? 'Semana' : f === 'MONTH' ? 'Mês' : 'Ano'}
                  </button>
                ))}
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setChartMetric('COUNT')}
                  className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${chartMetric === 'COUNT' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Pedidos
                </button>
                <button 
                  onClick={() => setChartMetric('KG')}
                  className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${chartMetric === 'KG' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Kg
                </button>
              </div>
            </div>
          </div>
          <div className="h-80 flex items-end justify-between gap-3 px-2 relative pt-10">
            {chartData.map((data, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-secondary/10 to-secondary/40 rounded-t-xl relative group transition-all hover:to-secondary/60 cursor-pointer" 
                style={{ height: `${(data.value / maxChartValue) * 100}%`, minHeight: data.value > 0 ? '4px' : '0' }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg">
                  {data.value.toLocaleString()} {chartMetric === 'KG' ? 'kg' : ''}
                </div>
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-secondary rounded-full border-2 border-white shadow-sm"></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-6 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {chartData.map((d, i) => <span key={i} className="flex-1 text-center">{d.label}</span>)}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
        <div className="p-8 flex justify-between items-center">
          <h3 className="font-bold text-xl">Pedidos Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">ID do Pedido</th>
                <th className="px-8 py-5">Data</th>
                <th className="px-8 py-4">Quantidade (kg)</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <OrderRow 
                    key={order.id}
                    order={order}
                    onAction={handleOrderAction}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">Nenhum pedido encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function NavItem({ icon, label, active = false, collapsed = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, collapsed?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
        active 
          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
          : 'text-slate-400 hover:text-primary hover:bg-slate-50'
      } ${collapsed ? 'justify-center px-0' : ''}`}
    >
      <div className={`shrink-0 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      {!collapsed && (
        <span className="font-headline font-bold tracking-tight whitespace-nowrap">{label}</span>
      )}
      {collapsed && active && (
        <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
      )}
    </button>
  );
}

function KPICard({ icon, label, value, trend, status }: { icon: React.ReactNode, label: string, value: string, trend?: string, status?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/50 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-secondary/10 p-2.5 rounded-xl text-secondary">
          {icon}
        </div>
        {trend && <span className="text-xs font-black text-secondary bg-secondary/5 px-2 py-1 rounded-lg">{trend}</span>}
        {status && <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{status}</span>}
      </div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
      <h4 className="text-2xl font-black font-headline mt-1 text-slate-900">{value}</h4>
    </div>
  );
}

function OrderRow({ order, onAction }: { order: Order, onAction: (order: Order, type: 'REPEAT' | 'EDIT') => void }) {
  const isFinalized = ['DELIVERED', 'COMPLETED', 'CANCELED'].includes(order.status);
  const id = `#${order.id.slice(0, 8).toUpperCase()}`;
  const date = new Date(order.data_solicitada).toLocaleDateString('pt-BR');
  const qty = `${order.quantidade_kg} kg`;
  
  const statusColor = 
    order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
    order.status === 'CANCELED' ? 'bg-error/10 text-error' :
    order.status === 'IN_DELIVERY' ? 'bg-secondary/10 text-secondary' :
    'bg-blue-50 text-blue-600';

  return (
    <tr 
      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
      onClick={() => !isFinalized && onAction(order, 'EDIT')}
    >
      <td className="px-8 py-6 font-mono text-sm font-bold text-slate-900">{id}</td>
      <td className="px-8 py-6 text-sm text-slate-500 font-medium">{date}</td>
      <td className="px-8 py-6 text-sm font-black text-slate-900">{qty}</td>
      <td className="px-8 py-6">
        <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg tracking-widest ${statusColor}`}>
          {order.status}
        </span>
      </td>
      <td className="px-8 py-6 text-right">
          <button 
            onClick={(e) => { e.stopPropagation(); onAction(order, 'EDIT'); }}
            className="text-slate-300 hover:text-secondary p-2 hover:bg-slate-100 rounded-lg transition-all" 
            title="Ver Pedido"
          >
            <EllipsisVertical size={20} />
          </button>
      </td>
    </tr>
  );
}
