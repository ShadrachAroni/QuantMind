'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { 
  LayoutGrid, 
  Briefcase, 
  Play, 
  Cpu, 
  TrendingUp, 
  BarChart3, 
  Settings, 
  CreditCard,
  ChevronRight,
  Mail,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TierBadge } from '@/components/ui/TierBadge';
import { useUser } from '@/components/UserContext';
import { useTranslation } from '@/lib/i18n';
import { useMobileNav } from '@/components/layout/MobileNavContext';
import { AlertCircle, Bell } from 'lucide-react';

const sidebarItems = [
  { label: 'Nav_Home', route: '/dashboard', icon: LayoutGrid },
  { label: 'Nav_Portfolios', route: '/dashboard/portfolios', icon: Briefcase },
  { label: 'Nav_Simulate', route: '/dashboard/simulate', icon: Play },
  { label: 'Nav_Backtest', route: '/dashboard/backtest', icon: BarChart3, gated: true },
  { label: 'Nav_Oracle', route: '/dashboard/oracle', icon: Cpu, gated: true },
  { label: 'Nav_Assets', route: '/dashboard/assets', icon: TrendingUp },
  { label: 'Nav_Results', route: '/dashboard/results', icon: BarChart3 },
];

const bottomItems = [
  { label: 'Nav_Settings', route: '/dashboard/settings', icon: Settings },
  { label: 'Nav_Subscription', route: '/dashboard/subscription', icon: CreditCard },
];

export function Sidebar() {
  const { profile } = useUser();
  const { isOpen, close } = useMobileNav();
  const pathname = usePathname();
  const t = useTranslation(profile?.interface_language || 'ENGLISH_INTL');
  const tier = (profile?.tier as 'free' | 'plus' | 'pro' | 'student') || 'free';
  const [newTicketsCount, setNewTicketsCount] = React.useState(0);
  const supabase = createClient();

  React.useEffect(() => {
    if (!profile?.is_admin) return;

    const channel = supabase
      .channel('sidebar-support-alerts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_tickets',
        filter: 'status=eq.open'
      }, () => {
        setNewTicketsCount(prev => prev + 1);
        // Play subtle sound or trigger vibration?
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.is_admin]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#05070A]/80 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300"
          onClick={close}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-[#05070A] border-r border-white/5 flex flex-col h-full z-[70] transition-transform duration-300 lg:translate-x-0 lg:static lg:block",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand */}
        <div className="p-6 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={close}>
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/logo.png" alt="QuantMind" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block">QUANTMIND</span>
              {profile && <TierBadge tier={tier} className="mt-1" />}
            </div>
          </Link>

          <button 
            onClick={close}
            className="lg:hidden p-2 text-[#848D97] hover:text-white transition-all"
            title="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.route;
            return (
              <Link
                key={item.route}
                href={item.route}
                onClick={close}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  isActive 
                    ? 'bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20 shadow-[0_4px_12px_rgba(0,217,255,0.1)]' 
                    : 'text-[#848D97] hover:text-white hover:bg-white/5 border border-transparent'
                )}
              >
                <item.icon size={20} className={cn('shrink-0', isActive ? 'text-[#00D9FF]' : 'group-hover:text-white')} />
                <span className="text-sm font-medium">{t(item.label)}</span>
                {item.gated && (
                   <span className="ml-auto flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-[#00D9FF] animate-pulse" />
                   </span>
                )}
              </Link>
            );
          })}

          {profile?.is_admin && (
            <div className="pt-4 border-t border-white/5 mt-4">
              <span className="px-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#848D97] font-mono">Admin_Control</span>
              <Link
                href="/dashboard/admin/support"
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 mt-2',
                  pathname === '/dashboard/admin/support' 
                    ? 'bg-[#FFD60A]/10 text-[#FFD60A] border border-[#FFD60A]/20 shadow-[0_4px_12px_rgba(255,214,10,0.1)]' 
                    : 'text-[#848D97] hover:text-white hover:bg-white/5 border border-transparent'
                )}
                onClick={() => {
                  setNewTicketsCount(0);
                  close();
                }}
              >
                <div className="relative">
                  <Mail size={20} className={cn('shrink-0', pathname === '/dashboard/admin/support' ? 'text-[#FFD60A]' : 'group-hover:text-white')} />
                  {newTicketsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF453A] border-2 border-[#05070A] rounded-full animate-pulse shadow-[0_0_8px_#FF453A]" />
                  )}
                </div>
                <span className="text-sm font-medium">Ticketing_System</span>
                {newTicketsCount > 0 && (
                  <span className="ml-auto text-[8px] font-bold bg-[#FF453A] text-white px-1.5 py-0.5 rounded-full uppercase tracking-widest font-mono shadow-[0_0_10px_rgba(255,69,58,0.2)]">
                    New::{newTicketsCount}
                  </span>
                )}
              </Link>
            </div>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/5 bg-[#05070A]/50">
          <div className="space-y-1 mb-6">
            {bottomItems.map((item) => {
              const isActive = pathname === item.route;
              return (
                <Link
                  key={item.route}
                  href={item.route}
                  onClick={close}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                    isActive ? 'bg-white/5 text-white' : 'text-[#848D97] hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon size={20} className="shrink-0" />
                  <span className="text-sm font-medium">{t(item.label)}</span>
                </Link>
              );
            })}
          </div>

          {/* Info Strip */}
          <div className="px-3 py-4 bg-white/[0.02] border border-white/5 rounded-2xl">
             <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97]">Protocol Status</span>
                <div className="w-1.5 h-1.5 rounded-full bg-[#32D74B] animate-pulse shadow-[0_0_8px_#32D74B]" />
             </div>
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-white/40">NODE_ID::SA_01</span>
                <span className="text-[10px] font-mono text-white/40">LATENCY::12MS</span>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
}
