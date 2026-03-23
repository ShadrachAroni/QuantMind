import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Get users with passwords expiring in ~7 days (53 days old) or ~1 day (59 days old)
    // We check if they haven't been notified for this specific "window" yet.
    
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id, password_last_changed_at, password_expiry_notified_at')
      .not('password_last_changed_at', 'is', null);

    if (error) throw error;

    const now = new Date();
    const notifications = [];

    for (const profile of profiles) {
      const lastChanged = new Date(profile.password_last_changed_at);
      const daysSinceChange = Math.floor((now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24));
      
      let daysLeft = 0;
      let shouldNotify = false;

      if (daysSinceChange === 53) {
        daysLeft = 7;
        shouldNotify = true;
      } else if (daysSinceChange === 59) {
        daysLeft = 1;
        shouldNotify = true;
      }

      // Check if we already notified them today to avoid spamming if the cron runs multiple times
      if (shouldNotify && profile.password_expiry_notified_at) {
        const lastNotified = new Date(profile.password_expiry_notified_at);
        if (lastNotified.toDateString() === now.toDateString()) {
          shouldNotify = false;
        }
      }

      if (shouldNotify) {
        // Get user email
        const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
        if (user?.email) {
          notifications.push({
            email: user.email,
            daysLeft,
            userId: profile.id
          });
        }
      }
    }

    // 2. Send emails via send-email function
    for (const n of notifications) {
      console.log(`Sending ${n.daysLeft}-day warning to ${n.email}`);
      
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: n.email,
          type: 'password_expiry_warning',
          details: { daysLeft: n.daysLeft }
        })
      });

      // Update notified timestamp
      await supabase
        .from('user_profiles')
        .update({ password_expiry_notified_at: now.toISOString() })
        .eq('id', n.userId);
    }

    return new Response(JSON.stringify({ processed: notifications.length }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
