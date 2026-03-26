'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Users, Shield, Activity, FileText, Settings, LogOut, ChevronLeft, 
  Menu, X, Bell, Search, LayoutDashboard, Wallet, CreditCard, 
  BarChart3, Gift, HelpCircle, Sun, Moon, MoreHorizontal, Home,
  MessageSquare, MapPin, CheckCircle2, AlertTriangle, Zap, ShieldCheck, Star, Radio, Terminal,
  DollarSign, Cpu
} from 'lucide-react';
import { useAuth } from '../../components/auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { useTheme } from 'next-themes';
import { useLoading } from './LoadingProvider';
import { logSystemEvent } from '../../lib/notifications';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const { signOut, user } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [systemStats, setSystemStats] = useState({ latency: 24, uptime: 99.98 });
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeAlert, setActiveAlert] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetchMaintenanceMode();
    fetchUnreadCount();
    fetchActiveAlert();
    
    const interval = setInterval(() => {
      setSystemStats({
        latency: Math.floor(Math.random() * (32 - 18) + 18),
        uptime: 99.97 + (Math.random() * 0.02)
      });
    }, 5000);

    const configChannel = supabase
      .channel('app_config_maintenance')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'app_config', 
        filter: "key=eq.maintenance_mode" 
      }, fetchMaintenanceMode)
      .subscribe();

    const eventsChannel = supabase
      .channel('system_events_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_events' }, fetchNotifications)
      .subscribe();

    const alertsChannel = supabase
      .channel('system_alerts_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_alerts' }, fetchActiveAlert)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(configChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  const fetchMaintenanceMode = async () => {
    const { data } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();
    if (data) setIsMaintenanceMode(data.value === 'true');
  };

  const handleToggleMaintenance = async () => {
    if (!user) return;
    setIsTogglingMaintenance(true);
    const newValue = !isMaintenanceMode;
    
    const { error } = await supabase
      .from('app_config')
      .update({ 
        value: String(newValue), 
        updated_at: new Date().toISOString() 
      })
      .eq('key', 'maintenance_mode');
    
    if (!error) {
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action_type: 'MAINTENANCE_MODE_TOGGLE',
        target_resource: 'SYSTEM',
        new_value: { enabled: newValue },
        old_value: { enabled: isMaintenanceMode },
        reason: newValue ? 'Manual maintenance triggered via dashboard' : 'Maintenance mode deactivated'
      });
      
      logSystemEvent(
        newValue ? 'CRITICAL: System entering maintenance mode' : 'NOTICE: System status restored to nominal',
        newValue ? 'security' : 'upgrade'
      );
    }
    
    setIsTogglingMaintenance(false);
  };

  // Close more menu on route change
  useEffect(() => {
    setIsMoreMenuOpen(false);
  }, [pathname]);

  const fetchUnreadCount = async () => {
    const { count } = await supabase
      .from('system_events')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    setUnreadCount(count || 0);
  };

  const fetchActiveAlert = async () => {
    const { data } = await supabase
      .from('system_alerts')
      .select('*')
      .eq('active', true)
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    setActiveAlert(data);
  };

  const dismissAlert = async (id: string) => {
    const { error } = await supabase
      .from('system_alerts')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) setActiveAlert(null);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('system_events')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setNotifications(data);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('system_events')
      .update({ is_read: true })
      .eq('id', id);
    if (!error) {
       fetchUnreadCount();
       fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('system_events')
      .update({ is_read: true })
      .eq('is_read', false);
    
    if (!error) {
       fetchUnreadCount(); // Update the badge count
       fetchNotifications(); // Update the notification list
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      startLoading(`SEARCH_QUERY:_${searchQuery.trim().toUpperCase()}`, 1500);
      setTimeout(() => {
        router.push(`/users?search=${encodeURIComponent(searchQuery.trim())}`);
        stopLoading();
      }, 1000);
    }
  };

  const handleNavClick = (href: string, label: string, e: React.MouseEvent) => {
    if (pathname === href) return;
    e.preventDefault();
    setIsMoreMenuOpen(false);
    
    startLoading(`ROUTING_TO_${label.toUpperCase()}...`, 800);
    
    setTimeout(() => {
      router.push(href);
    }, 400);

    setTimeout(() => {
      stopLoading();
    }, 1000);
  };

  const floatingNav = [
    { href: '/', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search, onClick: () => setIsSearchOpen(true) },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/campaigns', label: 'Campaigns', icon: FileText },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/payments', label: 'Payments', icon: CreditCard },
    { id: 'expand', label: 'More', icon: MoreHorizontal, onClick: () => setIsMoreMenuOpen(!isMoreMenuOpen) },
  ];

  const moreMenuLinks = [
    { href: '/admin/notifications', label: 'Alerts', icon: Bell },
    { href: '/admin/logs', label: 'Audit Logs', icon: Terminal },
    { href: '/admin/monitoring', label: 'Health', icon: Activity },
    { href: '/admin/portfolios', label: 'Portfolios', icon: Wallet },
    { href: '/admin/compliance', label: 'Compliance', icon: ShieldCheck },
    { href: '/admin/simulations', label: 'Simulations', icon: Zap },
    { href: '/admin/revenue', label: 'Revenue', icon: DollarSign },
    { href: '/admin/communications', label: 'Communications', icon: MessageSquare },
    { href: '/admin/security', label: 'Security', icon: Shield },
    { href: '/admin/support', label: 'Support', icon: HelpCircle },
    { href: '/admin/config', label: 'Config', icon: Settings },
    { href: '/admin/automation', label: 'Automation', icon: Cpu },
    { href: '/admin/roles', label: 'Roles', icon: Shield },
    { href: '/admin/integrations', label: 'Integrations', icon: Zap },
    { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
    { href: '/admin/help', label: 'Help', icon: HelpCircle },
  ];

  return (
    <>
      <div className="admin-container">
      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-[15vh] px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setIsSearchOpen(false)} />
          <div className="search-overlay-card relative w-full max-w-2xl bg-[#15161c]/80 border border-white/10 p-6 rounded-3xl shadow-2xl animate-scale-in">
            <form onSubmit={handleSearch} className="flex items-center gap-4">
              <Search className="text-purple-500" size={24} />
              <input 
                autoFocus
                type="text" 
                placeholder="Search resources, users, or system logs..."
                className="bg-transparent border-none outline-none text-xl w-full text-white placeholder:text-gray-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="button" onClick={() => setIsSearchOpen(false)} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global Alert Banner */}
      {activeAlert && (
        <div className={`system-alert-banner ${activeAlert.severity}`}>
          <div className="flex items-center justify-between px-8 h-10 w-full overflow-hidden relative">
             <div className="flex items-center gap-3">
                <AlertTriangle size={14} className="animate-pulse" />
                <span className="mono text-[10px] font-bold tracking-widest uppercase truncate">
                   {activeAlert.message}
                </span>
             </div>
             <button onClick={() => dismissAlert(activeAlert.id)} className="hover:text-white transition-colors">
                <X size={14} />
             </button>
             <div className="absolute bottom-0 left-0 h-[1px] bg-white/20 w-full" />
             <div className="alert-pulse-bg absolute inset-0 -z-10" />
          </div>
          {/* Alert styles moved to main style block */}
        </div>
      )}

      {/* Persistent Top Header (Minimal) */}
      <header className="fixed top-0 left-0 right-0 h-20 px-8 flex items-center justify-between z-[1000] pointer-events-none">
        <div className="pointer-events-auto">
          <Link href="/" className="logo-group group flex items-center h-full" onClick={(e) => handleNavClick('/', 'Home', e)}>
             <div className="relative flex items-center gap-4 group-hover:scale-105 transition-all duration-700">
               <div className="logo-icon-container relative">
                 <div className="logo-scanner-effect absolute inset-0 -inset-x-2 -inset-y-2 bg-gradient-to-t from-cyan-500/0 via-cyan-400/30 to-cyan-500/0 animate-scan pointer-events-none z-10 blur-sm mix-blend-screen" />
                 <img 
                   src="/assets/logo-icon.png" 
                   alt="Q" 
                   className="h-16 w-16 object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.4)] group-hover:drop-shadow-[0_0_35px_rgba(34,211,238,0.7)] transition-all duration-700 brightness-125"
                 />
               </div>
               <div className="flex flex-col">
                 <span className="text-xl font-black tracking-[0.2em] text-theme-primary leading-none group-hover:neon-text-cyan transition-all duration-500">QUANTMIND</span>
                 <span className="text-[8px] font-bold tracking-[0.3em] text-cyan-400/60 uppercase mt-1">Institutional Protocol // v1.0.7</span>
               </div>
               <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             </div>
          </Link>
        </div>

        <div className="header-actions pointer-events-auto bg-[#15161c]/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-3">
            <button 
              onClick={handleToggleMaintenance}
              disabled={isTogglingMaintenance}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-500 overflow-hidden relative group ${
                isMaintenanceMode 
                  ? 'bg-red-500/20 border-red-500/40 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isMaintenanceMode ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest px-1">
                {isMaintenanceMode ? 'SYSTEM_OFFLINE' : 'DOWNTIME_CTRL'}
              </span>
              {isTogglingMaintenance && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </button>

            <div className="w-[1px] h-6 bg-white/10 mx-1" />

            <button 
              className="icon-btn theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {mounted && (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />)}
            </button>

            <div className="relative">
              <button 
                className={`icon-btn ${showNotifications ? 'active' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} />
                {notifications.length > 0 && <div className="notification-dot" />}
              </button>

              {showNotifications && (
                <div className="notification-popover animate-scale-in">
                  <div className="popover-header flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                       <h3 className="text-[10px] font-black tracking-widest text-gray-400">SYSTEM_EVENTS</h3>
                       {unreadCount > 0 && <span className="bg-cyan-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-[9px] font-black text-cyan-500 hover:text-white transition-colors flex items-center gap-1 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20">
                        <X size={10} />
                        CLEAR ALL
                      </button>
                    )}
                  </div>
                  <div className="notifications-list max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-600">
                        <Bell size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-[10px] mono uppercase">No active protocols</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isUnread = !n.is_read;
                        let Icon = n.event_type === 'security' ? ShieldCheck : 
                                   n.event_type === 'upgrade' ? Activity : 
                                   n.event_type === 'achievement' ? Star : Activity;
                        
                        return (
                          <div key={n.id} className={`notification-item flex gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-all group relative ${isUnread ? 'bg-cyan-500/5' : ''}`}>
                            {isUnread && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              n.event_type === 'security' ? 'bg-red-500/20 text-red-400' :
                              n.event_type === 'upgrade' ? 'bg-purple-500/20 text-purple-400' :
                              n.event_type === 'achievement' ? 'bg-green-500/20 text-green-400' :
                              'bg-cyan-500/20 text-cyan-400'
                            }`}>
                              <Icon size={14} />
                            </div>
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                               <p className={`text-[11px] leading-relaxed truncate-2-lines transition-colors ${isUnread ? 'text-theme-primary font-bold' : 'text-gray-400'}`}>
                                {n.message}
                              </p>
                              <div className="flex items-center gap-2 opacity-40">
                                <span className="text-[9px] mono uppercase tracking-tight">{n.event_type}</span>
                                <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                <span className="text-[9px]">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => markAsRead(n.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-md transition-all self-start text-gray-500 hover:text-white"
                              title="Dismiss"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="user-profile">
              <div className="user-avatar">
                {user?.email?.[0].toUpperCase() || 'A'}
              </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content-full scroll-smooth">
        <div className="content-padding pt-24 pb-32">
          {children}
        </div>
      </main>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1500] flex flex-col items-center gap-4">
         {/* More Menu Popover */}
         {isMoreMenuOpen && (
           <div className="more-menu-card bg-[#15161c]/90 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl shadow-2xl mb-2 animate-slide-up">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 min-w-[280px] md:min-w-[400px]">
                {moreMenuLinks.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={(e) => handleNavClick(item.href, item.label, e)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-white/5 transition-all group"
                  >
                    <div className="p-2 rounded-xl bg-white/5 group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                      <item.icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-60 group-hover:opacity-100">{item.label}</span>
                  </Link>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                 <button onClick={signOut} className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all">
                    <span className="text-xs font-black uppercase tracking-widest">Terminate Session</span>
                    <LogOut size={16} />
                 </button>
              </div>
           </div>
         )}

         {/* The Nav Bar */}
         <nav className="floating-nav-bar relative flex items-center justify-center bg-[#0F1016]/70 backdrop-blur-[32px] border border-white/5 p-2 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(124,58,237,0.1)]">
            <div className="flex items-center gap-1 md:gap-4 px-2">
              {floatingNav.map((item) => {
                const isActive = item.href ? pathname === item.href : false;
                const Icon = item.icon;
                
                const content = (
                  <div className={`nav-icon-container relative p-3 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5'}`}>
                    <Icon size={22} className={`transition-all duration-300 ${isActive ? 'text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    
                    {/* Notification Badge Badge */}
                    {item.label === 'Alerts' && unreadCount > 0 && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-black shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-bounce">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}

                    {/* Active Indicator Glow */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-cyan-400 rounded-full shadow-[0_0_10px_2px_rgba(34,211,238,0.5)]" />
                    )}
                    {/* Tooltip Label */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-tighter text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/5">
                      {item.label}
                    </div>
                  </div>
                );

                if (item.href) {
                  return (
                    <Link key={item.href} href={item.href} title={item.label} onClick={(e) => handleNavClick(item.href as string, item.label, e)}>
                      {content}
                    </Link>
                  );
                }

                return (
                  <button key={item.id} onClick={item.onClick} title={item.label} className="focus:outline-none">
                    {content}
                  </button>
                );
              })}
            </div>
         </nav>
      </div>
    </div>
    <style jsx>{`
        .admin-container {
          min-height: 100vh;
          background-color: var(--background);
          color: var(--foreground);
          font-family: 'Inter', sans-serif;
          transition: background-color 0.4s ease, color 0.4s ease;
        }

        .system-alert-banner {
          width: 100%;
          animation: slide-down 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1100;
          position: relative;
        }
        .system-alert-banner.info { background: var(--accent-cyan); color: #000; }
        .system-alert-banner.warning { background: var(--warning); color: #000; }
        .system-alert-banner.critical { background: var(--error); color: #fff; }
        
        .alert-pulse-bg {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }

        @keyframes slide-down {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        :global(.glass-card) {
          background: rgba(15, 16, 22, 0.4);
          backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        :global(.glass-card:hover) {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(124, 58, 237, 0.3);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 
                      0 0 20px rgba(124, 58, 237, 0.1);
        }

        :global(.neon-text-purple) {
           text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }

        :global(.neon-text-cyan) {
           text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
           color: var(--accent-cyan) !important;
        }

        :global(.text-theme-primary) {
          color: var(--text-primary);
        }

        .main-content-full {
          width: 100%;
          min-height: 100vh;
        }

        .content-padding {
          max-width: 1600px;
          margin: 0 auto;
          padding-left: 2rem;
          padding-right: 2rem;
        }

        .logo-group {
          display: flex;
          align-items: center;
          gap: 1rem;
          text-decoration: none;
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .icon-btn:hover, .icon-btn.active {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.8rem;
          color: #fff;
        }

        .notification-popover {
          position: absolute;
          top: 45px;
          right: 0;
          width: 300px;
          background: rgba(21, 22, 28, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          z-index: 1001;
        }

        .floating-nav-bar {
           animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slide-up {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
        }

        @keyframes scan {
          0% { transform: translateY(-100%) scaleY(0); opacity: 0; }
          40% { transform: translateY(0) scaleY(1); opacity: 0.8; }
          60% { transform: translateY(0) scaleY(1); opacity: 0.8; }
          100% { transform: translateY(100%) scaleY(0); opacity: 0; }
        }

        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }

        .notifications-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .notification-item {
          padding: 1rem;
          display: flex;
          gap: 0.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .notification-icon-sm {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .popover-header {
           padding: 1rem;
           border-bottom: 1px solid rgba(255,255,255,0.05);
           display: flex;
           justify-content: space-between;
           align-items: center;
        }

        .popover-header h3 { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; }
        
        .notification-details p { font-size: 0.8rem; color: #e2e8f0; }
        .notification-details span { font-size: 0.7rem; color: #64748b; }

        @media (max-width: 768px) {
          .content-padding { padding-left: 1rem; padding-right: 1rem; }
          .logo-text { display: none; }
          .floating-nav-bar { width: 95vw; overflow-x: auto; justify-content: flex-start; }
          .nav-icon-container { p-2; }
        }
      `}</style>
    </>
  );
}
