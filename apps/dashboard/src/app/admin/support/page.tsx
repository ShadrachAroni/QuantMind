'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  MessageSquare, HelpCircle, AlertCircle, CheckCircle2,
  Clock, Users, User, ArrowRight, X, Plus, Save,
  MoreVertical, Search, Filter, Shield, Zap,
  Inbox, Send, Reply, Layout, Calendar, Trash2, Megaphone,
  History as LucideHistory
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlowEffect } from '../../../components/ui/GlowEffect';
import { useToast } from '../../../components/ui/ToastProvider';
import { HoloLoader } from '../../../components/ui/HoloLoader';

export default function AdminSupportPage() {
  return (
    <Suspense fallback={<div className="loading mono p-24 text-center">SYNCHRONIZING_RELATIONS_ENGINE...</div>}>
      <SupportContent />
    </Suspense>
  );
}

function SupportContent() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const { success, error, info } = useToast();

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoaderProgress(prev => (prev < 90 ? prev + Math.random() * 10 : prev));
      }, 150);
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    fetchSupportData();
  }, []);

  async function fetchSupportData() {
    try {
      const { data: ticketData } = await supabase
        .from('support_tickets')
        .select('*, user_profiles(email)')
        .order('created_at', { ascending: false })
        .limit(20);
      
      const { data: announceData } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketData) setTickets(ticketData);
      if (announceData) setAnnouncements(announceData);
    } catch (e: any) {
      error('SUPPORT_FAULT', e.message);
    }
    setLoading(false);
  }

  async function fetchMessages(ticketId: string) {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  }

  const handleTicketSelect = (ticket: any) => {
    setSelectedTicket(ticket);
    fetchMessages(ticket.id);
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyContent) return;
    const { error: err } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: selectedTicket.id,
        content: replyContent,
        is_staff: true,
        user_id: (await supabase.auth.getUser()).data.user?.id
      });
    
    if (!err) {
      success('REPLY_TRANSMITTED', 'Communication relay established.');
      setReplyContent('');
      fetchMessages(selectedTicket.id);
    }
  };

  if (loading) return (
    <HoloLoader 
      progress={loaderProgress} 
      phase="INIT_RELATIONS_CENTER" 
      isMuted={isMuted} 
      onToggleMute={() => setIsMuted(!isMuted)} 
    />
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-cyan-400 uppercase tracking-[0.3em] mb-2 block">Terminal // Support_HQ</span>
          <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight uppercase font-jetbrains">Relations</h1>
        </div>
        
        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] mono text-gray-400 hover:text-white transition-all">
              <Inbox size={14} />
              FEEDBACK_ARCHIVE
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-[10px] mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
              <Megaphone size={14} />
              BROADCAST_SYSTEM
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         {/* Ticket Queue */}
         <div className="xl:col-span-1 space-y-6">
            <GlassCard className="p-6" intensity="low">
               <h3 className="mono text-[10px] font-black tracking-widest text-cyan-400 uppercase mb-6 flex items-center gap-2">
                  <MessageSquare size={14} />
                  Ticket_Queue
               </h3>
               
               <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                  {tickets.map((t) => (
                    <button 
                      key={t.id}
                      onClick={() => handleTicketSelect(t)}
                      className={`w-full p-4 border rounded-2xl flex flex-col gap-2 transition-all text-left group ${selectedTicket?.id === t.id ? 'bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20 shadow-lg' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                    >
                       <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black mono tracking-tighter ${t.priority > 0 ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-500'}`}>
                             {t.priority > 0 ? 'H_PRIORITY' : 'NORMAL'}
                          </span>
                          <span className="text-[8px] mono text-gray-600 uppercase tracking-widest">{new Date(t.created_at).toLocaleDateString()}</span>
                       </div>
                       <div>
                          <div className={`text-[11px] font-bold ${selectedTicket?.id === t.id ? 'text-white' : 'text-gray-300'} group-hover:text-white transition-colors`}>{t.subject}</div>
                          <div className="text-[8px] mono text-gray-500 truncate">{t.user_profiles?.email}</div>
                       </div>
                    </button>
                  ))}
                  {tickets.length === 0 && <div className="text-center py-10 mono text-[10px] text-gray-600 uppercase">QUEUE_EMPTY</div>}
               </div>
            </GlassCard>

            {/* Announcement Manager Snippet */}
            <GlassCard className="p-6" intensity="low">
               <h3 className="mono text-[10px] font-black tracking-widest text-purple-400 uppercase mb-6 flex items-center gap-2">
                  <Megaphone size={14} />
                  Live_Banners
               </h3>
               <div className="space-y-3">
                  {announcements.map((a) => (
                    <div key={a.id} className="p-3 bg-white/5 border border-white/5 rounded-xl group hover:border-purple-500/30 transition-all">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-gray-200">{a.title}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${a.active ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-700'}`} />
                       </div>
                       <div className="text-[8px] mono text-gray-600 uppercase">TARGET: {a.target_tier}</div>
                    </div>
                  ))}
               </div>
               <button className="w-full mt-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] mono text-gray-500 hover:text-white transition-all">
                  SCHEDULE_NEW_NODE
               </button>
            </GlassCard>
         </div>

         {/* Message Interface */}
         <div className="xl:col-span-3 h-[760px] flex flex-col gap-6">
            {selectedTicket ? (
              <GlassCard className="flex-1 flex flex-col p-0 border-white/10 overflow-hidden" intensity="low">
                 <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                          {selectedTicket.user_profiles?.email?.[0].toUpperCase()}
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-white tracking-widest">{selectedTicket.subject}</h4>
                          <p className="text-[10px] mono text-gray-500">{selectedTicket.user_profiles?.email} // {selectedTicket.id}</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-green-400 border border-white/5 hover:border-green-500/30"><CheckCircle2 size={18} /></button>
                       <button className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/30"><Trash2 size={18} /></button>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-black/40">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.is_staff ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[70%] p-5 rounded-3xl border ${m.is_staff ? 'bg-cyan-500/5 border-cyan-500/20 text-right' : 'bg-white/5 border-white/10'}`}>
                            {m.is_staff && <span className="mono text-[8px] text-cyan-400 uppercase font-black block mb-2 tracking-widest">Support_Agent</span>}
                            <p className="text-xs text-gray-300 leading-relaxed">{m.content}</p>
                            <span className="text-[8px] mono text-gray-600 mt-2 block tracking-widest uppercase">{new Date(m.created_at).toLocaleTimeString()}</span>
                         </div>
                      </div>
                    ))}
                    {messages.length === 0 && <div className="text-center py-20 mono text-[10px] text-gray-700">WAITING_FOR_COMM_SYNCH...</div>}
                 </div>

                 <div className="p-6 border-t border-white/5 bg-white/5">
                    <div className="relative">
                       <textarea 
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="INITIALIZE_RESPONSE: ENTER MESSAGE CONTENT..."
                          className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 pr-20 text-[11px] mono text-gray-300 focus:outline-none focus:border-cyan-500/30 resize-none h-[120px] custom-scrollbar"
                       />
                       <button 
                         onClick={sendReply}
                         className="absolute right-4 bottom-4 p-4 bg-cyan-500 text-white rounded-2xl shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all hover:scale-105 active:scale-95"
                       >
                          <Send size={20} />
                       </button>
                    </div>
                 </div>
              </GlassCard>
            ) : (
              <GlassCard className="flex-1 flex items-center justify-center border-dashed border-white/10" intensity="low">
                 <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                       <Inbox size={24} className="text-gray-700 font-bold" />
                    </div>
                    <p className="mono text-[10px] text-gray-600 uppercase tracking-widest">Select_Interface_To_Initialize_Comm</p>
                 </div>
              </GlassCard>
            )}
            
            {/* Quick Actions Strip */}
            <div className="grid grid-cols-4 gap-4">
               {[
                 { label: 'USER_IMPERSONATION', icon: <Users size={14} />, color: 'hover:text-purple-400' },
                 { label: 'RESET_CLEARANCE', icon: <Shield size={14} />, color: 'hover:text-cyan-400' },
                 { label: 'PROTOCOL_DEBUG', icon: <Zap size={14} />, color: 'hover:text-yellow-400' },
                 { label: 'TERMINAL_LOGS', icon: <LucideHistory size={14} />, color: 'hover:text-pink-400' },
               ].map(btn => (
                 <button key={btn.label} className={`p-4 bg-white/5 border border-white/10 rounded-2xl mono text-[8px] text-gray-600 uppercase transition-all flex flex-col items-center gap-2 ${btn.color} hover:bg-white/10`}>
                    {btn.icon}
                    {btn.label}
                 </button>
               ))}
            </div>
         </div>
      </div>

      <style jsx>{`
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
