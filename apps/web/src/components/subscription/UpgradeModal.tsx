'use client';

import React from 'react';
import { X, Check, Star, Users, Zap, Shield, Cpu, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SUBSCRIPTION_PLANS, Plan } from '@/config/plans';
import { cn } from '@/lib/utils';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredTier?: string;
  featureName?: string;
}

export function UpgradeModal({ isOpen, onClose, requiredTier, featureName }: UpgradeModalProps) {
  if (!isOpen) return null;

  const targetPlan = SUBSCRIPTION_PLANS.find(p => p.tier === requiredTier && p.interval === 'monthly') || SUBSCRIPTION_PLANS.find(p => p.tier === 'pro' && p.interval === 'monthly');

  const testimonials = [
    {
      name: "Marcus Chen",
      role: "Portfolio Manager",
      text: "The Pro tier's Monte Carlo simulations are institutional-grade. A must-have for serious risk management.",
      avatar: "MC"
    },
    {
      name: "Sarah Jenkins",
      role: "Quantitative Analyst",
      text: "Jump Diffusion models changed how we view tail risk. Best-in-class UI and compute speed.",
      avatar: "SJ"
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#05070A]/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <GlassCard 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(0,217,255,0.15)] animate-in zoom-in-95 fade-in duration-300"
        intensity="high"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#848D97] hover:text-white transition-colors z-10"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Left Side: Persuasion & Social Proof */}
        <div className="w-full md:w-2/5 p-8 bg-[#00D9FF]/5 border-r border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#00D9FF]/20 flex items-center justify-center">
                <Zap size={16} className="text-[#00D9FF]" />
              </div>
              <span className="text-[10px] font-bold text-[#00D9FF] uppercase tracking-[0.2em] font-mono">QuantMind_Premium</span>
            </div>

            <h2 className="text-2xl font-bold text-white uppercase font-mono tracking-tight leading-tight mb-4">
              Unlock the Full <span className="text-glow">Institutional</span> Suite
            </h2>
            
            <p className="text-xs text-[#848D97] leading-relaxed uppercase font-mono mb-8">
              {featureName ? `Upgrade to deploy "${featureName}" and other advanced protocols.` : "Scale your compute power beyond baseline limitations."}
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Users size={18} className="text-[#00D9FF]" />
                </div>
                <div>
                  <p className="text-[11px] text-white font-bold uppercase tracking-wider">12,000+ Analysts</p>
                  <p className="text-[9px] text-[#848D97] uppercase font-mono tracking-widest">Currently utilizing Pro nodes</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Cpu size={18} className="text-[#7C3AED]" />
                </div>
                <div>
                  <p className="text-[11px] text-white font-bold uppercase tracking-wider">Unlimited Compute</p>
                  <p className="text-[9px] text-[#848D97] uppercase font-mono tracking-widest">Multi-threaded stochastic analysis</p>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-12 p-4 bg-white/5 rounded-xl border border-white/5 italic">
            <p className="text-[10px] text-[#848D97] leading-relaxed mb-3">&quot;{testimonials[0].text}&quot;</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#00D9FF] flex items-center justify-center text-[8px] font-bold text-black">{testimonials[0].avatar}</div>
              <div>
                <p className="text-[9px] text-white font-bold uppercase tracking-widest">{testimonials[0].name}</p>
                <p className="text-[8px] text-[#848D97] uppercase font-mono">{testimonials[0].role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Plan Comparison */}
        <div className="w-full md:w-3/5 p-8 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs uppercase font-bold tracking-[0.3em] text-[#848D97]">Deployment_Options</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-[#32D74B] animate-pulse" />
              <span className="text-[9px] font-bold text-white uppercase tracking-widest font-mono">Live_Rates</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 flex-1">
            {SUBSCRIPTION_PLANS.filter(p => p.interval === 'monthly' && p.tier !== 'free').map((plan) => (
              <div 
                key={plan.id}
                className={cn(
                  "p-6 rounded-2xl border transition-all group cursor-pointer",
                  plan.tier === requiredTier 
                    ? "bg-[#00D9FF]/10 border-[#00D9FF]/30 shadow-[0_0_20px_rgba(0,217,255,0.1)]" 
                    : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]"
                )}
                onClick={() => window.location.href = '/dashboard/settings?tab=billing'}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      plan.tier === 'pro' ? "bg-[#D4A017]/20 text-[#D4A017]" : "bg-[#00D9FF]/20 text-[#00D9FF]"
                    )}>
                      {plan.tier === 'pro' ? <Cpu size={16} /> : <Zap size={16} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-[0.1em] font-mono">{plan.name}</h4>
                      <p className="text-[10px] text-[#848D97] font-mono">${plan.price} / Node</p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={16} className="text-[#00D9FF]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {plan.features.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check size={10} className="text-[#32D74B]" />
                      <span className="text-[9px] text-[#848D97] uppercase tracking-tight font-mono">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <button 
              onClick={() => {
                window.location.href = '/dashboard/settings?tab=billing';
                onClose();
              }}
              className="w-full py-4 bg-[#00D9FF] text-[#05070A] rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:bg-[#00D9FF]/90 hover:shadow-[0_0_25px_rgba(0,217,255,0.4)] flex items-center justify-center gap-2 group"
            >
              Initialize Upgrade Protocol
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[8px] text-[#848D97] text-center mt-4 uppercase font-mono tracking-widest">
              Secure institutional-grade checkout via Paystack Node v2.4
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
