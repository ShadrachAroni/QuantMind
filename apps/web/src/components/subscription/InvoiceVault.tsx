'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface InvoiceVaultProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceVault({ isOpen, onClose }: InvoiceVaultProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      const fetchTransactions = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('paystack_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (data) setTransactions(data);
        }
        setIsLoading(false);
      };
      fetchTransactions();
    }
  }, [isOpen, supabase]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#05070A]/80 backdrop-blur-sm animate-in fade-in duration-300">
      <GlassCard className="w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90vh]" intensity="high">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[#00D9FF]/10 flex items-center justify-center text-[#00D9FF]">
                <FileText size={20} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight font-mono">Institutional_Vault</h3>
                <p className="text-[10px] text-[#848D97] uppercase tracking-widest font-bold">Transaction_Ledger_v1.0</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#848D97] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-50">
               <div className="w-8 h-8 border-2 border-[#00D9FF] border-t-transparent rounded-full animate-spin" />
               <p className="text-[10px] font-mono uppercase tracking-widest">Accessing_Encrypted_Ledger...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
               <div className="grid grid-cols-4 px-4 py-2 text-[9px] font-bold text-[#848D97] uppercase tracking-widest">
                  <span>Reference</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span className="text-right">Activity</span>
               </div>
               
               {transactions.map((tx) => (
                 <div key={tx.id} className="group relative">
                    <div className="absolute inset-0 bg-white/[0.02] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="grid grid-cols-4 items-center px-4 py-4 relative">
                       <span className="text-[10px] font-mono text-white/50 group-hover:text-white transition-colors">
                          {tx.reference.substring(0, 8)}...
                       </span>
                       <span className="text-xs font-bold text-white">
                          ${(tx.amount / 100).toFixed(2)}
                       </span>
                       <div className="flex items-center gap-1.5">
                          {tx.status === 'success' ? (
                            <CheckCircle2 size={12} className="text-[#32D74B]" />
                          ) : tx.status === 'failed' ? (
                            <XCircle size={12} className="text-[#FF453A]" />
                          ) : (
                            <Clock size={12} className="text-[#FFD60A]" />
                          )}
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-tight",
                            tx.status === 'success' ? "text-[#32D74B]" : "text-[#FF453A]"
                          )}>
                             {tx.status}
                          </span>
                       </div>
                       <div className="flex justify-end">
                          <button className="p-2 rounded-lg bg-white/5 text-[#848D97] hover:text-[#00D9FF] hover:bg-[#00D9FF]/10 transition-all active:scale-95 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                             <Download size={14} />
                             <span className="hidden sm:inline">PDF</span>
                          </button>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center opacity-20 text-center">
               <FileText size={48} className="mb-4" />
               <p className="text-[10px] uppercase tracking-widest font-mono">No_Historical_Records_Found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
           <p className="text-[9px] text-white/20 font-mono uppercase">System_Time: {new Date().toISOString()}</p>
           <div className="flex items-center gap-1 text-[9px] font-bold text-[#00D9FF] uppercase tracking-tight">
              Institutional_Access_Only <ArrowUpRight size={12} />
           </div>
        </div>
      </GlassCard>
    </div>
  );
}
