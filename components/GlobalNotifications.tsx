'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, AppNotification } from '@/types';
import { Bell, Check, Loader2, Package, Truck, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function GlobalNotifications({ profile }: { profile: Profile }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error fetching notifications:', error);
    }
    
    if (!error && data) {
      console.log('Fetched notifications:', data);
      setNotifications(data as AppNotification[]);
    }
    setLoading(false);
  };

  const playSound = (type: 'URGENT' | 'INFO' | 'SUCCESS') => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const now = ctx.currentTime;

      const playTone = (freq: number, oscType: OscillatorType, duration: number, delay: number, volStart = 0.2, volEnd = 0.01) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(volStart, now + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(volEnd, now + delay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + duration);
      };

      if (type === 'URGENT') {
        // Chamativo e mais demorado: Plin-Plin... Plin-Plin... Plin
        playTone(880, 'square', 0.2, 0, 0.1);
        playTone(1100, 'square', 0.4, 0.2, 0.1);
        playTone(880, 'square', 0.2, 0.8, 0.1);
        playTone(1100, 'square', 0.4, 1.0, 0.1);
        playTone(1320, 'square', 0.6, 1.6, 0.1);
      } else if (type === 'INFO') {
        // Status Update (aviso suave de mudança)
        playTone(600, 'sine', 0.2, 0, 0.3);
        playTone(400, 'sine', 0.4, 0.2, 0.3);
      } else if (type === 'SUCCESS') {
        // Cheerful rise para novo pedido do lado de quem comprou
        playTone(440, 'sine', 0.15, 0, 0.2);
        playTone(554, 'sine', 0.15, 0.15, 0.2);
        playTone(659, 'sine', 0.4, 0.3, 0.2);
      }
    } catch (e) {
      console.log('Audio playback prevented', e);
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    fetchNotifications();

    const channel = supabase
      .channel('notifications_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, (payload) => {
        const newNotif = payload.new as AppNotification;
        
        // Filter targeted
        const isTargetedToUser = newNotif.user_id === profile.id;
        
        // Broadcasts exist for NEW_ORDER, and only Admins/SuperAdmins should be alerted from it.
        const isAdminBroadcast = !newNotif.user_id && newNotif.type === 'NEW_ORDER' && ['ADMIN', 'SUPER_ADMIN'].includes(profile.perfil);
        
        if (isTargetedToUser || isAdminBroadcast) {
          
          if (newNotif.type === 'NEW_ORDER' || newNotif.type === 'ASSIGNMENT') playSound('URGENT');
          else if (newNotif.type === 'STATUS_UPDATE') playSound('INFO');
          else playSound('SUCCESS');
          
          let IconComponent = Bell;
          let iconClass = "text-primary";
          if (newNotif.type === 'NEW_ORDER') { IconComponent = Package; iconClass = "text-secondary"; }
          else if (newNotif.type === 'ASSIGNMENT') { IconComponent = Truck; iconClass = "text-secondary"; }
          else if (newNotif.type === 'STATUS_UPDATE') { IconComponent = CheckCircle2; iconClass = "text-green-500"; }
          else { IconComponent = Info; iconClass = "text-primary"; }

          toast(newNotif.title, {
            description: newNotif.message,
            duration: 10000,
            icon: <IconComponent className={iconClass} size={20} />,
          });

          if ('Notification' in window && Notification.permission === 'granted') {
            new window.Notification(`JPB Comercial - ${newNotif.title}`, {
              body: newNotif.message,
              icon: '/icon-192x192.png'
            });
          }

          // Add to local state
          setNotifications(prev => [newNotif, ...prev].slice(0, 20));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors relative text-slate-500 active:scale-95"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/60 overflow-hidden z-50 flex flex-col"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Bell size={16} className="text-secondary" />
                Notificações
              </h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] text-primary hover:text-primary/70 font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                >
                  <Check size={12} /> Lidas
                </button>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-8 flex justify-center items-center">
                  <Loader2 className="animate-spin text-slate-300" size={24} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Nenhuma notificação por enquanto.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={() => !notif.read && markAsRead(notif.id)}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 ${!notif.read ? 'bg-primary/5' : ''}`}
                    >
                      <div className={`mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notif.type === 'NEW_ORDER' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                        {notif.type === 'NEW_ORDER' ? <Package size={16} /> : <Bell size={16} />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm ${!notif.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap pt-0.5">
                            {formatDate(notif.created_at)}
                          </span>
                        </div>
                        <p className={`text-xs ${!notif.read ? 'text-slate-600' : 'text-slate-500'}`}>
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
