'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, Shield, FileText, ChevronLeft, ChevronRight, Filter, Search, Terminal } from 'lucide-react';
import { AdminLayout } from '../../components/ui/AdminLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlowEffect } from '../../components/ui/GlowEffect';
import { useToast } from '../../components/ui/ToastProvider';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const { success } = useToast();
  const pageSize = 15;

  const actionTypes = ['all', 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'AUTH_CHANGE', 'CONFIG_UPDATE'];

  useEffect(() => {
    fetchLogs();
    
    const channel = supabase
      .channel('admin_audit_log_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_audit_log' },
        (payload) => {
          setLogs((currentLogs) => [payload.new, ...currentLogs].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page, filterAction]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchLogs();
      else setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  async function fetchLogs() {
    setLoading(true);
    try {
      let query = supabase
        .from('admin_audit_log')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`target_resource.ilike.%${searchTerm}%,admin_user_id.eq.${searchTerm},description.ilike.%${searchTerm}%`);
      }

      if (filterAction !== 'all') {
        query = query.eq('action_type', filterAction);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;
      if (data) setLogs(data);
    } catch (err) {
      console.error('LOG_FETCH_ERROR:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <GlowEffect color="#00D9FF" size={600} style={{ top: -100, left: -200, opacity: 0.08 }} />
      
      <header className="top-bar">
        <div className="header-title">
          <span className="breadcrumb">SECURITY // GOVERNANCE // <span className="live-pill mono">LIVE_STREAM</span></span>
          <h1>AUDIT_TRAIL</h1>
        </div>
        <div className="header-actions">
           <div className="search-box group focus-within:border-cyan-500/50 transition-all">
              <Search size={14} className="text-gray-500 group-focus-within:text-cyan-400 font-bold" />
              <input 
                type="text" 
                placeholder="FILTER_BY_RESOURCE_OR_ID..." 
                className="mono" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           
           <div className="relative">
             <button 
               className={`filter-btn mono ${showFilters ? 'active' : ''}`}
               onClick={() => setShowFilters(!showFilters)}
             >
                <Filter size={14} /> {filterAction === 'all' ? 'ACTION_TYPES' : filterAction}
             </button>

             {showFilters && (
               <div className="filters-popover animate-scale-in">
                 <div className="filter-grid">
                   {actionTypes.map(type => (
                     <button 
                       key={type}
                       className={`filter-chip mono ${filterAction === type ? 'selected' : ''}`}
                       onClick={() => { setFilterAction(type); setShowFilters(false); }}
                     >
                       {type}
                     </button>
                   ))}
                 </div>
               </div>
             )}
           </div>
        </div>
      </header>

      <div className="log-container">
         {loading ? (
           <div className="loading mono">
              <Activity className="animate-spin" size={20} />
              SEQUENCING_LOG_STREAM...
           </div>
         ) : (
           <div className="log-stream">
             {logs.map((log) => (
               <GlassCard key={log.id} intensity="low" className="log-entry hover:border-white/10 transition-all group">
                  <div className="log-meta">
                    <div className="meta-left">
                       <Terminal size={12} className="text-cyan-400 font-bold" />
                       <span className="log-timestamp mono font-bold">{new Date(log.created_at).toLocaleString().toUpperCase()}</span>
                    </div>
                    <span className={`log-action mono ${log.action_type?.toLowerCase() || 'default'}`}>{log.action_type || 'SYSTEM'}</span>
                  </div>
                  <div className="log-body">
                     <div className="admin-chip">
                       <Shield size={10} className="text-purple-400 font-bold" />
                       <span className="mono">ID::{log.admin_user_id?.substring(0,8).toUpperCase() || 'SYSTEM'}</span>
                     </div>
                     <p className="log-desc">{log.description || log.target_resource}</p>
                  </div>
                  {(log.old_value || log.new_value) && (
                    <div className="log-details animate-slide-down">
                       <div className="details-header flex justify-between items-center mb-4">
                          <span className="mono text-[9px] text-gray-500 uppercase tracking-widest font-bold">State_Snapshot_Diff</span>
                          <button 
                            className="text-[9px] mono text-cyan-500 hover:text-cyan-400 hover:underline transition-all"
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify({ from: log.old_value, to: log.new_value }, null, 2));
                              success('OBJECT_COPIED', 'JSON payload stored in system clipboard.');
                            }}
                          >
                            COPY_JSON_OBJECT
                          </button>
                       </div>
                       <pre className="log-json mono">
                         {JSON.stringify({
                           before: log.old_value,
                           after: log.new_value
                         }, null, 2)}
                       </pre>
                    </div>
                  )}
               </GlassCard>
             ))}
           </div>
         )}
      </div>

      <div className="pagination mono">
         <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="page-btn">
           <ChevronLeft size={18} />
         </button>
         <span className="page-indicator">BLOCK_{page.toString().padStart(3, '0')}</span>
         <button onClick={() => setPage(p => p + 1)} className="page-btn">
           <ChevronRight size={18} />
         </button>
      </div>

      <style jsx>{`
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 3.5rem;
        }

        .breadcrumb {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 2px;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .live-pill {
           background: rgba(34, 197, 94, 0.1);
           color: #22c55e;
           padding: 2px 8px;
           border-radius: 4px;
           font-size: 0.6rem;
           border: 1px solid rgba(34, 197, 94, 0.2);
           animation: pulse 2s infinite;
        }

        @keyframes pulse {
           0%, 100% { opacity: 1; }
           50% { opacity: 0.6; }
        }

        .header-title h1 {
          font-size: 2.5rem;
          font-weight: 900;
          letter-spacing: -1.5px;
          color: #fff;
          text-transform: uppercase;
        }

        .header-actions {
           display: flex;
           gap: 1rem;
        }

        .search-box {
           background: rgba(255, 255, 255, 0.03);
           border: 1px solid rgba(255, 255, 255, 0.05);
           border-radius: 12px;
           padding: 0 1.25rem;
           display: flex;
           align-items: center;
           gap: 1rem;
           width: 320px;
           height: 48px;
           transition: all 0.3s var(--ease-premium);
        }

        .search-box input {
           background: transparent;
           border: none;
           color: #fff;
           font-size: 0.7rem;
           width: 100%;
           outline: none;
           font-weight: 500;
           letter-spacing: 0.5px;
        }

        .filter-btn {
           background: rgba(255, 255, 255, 0.03);
           border: 1px solid rgba(255, 255, 255, 0.05);
           height: 48px;
           padding: 0 1.5rem;
           border-radius: 12px;
           color: var(--text-muted);
           font-size: 0.7rem;
           display: flex;
           align-items: center;
           gap: 0.75rem;
           transition: all 0.3s var(--ease-premium);
           font-weight: 700;
           letter-spacing: 1px;
        }

        .filter-btn:hover, .filter-btn.active {
           background: rgba(255, 255, 255, 0.06);
           border-color: rgba(255, 255, 255, 0.1);
           color: #fff;
        }

        .filters-popover {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 300px;
          background: rgba(13, 14, 18, 0.98);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.25rem;
          z-index: 100;
          box-shadow: 0 30px 60px rgba(0,0,0,0.8);
        }

        .filter-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .filter-chip {
          font-size: 0.6rem;
          padding: 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          color: var(--text-muted);
          transition: all 0.2s;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .filter-chip:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .filter-chip.selected { 
          background: rgba(0, 217, 255, 0.1); 
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
        }

        .log-stream {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .log-entry {
          padding: 1.75rem;
        }

        .log-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          align-items: center;
        }

        .meta-left {
           display: flex;
           align-items: center;
           gap: 1rem;
        }

        .log-timestamp {
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 1px;
        }

        .log-action {
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 2px;
          padding: 6px 14px;
          border-radius: 6px;
          background: rgba(0, 217, 255, 0.08);
          color: var(--accent-cyan);
          border: 1px solid rgba(0, 217, 255, 0.12);
          text-transform: uppercase;
        }

        .log-action.delete {
          color: #ff4d4d;
          background: rgba(255, 77, 77, 0.08);
          border-color: rgba(255, 77, 77, 0.15);
        }

        .log-body {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .admin-chip {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-weight: 800;
          font-size: 0.65rem;
          color: var(--accent-purple);
          background: rgba(124, 58, 237, 0.08);
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid rgba(124, 58, 237, 0.15);
          letter-spacing: 0.5px;
        }

        .log-desc {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.85);
          font-weight: 400;
          flex: 1;
        }

        .log-details {
           margin-top: 1.75rem;
           padding-top: 1.75rem;
           border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .log-json {
          background: rgba(0, 0, 0, 0.3);
          padding: 1.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          color: var(--accent-cyan);
          overflow-x: auto;
          border: 1px solid rgba(0, 217, 255, 0.08);
          line-height: 1.6;
        }

        .loading {
          text-align: center;
          padding: 10rem 0;
          color: var(--text-muted);
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          letter-spacing: 4px;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3rem;
          margin-top: 5rem;
          padding-bottom: 5rem;
        }

        .page-btn {
           width: 52px;
           height: 52px;
           border-radius: 16px;
           background: rgba(255, 255, 255, 0.03);
           border: 1px solid rgba(255, 255, 255, 0.05);
           color: #fff;
           display: flex;
           align-items: center;
           justify-content: center;
           transition: all 0.3s var(--ease-premium);
        }

        .page-btn:hover:not(:disabled) {
           background: rgba(255, 255, 255, 0.08);
           border-color: rgba(255, 255, 255, 0.15);
           transform: translateY(-2px);
        }

        .page-btn:disabled {
           opacity: 0.2;
           cursor: not-allowed;
           transform: none;
        }

        .page-indicator {
           font-size: 0.9rem;
           color: var(--text-muted);
           letter-spacing: 3px;
           font-weight: 900;
           font-family: 'JetBrains Mono', monospace;
        }

        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95) translateY(-5px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .animate-slide-down {
          animation: slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 2s linear infinite;
        }

        /* Light Theme Fixes */
        :global([data-theme='light']) .breadcrumb { color: #64748b; }
        :global([data-theme='light']) h1 { color: #0f172a; }
        :global([data-theme='light']) .search-box { background: #fff; border-color: #e2e8f0; }
        :global([data-theme='light']) .search-box input { color: #0f172a; }
        :global([data-theme='light']) .filter-btn { background: #fff; border-color: #e2e8f0; color: #64748b; }
        :global([data-theme='light']) .filter-btn:hover { background: #f8fafc; color: #0f172a; }
        :global([data-theme='light']) .log-desc { color: #1e293b; }
        :global([data-theme='light']) .log-json { background: #f1f5f9; color: #0891b2; border-color: #e2e8f0; }
        :global([data-theme='light']) .page-btn { background: #fff; border-color: #e2e8f0; color: #1e293b; }
      `}</style>
    </AdminLayout>
  );
}
