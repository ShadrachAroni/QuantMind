'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
}

interface AssetSearchProps {
  onSelect: (asset: Asset) => void;
  selectedIds: string[];
}

export function AssetSearch({ onSelect, selectedIds }: AssetSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Asset[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      
      // Fetch available assets from institutional prices table
      const { data: priceData } = await supabase
        .from('prices')
        .select('id, symbol, price')
        .order('symbol', { ascending: true });

      if (priceData) {
        const liveAssets: Asset[] = priceData.map(p => ({
          id: p.id,
          symbol: p.symbol,
          name: p.symbol, // Use symbol as name if name column is missing
          price: Number(p.price)
        })).filter(a => 
          (a.symbol.toLowerCase().includes(query.toLowerCase())) &&
          !selectedIds.includes(a.id)
        );
        setResults(liveAssets);
      } else {
        setResults([]);
      }
      
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedIds]);

  return (
    <div className="relative">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848D97] group-focus-within:text-[#00D9FF] transition-colors" size={16} />
        <input
          type="text"
          placeholder="Search by SYMBOL or NAME..."
          className="w-full bg-[#12121A] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono placeholder:text-white/20"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isSearching && (
           <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Activity size={14} className="text-[#00D9FF] animate-spin" />
           </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0C10] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
          {results.map((asset) => (
            <button
              key={asset.id}
              onClick={() => {
                onSelect(asset);
                setQuery('');
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <div className="text-left">
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-mono">{asset.symbol}</span>
                    <span className="text-[10px] text-[#848D97] font-medium">{asset.name}</span>
                 </div>
              </div>
              <Plus size={14} className="text-[#00D9FF]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
