'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  CircleUser, 
  Search, 
  Bell, 
  TriangleAlert,
  ListFilter,
  CircleCheck,
  Truck,
  Scale,
  EllipsisVertical,
  ArrowRight,
  Menu,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'dashboard' | 'new-order' | 'my-orders' | 'users' | 'profile';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        className="fixed left-0 top-0 h-screen bg-[#0A192F] text-white flex flex-col z-50 transition-all duration-300 ease-in-out border-r border-white/5 shadow-2xl"
      >
        <div className="h-20 flex items-center px-6 overflow-hidden">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div 
                key="full-logo"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="whitespace-nowrap"
              >
                <h1 className="text-xl font-black tracking-widest uppercase font-headline">JPB Logística</h1>
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
          <NavItem 
            icon={<ShoppingCart size={22} />} 
            label="Novo Pedido" 
            active={activeTab === 'new-order'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('new-order')}
          />
          <NavItem 
            icon={<Package size={22} />} 
            label="Meus Pedidos" 
            active={activeTab === 'my-orders'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('my-orders')}
          />
          <NavItem 
            icon={<Users size={22} />} 
            label="Usuários" 
            active={activeTab === 'users'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('users')}
          />
          <NavItem 
            icon={<CircleUser size={22} />} 
            label="Perfil" 
            active={activeTab === 'profile'} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab('profile')}
          />
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-white/5">
          <button 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-error/10 hover:text-error transition-all duration-200 group ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
            onClick={() => console.log('Logout clicked')}
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
            <h2 className="text-lg font-bold text-primary-container capitalize">{activeTab.replace('-', ' ')}</h2>
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

            <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors relative text-slate-500">
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-white"></span>
            </button>

            <div className="h-10 w-px bg-slate-200"></div>

            {/* Profile Button in Header */}
            <button 
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-3 p-1.5 pr-4 hover:bg-slate-100 rounded-2xl transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden relative border-2 border-transparent group-hover:border-secondary transition-all">
                <Image 
                  src="https://picsum.photos/seed/alex/100/100" 
                  alt="Avatar" 
                  fill 
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">Alex Rivera</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Administrador</p>
              </div>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab !== 'dashboard' && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Settings size={40} className="animate-spin-slow" />
              </div>
              <h3 className="text-xl font-bold text-slate-600">Página em Desenvolvimento</h3>
              <p>A seção &quot;{activeTab}&quot; estará disponível em breve.</p>
            </div>
          )}
        </div>
      </motion.main>
    </div>
  );
}

function DashboardView() {
  return (
    <>
      {/* Alert Banner */}
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
        <button className="ml-auto text-error font-bold text-sm hover:underline px-4 py-2 rounded-lg hover:bg-error/5 transition-all">Ver status</button>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <KPICard icon={<ListFilter size={20} />} label="Total de pedidos" value="1,284" trend="+12%" />
        <KPICard icon={<TriangleAlert size={20} />} label="Pedidos em aberto" value="42" status="Ativo" />
        <KPICard icon={<CircleCheck size={20} />} label="Pedidos fechados" value="1,242" trend="98%" />
        <KPICard icon={<Scale size={20} />} label="Total solicitado (kg)" value="15.4k" />
        <KPICard icon={<Truck size={20} />} label="Total entregue (kg)" value="14.8k" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Placeholder */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200/50">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-bold text-xl">Volume de Pedidos</h3>
              <p className="text-slate-500 text-sm">Tendência mensal de entregas de CO2 sólido</p>
            </div>
            <select className="text-sm border-none bg-slate-100 rounded-xl focus:ring-0 cursor-pointer p-2.5 font-bold text-slate-600">
              <option>Últimos 6 meses</option>
              <option>Último ano</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-3 px-2 relative">
            {[40, 65, 55, 85, 70, 95].map((height, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-secondary/10 to-secondary/40 rounded-t-xl relative group transition-all hover:to-secondary/60 cursor-pointer" style={{ height: `${height}%` }}>
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-secondary rounded-full border-2 border-white shadow-sm"></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-6 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map(m => <span key={m}>{m}</span>)}
          </div>
        </div>

        {/* Thermal Monitoring */}
        <div className="bg-[#0A192F] p-8 rounded-2xl shadow-2xl flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-secondary/20 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h3 className="font-bold text-xl mb-2">Monitoramento Térmico</h3>
            <p className="text-slate-400 text-sm mb-8">Todos os containers operando em faixa ideal (-78.5°C)</p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="text-sm font-black text-secondary">100%</span>
                </div>
                <div>
                  <p className="text-sm font-bold">Integridade da Carga</p>
                  <p className="text-xs text-slate-500">Estável e Seguro</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="text-sm font-black text-slate-300">94%</span>
                </div>
                <div>
                  <p className="text-sm font-bold">Eficiência de Rota</p>
                  <p className="text-xs text-slate-500">Otimizado por IA</p>
                </div>
              </div>
            </div>
          </div>
          <button className="relative z-10 mt-8 w-full py-4 bg-secondary text-white font-black rounded-xl hover:bg-secondary/90 transition-all active:scale-95 shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
            Novo Pedido Urgente
          </button>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
        <div className="p-8 flex justify-between items-center">
          <h3 className="font-bold text-xl">Pedidos Recentes</h3>
          <button className="text-secondary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
            Ver todos <ArrowRight size={18} />
          </button>
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
              <OrderRow id="#JPB-99021" date="24 Out, 2023" qty="450 kg" status="Entregue" statusColor="bg-green-50 text-green-700" />
              <OrderRow id="#JPB-99020" date="23 Out, 2023" qty="1,200 kg" status="Em Trânsito" statusColor="bg-secondary/10 text-secondary" />
              <OrderRow id="#JPB-98994" date="22 Out, 2023" qty="85 kg" status="Processando" statusColor="bg-blue-50 text-blue-600" />
              <OrderRow id="#JPB-98842" date="21 Out, 2023" qty="2,500 kg" status="Entregue" statusColor="bg-green-50 text-green-700" />
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
          ? 'bg-secondary text-white shadow-lg shadow-secondary/20' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
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

function OrderRow({ id, date, qty, status, statusColor }: { id: string, date: string, qty: string, status: string, statusColor: string }) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="px-8 py-6 font-mono text-sm font-bold text-slate-900">{id}</td>
      <td className="px-8 py-6 text-sm text-slate-500 font-medium">{date}</td>
      <td className="px-8 py-6 text-sm font-black text-slate-900">{qty}</td>
      <td className="px-8 py-6">
        <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg tracking-widest ${statusColor}`}>
          {status}
        </span>
      </td>
      <td className="px-8 py-6 text-right">
        <button className="text-slate-300 hover:text-secondary p-2 hover:bg-slate-100 rounded-lg transition-all">
          <EllipsisVertical size={20} />
        </button>
      </td>
    </tr>
  );
}
