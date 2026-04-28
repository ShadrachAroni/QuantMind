import React, { useEffect } from 'react';
import { Crown, Zap, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export type Tier = 'free' | 'student' | 'plus' | 'pro';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  requiredTier: Tier;
}

export function UpgradeModal({ isOpen, onClose, featureName, requiredTier }: UpgradeModalProps) {
  const router = useRouter();

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    router.push('/settings/billing');
  };

  const isPro = requiredTier === 'pro';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Glassmorphic Backdrop */}
      <div 
        className="absolute inset-0 bg-background/60 backdrop-blur-md" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative w-full max-w-lg bg-card/90 backdrop-blur-xl border ${isPro ? 'border-purple-500/50 shadow-[0_0_50px_-12px_rgba(168,85,247,0.4)]' : 'border-blue-500/50 shadow-[0_0_50px_-12px_rgba(59,130,246,0.4)]'} rounded-3xl p-1 overflow-hidden transition-all duration-500 scale-in-95`}>
        
        {/* Animated gradient border effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${isPro ? 'from-purple-500 via-pink-500 to-purple-800' : 'from-blue-400 via-blue-600 to-indigo-800'} opacity-20 animate-pulse-slow`} />
        
        <div className="relative bg-card rounded-[1.4rem] p-8 h-full flex flex-col">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center mb-8">
            <div className={`size-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl ${isPro ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/40 ring-4 ring-purple-500/20' : 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-500/40 ring-4 ring-blue-500/20'}`}>
              {isPro ? (
                <Crown className="w-8 h-8 text-white drop-shadow-md" />
              ) : (
                <Zap className="w-8 h-8 text-white drop-shadow-md" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold font-mono tracking-tight mb-3">
              Unlock <span className={`bg-clip-text text-transparent bg-gradient-to-r ${isPro ? 'from-purple-400 to-pink-400' : 'from-blue-400 to-indigo-400'}`}>{featureName}</span>
            </h2>
            <p className="text-muted-foreground text-sm max-w-[280px] leading-relaxed">
              This powerful feature is exclusively available on our <strong className={isPro ? 'text-purple-400' : 'text-blue-400'}>{requiredTier.toUpperCase()}</strong> tier and above. Elevate your QuantMind experience today.
            </p>
          </div>

          <div className="space-y-4 mb-8 bg-secondary/30 rounded-xl p-5 border border-border/50">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 font-mono">What you'll get:</h3>
            {[
              isPro ? 'Unlimited high-fidelity Simulation Paths' : 'Up to 10k Simulation Paths',
              isPro ? 'Claude 3 Opus Oracle Access' : 'Full Asset Station & Diversification Score',
              isPro ? 'Priority Cluster Routing & API' : 'Standard Support SLA'
            ].map((benefit, i) => (
              <div key={i} className="flex items-center text-sm font-medium text-foreground/90">
                <div className={`size-5 rounded-full flex items-center justify-center mr-3 border ${isPro ? 'bg-purple-500/20 border-purple-500/30' : 'bg-blue-500/20 border-blue-500/30'}`}>
                  <CheckCircle2 className={`w-3 h-3 ${isPro ? 'text-purple-400' : 'text-blue-400'}`} />
                </div>
                {benefit}
              </div>
            ))}
          </div>

          <button 
            onClick={handleUpgrade}
            className={`group relative w-full py-4 text-white font-mono font-bold text-sm rounded-xl transition-all duration-300 shadow-xl overflow-hidden active:scale-[0.98] ${isPro ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-purple-500/30' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-blue-500/30'}`}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <span className="relative z-10 flex items-center justify-center">
              Upgrade to {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          
          <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
            Cancel anytime. Upgrade applies instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
