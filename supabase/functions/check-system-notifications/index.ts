import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();

  try {
    const results: any = { password: 0, subscription: 0 };

    // --- 1. Password Expiry Check (7 Days Warning) ---
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, password_last_changed_at, password_expiry_notified_at')
      .not('password_last_changed_at', 'is', null);

    if (profiles) {
      for (const profile of profiles) {
        const lastChanged = new Date(profile.password_last_changed_at);
        const daysSinceChange = Math.floor((now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24));
        
        // 53 days since change = 7 days until 60-day expiry
        if (daysSinceChange === 53) {
          const lastNotified = profile.password_expiry_notified_at ? new Date(profile.password_expiry_notified_at) : null;
          if (!lastNotified || lastNotified.toDateString() !== now.toDateString()) {
            const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
            if (user?.email) {
              await sendEmail(user.email, 'password_expiry_reminder', { 
                daysLeft: 7, 
                abTest: Math.random() > 0.5 ? 'variant_a' : 'variant_b' 
              });
              await sendPush(profile.id, 'SECURITY_PROTOCOL_v4.2', 'Access key rotation due in 7 days. Avoid terminal lockout.');
              await supabase.from('user_profiles').update({ password_expiry_notified_at: now.toISOString() }).eq('id', profile.id);
              results.password++;
            }
          }
        }
      }
    }

    // --- 2. Subscription Expiry Check (14, 7, 1 Days) ---
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('user_id, current_period_end, tier, last_expiry_notified_at')
      .eq('status', 'active')
      .not('current_period_end', 'is', null);

    if (subs) {
      for (const sub of subs) {
        const periodEnd = new Date(sub.current_period_end);
        const diffMs = periodEnd.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let shouldNotify = false;
        if ([14, 7, 1].includes(daysLeft)) {
          const lastNotified = sub.last_expiry_notified_at ? new Date(sub.last_expiry_notified_at) : null;
          if (!lastNotified || lastNotified.toDateString() !== now.toDateString()) {
            shouldNotify = true;
          }
        }

        if (shouldNotify) {
          const { data: { user } } = await supabase.auth.admin.getUserById(sub.user_id);
          if (user?.email) {
            await sendEmail(user.email, 'subscription_expiry', {
              daysLeft: daysLeft,
              planName: sub.tier,
              expiryDate: periodEnd.toLocaleDateString(),
              discountCode: daysLeft === 1 ? 'RENEW20' : null // Urgency discount
            });
            await sendPush(sub.user_id, 'TERM_EXPIRY_ALERT', `Your ${sub.tier.toUpperCase()} protocol access expires in ${daysLeft} days.`);
            await supabase.from('subscriptions').update({ last_expiry_notified_at: now.toISOString() }).eq('user_id', sub.user_id);
            results.subscription++;
          }
        }
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});

async function sendEmail(to: string, type: string, details: any) {
  await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, type, details })
  });
}

async function sendPush(userId: string, title: string, body: string, data?: any) {
  await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, title, body, data })
  });
}
