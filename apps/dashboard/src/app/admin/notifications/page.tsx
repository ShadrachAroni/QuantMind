'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
   Bell, Filter, Search, MoreVertical, CheckCircle2,
   Trash2, RefreshCw,  Activity, Server, Zap, Users, Clock, AlertCircle,
  ArrowUpRight, ArrowDownRight, BarChart3,
  Settings2, Database, Shield, Radio, Globe, Eye, Calendar, User, Info,
   AlertTriangle, XCircle, CheckCircle, ArrowUpDown
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlowEffect } from '../../../components/ui/GlowEffect';
import { useToast } from '../../../components/ui/ToastProvider';

type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'system' | 'security' | 'upgrade' | 'achievement';

interface Notification {
   id: string;
   event_type: NotificationType;
   message: string;
   is_read: boolean;
   created_at: string;
   metadata?: any;
}

export default function NotificationsCenter() {
   const [notifications, setNotifications] = useState<Notification[]>([]);
   const [loading, setLoading] = useState(true);
   const [filter, setFilter] = useState<string>('all');
   const [search, setSearch] = useState('');
   const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
   const [selectedIds, setSelectedIds] = useState<string[]>([]);
   const [showRead, setShowRead] = useState(false);
   const { success, error: toastError } = useToast();

   useEffect(() => {
      fetchNotifications();
      const channel = supabase
         .channel('admin_notifications_realtime')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'system_events' }, fetchNotifications)
         .subscribe();

      return () => {
         supabase.removeChannel(channel);
      };
   }, [filter, search, showRead]);

   const fetchNotifications = async () => {
      setLoading(true);
      let query = supabase
         .from('system_events')
         .select('*')
         .order('created_at', { ascending: false });

      if (!showRead) {
         query = query.eq('is_read', false);
      }

      if (filter !== 'all') {
         query = query.eq('event_type', filter);
      }

      if (search) {
         query = query.ilike('message', `%${search}%`);
      }

      const { data, error } = await query;
      if (data) setNotifications(data);
      if (error) toastError('PROTOCOL_ERROR: UNAVAILABLE_DATA_STREAM');
      setLoading(false);
   };

   const handleToggleRead = async (id: string, currentStatus: boolean) => {
      const { error } = await supabase
         .from('system_events')
         .update({ is_read: !currentStatus })
         .eq('id', id);
      if (!error) success(`NOTIFICATION_STATE_UPDATED: ${id.substring(0, 8)}`);
   };

   const handleDelete = async (id: string) => {
      const { error } = await supabase
         .from('system_events')
         .delete()
         .eq('id', id);
      if (!error) success(`PROTOCOL_DELETED: ${id.substring(0, 8)}`);
   };

   const handleBulkMarkRead = async () => {
      if (selectedIds.length === 0) return;
      const { error } = await supabase
         .from('system_events')
         .update({ is_read: true })
         .in('id', selectedIds);
      if (!error) {
         success(`BULK_ACKNOWLEDGE_SUCCESS: ${selectedIds.length}_EVENTS`);
         setSelectedIds([]);
      }
   };

   const getTypeColor = (type: NotificationType) => {
      switch (type) {
         case 'error': return 'text-red-400 bg-red-400/10 border-red-400/20';
         case 'warning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
         case 'success': return 'text-green-400 bg-green-400/10 border-green-400/20';
         case 'security': return 'text-red-500 bg-red-400/20 border-red-500/20';
         case 'upgrade': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
         case 'achievement': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
         default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      }
   };

   const getTypeIcon = (type: NotificationType) => {
      switch (type) {
         case 'error': return <XCircle size={14} />;
         case 'warning': return <AlertTriangle size={14} />;
         case 'success': return <CheckCircle size={14} />;
         case 'system': return <Shield size={14} />;
         case 'security': return <Shield size={14} />;
         default: return <Info size={14} />;
      }
   };

   return (
      <div className="space-y-8 animate-fade-in relative">
         <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
               <span className="mono text-[10px] text-cyan-400 uppercase tracking-[0.3em] mb-2 block">Central Command // Hub</span>
               <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight">Notifications Center</h1>
            </div>

            <div className="flex items-center gap-3">
               <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
                  <input
                     type="text"
                     placeholder="Filter by hash, message..."
                     className="bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-xs mono text-white focus:outline-none focus:border-cyan-500/50 transition-all w-[300px]"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && fetchNotifications()}
                  />
               </div>
               <button
                  onClick={fetchNotifications}
                  className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition-all"
               >
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
               </button>
            </div>
         </header>

         <div className="grid grid-cols-1 gap-6">
            <GlassCard className="p-0 overflow-hidden" intensity="low">
               <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-white/5 gap-4">
                  <div className="flex items-center gap-4">
                     <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[10px] mono text-gray-400 focus:outline-none focus:border-cyan-500/50"
                     >
                        <option value="all">ALL_TYPES</option>
                        <option value="info">INFO</option>
                        <option value="warning">WARNING</option>
                        <option value="error">ERROR</option>
                        <option value="system">SYSTEM</option>
                        <option value="security">SECURITY</option>
                     </select>

                     <button
                        onClick={() => setShowRead(!showRead)}
                        className={`px-4 py-2 rounded-lg text-[10px] mono font-bold border transition-all ${
                           showRead 
                           ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' 
                           : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'
                        }`}
                     >
                        {showRead ? 'HIDE_ACKNOWLEDGED' : 'SHOW_ACKNOWLEDGED'}
                     </button>

                     {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 animate-scale-in">
                           <button
                              onClick={handleBulkMarkRead}
                              className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-[10px] mono font-bold hover:bg-cyan-500/20 transition-all"
                           >
                              ACKNOWLEDGE_SELECTED ({selectedIds.length})
                           </button>
                        </div>
                     )}
                  </div>

                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        <span className="text-[10px] mono text-gray-500 uppercase">Live_Feed_Active</span>
                     </div>
                  </div>
               </div>

               <div className="overflow-x-auto min-h-[400px]">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5 uppercase tracking-widest mono text-[9px] text-gray-500">
                           <th className="p-6 w-12 text-center">
                              <input
                                 type="checkbox"
                                 onChange={(e) => {
                                    if (e.target.checked) setSelectedIds(notifications.map(n => n.id));
                                    else setSelectedIds([]);
                                 }}
                                 checked={selectedIds.length === notifications.length && notifications.length > 0}
                                 className="accent-cyan-500 opacity-50"
                              />
                           </th>
                           <th className="p-6">Origin / Type</th>
                           <th className="p-6">Communication Stream</th>
                           <th className="p-6">Timestamp</th>
                           <th className="p-6 text-right w-32">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {loading ? (
                           Array(6).fill(0).map((_, i) => (
                              <tr key={i} className="animate-pulse">
                                 <td colSpan={5} className="p-6 h-12 bg-white/[0.01]" />
                              </tr>
                           ))
                        ) : notifications.length === 0 ? (
                           <tr>
                              <td colSpan={5} className="p-20 text-center">
                                 <div className="flex flex-col items-center gap-4 opacity-20">
                                    <Bell size={48} className="text-gray-400" />
                                    <span className="mono text-xs uppercase tracking-widest text-gray-500">Zero Communications Logged</span>
                                 </div>
                              </td>
                           </tr>
                        ) : (
                           notifications.map((n) => (
                              <tr key={n.id} className={`group hover:bg-white/[0.02] transition-colors ${!n.is_read ? 'bg-cyan-500/[0.02]' : ''}`}>
                                 <td className="p-6 text-center">
                                    <input
                                       type="checkbox"
                                       checked={selectedIds.includes(n.id)}
                                       onChange={(e) => {
                                          if (e.target.checked) setSelectedIds([...selectedIds, n.id]);
                                          else setSelectedIds(selectedIds.filter(id => id !== n.id));
                                       }}
                                       className="accent-cyan-500 opacity-50"
                                    />
                                 </td>
                                 <td className="p-6">
                                    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border mono text-[9px] font-bold ${getTypeColor(n.event_type)}`}>
                                       {getTypeIcon(n.event_type)}
                                       {n.event_type.toUpperCase()}
                                    </div>
                                 </td>
                                 <td className="p-6">
                                    <div className="flex flex-col gap-1 max-w-md">
                                       <span className={`text-sm ${!n.is_read ? 'text-white font-semibold' : 'text-gray-400'}`}>{n.message}</span>
                                       <span className="text-[10px] mono text-gray-600 truncate">SHA256: {n.id.replace(/-/g, '').substring(0, 32)}</span>
                                    </div>
                                 </td>
                                 <td className="p-6">
                                    <div className="flex flex-col">
                                       <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                                       <span className="text-[10px] mono text-gray-600 mt-0.5">{new Date(n.created_at).toLocaleTimeString()}</span>
                                    </div>
                                 </td>
                                 <td className="p-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                       <button
                                          onClick={() => setSelectedNotification(n)}
                                          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                          title="DEBUG_METADATA"
                                       >
                                          <Eye size={14} />
                                       </button>
                                       <button
                                          onClick={() => handleToggleRead(n.id, n.is_read)}
                                          className={`p-2 rounded-lg transition-colors ${n.is_read ? 'bg-white/5 text-gray-600' : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'}`}
                                          title={n.is_read ? 'REMARK_AS_UNREAD' : 'ACKNOWLEDGE_EVENT'}
                                       >
                                          <CheckCircle2 size={14} />
                                       </button>
                                       <button
                                          onClick={() => handleDelete(n.id)}
                                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                          title="TERMINATE_RECORD"
                                       >
                                          <Trash2 size={14} />
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>

               <div className="p-6 border-t border-white/5 flex items-center justify-between text-[10px] mono text-gray-500">
                  <span>DISPLAYING_TOTAL: {notifications.length} COMMUNICATIONS</span>
                  <div className="flex items-center gap-4">
                     <button disabled className="hover:text-cyan-400 transition-colors disabled:opacity-30">PREVIOUS_NODE</button>
                     <span className="text-gray-700">//</span>
                     <button disabled className="hover:text-cyan-400 transition-colors disabled:opacity-30">NEXT_NODE</button>
                  </div>
               </div>
            </GlassCard>
         </div>

         {/* Details Modal */}
         {selectedNotification && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" onClick={() => setSelectedNotification(null)} />
               <GlassCard className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-8 animate-scale-in" intensity="high">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl border ${getTypeColor(selectedNotification.event_type)}`}>
                           {getTypeIcon(selectedNotification.event_type)}
                        </div>
                        <div>
                           <span className="mono text-[10px] text-gray-500 uppercase tracking-widest">{selectedNotification.event_type} // {selectedNotification.id.substring(0, 8)}</span>
                           <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Signal Analysis</h2>
                        </div>
                     </div>
                     <button onClick={() => setSelectedNotification(null)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white">
                        <Eye size={20} className="rotate-180" />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                     <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                        <span className="mono text-[8px] text-gray-600 block mb-3 uppercase tracking-widest">Decoded_Message</span>
                        <p className="text-lg text-white leading-relaxed font-semibold">
                           {selectedNotification.message}
                        </p>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                           <span className="mono text-[8px] text-gray-600 block mb-1">RECORDED_AT</span>
                           <span className="text-xs text-theme-primary mono">{new Date(selectedNotification.created_at).toLocaleString()}</span>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                           <span className="mono text-[8px] text-gray-600 block mb-1">CLEARANCE_STATUS</span>
                           <span className={`text-xs mono font-bold ${selectedNotification.is_read ? 'text-gray-500' : 'text-cyan-400'}`}>
                              {selectedNotification.is_read ? 'ACKNOWLEDGED' : 'PENDING_REVIEW'}
                           </span>
                        </div>
                     </div>

                     <div className="p-6 bg-black/40 border border-white/5 rounded-2xl">
                        <span className="mono text-[8px] text-gray-600 block mb-3 uppercase tracking-widest">Metadata_Trace</span>
                        <pre className="text-[10px] mono text-cyan-400/70 overflow-x-auto">
                           {JSON.stringify(selectedNotification.metadata || { "system": "operational", "origin": "institutional_mainnet" }, null, 2)}
                        </pre>
                     </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex justify-end gap-3">
                     <button onClick={() => handleDelete(selectedNotification.id)} className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] mono font-bold transition-all">
                        TERMINATE_LOG
                     </button>
                     <button onClick={() => setSelectedNotification(null)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] mono font-bold transition-all">
                        DISMISS_VIEW
                     </button>
                  </div>
               </GlassCard>
            </div>
         )}

         <style jsx>{`
         .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
         .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
         
         @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
         @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

         .custom-scrollbar::-webkit-scrollbar { width: 4px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
      </div>
   );
}
