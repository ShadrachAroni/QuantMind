'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Command, 
  Briefcase, 
  Play, 
  TrendingUp, 
  BarChart3, 
  Cpu, 
  Settings,
  X,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  type: 'portfolio' | 'simulation' | 'asset' | 'action';
  route: string;
  subtitle?: string;
}

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery) {
      setResults(getDefaultActions());
      return;
    }

    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Parallel search across entities
      const [portfolios, sims, prices] = await Promise.all([
        supabase.from('portfolios').select('id, name').ilike('name', `%${searchQuery}%`).limit(3),
        supabase.from('simulations').select('id, status').ilike('id', `%${searchQuery}%`).limit(2),
        supabase.from('prices').select('symbol, price').ilike('symbol', `%${searchQuery}%`).limit(3)
      ]);

      const formattedResults: SearchResult[] = [];

      portfolios.data?.forEach(p => formattedResults.push({
        id: p.id,
        title: p.name,
        type: 'portfolio',
        route: `/dashboard/portfolios/${p.id}`,
        subtitle: 'Institutional Portfolio'
      }));

      sims.data?.forEach(s => formattedResults.push({
        id: s.id,
        title: `SIM_${s.id.substring(0, 8)}`,
        type: 'simulation',
        route: `/dashboard/results`,
        subtitle: `Status: ${s.status.toUpperCase()}`
      }));

      prices.data?.forEach(pr => formattedResults.push({
        id: pr.symbol,
        title: pr.symbol,
        type: 'asset',
        route: `/dashboard/assets`,
        subtitle: `Market Price: $${Number(pr.price).toFixed(2)}`
      }));

      setResults(formattedResults);
    } catch (error) {
      console.error('Search failure:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const getDefaultActions = (): SearchResult[] => [
    { id: 'new-portfolio', title: 'Initialize New Portfolio', type: 'action', route: '/dashboard/portfolios/new', subtitle: 'Quick Action' },
    { id: 'run-sim', title: 'Execute Risk Simulation', type: 'action', route: '/dashboard/simulate', subtitle: 'Quick Action' },
    { id: 'settings', title: 'Command Settings', type: 'action', route: '/dashboard/settings', subtitle: 'System' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#05070A]/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-2xl bg-[#0A0C14] border border-white/10 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="p-4 border-b border-white/5 flex items-center gap-4">
          <Search className="text-[#00D9FF]" size={20} />
          <input
            autoFocus
            type="text"
            placeholder="Search Portfolios, Assets, or Execute Commands..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-[#848D97] font-mono text-sm uppercase tracking-wider"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-[#848D97]">
            <Command size={10} />
            <span>K</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition-colors text-[#848D97]">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-2 border-[#00D9FF]/30 border-t-[#00D9FF] rounded-full animate-spin" />
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97]">Indexing_Registry...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    router.push(result.route);
                    onClose();
                  }}
                  className="w-full group flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-all text-left"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-white/5 group-hover:border-[#00D9FF]/30 group-hover:bg-[#00D9FF]/5 transition-all",
                    result.type === 'portfolio' && "text-[#00D9FF]",
                    result.type === 'asset' && "text-[#32D74B]",
                    result.type === 'simulation' && "text-[#FFD60A]",
                    result.type === 'action' && "text-[#7C3AED]"
                  )}>
                    {result.type === 'portfolio' && <Briefcase size={18} />}
                    {result.type === 'asset' && <TrendingUp size={18} />}
                    {result.type === 'simulation' && <Play size={18} />}
                    {result.type === 'action' && <Cpu size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white uppercase font-mono group-hover:text-[#00D9FF] transition-colors">{result.title}</p>
                    <p className="text-[10px] text-[#848D97] uppercase tracking-wider">{result.subtitle}</p>
                  </div>
                  <ArrowRight size={14} className="text-[#848D97] opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-xs text-[#848D97] uppercase font-mono mb-2">No Matches Found in Registry</p>
              <p className="text-[10px] text-[#848D97]/50 tracking-widest">QUERY_EXCEPTION::ENTITY_NOT_FOUND</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] font-mono text-[#848D97]">ENTER</div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#848D97]/50">Select</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] font-mono text-[#848D97]">↑↓</div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#848D97]/50">Navigate</span>
            </div>
          </div>
          <span className="text-[9px] font-mono text-[#848D97]/30">QUANTMIND_INDEX_V2.0.4</span>
        </div>
      </div>
    </div>
  );
}
