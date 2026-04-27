'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Loader2, 
  ChevronRight,
  Info,
  Lock,
  Trash2,
  History
} from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function OraclePage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [vitals, setVitals] = useState({
    xbt: { price: 0, change: 0 },
    dxy: { price: 0, change: 0 },
    vix: { price: 0, change: 0 }
  });
  const [sentiment, setSentiment] = useState<any>(null);

  const supabase = createClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('tier')
          .eq('id', user.id)
          .single();
        setUserProfile(data);
      }
    };
    fetchProfile();
  }, [supabase]);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('oracle_chat_messages')
        .select('role, content')
        .eq('user_id', user.id)
        .gt('created_at', eightHoursAgo)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        setMessages(data as Message[]);
      } else {
        setMessages([{ 
          role: 'assistant', 
          content: "Greetings. I am the QuantMind AI Oracle. I have specialized access to your portfolio analytics and institutional risk models. How may I assist your strategy today?" 
        }]);
      }
      setIsLoadingHistory(false);
    };
    fetchHistory();
  }, [supabase]);

  // Handle Incoming URL Prompt
  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt && !isLoadingHistory && messages.length <= 1) {
      handleSend(prompt);
    }
  }, [searchParams, isLoadingHistory, messages.length]);

  const getOracleMode = (tier: string) => {
    if (tier === 'pro') return { label: 'Full_Quantum_Relay', color: 'text-[#D4A017]' };
    if (tier === 'plus') return { label: 'Strategic_Insight', color: 'text-[#00D9FF]' };
    if (tier === 'student') return { label: 'Academic_Relay', color: 'text-[#7C3AED]' };
    return { label: 'Access_Restricted', color: 'text-[#FF453A]' };
  };

  const modeInfo = getOracleMode(userProfile?.tier || 'free');

  useEffect(() => {
    const fetchVitals = async () => {
      const { data } = await supabase.from('prices').select('*');
      if (data) {
        const xbt = data.find(p => p.symbol === 'BTC') || { price: 65000, change_24h: 4.22 };
        const dxy = data.find(p => p.symbol === 'DXY') || { price: 104.2, change_24h: -0.15 };
        const vix = data.find(p => p.symbol === 'VIX') || { price: 14.05, change_24h: 0 };
        
        setVitals({
          xbt: { price: xbt.price, change: xbt.change_24h },
          dxy: { price: dxy.price, change: dxy.change_24h },
          vix: { price: vix.price, change: vix.change_24h }
        });
      }
    };
    fetchVitals();

    const fetchSentiment = async () => {
      const { data } = await supabase
        .from('market_sentiment')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) setSentiment(data);
    };
    fetchSentiment();

    const channel = supabase.channel('market-vitals')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'prices' }, fetchVitals)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (overrideInput?: string) => {
    const messageContent = overrideInput || input;
    if (!messageContent.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMsg]);
    if (!overrideInput) setInput('');
    setIsLoading(true);

    // Initial placeholder for assistant message to start streaming into
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Persist user message immediately
        await supabase.from('oracle_chat_messages').insert({
          user_id: user.id,
          role: 'user',
          content: messageContent
        });
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'UNKNOWN' }));
        throw new Error(errData.error || 'COGNITIVE_RELAY_FAILURE');
      }

      if (!response.body) throw new Error('COGNITIVE_RELAY_FAILURE');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantContent += chunk;

        // Update the last message (the placeholder) with the accumulated content
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last.role === 'assistant') {
            return [...prev.slice(0, -1), { role: 'assistant', content: assistantContent }];
          }
          return prev;
        });
      }

      // Persist assistant response after stream ends
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && assistantContent) {
        await supabase.from('oracle_chat_messages').insert({
          user_id: currentUser.id,
          role: 'assistant',
          content: assistantContent
        });
      }

    } catch (error: any) {
      console.error('Chat Error', error);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last.role === 'assistant' && last.content === '') {
           let userFriendlyMsg = "I apologize, but my connection to the cognitive nodes has been interrupted. Please try again shortly.";
           
           if (error.message === 'QUOTA_EXCEEDED') {
             userFriendlyMsg = "PROTOCOL_LIMIT_REACHED: The Institutional AI Oracle has reached its daily data allocation. Please wait for the daily reset or upgrade your institutional access.";
           } else if (error.message === 'UPGRADE_REQUIRED') {
             userFriendlyMsg = "This terminal is currently restricted. Upgrade to PLUS_ACCESS to proceed.";
           } else if (error.message === 'COGNITIVE_RELAY_FAILURE') {
             userFriendlyMsg = "ERROR_RELAY_FAILURE: A synchronization error occurred between the oracle and the market telemetry stream.";
           }

           return [...prev.slice(0, -1), { 
             role: 'assistant', 
             content: userFriendlyMsg
           }];
        }
        return prev;
      });
    }
 finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm("Are you sure you want to wipe the neural buffer? This will permanently delete current chat history.")) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('oracle_chat_messages').delete().eq('user_id', user.id);
        setMessages([{ 
          role: 'assistant', 
          content: "Greetings. I am the QuantMind AI Oracle. I have specialized access to your portfolio analytics and institutional risk models. How may I assist your strategy today?" 
        }]);
      }
    } catch (error) {
      console.error('Failed to clear history', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] p-4 md:p-8 flex flex-col gap-6 md:gap-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 shrink-0">
         <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#00D9FF] to-[#7C3AED] flex items-center justify-center p-[1px]">
            <div className="w-full h-full rounded-xl md:rounded-2xl bg-[#05070A] flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-[#00D9FF]/20 to-[#7C3AED]/20 animate-pulse" />
               <Sparkles className="text-[#00D9FF] relative z-10" size={24} />
            </div>
         </div>
          <div>
             <div className="flex items-center gap-2 mb-1">
                <span className={cn("text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] font-mono", modeInfo.color)}>
                   STATUS::{modeInfo.label}
                </span>
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
                  userProfile?.tier === 'free' ? "bg-[#FF453A] shadow-[0_0_8px_#FF453A]" : "bg-[#32D74B] shadow-[0_0_8px_#32D74B]"
                )} />
             </div>
             <h1 className="text-2xl md:text-3xl font-bold text-white uppercase font-mono tracking-tight text-glow">The_AI_Oracle</h1>
          </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 min-h-0">
         <GlassCard className="lg:col-span-3 flex flex-col min-h-[400px] lg:min-h-0 overflow-hidden relative" intensity="medium">
            {/* Chat Header with Clear Button */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={14} className="text-[#00D9FF]" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">Cognitive_Buffer</span>
              </div>
              <button 
                onClick={clearHistory}
                disabled={isLoading || messages.length <= 1}
                className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-[0.2em] text-[#FF453A] hover:text-[#FF453A]/80 transition-colors disabled:opacity-30"
              >
                <Trash2 size={12} /> Clear_Neural_Path
              </button>
            </div>

            {/* Gating Overlay for Free Users */}
            {userProfile?.tier === 'free' && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#05070A]/60 backdrop-blur-md p-8 text-center">
                <div className="w-20 h-20 bg-[#FFD60A]/10 rounded-full flex items-center justify-center border border-[#FFD60A]/20 mb-6">
                  <Lock className="text-[#FFD60A]" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">RESTRICTED_PROTOCOL</h3>
                <p className="text-[#848D97] max-w-sm mb-8 text-xs leading-relaxed">
                  The Institutional AI Oracle requires a Plus or Pro subscription to establish a secure cognitive relay.
                </p>
                <Link 
                  href="/dashboard/subscription"
                  className="bg-[#FFD60A] text-[#05070A] px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,214,10,0.2)]"
                >
                  Upgrade to PLUS_ACCESS
                </Link>
              </div>
            )}

            <div 
              ref={scrollRef}
              className={cn(
                "flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide",
                (userProfile?.tier === 'free' || isLoadingHistory) && "blur-[2px]"
              )}
            >
               {isLoadingHistory ? (
                 <div className="h-full flex flex-col items-center justify-center gap-4">
                   <Loader2 className="animate-spin text-[#00D9FF]" size={32} />
                   <span className="text-[10px] uppercase font-bold tracking-widest text-[#848D97] animate-pulse">Syncing_Neural_History...</span>
                 </div>
               ) : (
                 messages.map((ms, i) => (
                   <div key={i} className={cn(
                      "flex gap-3 md:gap-6 max-w-[95%] md:max-w-[85%]",
                      ms.role === 'user' ? "ml-auto flex-row-reverse" : ""
                   )}>
                      <div className={cn(
                        "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl shrink-0 flex items-center justify-center",
                        ms.role === 'assistant' ? "bg-white/5 text-[#00D9FF]" : "bg-[#00D9FF] text-[#05070A]"
                      )}>
                         {ms.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                      </div>
                      
                      <div className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed",
                        ms.role === 'assistant' ? "bg-white/5 text-[#848D97]" : "bg-white/5 text-white border border-white/10"
                      )}>
                         {ms.role === 'assistant' ? (
                           <div className="prose prose-invert prose-sm max-w-none">
                              <ReactMarkdown>{ms.content}</ReactMarkdown>
                           </div>
                         ) : ms.content}
                      </div>
                   </div>
                 ))
               )}
               {isLoading && messages.length > 0 && messages[messages.length-1].content === '' && (
                 <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#00D9FF]">
                       <Loader2 className="animate-spin" size={20} />
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 text-[#848D97] flex items-center gap-3">
                       <span className="text-[10px] uppercase font-bold tracking-widest animate-pulse font-mono">Cognitive_Processing...</span>
                    </div>
                 </div>
               )}
            </div>

            <div className={cn(
               "p-6 border-t border-white/5 bg-white/[0.02]",
               userProfile?.tier === 'free' && "opacity-20 pointer-events-none"
            )}>
               <div className="relative flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder={window.innerWidth < 640 ? "Ask strategy..." : "Enter strategy query or market analysis request..."}
                    className="flex-1 bg-[#12121A] border border-white/10 rounded-xl md:rounded-2xl py-3 md:py-4 pl-4 md:pl-6 pr-12 md:pr-24 text-white text-xs md:text-sm focus:outline-none focus:border-[#00D9FF]/50 transition-all font-mono"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isLoading}
                  />
                  <div className="absolute right-1.5 top-1.5 bottom-1.5 md:right-2 md:top-2 md:bottom-2">
                     <button 
                       onClick={() => handleSend()}
                       disabled={isLoading || !input.trim()}
                       className="h-full px-4 md:px-6 bg-[#00D9FF] text-[#05070A] rounded-lg md:rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2 hover:bg-[#00D9FF]/90 transition-all disabled:opacity-50"
                     >
                        <Send size={14} className="md:block hidden" /> 
                        <span className="sm:inline">Send</span>
                     </button>
                  </div>
               </div>
            </div>
         </GlassCard>

         <div className="space-y-6">
            <GlassCard className="p-6" intensity="low">
               <div className="flex items-center gap-3 mb-6">
                  <Info size={16} className="text-[#00D9FF]" />
                  <h3 className="text-xs uppercase font-bold tracking-widest text-white">Assistant_Capabilities</h3>
               </div>
                <div className="space-y-4">
                  {[
                    { id: "Portfolio_Health_Audit", prompt: "Perform a detailed health audit of my current portfolios, analyzing diversification and risk exposure." },
                    { id: "Monte_Carlo_Interpretation", prompt: "Interpret my most recent Monte Carlo simulation results. What are the key takeaways for my strategy?" },
                    { id: "Predictive_Market_Cycles", prompt: "Based on current market vitals (XBT, DXY, VIX), what predictive cycles should I be aware of?" },
                    { id: "Tail_Risk_Mitigation", prompt: "Analyze my portfolios for tail risk. How can I mitigate potential black swan events given my current holdings?" }
                  ].map(cap => (
                    <div 
                      key={cap.id} 
                      className="flex items-center gap-2 group cursor-pointer"
                      onClick={() => handleSend(cap.prompt)}
                    >
                       <ChevronRight size={12} className="text-white/20 group-hover:text-[#00D9FF] transition-colors" />
                       <span className="text-[10px] text-[#848D97] uppercase font-mono group-hover:text-white transition-colors">{cap.id}</span>
                    </div>
                  ))}
                </div>
            </GlassCard>

            <GlassCard className="p-6 bg-[#00D9FF]/5 border-[#00D9FF]/10" intensity="low">
               <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4">Market_Vitals_Context</h4>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] text-[#848D97] uppercase font-mono">XBT_AGGREGATE</span>
                     <span className={cn(
                       "text-[11px] font-mono font-bold",
                       vitals.xbt.change >= 0 ? "text-[#32D74B]" : "text-[#FF453A]"
                     )}>{vitals.xbt.change >= 0 ? '+' : ''}{vitals.xbt.change.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] text-[#848D97] uppercase font-mono">DXY_INDEX</span>
                     <span className={cn(
                       "text-[11px] font-mono font-bold",
                       vitals.dxy.change >= 0 ? "text-[#32D74B]" : "text-[#FF453A]"
                     )}>{vitals.dxy.change >= 0 ? '+' : ''}{vitals.dxy.change.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] text-[#848D97] uppercase font-mono">VIX_VOLATILITY</span>
                     <span className="text-[11px] font-mono text-white font-bold">{vitals.vix.price.toFixed(2)}</span>
                  </div>
               </div>

               {sentiment && (
                 <div className="mt-8 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                       <span className="text-[10px] uppercase font-bold tracking-widest text-[#00D9FF]">AI_SENTIMENT_ORACLE</span>
                       <div className="flex-1 h-[1px] bg-gradient-to-r from-[#00D9FF]/20 to-transparent" />
                    </div>
                    
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] text-[#848D97] uppercase font-mono font-bold">Aggregated_Mood</span>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            sentiment.sentiment_score > 0.3 ? "bg-[#32D74B]/20 text-[#32D74B]" :
                            sentiment.sentiment_score < -0.3 ? "bg-[#FF453A]/20 text-[#FF453A]" :
                            "bg-white/10 text-white/60"
                          )}>
                            {(sentiment.sentiment_score * 100).toFixed(0)}%
                          </span>
                       </div>
                       <p className="text-[10px] text-white/50 leading-relaxed italic line-clamp-2">
                          &quot;{sentiment.summary}&quot;
                       </p>
                    </div>
                 </div>
               )}
            </GlassCard>
         </div>
      </div>
    </div>
  );
}
