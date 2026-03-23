'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { CheckCircle2, Crown, Zap, GraduationCap } from 'lucide-react';

export default function BillingSettings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (data) setSubscription(data);
    };
    fetchSubscription();
  }, [supabase.auth]);

  const handleCheckout = async (priceId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/paystack-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planCode: priceId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize checkout');

      // Redirect to Paystack Checkout safely
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/paystack-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize customer portal');

      // Redirect to robust Paystack Subscription Billing Portal
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-mono tracking-tight">Billing & Subscriptions</h1>
        <p className="text-muted-foreground mt-2">Manage your PCI-DSS compliant billing information securely.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 font-mono text-sm">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold font-mono mb-4">Current Status</h2>
        
        {subscription ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              <div className="text-muted-foreground">Status</div>
              <div className="capitalize font-medium text-emerald-400">{subscription.status}</div>
              
              <div className="text-muted-foreground">Period Ends</div>
              <div>{subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}</div>
            </div>

            <div className="pt-6 border-t border-border">
              <button 
                onClick={handlePortal}
                disabled={loading}
                className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md font-mono text-sm transition-colors"
              >
                {loading ? 'Processing...' : 'Manage Billing Portal'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm font-mono text-muted-foreground mb-6">
            You are currently on the Free tier. Upgrade to unlock powerful analytics and simulation features.
          </div>
        )}
      </div>

      {!subscription && (
        <div className="grid md:grid-cols-3 gap-8 mt-12 relative items-center">
          
          {/* STUDENT - Clean & Basic */}
          <div className="bg-card/50 border border-border/40 rounded-2xl p-6 relative opacity-75 backdrop-blur-sm grayscale-[20%]">
            <div className="absolute top-0 right-0 bg-yellow-500/10 text-yellow-500/80 text-xs px-3 py-1 rounded-bl-xl font-mono font-medium border-b border-l border-yellow-500/20">Coming Soon</div>
            <div className="size-10 bg-secondary/30 rounded-full flex items-center justify-center mb-6">
              <GraduationCap className="w-5 h-5 text-emerald-500/50" />
            </div>
            <h3 className="text-xl font-bold font-mono text-emerald-500/80 mb-2">Student</h3>
            <p className="text-sm text-muted-foreground/80 mb-6 min-h-[40px]">Powerful learning at student price.</p>
            <div className="text-3xl font-mono mb-8 opacity-80">$5<span className="text-sm text-muted-foreground">/mo</span></div>
            
            <div className="space-y-3 mb-8">
              {['10k Simulation Paths', 'Basic Asset Library', 'Community Support'].map((feat, i) => (
                <div key={i} className="flex items-center text-sm text-muted-foreground/70">
                  <CheckCircle2 className="w-4 h-4 mr-3 text-emerald-500/40" /> {feat}
                </div>
              ))}
            </div>

            <button 
              disabled={true}
              className="w-full py-2.5 bg-secondary/30 text-muted-foreground/60 border border-border/30 rounded-xl font-mono text-sm cursor-not-allowed uppercase tracking-wider"
            >
              Pending API
            </button>
          </div>
          
          {/* PLUS - Richer colors, shadows & interactions */}
          <div className="bg-card border border-blue-500/20 rounded-2xl p-8 relative shadow-xl shadow-blue-500/5 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-500/40 group">
            <div className="size-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 ring-4 ring-blue-500/5 group-hover:bg-blue-500/20 transition-colors">
              <Zap className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-2xl font-bold font-mono text-blue-400 mb-2">Plus</h3>
            <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">Enhanced tools for smarter investors.</p>
            <div className="text-4xl font-mono font-medium mb-8">$9.99<span className="text-base font-normal text-muted-foreground">/mo</span></div>
            
            <div className="space-y-4 mb-8">
              {['10k Simulation Paths', 'Full Asset Station', 'Diversification Score', 'Standard Support'].map((feat, i) => (
                <div key={i} className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  <CheckCircle2 className="w-5 h-5 mr-3 text-blue-400" /> {feat}
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                const planId = process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PLUS;
                if (!planId) {
                  setError('PLAN_ID_NOT_CONFIGURED');
                  return;
                }
                handleCheckout(planId);
              }}
              disabled={loading}
              className="w-full py-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/30 rounded-xl font-mono text-sm uppercase tracking-wider transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95"
            >
              {loading ? 'Initializing...' : 'Upgrade to Plus'}
            </button>
          </div>
          
          {/* PRO - VIP Status, Prominent glows, animations, badges */}
          <div className="md:scale-105 z-10 bg-gradient-to-b from-card to-card border border-purple-500/50 rounded-2xl p-8 relative shadow-[0_0_40px_-10px_rgba(168,85,247,0.4)] transition-all duration-500 hover:shadow-[0_0_60px_-10px_rgba(168,85,247,0.6)] group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-800/20 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500" />
            <div className="absolute top-4 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-4 py-1.5 rounded-l-full font-mono shadow-lg tracking-wider font-bold">VIP STATUS</div>
            
            <div className="relative z-10">
              <div className="size-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-purple-500/30 ring-4 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all duration-300">
                <Crown className="w-7 h-7 text-white drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
              </div>
              
              <h3 className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-2">Pro</h3>
              <p className="text-sm text-foreground/80 mb-6 min-h-[40px] font-medium">The ultimate financial & AI suite.</p>
              
              <div className="flex items-baseline mb-8">
                <div className="text-5xl font-mono font-bold text-white drop-shadow-md">$24.99</div>
                <div className="text-base text-purple-200/60 ml-2 border-l border-border/50 pl-2">USD<br/>/mo</div>
              </div>
              
              <div className="space-y-4 mb-8">
                {[
                  '100k Simulation Paths', 
                  'Levy Custom Engines', 
                  'Claude 3 Opus Oracle', 
                  'Priority Cluster Routing',
                  'Exclusive Support'
                ].map((feat, i) => (
                  <div key={i} className="flex items-center text-sm font-semibold text-purple-100/80 group-hover:text-white transition-colors">
                    <div className="size-6 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 border border-purple-500/30 group-hover:bg-purple-500 group-hover:border-purple-400 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-300 group-hover:text-white" />
                    </div>
                    {feat}
                  </div>
                ))}
              </div>

              <div className="relative group/btn">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-30 group-hover/btn:opacity-75 transition duration-500"></div>
                <button 
                  onClick={() => {
                    const planId = process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PRO;
                    if (!planId) {
                      setError('PLAN_ID_NOT_CONFIGURED');
                      return;
                    }
                    handleCheckout(planId);
                  }}
                  disabled={loading}
                  className="relative w-full py-4 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-mono font-bold text-base rounded-xl transition-all duration-300 shadow-xl overflow-hidden active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-in-out" />
                  <span className="relative z-10 flex items-center justify-center">
                    {loading ? 'Processing...' : 'Unlock VIP Access'} 
                    {!loading && <Crown className="w-4 h-4 ml-2 opacity-70" />}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
