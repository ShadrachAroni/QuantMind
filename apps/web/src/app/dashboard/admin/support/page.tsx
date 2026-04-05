'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Mail, 
  User, 
  Clock, 
  ChevronRight, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Paperclip,
  ArrowLeft,
  X,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Zap,
  ShieldCheck,
  History
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/components/UserContext';
import { useTranslation } from '@/lib/i18n';
import ReactMarkdown from 'react-markdown';

interface Ticket {
  id: string;
  user_id: string | null;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'escalated';
  priority: 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  metadata: any;
  user_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    tier: string;
  };
}

interface Message {
  id: string;
  ticket_id: string;
  content: string;
  is_staff: boolean;
  created_at: string;
  metadata: any;
}

export default function AdminTicketingPage() {
  const { profile } = useUser();
  const t = useTranslation(profile?.interface_language || 'ENGLISH_INTL');
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();
    
    // Realtime subscription
    const ticketChannel = supabase.channel('admin-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchTickets)
      .subscribe();

    return () => {
      supabase.removeChannel(ticketChannel);
    };
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      fetchMessages(selectedTicketId);
      
      const msgChannel = supabase.channel(`ticket-${selectedTicketId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'support_messages',
          filter: `ticket_id=eq.${selectedTicketId}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(msgChannel);
      };
    }
  }, [selectedTicketId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, user_profiles(first_name, last_name, email, tier)')
      .order('updated_at', { ascending: false });

    if (!error && data) setTickets(data);
    setLoading(false);
  };

  const fetchMessages = async (ticketId: string) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (!error && data) setMessages(data);
  };

  const handleSendReply = async () => {
    if (!selectedTicketId || !replyText.trim() || isSending) return;
    setIsSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('https://qvqczzyghhgzaesiwtkj.supabase.co/functions/v1/handle-support-outbound', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ticket_id: selectedTicketId,
          content: replyText,
          status: 'pending'
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to dispatch reply');
      }
      
      setReplyText('');
    } catch (error) {
      console.error('Reply Error:', error);
      alert('REPLY_DISPATCH_FAILURE: Connection to Resend relay interrupted.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestAI = async () => {
    if (!selectedTicketId || isSuggesting) return;
    setIsSuggesting(true);

    try {
      const ticket = tickets.find(t => t.id === selectedTicketId);
      const conversationContext = messages.slice(-5).map(m => `${m.is_staff ? 'QuantMind' : 'Customer'}: ${m.content}`).join('\n');
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [
            { 
              role: 'user', 
              content: `CONTEXT: Support Ticket for QuantMind. User Query: ${ticket?.subject}. \n\nCONVERSATION HISTORY:\n${conversationContext}\n\nTASK: Draft a professional, institutional-grade reply (Markdown). Focus on being helpful, authoritative, and concise.` 
            }
          ] 
        }),
      });

      if (!response.ok) throw new Error('AI relay failure');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value);
        setReplyText(fullText.trim()); // Dynamic update
      }
    } catch (error) {
      console.error('AI Suggestion Error:', error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.user_profiles?.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-[#FFD60A] bg-[#FFD60A]/10 border-[#FFD60A]/20';
      case 'pending': return 'text-[#00D9FF] bg-[#00D9FF]/10 border-[#00D9FF]/20';
      case 'resolved': return 'text-[#32D74B] bg-[#32D74B]/10 border-[#32D74B]/20';
      case 'escalated': return 'text-[#FF453A] bg-[#FF453A]/10 border-[#FF453A]/20';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  // Security Gate UI
  if (profile && !profile.is_admin) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <GlassCard className="max-w-md p-8 text-center" intensity="high">
          <AlertCircle className="mx-auto text-[#FF453A] mb-4" size={48} />
          <h1 className="text-xl font-bold text-white mb-2 uppercase font-mono">Access_Denied</h1>
          <p className="text-[#848D97] text-sm">Institutional admin credentials required to establish a secure support relay.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] overflow-hidden flex flex-col md:flex-row p-4 md:p-8 gap-6 animate-in fade-in duration-700">
      
      {/* Sidebar: Ticket List */}
      <div className={cn(
        "flex-1 md:flex-none md:w-80 lg:w-96 flex flex-col gap-4 transition-all duration-300",
        selectedTicketId && "hidden md:flex"
      )}>
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-white uppercase font-mono tracking-tight text-glow">Support_Relay</h2>
          <div className="flex items-center gap-2">
            <RefreshCw 
              size={14} 
              className={cn("text-[#848D97] cursor-pointer hover:text-white transition-colors", loading && "animate-spin")} 
              onClick={fetchTickets}
            />
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#848D97] transition-colors group-focus-within:text-[#00D9FF]" size={16} />
          <input 
            type="text" 
            placeholder="Search credentials / subjects..."
            className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 px-1">
          {['all', 'open', 'pending', 'resolved'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all",
                statusFilter === status 
                  ? "bg-white/10 text-white border-white/20" 
                  : "bg-transparent text-[#848D97] border-transparent hover:text-white"
              )}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pr-1">
          {filteredTickets.map(ticket => (
            <div 
              key={ticket.id}
              onClick={() => setSelectedTicketId(ticket.id)}
              className={cn(
                "p-4 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.02] active:scale-95",
                selectedTicketId === ticket.id 
                  ? "bg-[#00D9FF]/10 border-[#00D9FF]/30 shadow-[0_4px_12_rgba(0,217,255,0.1)]" 
                  : "bg-white/[0.03] border-white/5 hover:border-white/10"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                 <span className="text-[9px] font-mono font-bold text-[#848D97] uppercase tracking-widest leading-none">
                   QS-{ticket.id.substring(0, 8)}
                 </span>
                 <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border", getStatusColor(ticket.status))}>
                   {ticket.status}
                 </span>
              </div>
              <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1 group-hover:text-[#00D9FF] transition-colors">{ticket.subject}</h3>
              <div className="flex items-center justify-between text-[10px] text-[#848D97]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <User size={12} className="shrink-0" />
                  <span className="truncate">{ticket.user_profiles?.email || 'Guest User'}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Clock size={12} />
                  <span>{new Date(ticket.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))}
          {!loading && filteredTickets.length === 0 && (
            <div className="py-12 text-center">
              <Mail className="mx-auto text-white/10 mb-4" size={48} />
              <p className="text-[#848D97] text-xs uppercase font-mono tracking-widest">No_Tickets_Found</p>
            </div>
          )}
        </div>
      </div>

      {/* Main View: Conversation */}
      <GlassCard className="flex-1 flex flex-col overflow-hidden min-h-0" intensity="medium">
        {selectedTicket ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedTicketId(null)}
                  className="md:hidden p-2 text-[#848D97] hover:text-white"
                  title="Return to ticket list"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                   <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-lg font-bold text-white truncate max-w-md">{selectedTicket.subject}</h2>
                      <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border", getStatusColor(selectedTicket.status))}>
                        {selectedTicket.status}
                      </div>
                   </div>
                   <div className="flex items-center gap-4 text-[11px] text-[#848D97]">
                      <span className="flex items-center gap-1.5">
                        <User size={12} /> {selectedTicket.user_profiles?.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-[#00D9FF]" /> Tier::{selectedTicket.user_profiles?.tier || 'free'}
                      </span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                  className="p-2 text-[#848D97] hover:text-white transition-all bg-white/5 rounded-lg hover:bg-white/10"
                  title="More ticket options"
                >
                   <MoreVertical size={18} />
                 </button>
              </div>
            </div>

            {/* Timeline */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide scroll-smooth"
            >
              {messages.map((ms, i) => (
                <div key={ms.id} className={cn(
                  "flex gap-4 max-w-[85%]",
                  ms.is_staff ? "ml-auto flex-row-reverse" : ""
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center",
                    ms.is_staff ? "bg-[#00D9FF]/20 text-[#00D9FF]" : "bg-white/5 text-[#848D97]"
                  )}>
                    {ms.is_staff ? <Zap size={18} /> : <User size={18} />}
                  </div>
                  <div className="space-y-2 group">
                    <div className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed",
                      ms.is_staff 
                        ? "bg-[#00D9FF]/10 text-white border border-[#00D9FF]/20" 
                        : "bg-white/5 text-[#CED4DA] border border-white/5"
                    )}>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{ms.content}</ReactMarkdown>
                      </div>
                      
                      {/* Attachments */}
                      {ms.metadata?.attachments?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                           {ms.metadata.attachments.map((url: string, idx: number) => (
                             <a 
                               key={idx} 
                               href={url} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="flex items-center gap-2 px-3 py-2 bg-black/40 rounded-lg border border-white/5 hover:border-[#00D9FF]/30 transition-all"
                             >
                               <Paperclip size={12} className="text-[#00D9FF]" />
                               <span className="text-[10px] text-white/60">Attachment_{idx + 1}</span>
                               <ExternalLink size={10} className="text-white/30" />
                             </a>
                           ))}
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 text-[9px] font-mono tracking-widest text-[#848D97] px-2",
                      ms.is_staff ? "justify-end" : "justify-start"
                    )}>
                      <span>{new Date(ms.created_at).toLocaleString()}</span>
                      {ms.is_staff && <span className="text-[#32D74B]">SENT_VIA_RESEND</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Controls */}
            <div className="p-6 bg-white/[0.02] border-t border-white/5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-2">
                   <button 
                     onClick={handleSuggestAI}
                     disabled={isSuggesting || isSending}
                     className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#7C3AED]/20 transition-all disabled:opacity-30"
                     title="Generate AI reply suggestion"
                   >
                     {isSuggesting ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                     Suggest_AI_Reply
                   </button>
                   <div className="h-8 w-[1px] bg-white/5 mx-2" />
                   <button 
                    className="p-2 text-[#848D97] hover:text-white transition-all"
                    title="View local interaction history"
                   >
                     <History size={16} />
                   </button>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 rounded-lg px-3 py-1.5 border border-white/5">
                   <div className="w-2 h-2 rounded-full bg-[#32D74B] animate-pulse" />
                   <span className="text-[10px] text-[#848D97] uppercase font-bold tracking-widest font-mono">STAFF::ONLINE</span>
                </div>
              </div>
              
              <div className="relative">
                <textarea 
                  placeholder="Draft institutional response... (Markdown supported)"
                  className="w-full bg-[#05070A] border border-white/10 rounded-2xl p-5 pr-16 text-sm text-white resize-none h-32 focus:outline-none focus:border-[#00D9FF]/50 transition-all font-sans"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={isSending}
                />
                <div className="absolute right-3 bottom-3 flex flex-col gap-2">
                   <button 
                     className="p-3 bg-[#00D9FF] text-[#05070A] rounded-xl hover:bg-[#00D9FF]/90 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(0,217,255,0.2)]"
                     onClick={handleSendReply}
                     disabled={isSending || !replyText.trim()}
                   >
                     {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                   </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
            <div className="w-24 h-24 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center relative">
               <div className="absolute inset-0 bg-[#00D9FF]/5 rounded-full blur-2xl animate-pulse" />
               <MessageSquare size={40} className="text-[#848D97]" />
            </div>
            <div>
               <h3 className="text-xl font-bold text-white mb-2 uppercase font-mono tracking-widest">Awaiting_Relay_Selection</h3>
               <p className="text-[#848D97] text-sm max-w-xs leading-relaxed">
                 Select an active ticket from the registry to initialize a secure communication handshake.
               </p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Right Sidebar: Details & Audit (Visible only on large screens when selected) */}
      {selectedTicket && (
        <div className="hidden lg:flex w-72 flex-col gap-6 animate-in slide-in-from-right duration-500">
           <GlassCard className="p-6" intensity="low">
             <div className="flex items-center gap-2 mb-6">
               <AlertCircle size={16} className="text-[#FFD60A]" />
               <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">Ticket_Priority</h3>
             </div>
             <div className="grid grid-cols-1 gap-3">
               {['normal', 'high', 'urgent'].map(p => (
                 <button 
                   key={p}
                   className={cn(
                     "px-4 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest text-left flex items-center justify-between transition-all",
                     selectedTicket.priority === p 
                       ? "bg-white/10 border-white/20 text-white" 
                       : "bg-transparent border-transparent text-[#848D97] hover:bg-white/5"
                   )}
                 >
                   {p}
                   {selectedTicket.priority === p && <CheckCircle2 size={12} className="text-[#32D74B]" />}
                 </button>
               ))}
             </div>
           </GlassCard>

           <GlassCard className="p-6 flex-1 overflow-hidden flex flex-col" intensity="low">
              <div className="flex items-center gap-2 mb-6 shrink-0">
                 <History size={16} className="text-[#00D9FF]" />
                 <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">Audit_Log</h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide text-[10px] font-mono">
                 <div className="border-l border-white/5 pl-4 relative space-y-6 pb-4">
                    <div className="relative">
                       <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-[#00D9FF]" />
                       <p className="text-white mb-1">Ticket_Initialized</p>
                       <p className="text-[#848D97]">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                    </div>
                    {/* Placeholder for future audit events */}
                    <div className="relative opacity-40">
                       <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-white/20" />
                       <p className="text-white mb-1">Last_Activity_Pulse</p>
                       <p className="text-[#848D97]">{new Date(selectedTicket.updated_at).toLocaleString()}</p>
                    </div>
                 </div>
              </div>
           </GlassCard>
        </div>
      )}
    </div>
  );
}

const Loader2 = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={cn("lucide lucide-loader-2", className)}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
