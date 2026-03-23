'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Activity, Search, Filter, Download, List, RefreshCw, 
  ChevronRight, ChevronDown, User, Shield, Terminal, 
  AlertCircle, Info, Zap, Database, Globe, Lock, Ban
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlowEffect } from '../../../components/ui/GlowEffect';
import { useToast } from '../../../components/ui/ToastProvider';

type LogSource = 'AUDIT_TRAIL' | 'USER_ACTIVITY' | 'SYSTEM_EVENTS' | 'SECURITY_LOG';
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface LogEntry {
  id: string;
  source: LogSource;
  level: LogLevel;
  message: string;
  user_id?: string;
  timestamp: string;
  ip_address?: string;
  metadata: any;
}

export default function UnifiedLogViewer() {
  const [activeTab, setActiveTab] = useState<LogSource>('AUDIT_TRAIL');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { info, error: toastError, success } = useToast();

  useEffect(() => {
    fetchLogs();
    
    // Scoped Realtime Subscription
    const table = getTableForSource(activeTab);
    const channel = supabase
      .channel(`logs_${activeTab.toLowerCase()}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: table 
      }, (payload) => {
        const newLog = mapToLogEntry(payload.new, activeTab);
        setLogs(prev => [newLog, ...prev].slice(0, 100));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, levelFilter]);

  const getTableForSource = (source: LogSource) => {
    switch (source) {
      case 'AUDIT_TRAIL': return 'admin_audit_log';
      case 'USER_ACTIVITY': return 'user_activity_log';
      case 'SYSTEM_EVENTS': return 'system_event_log';
      case 'SECURITY_LOG': return 'security_log';
    }
  };

  const mapToLogEntry = (data: any, source: LogSource): LogEntry => {
    switch (source) {
      case 'AUDIT_TRAIL':
        return {
          id: data.id,
          source,
          level: data.action_type === 'DELETE' ? 'WARN' : 'INFO',
          message: `${data.action_type} on ${data.target_resource}`,
          user_id: data.admin_user_id,
          timestamp: data.created_at,
          ip_address: data.ip_address,
          metadata: { old: data.old_value, new: data.new_value, reason: data.reason }
        };
      case 'USER_ACTIVITY':
        return {
          id: data.id,
          source,
          level: 'INFO',
          message: `User ${data.event?.replace(/_/g, ' ')}`,
          user_id: data.user_id,
          timestamp: data.created_at,
          ip_address: data.ip_address,
          metadata: data.metadata
        };
      case 'SYSTEM_EVENTS':
        return {
          id: data.id,
          source,
          level: data.severity as LogLevel,
          message: `[${data.service}] ${data.message}`,
          timestamp: data.created_at,
          metadata: { type: data.event_type, resolved_at: data.resolved_at }
        };
      case 'SECURITY_LOG':
        return {
          id: data.id,
          source,
          level: data.severity as LogLevel,
          message: data.threat_type?.replace(/_/g, ' '),
          user_id: data.user_id,
          timestamp: data.created_at,
          ip_address: data.ip_address,
          metadata: data.metadata
        };
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const table = getTableForSource(activeTab);
      let query = supabase.from(table).select('*').order('created_at', { ascending: false }).limit(100);
      
      if (levelFilter !== 'ALL') {
         if (activeTab === 'SYSTEM_EVENTS' || activeTab === 'SECURITY_LOG') {
            query = query.eq('severity', levelFilter);
         }
      }

      const { data, error } = await query;
      if (error) throw error;

      setLogs((data || []).map(l => mapToLogEntry(l, activeTab)));
    } catch (e: any) {
      toastError(`LOG_FETCH_FAILURE: ${e.message}`);
    }
    setLoading(false);
  };

  const blockIP = async (ip: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-ip-blocker', {
        body: { ip }
      });
      if (error) throw error;
      success(`IP_BLOCK_PROTOCOL: ${ip} restricted`);
    } catch (e: any) {
      toastError(`BLOCK_COMMAND_FAILURE: ${e.message}`);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'TIMESTAMP', 'LEVEL', 'MESSAGE', 'USER_ID', 'IP_ADDRESS'];
    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      l.level,
      l.message,
      l.user_id || 'SYSTEM',
      l.ip_address || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `quantmind_${activeTab.toLowerCase()}_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    info('EXPORT_INITIALIZED: csv_stream_resolved');
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'FATAL': return 'text-red-600 bg-red-600/10 border-red-600/20';
      case 'ERROR': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'WARN': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'INFO': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'DEBUG': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-cyan-400 uppercase tracking-[0.3em] mb-2 block">TERMINAL // LOGS // {activeTab}</span>
          <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight uppercase">Unified Log Aggregator</h1>
        </div>
        
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] mono text-gray-400 hover:text-white hover:border-white/20 transition-all group"
        >
          <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
          EXPORT_DATA_CSV
        </button>
      </header>

      {/* Source Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['AUDIT_TRAIL', 'USER_ACTIVITY', 'SYSTEM_EVENTS', 'SECURITY_LOG'] as LogSource[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-[10px] mono tracking-widest transition-all ${activeTab === tab ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400 border' : 'bg-white/5 border border-white/5 text-gray-500 hover:bg-white/10'}`}
          >
            {tab.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <GlassCard className="p-6" intensity="low">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
           <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text"
                placeholder="PROBE_STREAM: Input fingerprint or message..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-xs mono text-white focus:outline-none focus:border-cyan-500/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           
           <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1">
              <Filter size={14} className="text-gray-500" />
              <select 
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as any)}
                className="bg-transparent border-none text-[10px] mono text-gray-400 focus:outline-none py-2 cursor-pointer"
              >
                <option value="ALL">ALL_SEVERITIES</option>
                <option value="FATAL">FATAL</option>
                <option value="ERROR">ERROR</option>
                <option value="WARN">WARN</option>
                <option value="INFO">INFO</option>
                <option value="DEBUG">DEBUG</option>
              </select>
           </div>

           <button 
             onClick={fetchLogs}
             className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-gray-400"
           >
             <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>

        <div className="space-y-2">
           {loading && logs.length === 0 ? (
              Array(10).fill(0).map((_, i) => (
                 <div key={i} className="h-14 w-full bg-white/[0.02] rounded-xl animate-pulse" />
              ))
           ) : logs.length === 0 ? (
              <div className="py-20 text-center opacity-30">
                 <Terminal size={48} className="mx-auto mb-4" />
                 <span className="mono text-xs uppercase tracking-widest">NO_SIGNALS_DETECTED: Active filter range empty</span>
              </div>
           ) : (
              logs.filter(l => l.message.toLowerCase().includes(search.toLowerCase())).map((log) => (
                 <div key={log.id} className="group">
                    <div 
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/[0.03] cursor-pointer transition-all ${expandedId === log.id ? 'bg-white/[0.05] border-white/10' : 'bg-white/[0.01]'}`}
                    >
                       <div className={`w-20 text-center py-1 rounded border text-[9px] font-black mono shrink-0 ${getLevelColor(log.level)}`}>
                          {log.level || 'INFO'}
                       </div>
                       
                       <div className="flex items-center gap-3 min-w-[80px]">
                          <span className="mono text-[10px] text-gray-500 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                       </div>

                       <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-300 truncate mono tracking-tight">{log.message}</p>
                       </div>

                       <div className="flex items-center gap-4 shrink-0">
                          {log.ip_address && (
                             <div className="flex items-center gap-2 px-2 py-1 bg-black/40 rounded border border-white/5 text-[9px] mono text-gray-500">
                                <Globe size={10} />
                                {log.ip_address}
                             </div>
                          )}
                          <div className={`transition-transform duration-300 ${expandedId === log.id ? 'rotate-180' : ''}`}>
                             <ChevronDown size={14} className="text-gray-600" />
                          </div>
                       </div>
                    </div>
                    
                    {expandedId === log.id && (
                       <div className="p-6 bg-black/40 border-x border-b border-white/10 rounded-b-xl animate-slide-down">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                             <div className="lg:col-span-2 space-y-4">
                                <div>
                                   <span className="mono text-[8px] text-gray-600 block mb-2 uppercase tracking-widest">Payload_Inspect</span>
                                   <pre className="text-[11px] mono text-cyan-400 inline-block p-4 bg-black/40 rounded-xl border border-white/10 w-full overflow-x-auto shadow-inner">
                                      {JSON.stringify(log.metadata, null, 2)}
                                   </pre>
                                </div>
                             </div>
                             
                             <div className="space-y-6">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                                   <div>
                                      <span className="mono text-[8px] text-gray-600 block mb-1 uppercase tracking-widest">Entry_Fingerprint</span>
                                      <span className="text-[10px] mono text-gray-400 break-all">{log.id}</span>
                                   </div>
                                   <div>
                                      <span className="mono text-[8px] text-gray-600 block mb-1 uppercase tracking-widest">Source_Node</span>
                                      <span className="text-[10px] mono text-cyan-500">{log.source}</span>
                                   </div>
                                   {log.user_id && (
                                      <div>
                                         <span className="mono text-[8px] text-gray-600 block mb-1 uppercase tracking-widest">Entity_ID</span>
                                         <span className="text-[10px] mono text-white">{log.user_id}</span>
                                      </div>
                                   )}
                                </div>

                                {activeTab === 'SECURITY_LOG' && log.ip_address && (
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); blockIP(log.ip_address!); }}
                                     className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 mono text-[10px] hover:bg-red-500 hover:text-white transition-all group"
                                   >
                                      <Ban size={14} className="group-hover:scale-110 transition-transform" />
                                      INVOKE_IP_BLOCK_PROTOCOL
                                   </button>
                                )}

                                <button className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 mono text-[10px] hover:bg-white/10 hover:text-white transition-all">
                                   <Search size={14} />
                                   TRACE_RECURSIVE
                                </button>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
              ))
           )}
        </div>
      </GlassCard>

      <style jsx>{`
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-down { animation: slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        select::-ms-expand { display: none; }
        select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
      `}</style>
    </div>
  );
}
