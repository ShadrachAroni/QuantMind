'use client';

import React, { useMemo } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  change_24h: number;
  allocation: number;
  value: number;
  category?: string;
}

interface HoldingsTableProps {
  holdings: Holding[];
  showMetadata?: boolean;
}

export function HoldingsTable({ holdings, showMetadata }: HoldingsTableProps) {
  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-separate border-spacing-y-2">
        <thead>
          <tr className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848D97]">
            <th className="px-6 py-3">Institutional_Asset</th>
            <th className="px-6 py-3">Quantity</th>
            <th className="px-6 py-3">Tactical_Price</th>
            {showMetadata && <th className="px-6 py-3">Notional_Value</th>}
            <th className="px-6 py-3">24h_Delta</th>
            <th className="px-6 py-3">Allocation</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {holdings.map((h) => {
            const isPositive = h.change_24h >= 0;
            return (
              <tr key={h.id} className="group bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                <td className="px-6 py-4 rounded-l-2xl border-y border-l border-white/5">
                   <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center font-bold text-[10px] text-[#00D9FF] border border-white/5">
                         {h.symbol.substring(0, 2)}
                      </div>
                      <div>
                         <p className="font-bold text-white font-mono">{h.symbol}</p>
                         <p className="text-[10px] text-[#848D97] uppercase tracking-wider">{h.name}</p>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-4 border-y border-white/5 font-mono text-white/80">
                   {h.quantity.toLocaleString()}
                </td>
                 <td className="px-6 py-4 border-y border-white/5 font-mono text-white/80">
                    {formatCurrency(h.price)}
                 </td>
                 {showMetadata && (
                   <td className="px-6 py-4 border-y border-white/5 font-mono text-[#00D9FF] font-bold">
                      {formatCurrency(h.value)}
                   </td>
                 )}
                 <td className="px-6 py-4 border-y border-white/5">
                   <div className={cn(
                     "flex items-center gap-1 font-mono font-bold text-xs",
                     isPositive ? 'text-[#32D74B]' : 'text-[#FF453A]'
                   )}>
                      {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {isPositive ? '+' : ''}{h.change_24h}%
                   </div>
                </td>
                <td className="px-6 py-4 border-y border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-[#00D9FF] shadow-[0_0_8px_#00D9FF]" 
                           style={{ width: `${h.allocation}%` }} 
                         />
                      </div>
                      <span className="text-xs font-mono text-white/60">{h.allocation}%</span>
                   </div>
                </td>
                <td className="px-6 py-4 rounded-r-2xl border-y border-r border-white/5 text-right">
                   <button className="p-2 text-[#848D97] hover:text-white transition-colors">
                      <MoreHorizontal size={16} />
                   </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
