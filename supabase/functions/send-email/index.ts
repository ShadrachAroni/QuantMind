// QuantMind Edge Function: send-email (FX1 Centralized Mailer)
// Single Source of Truth for Institutional FX1 Templates.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

/**
 * FX1 Institutional Templates (Refactored for Centralized Maintenance)
 */

function getFX1RiskAlertTemplate(details: any) {
  const accent = "#ff3cac";
  const bg = "#020617";
  const card = "#0f172a";
  const slate100 = "#f1f5f9";
  const esValue = details.expectedShortfall || (parseFloat(details.valueAtRisk) * 1.2).toFixed(4);
  const volValue = details.volatility || "14.2%";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark only">
  <style>
    :root { color-scheme: dark only; supported-color-schemes: dark only; }
    h1, h2, h3, p, span { color: inherit !important; }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${bg} !important;">
  <div style="background-color:${bg} !important; color:${slate100} !important; font-family: -apple-system, sans-serif; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: ${card} !important; border: 1px solid rgba(255,60,172,0.4); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
      <div style="padding: 24px; background-color: #000001 !important; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <span style="float: right; color: ${accent} !important; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Critical Breach</span>
        <div style="font-size: 18px; font-weight: 900; color: ${accent} !important; letter-spacing: -0.02em;">FX1 Risk Engine</div>
      </div>
      <div style="padding: 48px 40px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; color: ${accent} !important; text-transform: uppercase; letter-spacing: 0.05em;">Risk Breach Detected</h1>
        <div style="font-family: ui-monospace, monospace; font-size: 11px; color: #94a3b8 !important; margin-top: 12px; opacity: 0.8;">EVENT_ID: ${details.eventId}</div>
        <div style="margin-top: 40px; display: table; width: 100%;">
          <div style="display: table-cell; padding: 20px; background-color: rgba(15,23,42,0.8) !important; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="font-size: 10px; color: #94a3b8 !important; text-transform: uppercase; margin-bottom: 8px; font-weight: 700;">VaR (99.0%)</div>
            <div style="font-size: 26px; font-weight: 800; color: ${accent} !important;">${details.valueAtRisk}</div>
          </div>
          <div style="display: table-cell; width: 16px;"></div>
          <div style="display: table-cell; padding: 20px; background-color: rgba(15,23,42,0.8) !important; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="font-size: 10px; color: #94a3b8 !important; text-transform: uppercase; margin-bottom: 8px; font-weight: 700;">Exp. Shortfall</div>
            <div style="font-size: 26px; font-weight: 800; color: ${accent} !important;">${esValue}</div>
          </div>
        </div>
      </div>
      <div style="padding: 0 40px 48px 40px;">
        <div style="background-color: rgba(30,41,59,0.3) !important; padding: 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
          <div style="font-size: 11px; font-weight: 900; color: ${slate100} !important; margin-bottom: 12px; text-transform: uppercase;">Exposure: ${details.title.toUpperCase()}</div>
          <div style="font-size: 15px; line-height: 1.6; color: #cbd5e1 !important;">High-sensitivity risk threshold breach. Volatility indexed at <span style="color:${accent} !important; font-weight:700;">${volValue}</span>.</div>
        </div>
        <a href="https://qvqczzyghhgzaesiwtkj.supabase.co/functions/v1/deep-link-handler/risk/${details.eventId}" style="display: block; background-color: ${accent} !important; color: #ffffff !important; text-align: center; padding: 20px; border-radius: 12px; font-weight: 900; text-decoration: none; margin-top: 32px; font-size: 14px; letter-spacing: 0.05em;">LAUNCH RISK TERMINAL</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function getFX1WelcomeTemplate(tier: string, userId: string) {
  const accent = "#00f5ff";
  const bg = "#020617";
  const card = "#0f172a";
  const slate100 = "#f1f5f9";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark only">
  <style>h1, h2, h3, p, div { color: inherit !important; }</style>
</head>
<body style="margin:0; padding:0; background-color:${bg} !important;">
  <div style="background-color:${bg} !important; color:${slate100} !important; font-family: -apple-system, sans-serif; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: ${card} !important; border: 1px solid rgba(0,245,255,0.3); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
      <div style="padding: 64px 40px; text-align: center; background-color: #0f172a !important;">
        <div style="display: inline-block; background: rgba(0,245,255,0.1); color: ${accent} !important; padding: 8px 20px; border-radius: 999px; font-size: 11px; font-weight: 900; margin-bottom: 24px; border: 1px solid rgba(0,245,255,0.2); text-transform: uppercase; letter-spacing: 0.05em;">${(tier || 'pro').toUpperCase()} Node Initialized</div>
        <h1 style="margin: 0; font-size: 32px; color: ${accent} !important; letter-spacing: -0.02em;">Welcome to QuantMind</h1>
        <div style="font-family: ui-monospace, monospace; font-size: 12px; color: #94a3b8 !important; margin-top: 12px;">ID: QM-${userId.substring(0,8)}-FX1</div>
      </div>
      <div style="padding: 48px 40px; background-color: #0f172a !important;">
        <div style="font-size: 12px; font-weight: 900; color: ${accent} !important; margin-bottom: 32px; text-transform: uppercase; letter-spacing: 0.1em;">Institutional Roadmap</div>
        <div style="margin-bottom: 28px;"><div style="font-weight: 800; color: ${slate100} !important; font-size: 16px; margin-bottom: 4px;">01 Portfolio Ingestion</div><div style="font-size: 14px; color: #94a3b8 !important; line-height: 1.5;">Connect multi-asset data nodes.</div></div>
        <div style="margin-bottom: 28px;"><div style="font-weight: 800; color: ${slate100} !important; font-size: 16px; margin-bottom: 4px;">02 Engine Calibration</div><div style="font-size: 14px; color: #94a3b8 !important; line-height: 1.5;">Customize VaR thresholds.</div></div>
        <div style="margin-bottom: 40px;"><div style="font-weight: 800; color: ${slate100} !important; font-size: 16px; margin-bottom: 4px;">03 Live Monitoring</div><div style="font-size: 14px; color: #94a3b8 !important; line-height: 1.5;">Enable analytical risk monitoring.</div></div>
        <a href="https://qvqczzyghhgzaesiwtkj.supabase.co/functions/v1/deep-link-handler/terminal" style="display: block; background-color: ${accent} !important; color: #020617 !important; text-align: center; padding: 22px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 15px; letter-spacing: 0.05em;">ENTER TERMINAL</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function getFX1SubscriptionTemplate(details: any) {
  const accent = "#00f5ff";
  const bg = "#020617";
  const card = "#0f172a";
  const slate100 = "#f1f5f9";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark only">
</head>
<body style="margin:0; padding:0; background-color:${bg} !important;">
  <div style="background-color:${bg} !important; color:${slate100} !important; font-family: -apple-system, sans-serif; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: ${card} !important; border: 1px solid rgba(0,245,255,0.3); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
      <div style="padding: 48px 40px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);"><h1 style="color: ${accent} !important; margin: 0; font-size: 28px;">Terminal Allocated</h1></div>
      <div style="padding: 48px 40px; background-color: ${card} !important;">
        <table style="width: 100%; margin-bottom: 32px;">
          <tr><td style="color: #94a3b8 !important; font-size: 12px; font-weight: 700; text-transform: uppercase;">Node Type</td><td style="color: #94a3b8 !important; font-size: 12px; font-weight: 700; text-align: right; text-transform: uppercase;">Capacity</td></tr>
          <tr><td style="color: ${slate100} !important; font-size: 20px; font-weight: 800; padding-top: 12px;">${details.tier.toUpperCase()} Grid</td><td style="color: ${accent} !important; font-size: 20px; font-weight: 800; text-align: right; padding-top: 12px;">${details.amount}</td></tr>
        </table>
        <a href="https://qvqczzyghhgzaesiwtkj.supabase.co/functions/v1/deep-link-handler/terminal" style="display: block; background-color: ${accent} !important; color: #020617 !important; text-align: center; padding: 22px; border-radius: 12px; font-weight: 900; text-decoration: none; letter-spacing: 0.05em;">ACTIVATE TERMINAL</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function getFX1PasswordReminderTemplate(details: any) {
  const accent = "#ff9d00";
  const bg = "#020617";
  const card = "#0f172a";
  const slate100 = "#f1f5f9";
  
  // A/B Testing Variable (Color)
  const ctaColor = details.abTest === 'variant_b' ? '#00f5ff' : accent;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark only">
  <style>
    @media (max-width: 600px) { .container { padding: 10px !important; } .card { border-radius: 0 !important; } }
    h1, h2, h3, p, span, div { color: inherit !important; }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${bg} !important;">
  <div class="container" style="background-color:${bg} !important; color:${slate100} !important; font-family: -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, helvetica, arial, sans-serif; padding: 40px 20px;">
    <div class="card" style="max-width: 600px; margin: 0 auto; background-color: ${card} !important; border: 1px solid rgba(255,157,0,0.3); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
      <div style="padding: 40px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05); background-color: #1e293b !important;">
        <div style="background: rgba(255,157,0,0.1); color: ${accent} !important; padding: 6px 16px; border-radius: 999px; font-size: 10px; font-weight: 900; margin-bottom: 20px; display: inline-block; border: 1px solid rgba(255,157,0,0.2); letter-spacing: 0.1em;">SECURITY_PROTOCOL_v4.2</div>
        <h1 style="color: ${accent} !important; margin: 0; font-size: 26px; letter-spacing: -0.01em;">ACCESS KEY ROTATION DUE</h1>
      </div>
      <div style="padding: 40px;">
        <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1 !important; margin-bottom: 32px;">
          Institutional security protocols require a mandatory access key (password) rotation every 60 days. Your current key is set to expire in <span style="color:${accent} !important; font-weight:800;">7 days</span>.
        </p>
        <div style="background: rgba(30,41,59,0.5); padding: 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 32px;">
          <div style="font-size: 11px; font-weight: 800; color: #94a3b8 !important; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.1em;">NEW_KEY_REQUIREMENTS</div>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: ${slate100} !important; line-height: 1.8;">
            <li>Minimum 12 character bit-length</li>
            <li>Uppercase & Lowercase alpha-sets</li>
            <li>Numerical & Special character inclusions</li>
            <li>Distinction from previous 5 iterations</li>
          </ul>
        </div>
        <a href="https://qvqczzyghhgzaesiwtkj.supabase.co/functions/v1/deep-link-handler/password-reset" style="display: block; background-color: ${ctaColor} !important; color: #020617 !important; text-align: center; padding: 22px; border-radius: 14px; font-weight: 900; text-decoration: none; font-size: 14px; letter-spacing: 0.08em; box-shadow: 0 4px 14px 0 rgba(255,157,0,0.39);">ROTATE ACCESS KEY</a>
        <p style="font-size: 12px; text-align: center; color: #64748b !important; margin-top: 32px;">
          Failure to rotate credentials will result in a terminal lockout upon expiration.
        </p>
      </div>
    </div>
    <div style="text-align: center; padding: 40px 0; color: #475569 !important; font-size: 11px; letter-spacing: 0.05em; font-family: ui-monospace, monospace;">
      QUANTMIND_SYSTEMS // SECURE_COMM_LAYER_E2EE
    </div>
  </div>
</body>
</html>`;
}

function getFX1SubscriptionExpiryTemplate(details: any) {
  const accent = "#00f5ff";
  const bg = "#020617";
  const card = "#0f172a";
  const slate100 = "#f1f5f9";
  const { daysLeft, planName, expiryDate, discountCode } = details;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:${bg} !important;">
  <div style="background-color:${bg} !important; color:${slate100} !important; font-family: -apple-system, sans-serif; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: ${card} !important; border: 1px solid rgba(0,245,255,0.3); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
      <div style="padding: 64px 40px; text-align: center; background-color: #0f172a !important;">
        <div style="background: rgba(0,245,255,0.1); color: ${accent} !important; padding: 6px 16px; border-radius: 999px; font-size: 10px; font-weight: 900; margin-bottom: 24px; display: inline-block; border: 1px solid rgba(0,245,255,0.2); letter-spacing: 0.1em;">TERM_EXPIRY_ALERT</div>
        <h1 style="color: ${accent} !important; margin: 0; font-size: 30px; letter-spacing: -0.02em;">NODE ACCESS EXPIRING</h1>
        <div style="font-family: ui-monospace, monospace; font-size: 11px; color: #94a3b8 !important; margin-top: 12px; opacity: 0.8;">T-MINUS ${daysLeft} DAYS</div>
      </div>
      <div style="padding: 40px;">
        <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1 !important; margin-bottom: 32px;">
          Your <span style="color:white !important; font-weight:800;">${planName.toUpperCase()}</span> protocol access is scheduled for termination on <span style="color:white !important; font-weight:800;">${expiryDate}</span>. Don't lose your analytical edge in the markets.
        </p>
        <div style="background: rgba(30,41,59,0.3); padding: 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 32px;">
          <div style="font-size: 11px; font-weight: 800; color: #94a3b8 !important; text-transform: uppercase; margin-bottom: 16px;">CONTINUITY_BENEFITS</div>
          <div style="font-size: 14px; margin-bottom: 12px; color: ${slate100} !important;">• High-frequency AI simulation nodes</div>
          <div style="font-size: 14px; margin-bottom: 12px; color: ${slate100} !important;">• Real-time institutional risk monitoring</div>
          <div style="font-size: 14px; color: ${slate100} !important;">• Advanced neural Auditory Synthesis</div>
        </div>
        ${discountCode ? `
        <div style="text-align: center; padding: 20px; border: 2px dashed rgba(0,245,255,0.4); border-radius: 12px; margin-bottom: 32px;">
          <div style="font-size: 10px; color: #94a3b8 !important; margin-bottom: 8px;">RENEWAL_INCENTIVE_CODE</div>
          <div style="font-size: 24px; font-weight: 900; color: ${accent} !important; letter-spacing: 0.2em;">${discountCode}</div>
        </div>` : ''}
        <a href="https://qvqczzyghhgzaesiwtkj.supabase.co/functions/v1/deep-link-handler/subscription" style="display: block; background-color: ${accent} !important; color: #020617 !important; text-align: center; padding: 22px; border-radius: 14px; font-weight: 900; text-decoration: none; font-size: 15px; letter-spacing: 0.1em; box-shadow: 0 0 20px rgba(0,245,255,0.2);">RENEW NODE ACCESS</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function getFX1SubscriptionCancellationTemplate(details: any) {
  const accent = "#94a3b8";
  const bg = "#020617";
  const card = "#0f172a";
  const slate100 = "#f1f5f9";
  const { expiryDate } = details;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:${bg} !important;">
  <div style="background-color:${bg} !important; color:${slate100} !important; font-family: -apple-system, sans-serif; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: ${card} !important; border: 1px solid rgba(148,163,184,0.3); border-radius: 24px; overflow: hidden;">
      <div style="padding: 48px 40px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <h1 style="color: white !important; margin: 0; font-size: 24px; letter-spacing: -0.01em;">DE-ACTIVATION CONFIRMED</h1>
      </div>
      <div style="padding: 40px;">
        <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1 !important; margin-bottom: 32px;">
          Your subscription cancellation request has been processed. Your terminal access remains active until the end of the current billing cycle: <span style="color:white !important; font-weight:700;">${expiryDate}</span>.
        </p>
        <div style="background: rgba(30,41,59,0.3); padding: 24px; border-radius: 16px; margin-bottom: 32px;">
          <div style="font-size: 11px; font-weight: 800; color: #94a3b8 !important; text-transform: uppercase; margin-bottom: 12px;">POST_EXPIRY_STATUS</div>
          <p style="font-size: 13px; margin: 0; color: #94a3b8 !important; line-height: 1.5;">
            After ${expiryDate}, your account will revert to the Standard Tier. Portfolio data will be preserved but advanced analytical features will be restricted.
          </p>
        </div>
        <p style="font-size: 14px; color: #cbd5e1 !important; margin-bottom: 32px;">
          We would appreciate your brief feedback on the terminal experience:
        </p>
        <a href="https://quantmind.io/survey?userId=${details.userId}" style="display: block; border: 1px solid ${accent} !important; color: ${accent} !important; text-align: center; padding: 18px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 13px; margin-bottom: 40px;">OPERATOR_SATISFACTION_SURVEY</a>
        <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 32px; font-size: 13px; color: #64748b !important;">
          Need assistance or want to reactivate? Contact HQ at <span style="color:white !important;">support@quantmind.io</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function getFX1AdminOTPTemplate(code: string) {
  const accent = "#00f5ff";
  const bg = "#020617";
  const card = "#0f172a";
  const slate100 = "#f1f5f9";
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark only">
</head>
<body style="margin:0; padding:0; background-color:${bg} !important;">
  <div style="background-color:${bg} !important; color:${slate100} !important; font-family: -apple-system, sans-serif; padding: 40px 20px;">
    <div style="max-width: 500px; margin: 0 auto; background-color: ${card} !important; border: 1px solid rgba(0,245,255,0.4); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
      <div style="padding: 40px; text-align: center; background-color: #0f172a !important;">
        <div style="background: rgba(0,245,255,0.1); color: ${accent} !important; padding: 6px 16px; border-radius: 999px; font-size: 10px; font-weight: 900; margin-bottom: 24px; display: inline-block; border: 1px solid rgba(0,245,255,0.2); letter-spacing: 0.1em;">GOVERNANCE_AUTHENTICATION</div>
        <h1 style="color: ${accent} !important; margin: 0; font-size: 26px; letter-spacing: -0.01em;">ADMIN ACCESS KEY</h1>
        <div style="font-family: ui-monospace, monospace; font-size: 11px; color: #94a3b8 !important; margin-top: 12px; opacity: 0.8;">SESSION_CHALLENGE_v1.0</div>
      </div>
      <div style="padding: 40px; text-align: center;">
        <p style="font-size: 15px; color: #cbd5e1 !important; margin-bottom: 32px;">
          An administrative login attempt was detected. Enter the following zero-trust authorization code to synchronize your terminal:
        </p>
        <div style="background: rgba(0,245,255,0.05); border: 1px solid rgba(0,245,255,0.2); padding: 32px; border-radius: 20px; margin-bottom: 32px;">
          <div style="font-size: 48px; font-weight: 900; color: ${accent} !important; letter-spacing: 0.2em; font-family: ui-monospace, monospace;">${code}</div>
        </div>
        <p style="font-size: 12px; color: #64748b !important;">
          This code expires in 10 minutes. If you did not initiate this request, immediately trigger the <span style="color:white;">LOCKDOWN_PROTOCOL</span>.
        </p>
      </div>
      <div style="padding: 32px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; color: #475569 !important; font-size: 10px; font-family: ui-monospace, monospace;">
        QUANTMIND_SYSTEMS // SECURE_COMM_LAYER_E2EE
      </div>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { to, subject, type, details, tier, userId } = payload;
    
    if (!to) return new Response(JSON.stringify({ error: 'Recipient "to" is required' }), { status: 400 });

    let html = '';
    let finalSubject = subject || 'QuantMind Terminal Notification';

    if (type === 'risk_alert') {
      html = getFX1RiskAlertTemplate(details);
      finalSubject = subject || `[FX1] CRITICAL RISK ALERT: ${details.title}`;
    } else if (type === 'welcome') {
      html = getFX1WelcomeTemplate(tier || 'pro', userId || '0000');
      finalSubject = subject || `QuantMind ${ (tier || 'pro').toUpperCase() } Terminal Activated`;
    } else if (type === 'subscription_update') {
      html = getFX1SubscriptionTemplate(details);
      finalSubject = subject || `QuantMind ${ details.tier.toUpperCase() } Node Status Update`;
    } else if (type === 'password_expiry_reminder') {
      html = getFX1PasswordReminderTemplate(details);
      finalSubject = subject || `[SECURITY] QuantMind Access Key Rotation Due (${details.daysLeft || 7}d)`;
    } else if (type === 'subscription_expiry') {
      html = getFX1SubscriptionExpiryTemplate(details);
      finalSubject = subject || `[TERM_ALERT] Node Subscription Termination Approaching (${details.daysLeft}d)`;
    } else if (type === 'subscription_cancellation') {
      html = getFX1SubscriptionCancellationTemplate(details);
      finalSubject = subject || `[CONFIRMATION] Subscription Closure Initialized`;
    } else if (type === 'admin_2fa_otp') {
      html = getFX1AdminOTPTemplate(details.code);
      finalSubject = subject || `[SECURITY] Admin Authorization Key: ${details.code}`;
    } else {
      // Fallback/Generic
      html = '<div style="background:#050505;color:#fff;padding:40px;"><h1>' + finalSubject + '</h1><p>Institutional notification received.</p></div>';
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
