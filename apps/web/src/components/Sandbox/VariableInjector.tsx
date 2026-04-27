import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Play, Activity, Settings2, BarChart2, ShieldAlert } from 'lucide-react';

export function VariableInjector({ onRunSimulation }: { onRunSimulation: (seed: string) => void }) {
  const [seedText, setSeedText] = useState('');
  const [isInjecting, setIsInjecting] = useState(false);

  const handleInject = () => {
    if (!seedText.trim()) return;
    setIsInjecting(true);
    // Mock short delay to simulate network/GraphRAG ingestion
    setTimeout(() => {
      onRunSimulation(seedText);
      setIsInjecting(false);
      setSeedText('');
    }, 1500);
  };

  return (
    <GlassCard className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-mono text-white flex items-center gap-2">
          <Settings2 size={20} className="text-[#00D9FF]" />
          Variable Injector
        </h3>
        <span className="text-xs text-[#00D9FF]/70 font-mono tracking-widest uppercase">
          MiroFish Engine
        </span>
      </div>

      <div className="text-sm text-[#848D97] mb-2 font-mono">
        <ShieldAlert size={14} className="inline mr-1 text-yellow-500" />
        Inject external variables (e.g., "Fed announces unexpected 50bp rate cut") to observe agent reflexivity and market evolution.
      </div>

      <textarea
        className="w-full h-32 bg-[#05070A]/50 border border-white/10 rounded-xl p-4 text-white font-mono text-sm focus:border-[#00D9FF]/50 focus:ring-1 focus:ring-[#00D9FF]/50 outline-none resize-none transition-all"
        placeholder="Enter news, policy drafts, or macroeconomic events..."
        value={seedText}
        onChange={(e) => setSeedText(e.target.value)}
        disabled={isInjecting}
      />

      <div className="flex justify-end mt-2">
        <button
          onClick={handleInject}
          disabled={!seedText.trim() || isInjecting}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#00D9FF]/10 text-[#00D9FF] hover:bg-[#00D9FF]/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-mono text-sm tracking-wider uppercase transition-all"
        >
          {isInjecting ? (
            <Activity size={16} className="animate-pulse" />
          ) : (
            <Play size={16} />
          )}
          {isInjecting ? 'Ingesting via GraphRAG...' : 'Inject & Run Simulation'}
        </button>
      </div>
    </GlassCard>
  );
}
