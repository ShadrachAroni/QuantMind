// QuantMind Edge Function: send-email
// Single Source of Truth for Institutional QuantMind Templates.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { 
  getQuantMindRiskAlertTemplate, 
  getQuantMindWelcomeTemplate, 
  getQuantMindSubscriptionTemplate, 
  getQuantMindPasswordReminderTemplate, 
  getQuantMindOTPTemplate,
  getQuantMindTemplate,
  getQuantMindReceiptTemplate
} from '../_shared/email.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

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
      // Reusing subscription template or generic for now, as it's similar
      html = getQuantMindTemplate(
        `<p>Your ${details.planName} protocol access is scheduled for termination on <strong>${details.expiryDate}</strong>.</p>
         <p>T-Minus ${details.daysLeft} Days remaining.</p>
         <a href="https://quantmind.app/terminal/subscription" class="btn">Renew Node Access</a>`,
        "Node Access Expiring"
      );
      finalSubject = subject || `[TERM_ALERT] Node Subscription Termination Approaching (${details.daysLeft}d)`;
    } else if (type === 'subscription_expired') {
      html = getQuantMindTemplate(
        `<p>Your ${details.planName} protocol access has expired as of <strong>${details.expiryDate}</strong>.</p>
         <p>Your account has been automatically reverted to the <strong>STND (Free) Tier</strong>. All elite node access and priority simulation bandwidth have been restricted.</p>
         <p>To restore institutional-grade access, please initialize a new subscription via the terminal.</p>
         <a href="https://quantmind.app/terminal/subscription" class="btn">Renew Node Access</a>`,
        "Node Access Expired"
      );
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

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM_EMAIL') || 'QuantMind <onboarding@resend.dev>',
        to,
        subject: finalSubject,
        html
      })
    });

    const resData = await res.json();
    return new Response(JSON.stringify(resData), { 
      status: res.status, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
