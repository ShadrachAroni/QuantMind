import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

import { 
  getQuantMindRiskAlertTemplate, 
  getQuantMindWelcomeTemplate, 
  getQuantMindSubscriptionTemplate, 
  getQuantMindSubscriptionExpiryTemplate,
  getQuantMindSubscriptionExpiredTemplate,
  getQuantMindPasswordReminderTemplate, 
  getQuantMindOTPTemplate,
  getQuantMindTemplate,
  getQuantMindReceiptTemplate,
  getInstitutionalSender,
  sendEmail
} from '../_shared/email.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { to, subject, type, details, tier, userId } = payload;
    
    if (!to) return new Response(JSON.stringify({ error: 'Recipient "to" is required' }), { status: 400 });

    let html = '';
    let finalSubject = subject || 'QuantMind Terminal Notification';

    // Map types to centralized templates
    if (type === 'risk_alert') {
      html = getQuantMindRiskAlertTemplate(details);
      finalSubject = subject || `[ALERT] CRITICAL RISK BREACH: ${details.title}`;
    } else if (type === 'welcome') {
      html = getQuantMindWelcomeTemplate(tier || 'pro', userId || '0000');
      finalSubject = subject || `QuantMind ${ (tier || 'pro').toUpperCase() } Terminal Activated`;
    } else if (type === 'subscription_update') {
      html = getQuantMindSubscriptionTemplate(details);
      finalSubject = subject || `QuantMind ${ details.tier.toUpperCase() } Node Status Update`;
    } else if (type === 'password_expiry_reminder') {
      html = getQuantMindPasswordReminderTemplate(details);
      finalSubject = subject || `[SECURITY] QuantMind Access Key Rotation Due (${details.daysLeft || 7}d)`;
    } else if (type === 'admin_2fa_otp') {
      html = getQuantMindOTPTemplate(details.code);
      finalSubject = subject || `[SECURITY] Admin Authorization Key: ${details.code}`;
    } else if (type === 'subscription_expiry') {
      html = getQuantMindSubscriptionExpiryTemplate(details);
      finalSubject = subject || `[TERM_ALERT] Node Subscription Termination Approaching (${details.daysLeft}d)`;
    } else if (type === 'subscription_expired') {
      html = getQuantMindSubscriptionExpiredTemplate(details);
      finalSubject = subject || `[TERM_ALERT] Node Subscription Token Expired - Reverted to Standard`;
    } else if (type === 'payment_receipt') {
      html = getQuantMindReceiptTemplate(details);
      finalSubject = subject || `[RECEIPT] QuantMind Terminal Allocation: ${details.reference}`;
    } else {
      // Fallback/Generic
      html = getQuantMindTemplate(
        payload.content || '<p>Institutional notification received from the QuantMind analytical engine.</p>',
        payload.title || 'SYSTEM_UPDATE'
      );
    }

    // Determine the institutional sender based on type
    const from = getInstitutionalSender(type || 'system');

    // Dispatch using shared utility with explicit Supabase client for validation
    const resData = await sendEmail({
      from,
      to,
      subject: finalSubject,
      html,
      userId
    }, supabase);

    return new Response(JSON.stringify(resData), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[send-email error]:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
