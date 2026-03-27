'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Search, Bell, ChevronDown, Settings, CreditCard, LogOut, Shield, Check, Info, AlertTriangle, AlertCircle, X, Menu } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { TierBadge } from '@/components/ui/TierBadge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { useUser } from '@/components/UserContext';
import { useTranslation } from '@/lib/i18n';
import { useMobileNav } from '@/components/layout/MobileNavContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function Header() {
  const { profile } = useUser();
  const { toggle } = useMobileNav();
  const t = useTranslation(profile?.interface_language || 'ENGLISH_INTL');
  
  const userName = profile?.first_name || 'OPERATOR';
  const tier = (profile?.tier as 'free' | 'plus' | 'pro' | 'student') || 'free';
  
  // Dropdown states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Data states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to Realtime Notifications
    const channel = supabase
      .channel('header-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_notifications' },
        () => fetchNotifications()
      )
      .subscribe();

    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
    };

    // Global Key Listener for Search (Ctrl+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleClearAll = async () => {
    // Optimistic Update
    setNotifications([]);
    setUnreadCount(0);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase
      .from('user_notifications')
      .delete()
      .eq('user_id', user.id);
    
    fetchNotifications();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'simulation_complete': return <Check size={14} className="text-[#32D74B]" />;
      case 'risk_alert': return <AlertTriangle size={14} className="text-[#FFD60A]" />;
      case 'security_notice': return <Shield size={14} className="text-[#E5E7EB]" />;
      default: return <Info size={14} className="text-[#00D9FF]" />;
    }
  };

  return (
    <header className="h-14 border-b border-white/5 bg-[#05070A]/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* Mobile Menu Toggle */}
      <button 
        onClick={toggle}
        className="lg:hidden p-2 text-[#848D97] hover:text-white transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Search Trigger */}
      <div className="flex-1 max-w-xl hidden sm:block">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="w-full relative group"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848D97] group-hover:text-[#00D9FF] transition-colors" size={16} />
          <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs font-mono text-[#848D97] text-left transition-all hover:bg-white/[0.05] hover:border-white/10 group flex items-center justify-between">
            <span>EXECUTE_COMMAND_OR_SEARCH...</span>
            <span className="text-[10px] text-white/20">CTRL+K</span>
          </div>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Notification Hub */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={cn(
              "relative p-2 transition-colors",
              isNotificationsOpen ? "text-[#00D9FF]" : "text-[#848D97] hover:text-white"
            )}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <div className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-1 bg-[#FF453A] rounded-full border border-[#05070A] flex items-center justify-center text-[8px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-[#0A0C14] border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <p className="text-[10px] text-[#848D97] uppercase tracking-[0.2em] font-bold">{t('Terminal_Notifications')}</p>
                <button 
                   onClick={handleClearAll}
                   className="text-[9px] text-[#00D9FF] hover:underline font-bold uppercase transition-all active:scale-95"
                >
                  {t('Clear_All')}
                </button>
              </div>

              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {notifications.map((n) => (
                      <div key={n.id} className={cn(
                        "p-4 hover:bg-white/[0.02] transition-colors relative group cursor-default",
                        !n.is_read && "bg-[#00D9FF]/[0.02]"
                      )}>
                        {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#00D9FF]" />}
                        <div className="flex gap-3">
                          <div className="mt-0.5 shrink-0">{getNotificationIcon(n.type)}</div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white mb-0.5 uppercase tracking-tight">{n.title}</p>
                            <p className="text-[11px] text-[#848D97] leading-relaxed mb-2">{n.message}</p>
                            <span className="text-[9px] text-white/20 uppercase font-mono">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center opacity-20 text-center px-8">
                    <Bell size={40} className="mb-4" />
                    <p className="text-[10px] uppercase tracking-widest font-mono">{t('Registry_Clear')}</p>
                  </div>
                )}
              </div>
              
              <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01]">
                <Link href="/dashboard/activity" className="block text-center py-2 text-[10px] font-bold text-[#848D97] hover:text-[#00D9FF] uppercase tracking-widest transition-colors">
                  {t('View_Log')}
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-white/5" />

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <div 
            className="flex items-center gap-2 md:gap-4 group cursor-pointer"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="text-right hidden lg:block">
              <p className="text-xs font-bold text-white tracking-tight leading-none mb-1 uppercase font-mono group-hover:text-[#00D9FF] transition-colors">{userName}</p>
              <TierBadge tier={tier} />
            </div>
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] p-px group-hover:shadow-[0_0_15px_rgba(0,217,255,0.3)] transition-all">
                  <div className="w-full h-full rounded-[11px] bg-[#05070A] flex items-center justify-center text-[10px] font-bold text-white uppercase font-mono">
                    {userName.substring(0, 2)}
                  </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#32D74B] rounded-full border-2 border-[#05070A]" />
            </div>
            <ChevronDown 
              size={14} 
              className={cn(
                "text-[#848D97] group-hover:text-white transition-all duration-300",
                isProfileOpen && "rotate-180 text-[#00D9FF]"
              )} 
            />
          </div>

          {/* User Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-[#0A0C14] border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
               <div className="px-4 py-3 border-b border-white/5 mb-2">
                  <p className="text-[10px] text-[#848D97] uppercase tracking-[0.2em] font-bold mb-1">{t('Session_Identity')}</p>
                  <p className="text-sm font-bold text-white uppercase font-mono">{userName}</p>
                  <div className="mt-2 text-[9px] flex items-center gap-1.5 text-[#00D9FF] font-bold uppercase tracking-widest">
                     <Shield size={10} />
                     {tier.toUpperCase()}_LEVEL_ACCESS
                  </div>
               </div>

               <div className="space-y-0.5">
                  <Link 
                    href="/dashboard/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs text-white/70 hover:text-[#00D9FF] hover:bg-white/5 transition-all group"
                  >
                    <Settings size={14} className="group-hover:rotate-45 transition-transform" />
                    <span>{t('Command_Settings')}</span>
                  </Link>

                  <Link 
                    href="/dashboard/subscription"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs text-white/70 hover:text-[#00D9FF] hover:bg-white/5 transition-all group"
                  >
                    <CreditCard size={14} />
                    <span>{t('Subscription_Dept')}</span>
                  </Link>

                  <div className="h-px bg-white/5 my-2 mx-4" />

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[#FF453A] hover:bg-[#FF453A]/10 transition-all group text-left"
                  >
                    <LogOut size={14} className="group-hover:translate-x-1 transition-transform" />
                    <span>{t('Terminate_Session')}</span>
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
