// QuantMind Edge Function: welcome-email
// Triggered by Database Webhooks when a user confirms their email.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { 
  sendEmail, 
  getQuantMindWelcomeTemplate, 
  getInstitutionalSender 
} from '../_shared/email.ts';

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { record, old_record, type } = payload;
    
    // Only process UPDATE events where email_confirmed_at was null and is now set
    if (type === 'UPDATE' && !old_record?.email_confirmed_at && record?.email_confirmed_at) {
      console.log(`[Welcome Email] New confirmation detected for ${record.email}`);
      
      const tier = record.raw_user_meta_data?.plan_preference || 'free';
      const userId = record.id;
      
      const html = getQuantMindWelcomeTemplate(tier, userId);
      const subject = `Your QuantMind ${tier.toUpperCase()} Terminal Node is Active`;

      await sendEmail({
        to: record.email,
        from: getInstitutionalSender('welcome'),
        subject,
        html,
        tags: [
          { name: 'user_id', value: record.id },
          { name: 'email_type', value: 'welcome' }
        ]
      });

      return new Response(JSON.stringify({ status: 'sent' }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Also handle INSERT if email is already confirmed (e.g. OAuth)
    if (type === 'INSERT' && record?.email_confirmed_at) {
      console.log(`[Welcome Email] New confirmed user (OAuth/Direct) detected for ${record.email}`);
      
      const tier = record.raw_user_meta_data?.plan_preference || 'free';
      const userId = record.id;
      
      const html = getQuantMindWelcomeTemplate(tier, userId);
      const subject = `Welcome to the QuantMind Terminal`;

      await sendEmail({
        to: record.email,
        from: getInstitutionalSender('welcome'),
        subject,
        html,
        tags: [
          { name: 'user_id', value: record.id },
          { name: 'email_type', value: 'welcome' }
        ]
      });

      return new Response(JSON.stringify({ status: 'sent_insert' }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ status: 'ignored', reason: 'Not a confirmation event' }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[Welcome Email Error]: ${errorMessage}`);
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
