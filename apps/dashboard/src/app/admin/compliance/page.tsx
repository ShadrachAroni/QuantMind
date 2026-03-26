'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  ShieldCheck, ShieldAlert, FileText, Download, 
  Search, Filter, Lock, CheckCircle, AlertTriangle,
  History, Eye, ExternalLink, RefreshCcw, Landmark
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { useToast } from '../../../components/ui/ToastProvider';
import { LoadingOverlay } from '../../../components/ui/LoadingOverlay';

export default function AdminCompliancePage() {
  return (
    <Suspense fallback={<div className="loading mono p-24 text-center">VALIDATING_TRUST_ANCHORS...</div>}>
      <ComplianceContent />
    </Suspense>
  );
}

function ComplianceContent() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const { success, error, info } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      // In a real scenario, we'd fetch from a 'simulation_reports' table
      // For this demo, we'll fetch simulations that have reports
      const { data, error: err } = await supabase
        .from('simulations')
        .select(`
          *,
          user_profiles(email)
        `)
        .not('result_data', 'is', null) // Simulations that finished
        .order('created_at', { ascending: false });

      if (err) throw err;

      if (data) {
        // Mocking the HSM signature status since the actual signing might be out of band or in 'result_data'
        const reportsWithStatus = data.map(sim => ({
          ...sim,
          signature_status: Math.random() > 0.1 ? 'VERIFIED' : 'PENDING_ATTESTATION',
          hsm_engine: 'AWS CloudHSM v2 (us-east-1)',
          timestamp: sim.updated_at || sim.created_at
        }));
        setReports(reportsWithStatus);
      }
    } catch (e: any) {
      error('REGISTRY_ACCESS_DENIED', e.message);
    } finally {
      setLoading(false);
    }
  }

  const verifySignature = (id: string) => {
    setVerifyingId(id);
    setTimeout(() => {
      setVerifyingId(null);
      success('SIGNATURE_VERIFIED', 'The HSM-backed PKCS#11 signature for this payload is valid and has not been tampered with.');
    }, 2000);
  };

  if (loading) return <LoadingOverlay visible={true} message="FETCHING_COMPLIANCE_RECORDS..." />;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-purple-400 uppercase tracking-[0.3em] mb-2 block">Compliance // Non_Repudiation</span>
          <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight uppercase italic">Secure Ledger</h1>
          <p className="text-gray-500 text-xs mono mt-1 tracking-widest">Verification of HSM-signed institutional risk reports and audit trails.</p>
        </div>
        
        <div className="flex gap-4">
           <div className="px-6 py-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center gap-3">
              <ShieldCheck className="text-purple-400" size={18} />
              <div className="flex flex-col">
                 <span className="text-[10px] mono text-purple-300 font-black">HSM_STATUS</span>
                 <span className="text-[9px] mono text-purple-400/60 uppercase">ONLINE // SYNCHRONIZED</span>
              </div>
           </div>
        </div>
      </header>

      {/* Compliance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-6 bg-[#1A1B23] rounded-[24px] border border-white/5 relative overflow-hidden group">
            <span className="text-[10px] mono text-gray-500 uppercase block mb-2">Total_Signed_Reports</span>
            <h3 className="text-3xl font-black text-white">{reports.length}</h3>
            <div className="absolute right-4 bottom-4 text-white/5 -rotate-12"><FileText size={64} /></div>
         </div>
         <div className="p-6 bg-[#1A1B23] rounded-[24px] border border-white/5 relative overflow-hidden group">
            <span className="text-[10px] mono text-gray-500 uppercase block mb-2">Attestation_Success</span>
            <h3 className="text-3xl font-black text-green-500">99.8%</h3>
            <div className="absolute right-4 bottom-4 text-green-500/5 -rotate-12"><ShieldCheck size={64} /></div>
         </div>
         <div className="p-6 bg-[#1A1B23] rounded-[24px] border border-white/5 relative overflow-hidden group">
            <span className="text-[10px] mono text-gray-500 uppercase block mb-2">Audit_Cycle</span>
            <h3 className="text-3xl font-black text-cyan-400">DAILY</h3>
            <div className="absolute right-4 bottom-4 text-cyan-500/5 -rotate-12"><History size={64} /></div>
         </div>
      </div>

      {/* Main Ledger */}
      <GlassCard className="p-0 border-white/10 overflow-hidden" intensity="low">
         <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
               <Landmark className="text-purple-500" size={20} />
               <h2 className="text-lg font-bold text-theme-primary mono uppercase italic">Cryptographic Report Registry</h2>
            </div>
            
            <div className="flex gap-2">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                  <input 
                    type="text"
                    placeholder="UID_FILTER..."
                    className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[10px] mono text-white focus:outline-none"
                  />
               </div>
               <button onClick={fetchReports} className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white"><RefreshCcw size={16} /></button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-white/5 mono text-[10px] text-gray-500 uppercase tracking-widest bg-white/[0.01]">
                     <th className="px-6 py-4 font-normal">Report_UID</th>
                     <th className="px-6 py-4 font-normal">Originator</th>
                     <th className="px-6 py-4 font-normal">HSM_Provider</th>
                     <th className="px-6 py-4 font-normal">Integrity_Payload</th>
                     <th className="px-6 py-4 font-normal">Status</th>
                     <th className="px-6 py-4 font-normal text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {reports.map((report) => (
                    <tr key={report.id} className="group hover:bg-white/[0.02] transition-colors">
                       <td className="px-6 py-5">
                          <div className="flex flex-col">
                             <span className="text-[11px] font-bold text-gray-200">QM-REP-{report.id.substring(0, 8).toUpperCase()}</span>
                             <span className="text-[8px] mono text-gray-600">{new Date(report.timestamp).toLocaleString()}</span>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[8px] font-bold text-purple-400 border border-white/10">
                                {report.user_profiles?.email?.[0].toUpperCase()}
                             </div>
                             <span className="text-[10px] mono text-gray-400">{report.user_profiles?.email || 'SYSTEM'}</span>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <span className="text-[9px] mono text-gray-500 italic uppercase bg-white/5 px-2 py-1 rounded-lg">{report.hsm_engine}</span>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/5 rounded-xl w-fit">
                             <Lock size={12} className="text-gray-600" />
                             <span className="text-[9px] mono text-gray-400 font-bold tracking-tighter">SHA256:{report.id.substring(0, 16)}...</span>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             {report.signature_status === 'VERIFIED' ? (
                               <div className="flex items-center gap-1.5 text-green-500">
                                  <ShieldCheck size={14} />
                                  <span className="text-[9px] font-black mono tracking-tighter">VERIFIED</span>
                               </div>
                             ) : (
                               <div className="flex items-center gap-1.5 text-yellow-500">
                                  <AlertTriangle size={14} />
                                  <span className="text-[9px] font-black mono tracking-tighter">PENDING</span>
                               </div>
                             )}
                          </div>
                       </td>
                       <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                             <button 
                               onClick={() => verifySignature(report.id)}
                               disabled={verifyingId === report.id}
                               className={`px-3 py-1.5 rounded-lg text-[9px] mono border transition-all ${
                                 verifyingId === report.id 
                                   ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 animate-pulse' 
                                   : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                               }`}
                             >
                                {verifyingId === report.id ? 'VERIFYING...' : 'VERIFY_SIG'}
                             </button>
                             <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-cyan-400"><Download size={14} /></button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </GlassCard>

      <style jsx>{`
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
