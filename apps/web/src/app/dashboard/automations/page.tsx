'use client';

import React, { useState } from 'react';
import { Workflow, Zap, Bell, Clock, Settings, Copy, Plus, Trash2, ToggleLeft, ToggleRight, Code2, Webhook } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { useUser } from '@/components/UserContext';

const TEMPLATES = [
  { id: 'stop_loss', name: 'Stop-Loss Alert', description: 'Alert when any position drops below stop-loss level', trigger: 'Price drops below threshold', icon: Bell, color: '#FF453A' },
  { id: 'earnings_reminder', name: 'Earnings Reminder', description: 'Notify before earnings for watchlist stocks', trigger: '24h before earnings date', icon: Clock, color: '#FFD60A' },
  { id: 'rsi_signal', name: 'RSI Signal', description: 'Alert when RSI crosses 70 (overbought) or 30 (oversold)', trigger: 'RSI threshold breach', icon: Zap, color: '#7C3AED' },
  { id: 'news_digest', name: 'News Digest', description: 'Daily summary of top news for portfolio holdings', trigger: 'Scheduled: 8AM daily', icon: Workflow, color: '#00D9FF' },
  { id: 'portfolio_threshold', name: 'Portfolio Threshold', description: 'Alert when portfolio value changes by set percentage', trigger: 'Portfolio value change > X%', icon: Bell, color: '#32D74B' },
  { id: 'volume_spike', name: 'Volume Spike', description: 'Detect unusual trading volume on watched assets', trigger: 'Volume > 2x average', icon: Zap, color: '#FF9500' },
];

interface Automation {
  id: string;
  name: string;
  templateId: string;
  enabled: boolean;
  config: Record<string, any>;
  lastTriggered?: string;
}

export default function AutomationsPage() {
  const { profile } = useUser();
  const [automations, setAutomations] = useState<Automation[]>([
    { id: '1', name: 'My Stop-Loss Alert', templateId: 'stop_loss', enabled: true, config: { threshold: -5, assets: ['AAPL', 'MSFT'] }, lastTriggered: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', name: 'Daily News Digest', templateId: 'news_digest', enabled: true, config: { time: '08:00', format: 'summary' } },
  ]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null);
  const [webhookUrl] = useState(`https://quantmind.co.ke/api/webhooks/${profile?.id?.substring(0, 8) || 'user'}`);
  const [copied, setCopied] = useState(false);

  const addAutomation = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const newAuto: Automation = {
      id: Date.now().toString(),
      name: template.name,
      templateId,
      enabled: false,
      config: {},
    };
    setAutomations(prev => [...prev, newAuto]);
    setShowTemplates(false);
  };

  const toggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const removeAutomation = (id: string) => {
    setAutomations(prev => prev.filter(a => a.id !== id));
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 bg-[#32D74B]/10 border border-[#32D74B]/20 rounded text-[10px] font-bold text-[#32D74B] uppercase tracking-widest flex items-center gap-1">
              <Workflow size={10} /> Automation_Hub
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter font-mono">n8n <span className="text-[#32D74B]">Automations</span></h1>
          <p className="text-[#848D97] text-sm font-mono uppercase tracking-widest mt-1">Workflow Automation Engine</p>
        </div>
        <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-2 bg-[#32D74B] text-[#05070A] px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(50,215,75,0.3)] transition-all">
          <Plus size={14} /> New Automation
        </button>
      </div>

      {/* Templates */}
      {showTemplates && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => addAutomation(t.id)} className="text-left group">
              <GlassCard className="p-5 h-full hover:border-[#32D74B]/20 transition-all">
                <t.icon size={24} style={{ color: t.color }} className="mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">{t.name}</h4>
                <p className="text-xs text-[#848D97] mb-3">{t.description}</p>
                <div className="flex items-center gap-1">
                  <Zap size={10} className="text-[#FFD60A]" />
                  <span className="text-[9px] text-[#848D97] font-mono">{t.trigger}</span>
                </div>
              </GlassCard>
            </button>
          ))}
        </div>
      )}

      {/* Active Automations */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97]">Active Workflows ({automations.filter(a => a.enabled).length}/{automations.length})</h3>
        {automations.map(auto => {
          const template = TEMPLATES.find(t => t.id === auto.templateId);
          return (
            <GlassCard key={auto.id} className={cn("p-5 transition-all", auto.enabled ? 'border-[#32D74B]/10' : 'opacity-50')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleAutomation(auto.id)} className="text-white" aria-label={auto.enabled ? `Disable ${auto.name}` : `Enable ${auto.name}`}>
                    {auto.enabled ? <ToggleRight size={24} className="text-[#32D74B]" /> : <ToggleLeft size={24} className="text-[#848D97]" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{auto.name}</h4>
                      {auto.enabled && <div className="w-1.5 h-1.5 rounded-full bg-[#32D74B] animate-pulse" />}
                    </div>
                    <p className="text-[10px] text-[#848D97] font-mono">
                      Template: {template?.name || 'Custom'} {auto.lastTriggered && `• Last: ${new Date(auto.lastTriggered).toLocaleString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedAutomation(auto.id === selectedAutomation ? null : auto.id)} className="p-2 hover:bg-white/5 rounded-lg text-[#848D97] hover:text-white transition-all" aria-label={`Settings for ${auto.name}`}>
                    <Settings size={14} />
                  </button>
                  <button onClick={() => removeAutomation(auto.id)} className="p-2 hover:bg-[#FF453A]/10 rounded-lg text-[#848D97] hover:text-[#FF453A] transition-all" aria-label={`Delete ${auto.name}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {selectedAutomation === auto.id && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`auto-name-${auto.id}`} className="text-[10px] text-[#848D97] uppercase tracking-widest block mb-1">Workflow Name</label>
                      <input id={`auto-name-${auto.id}`} defaultValue={auto.name} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#32D74B]/40" />
                    </div>
                    <div>
                      <label htmlFor={`auto-trigger-${auto.id}`} className="text-[10px] text-[#848D97] uppercase tracking-widest block mb-1">Trigger Type</label>
                      <select id={`auto-trigger-${auto.id}`} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none appearance-none">
                        <option>Price Alert</option><option>Time-Based</option><option>Event-Based</option><option>Webhook</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {/* Webhook Interface */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Webhook size={16} className="text-[#00D9FF]" />
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97]">Webhook Interface</h3>
        </div>
        <p className="text-xs text-[#848D97] mb-3">Connect your n8n instance to QuantMind events. Use this webhook URL as a trigger in your n8n workflows.</p>
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl p-3">
          <Code2 size={14} className="text-[#00D9FF] shrink-0" />
          <code className="text-xs font-mono text-white flex-1 overflow-hidden text-ellipsis">{webhookUrl}</code>
          <button onClick={copyWebhook} className={cn("px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", copied ? 'bg-[#32D74B]/20 text-[#32D74B]' : 'bg-white/5 text-[#848D97] hover:text-white')} aria-label="Copy webhook URL">
            <Copy size={12} /> {copied ? 'Copied!' : ''}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <span className="text-[10px] text-[#848D97] uppercase tracking-widest block mb-1">Events</span>
            <div className="flex flex-wrap gap-1">
              {['price.alert', 'portfolio.threshold', 'earnings.release', 'rsi.signal', 'news.breaking'].map(e => (
                <span key={e} className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] font-mono text-[#848D97]">{e}</span>
              ))}
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <span className="text-[10px] text-[#848D97] uppercase tracking-widest block mb-1">Documentation</span>
            <p className="text-xs text-[#848D97]">Full API docs and integration guides available in Settings → Developer</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
