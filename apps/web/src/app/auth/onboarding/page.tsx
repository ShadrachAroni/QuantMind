'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowEffect } from '@/components/ui/GlowEffect';
import { CheckCircle2, ChevronRight, Brain, Globe, Shield, Activity } from 'lucide-react';

const REGIONS = [
  { id: 'US_EAST_NY', name: 'US East (New York)', signal: 'LOW_LATENCY' },
  { id: 'EU_WEST_LDN', name: 'Europe West (London)', signal: 'OPTIMAL' },
  { id: 'AP_SOUTH_SIN', name: 'Asia Pacific (Singapore)', signal: 'STABLE' },
];

const EXPERTISE_LEVELS = [
  { id: 'beginner', name: 'NEOPHYTE', desc: 'Standard narrative adaptation. High-clarity explanations.' },
  { id: 'intermediate', name: 'PRACTITIONER', desc: 'Balanced technicality. Focus on correlation clusters.' },
  { id: 'advanced', name: 'ARCHITECT', desc: 'Raw stochastic data. Minimal narrative padding.' },
];

const PERSONAS = [
  { id: 'ANALYTICAL_COLD', name: 'ANALYTICAL_COLD', desc: 'Pure logic. Emotionless risk assessment.' },
  { id: 'AGGRESSIVE_STOCHASTIC', name: 'AGGRESSIVE', desc: 'High-alpha focus. Volatility-positive.' },
  { id: 'QUANTUM_EQUILIBRIUM', name: 'EQUILIBRIUM', desc: 'Balanced risk/reward. Mean-reverting logic.' },
];

function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Profile State
  const [region, setRegion] = useState('US_EAST_NY');
  const [expertise, setExpertise] = useState('intermediate');
  const [persona, setPersona] = useState('ANALYTICAL_COLD');
  const [analyticsConsent, setAnalyticsConsent] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);
    }
    getUser();
  }, []);

  const handleComplete = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          region,
          ai_expertise: expertise,
          ai_persona: persona,
          analytics_consent: analyticsConsent,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Onboarding sync failure:', err);
      setIsLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 reveal slide-up">
      <LoadingOverlay visible={isLoading} message="SYNCING_IDENTITY_PROTOCOL..." />
      
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-[#00D9FF] mb-6">
          <Brain size={32} className="animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight uppercase">Neural Calibration</h1>
        <p className="text-[#848D97] max-w-md mx-auto">Configure your operator profile to optimize institutional throughput.</p>
        
        {/* Progress Tracker */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                step >= i ? 'w-8 bg-[#00D9FF]' : 'w-2 bg-white/10'
              }`} 
            />
          ))}
        </div>
      </div>

      <div className="relative">
        <GlowEffect color="#00D9FF" opacity={0.05} size={400} />
        
        <GlassCard intensity="high" className="p-8 border-white/5">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="text-[#00D9FF]" size={20} />
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Regional Latency</h2>
              </div>
              <div className="grid gap-4">
                {REGIONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRegion(r.id)}
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                      region === r.id 
                        ? 'bg-[#00D9FF]/5 border-[#00D9FF]/50 shadow-[0_0_20px_rgba(0,217,255,0.1)]' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="text-left">
                      <p className={`font-bold uppercase tracking-wide ${region === r.id ? 'text-[#00D9FF]' : 'text-white'}`}>
                        {r.name}
                      </p>
                      <p className="text-[10px] text-[#848D97] mt-1 font-mono tracking-widest">{r.signal}</p>
                    </div>
                    {region === r.id && <CheckCircle2 size={20} className="text-[#00D9FF]" />}
                  </button>
                ))}
              </div>
              <button
                onClick={nextStep}
                className="w-full bg-[#00D9FF] text-[#05070A] font-bold py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
              >
                Continue Protocol <ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-3 mb-2">
                <Brain className="text-[#00D9FF]" size={20} />
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Neural Adaptation</h2>
              </div>
              <div className="grid gap-4">
                {EXPERTISE_LEVELS.map(lev => (
                  <button
                    key={lev.id}
                    onClick={() => setExpertise(lev.id)}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      expertise === lev.id 
                        ? 'bg-[#00D9FF]/5 border-[#00D9FF]/50' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <p className={`font-bold uppercase tracking-wide ${expertise === lev.id ? 'text-[#00D9FF]' : 'text-white'}`}>
                      {lev.name}
                    </p>
                    <p className="text-xs text-[#848D97] mt-1">{lev.desc}</p>
                  </button>
                ))}
              </div>
              
              <div className="pt-4">
                 <p className="text-[10px] text-[#848D97] uppercase tracking-widest mb-3 font-bold px-1">AI Persona Preference</p>
                 <div className="grid grid-cols-3 gap-3">
                   {PERSONAS.map(p => (
                     <button
                       key={p.id}
                       onClick={() => setPersona(p.id)}
                       className={`p-3 rounded-xl border text-[9px] font-bold uppercase tracking-tighter leading-tight transition-all ${
                         persona === p.id 
                           ? 'bg-[#00D9FF]/10 border-[#00D9FF]/50 text-[#00D9FF]' 
                           : 'bg-white/[0.02] border-white/5 text-[#848D97]'
                       }`}
                     >
                       {p.name.split('_')[0]}
                     </button>
                   ))}
                 </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={prevStep}
                  className="flex-1 border border-white/10 text-white font-bold py-4 rounded-xl uppercase tracking-widest text-xs"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="flex-[2] bg-[#00D9FF] text-[#05070A] font-bold py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                >
                  Proceed <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="text-[#00D9FF]" size={20} />
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Final Compliance</h2>
              </div>
              
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      id="analytics"
                      checked={analyticsConsent}
                      onChange={(e) => setAnalyticsConsent(e.target.checked)}
                      className="w-5 h-5 bg-black border-white/10 rounded accent-[#00D9FF] cursor-pointer"
                    />
                  </div>
                  <div>
                    <label htmlFor="analytics" className="text-sm text-white font-bold block mb-1">STOCHASTIC_ANALYTICS_SHARING</label>
                    <p className="text-xs text-[#848D97] leading-relaxed">
                      Enable anonymized data collection to refine neural models and platform stability. Recommended for institutional growth.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 border border-[#00D9FF]/20 rounded-2xl bg-[#00D9FF]/5 text-sm">
                <Activity size={18} className="text-[#00D9FF] shrink-0" />
                <p className="text-[#00D9FF]">All systems calibrated. Network handshake pending validation.</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={prevStep}
                  className="flex-1 border border-white/10 text-white font-bold py-4 rounded-xl uppercase tracking-widest text-xs"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-[2] bg-[#00D9FF] text-[#05070A] font-bold py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(0,217,255,0.3)]"
                >
                  Deploy Profile <CheckCircle2 size={18} />
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      <p className="mt-12 text-center text-[10px] text-[#848D97] uppercase tracking-[0.2em] font-mono opacity-50">
        QuantMind Institutional Node // SECURE_HANDSHAKE_ESTABLISHED
      </p>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingOverlay visible={true} message="INITIALIZING_CALIBRATION..." />}>
      <div className="min-h-screen bg-[#05070A] bg-[radial-gradient(circle_at_top,_#001a2e_0%,_#05070a_100%)]">
        <OnboardingForm />
      </div>
    </Suspense>
  );
}
