'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowUpRight,
  Mail,
  Loader2
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
  channel: string;
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

  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleResendEmail = async (tx: Transaction) => {
    setProcessingId(tx.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("User email not found");

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: user.email,
          type: 'payment_receipt',
          details: {
            reference: tx.reference,
            amount: (tx.amount).toFixed(2),
            currency: tx.currency,
            tier: 'INSTITUTIONAL', // We can improve this by fetching subscription tier
            date: new Date(tx.created_at).toLocaleDateString('en-GB', { 
              day: '2-digit', month: 'short', year: 'numeric' 
            }).toUpperCase(),
            method: tx.channel || 'Card'
          }
        }
      });

      if (error) throw error;
      alert("SUCCESS: Institutional receipt dispatched to " + user.email);
    } catch (err: any) {
      console.error(err);
      alert("ERROR: Failed to dispatch receipt.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownload = (tx: Transaction) => {
    // Basic Print Protocol for Institutional Receipts
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const date = new Date(tx.created_at).toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    }).toUpperCase();

    printWindow.document.write(`
      <html>
        <head>
          <title>QUANTMIND_RECEIPT_${tx.reference}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; background: #fff; color: #000; padding: 40px; }
            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; }
            .details { margin-bottom: 40px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc; }
            .footer { margin-top: 60px; font-size: 10px; text-align: center; color: #666; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">QuantMind Systems</div>
            <div style="font-size: 12px; margin-top: 4px;">OFFICIAL_TRANSACTION_RECORDS</div>
          </div>
          <div class="details">
            <div class="row"><span>REFERENCE:</span> <span>${tx.reference}</span></div>
            <div class="row"><span>DATE:</span> <span>${date}</span></div>
            <div class="row"><span>AMOUNT:</span> <span>${tx.amount.toFixed(2)} ${tx.currency}</span></div>
            <div class="row"><span>STATUS:</span> <span>${tx.status.toUpperCase()}</span></div>
            <div class="row"><span>CHANNEL:</span> <span>${tx.channel || 'CREDIT_CARD'}</span></div>
          </div>
          <div style="margin-top: 40px; text-align: center;">
            <p>Thank you for scaling with QuantMind.</p>
          </div>
          <div class="footer">
            QUANTMIND_GLOBAL // SECURE_TRANSACTION_LEDGER
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
                       <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleResendEmail(tx)}
                            disabled={processingId === tx.id || tx.status !== 'success'}
                            className="p-2 rounded-lg bg-white/5 text-[#848D97] hover:text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-all active:scale-95 disabled:opacity-50"
                            title="Resend Email"
                          >
                             {processingId === tx.id ? (
                               <Loader2 size={14} className="animate-spin" />
                             ) : (
                               <Mail size={14} />
                             )}
                          </button>
                          <button 
                            onClick={() => handleDownload(tx)}
                            disabled={tx.status !== 'success'}
                            className="p-2 rounded-lg bg-white/5 text-[#848D97] hover:text-[#00D9FF] hover:bg-[#00D9FF]/10 transition-all active:scale-95 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                          >
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
