// Shared Email Utility for QuantMind Edge Functions
// Implements Resend API with Premium QuantMind Fintech Styling
// Centralized Source of Truth for Institutional Templates.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  reply_to?: string;
  tags?: { name: string, value: string }[];
  userId?: string; // Optional userId for recipient validation
}

/**
 * Validates that the recipient email belongs to the specified userId in the database.
 * Also blocks placeholder domains like localhost and test.com.
 */
export async function validateRecipient(supabase: any, email: string, userId?: string): Promise<void> {
  const domain = email.split('@')[1]?.toLowerCase();
  
  // Security: Block placeholder domains
  if (domain === 'localhost' || domain === 'test.com' || domain === 'example.com') {
    throw new Error(`Restricted recipient domain: ${domain}`);
  }

  if (userId) {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw new Error(`Institutional verification failed: No profile found for UID ${userId}`);
    }

    if (profile.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error(`Institutional mismatch: Recipient ${email} does not match profile email for UID ${userId}`);
    }
  } else {
    // If no userId is provided, ensure the recipient exists in the platform at all
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!profile) {
      throw new Error(`Institutional restriction: Recipient ${email} is not a registered QuantMind user.`);
    }
  }
}

/**
 * Sends an email using the Resend API
 */
export async function sendEmail(options: EmailOptions, supabase?: any) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured in environment variables.');
  }

  // Perform validation if supabase client is provided
  if (supabase) {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    for (const recipient of recipients) {
      await validateRecipient(supabase, recipient, options.userId);
    }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: options.from || Deno.env.get('RESEND_FROM_EMAIL') || 'QuantMind <onboarding@quantmind.co.ke>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      reply_to: options.reply_to,
      tags: options.tags,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[Resend Error]:', error);
    throw new Error('Failed to send email: ' + (error.message || response.statusText));
  }

  return await response.json();
}

/**
 * Common Styles and Header/Footer Components
 */
const BRAND_COLOR = "#00f5ff";
const BG_DARK = "#020617";
const CARD_DARK = "#0f172a";
const TEXT_PRIMARY = "#f8fafc";
const TEXT_SECONDARY = "#94a3b8";

// QuantMind Logo (hosted on primary domain)
const LOGO_URL = "https://quantmind.co.ke/logo.png";
const APP_URL = Deno.env.get('APP_URL') || "https://quantmind.co.ke";

const COMMON_HEAD = `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    
    /* Standard Styles */
    body { background-color: ${BG_DARK} !important; color: ${TEXT_PRIMARY} !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${BG_DARK} !important; }
    .card { background-color: ${CARD_DARK} !important; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; overflow: hidden; margin: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .header { padding: 48px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05); background: linear-gradient(to bottom, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.3) 100%) !important; }
    .logo-img { display: block; margin: 0 auto; width: 140px; height: auto; outline: none; border: none; text-decoration: none; }
    .footer { padding: 40px 32px; text-align: center; color: ${TEXT_SECONDARY} !important; font-size: 11px; letter-spacing: 0.1em; font-family: ui-monospace, monospace; text-transform: uppercase; }
    .footer-metadata { display: inline-block; background: rgba(255, 255, 255, 0.03); padding: 4px 12px; border-radius: 999px; margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.05); }
    h1, h2, h3, p, span, div { color: inherit !important; }
    .btn { display: inline-block; background-color: ${BRAND_COLOR} !important; color: ${BG_DARK} !important; text-decoration: none; text-align: center; padding: 18px 40px; border-radius: 12px; font-weight: 800; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; margin: 32px 0; box-shadow: 0 10px 15px -3px rgba(0, 245, 255, 0.2); transition: all 0.3s ease; }
    .btn:hover { opacity: 0.9; transform: translateY(-1px); }

    .section-dark { background-color: rgba(0, 0, 0, 0.2) !important; }
    
    /* Dark Mode Overrides for Aggressive Clients (Gmail, Outlook) */
    @media (prefers-color-scheme: dark) {
      body, .container { background-color: ${BG_DARK} !important; color: ${TEXT_PRIMARY} !important; }
      .card { background-color: ${CARD_DARK} !important; }
      .footer { color: ${TEXT_SECONDARY} !important; }
      .section-dark { background-color: rgba(0, 0, 0, 0.2) !important; }
      h1, h2, h3, p, span, div { color: inherit !important; }
      .btn { background-color: ${BRAND_COLOR} !important; color: ${BG_DARK} !important; }
    }

    /* Outlook specific dark mode styling */
    [data-ogsc] body, [data-ogsc] .container { background-color: ${BG_DARK} !important; color: ${TEXT_PRIMARY} !important; }
    [data-ogsc] .card { background-color: ${CARD_DARK} !important; }
    [data-ogsc] .section-dark { background-color: rgba(0, 0, 0, 0.2) !important; }
    [data-ogsc] .btn { background-color: ${BRAND_COLOR} !important; color: ${BG_DARK} !important; }
    
    @media (max-width: 600px) {
      .card { margin: 10px !important; border-radius: 16px !important; }
      .header, .content { padding: 24px !important; }
      h1 { font-size: 24px !important; }
    }
  </style>
`;

const SHARED_FOOTER = (canReply: boolean = false) => `
  <div class="footer">
    <div class="footer-metadata">QUANTMIND // E2EE TERMINAL NODE</div>
    <div style="margin-bottom: 16px;">
      © 2024 QUANTMIND GLOBAL OPERATIONS. LONDON // NYC // SINGAPORE
    </div>
    ${!canReply ? '<div style="color: #64748b; margin-top: 16px; font-weight: 700; font-size: 10px;">[ SYSTEM GENERATED NOTICE: DO NOT REPLY TO THIS TRANSMISSION ]</div>' : ''}
    <div style="margin-top: 12px; font-size: 10px;">
      <a href="${APP_URL}/legal/privacy" style="color: ${TEXT_SECONDARY} !important; text-decoration: none;">Privacy</a> | 
      <a href="${APP_URL}/legal/terms" style="color: ${TEXT_SECONDARY} !important; text-decoration: none;">Terms</a> | 
      <a href="${APP_URL}/terminal" style="color: ${TEXT_SECONDARY} !important; text-decoration: none;">Dashboard</a>
    </div>
  </div>
`;

/**
 * Standard QuantMind Template Wrapper
 */
export function getQuantMindTemplate(htmlContent: string, title: string = "TERMINAL NOTIFICATION", canReply: boolean = false) {
  return `<!DOCTYPE html>
<html lang="en">
<head>${COMMON_HEAD}</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <img src="${LOGO_URL}" alt="QuantMind" class="logo-img">
      </div>
      <div style="padding: 48px 32px;" class="content">
        <h1 style="font-size: 24px; font-weight: 900; margin: 0 0 24px 0; color: #fff !important; letter-spacing: -0.01em;">${title.toUpperCase()}</h1>
        <div style="font-size: 15px; line-height: 1.7; color: ${TEXT_SECONDARY} !important;">${htmlContent}</div>
      </div>
    </div>
    ${SHARED_FOOTER(canReply)}
  </div>
</body>
</html>`;
}

/**
 * Risk Alert Template
 */
/**
 * Risk Alert Template
 */
export function getQuantMindRiskAlertTemplate(details: { eventId: string, title: string, valueAtRisk: string, expectedShortfall: string, volatility: string, confidence?: string, timestamp: string }) {
  const accent = "#ff3cac"; // Danger Alert Pink

  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${COMMON_HEAD}
  <style>
    .metric-grid { display: table; width: 100%; border-spacing: 12px 0; margin: 40px 0; }
    .metric-box { display: table-cell; background: rgba(15, 23, 42, 0.6) !important; border: 1px solid rgba(255, 60, 172, 0.2); padding: 24px; border-radius: 16px; text-align: center; }
    .metric-label { font-size: 9px; color: ${TEXT_SECONDARY} !important; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 12px; font-weight: 700; }
    .metric-value { font-size: 24px; font-weight: 900; color: ${accent} !important; font-family: ui-monospace, monospace; }

    @media (prefers-color-scheme: dark) {
      .metric-box { background: rgba(15, 23, 42, 0.6) !important; }
      .metric-label { color: ${TEXT_SECONDARY} !important; }
      .metric-value { color: ${accent} !important; }
    }
    
    [data-ogsc] .metric-box { background: rgba(15, 23, 42, 0.6) !important; }
    [data-ogsc] .metric-label { color: ${TEXT_SECONDARY} !important; }
    [data-ogsc] .metric-value { color: ${accent} !important; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card" style="border: 1px solid rgba(255, 60, 172, 0.3) !important;">
      <div class="header">
        <img src="${LOGO_URL}" alt="QuantMind" class="logo-img" style="margin-bottom: 24px;">
        <span style="color: ${accent} !important; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; border: 1px solid ${accent}; padding: 6px 16px; border-radius: 999px;">CRITICAL BREACH // VAR THRESHOLD</span>
      </div>
      <div style="padding: 48px 32px; text-align: center;">
        <h1 style="font-size: 32px; font-weight: 900; margin: 0; color: #fff !important;">RISK ALERT</h1>
        <div style="font-family: ui-monospace, monospace; font-size: 11px; color: ${TEXT_SECONDARY} !important; margin-top: 12px; letter-spacing: 0.1em; background: rgba(255,255,255,0.03); padding: 4px 12px; display: inline-block; border-radius: 4px;">EVENT_REF: ${details.eventId}</div>
        
        <div class="metric-grid">
          <div class="metric-box">
            <div class="metric-label">VaR (99.0%)</div>
            <div class="metric-value">${details.valueAtRisk}</div>
          </div>
          <div class="metric-box">
            <div class="metric-label">Exp. Shortfall</div>
            <div class="metric-value">${details.expectedShortfall}</div>
          </div>
        </div>
 
        <div style="background: rgba(30, 41, 59, 0.4) !important; padding: 28px; border-radius: 20px; text-align: left; border: 1px solid rgba(255, 255, 255, 0.05);">
          <div style="font-size: 11px; font-weight: 900; color: #fff !important; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">EXPOSURE METRIC: ${details.title}</div>
          <p style="font-size: 14px; line-height: 1.6; color: ${TEXT_SECONDARY} !important; margin: 0;">
            Real-time simulation engine has detected a significant threshold breach in your portfolio nodes. Net volatility is currently <span style="color: ${accent} !important; font-weight: 800;">${details.volatility}</span>. Active hedging is recommended.
          </p>
        </div>
 
        <a href="${APP_URL}/terminal/risk/${details.eventId}" class="btn" style="background-color: ${accent} !important; width: 100%; box-sizing: border-box;">Launch Risk Terminal</a>
      </div>
    </div>
    ${SHARED_FOOTER(false)}
  </div>
</body>
</html>`;
}

/**
 * Welcome Template
 */
/**
 * Welcome Template
 */
export function getQuantMindWelcomeTemplate(tier: string, userId: string) {
  const stepsByTier: Record<string, { title: string, desc: string }[]> = {
    'free': [
      { title: 'CONFIGURE_IDENTITY', desc: 'Set up your region and language preferences to optimize the terminal.' },
      { title: 'EXPLORE_MARKETS', desc: 'View real-time data feeds for global indices and common assets.' }
    ],
    'pro': [
      { title: 'CONNECT_NODES', desc: 'Ingest live assets for real-time risk calibration and monitoring.' },
      { title: 'CALIBRATE_ENGINE', desc: 'Configure VaR sensitivity and custom Monte Carlo loops.' }
    ],
    'plus': [
      { title: 'INSTITUTIONAL_HEDGING', desc: 'Access advanced hedging strategies for complex multi-asset portfolios.' },
      { title: 'NODE_CORRELATION', desc: 'Apply stress tests across cross-asset correlations in real-time.' }
    ],
    'student': [
      { title: 'EDUCATIONAL_SIMS', desc: 'Learn quantitative finance through pre-built institutional scenarios.' },
      { title: 'QUANT_SANDBOX', desc: 'Test your own risk models and ciphers in a safe research environment.' }
    ]
  };

  const steps = stepsByTier[tier.toLowerCase()] || stepsByTier['free'];

  return `<!DOCTYPE html>
<html lang="en">
<head>${COMMON_HEAD}</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header" style="background: radial-gradient(circle at center, rgba(0, 245, 255, 0.05) 0%, rgba(2, 6, 23, 0) 100%) !important;">
        <img src="${LOGO_URL}" alt="QuantMind" class="logo-img">
      </div>
      <div style="padding: 64px 32px; text-align: center;">
        <div style="display: inline-block; border: 1px solid ${BRAND_COLOR}; color: ${BRAND_COLOR} !important; padding: 6px 20px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 2px; margin-bottom: 24px; text-transform: uppercase;">${tier.toUpperCase()} TERMINAL PROVISIONED</div>
        <h1 style="font-size: 36px; font-weight: 900; margin: 0; line-height: 1.1; color: #fff !important; line-height: 1.2;">Welcome to the<br>Global Terminal</h1>
        <div style="font-family: ui-monospace, monospace; font-size: 11px; color: ${TEXT_SECONDARY} !important; margin-top: 16px; opacity: 0.7;">SYSCFG-QM-${userId.substring(0,8).toUpperCase()}</div>
      </div>
      <div style="padding: 48px 32px; border-top: 1px solid rgba(255,255,255,0.03);" class="section-dark">
        <div style="font-size: 11px; font-weight: 900; color: #64748b !important; margin-bottom: 40px; letter-spacing: 3px; text-transform: uppercase;">INITIALIZATION STEPS</div>
        
        <table style="width: 100%; margin-bottom: 40px;">
          ${steps.map((step, i) => `
            <tr>
              <td style="width: 44px; vertical-align: middle;">
                <div style="width: 32px; height: 32px; background: ${i === 0 ? BRAND_COLOR : 'transparent'}; border: ${i === 0 ? 'none' : `1px solid ${BRAND_COLOR}`}; border-radius: 50%; color: ${i === 0 ? BG_DARK : BRAND_COLOR} !important; text-align: center; line-height: 32px; font-weight: 900; font-size: 14px;">${i + 1}</div>
              </td>
              <td style="padding-left: 16px; vertical-align: middle;">
                <div style="font-size: 16px; font-weight: 800; color: #fff !important;">${step.title}</div>
                <div style="font-size: 14px; color: ${TEXT_SECONDARY} !important;">${step.desc}</div>
              </td>
            </tr>
            ${i < steps.length - 1 ? '<tr><td height="24"></td></tr>' : ''}
          `).join('')}
        </table>

        <a href="${APP_URL}/terminal" class="btn" style="width: 100%; box-sizing: border-box;">Initialize Personal Terminal</a>
      </div>
    </div>
    ${SHARED_FOOTER(false)}
  </div>
</body>
</html>`;
}

/**
 * Subscription Template
 */
export function getQuantMindSubscriptionTemplate(details: { tier: string, amount: string, nextBilling: string, capabilities?: string[] }) {
  const defaultCapabilities = [
    "✓ Low-Latency Simulation Engine Access",
    "✓ AI-Powered Portfolio Risk Forecasting",
    "✓ Institutional Real-Time Market Feed"
  ];
  
  const capabilities = details.capabilities || defaultCapabilities;

  return `<!DOCTYPE html>
<html lang="en">
<head>${COMMON_HEAD}</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <img src="${LOGO_URL}" alt="QuantMind" class="logo-img">
      </div>
      <div style="padding: 48px 32px; text-align: center;">
        <div style="font-size: 11px; color: ${BRAND_COLOR} !important; font-weight: 900; letter-spacing: 3px; margin-bottom: 8px;">RESOURCE_ALLOCATION_SUCCESS</div>
        <h1 style="font-size: 28px; margin: 0; color: #fff !important; font-weight: 900;">TERMINAL ALLOCATED</h1>
        
        <div style="margin: 40px 0; background: rgba(255,255,255,0.02) !important; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 32px 24px;">
          <table style="width: 100%;">
            <tr>
              <td style="text-align: left;">
                <div style="font-size: 11px; color: ${TEXT_SECONDARY} !important; text-transform: uppercase;">TIER LEVEL</div>
                <div style="font-size: 18px; color: #fff !important; font-weight: 900; margin-top: 4px;">${details.tier.toUpperCase()}</div>
              </td>
              <td style="text-align: right;">
                <div style="font-size: 11px; color: ${TEXT_SECONDARY} !important; text-transform: uppercase;">DAILY CAPACITY</div>
                <div style="font-size: 18px; color: ${BRAND_COLOR} !important; font-weight: 900; margin-top: 4px;">${details.amount}</div>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align: left; background: rgba(15, 23, 42, 0.4) !important; border: 1px dashed rgba(255, 255, 255, 0.1); padding: 24px; border-radius: 16px; margin-bottom: 32px;">
          <div style="font-size: 11px; color: #fff !important; font-weight: 900; margin-bottom: 16px; letter-spacing: 1px;">ENABLED CAPABILITIES:</div>
          ${capabilities.map(cap => `
            <div style="font-size: 13px; color: ${TEXT_SECONDARY} !important; margin-bottom: 8px;">${cap}</div>
          `).join('')}
        </div>

        <a href="${APP_URL}/terminal/billing" class="btn" style="width: 100%; box-sizing: border-box;">Manage Terminal Resource</a>
        <div style="font-size: 11px; color: ${TEXT_SECONDARY} !important; font-family: ui-monospace, monospace; opacity: 0.6;">NEXT BILLING CYCLE: ${details.nextBilling}</div>
      </div>
    </div>
    ${SHARED_FOOTER(false)}
  </div>
</body>
</html>`;
}

/**
 * Subscription Expiry Warning Template
 */
export function getQuantMindSubscriptionExpiryTemplate(details: { planName: string, expiryDate: string, daysLeft: number, discountCode?: string }) {
  const accent = details.daysLeft <= 3 ? "#ff3cac" : "#ffd60a";
  
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: rgba(255,255,255,0.02) !important; color: ${accent} !important; padding: 6px 20px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 2px; margin-bottom: 16px; border: 1px solid ${accent};">PROTOCOL_EXPIRATION_WARNING</div>
      <h2 style="font-size: 24px; font-weight: 900; color: #fff !important; margin: 0;">Terminal Access Expiring</h2>
      <div style="font-size: 14px; color: ${TEXT_SECONDARY} !important; margin-top: 12px;">Your ${details.planName.toUpperCase()} nodes are scheduled for de-provisioning on <strong>${details.expiryDate}</strong>.</div>
    </div>

    <div style="border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px; padding: 32px; text-align: center; margin: 32px 0;" class="section-dark">
      <div style="font-size: 11px; text-transform: uppercase; color: ${TEXT_SECONDARY} !important; letter-spacing: 2px; margin-bottom: 8px;">ACCESS WINDOW CLOSING IN</div>
      <div style="font-size: 48px; font-weight: 900; color: ${accent} !important; font-family: ui-monospace, monospace;">${details.daysLeft} DAYS</div>
    </div>

    ${details.discountCode ? `
      <div style="background: rgba(0, 245, 255, 0.05) !important; border: 1px dashed ${BRAND_COLOR}; padding: 24px; border-radius: 16px; margin: 32px 0; text-align: center;">
        <div style="font-size: 11px; color: ${BRAND_COLOR} !important; font-weight: 900; margin-bottom: 8px; letter-spacing: 1px;">URGENCY RENEWAL OFFER</div>
        <div style="font-size: 20px; font-weight: 900; color: #fff !important; font-family: ui-monospace, monospace;">CODE: ${details.discountCode}</div>
      </div>
    ` : ''}

    <a href="${APP_URL}/terminal/billing" class="btn" style="width: 100%; box-sizing: border-box; background-color: ${BRAND_COLOR} !important;">Renew Terminal Lease</a>
    
    <p style="font-size: 11px; color: #64748b !important; line-height: 1.6; text-align: center;">Failure to renew will result in the loss of high-fidelity simulation history and API uplink access.</p>
  `;
  return getQuantMindTemplate(content, "Subscription Notice", false);
}

/**
 * Subscription Expired Template
 */
export function getQuantMindSubscriptionExpiredTemplate(details: { planName: string, expiryDate: string }) {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: rgba(255, 69, 58, 0.1); color: #ff453a !important; padding: 6px 20px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 2px; margin-bottom: 16px; border: 1px solid rgba(255, 69, 58, 0.2);">PROTOCOL_TERMINATED</div>
      <h2 style="font-size: 24px; font-weight: 900; color: #fff !important; margin: 0;">Access Revoked</h2>
      <div style="font-size: 14px; color: ${TEXT_SECONDARY} !important; margin-top: 12px;">Your ${details.planName.toUpperCase()} protocol access expired on <strong>${details.expiryDate}</strong>.</div>
    </div>

    <div style="border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px; padding: 32px; text-align: center; margin: 32px 0;" class="section-dark">
      <p style="font-size: 16px; line-height: 1.7; color: ${TEXT_PRIMARY} !important; margin: 0;">The terminal has been downgraded to <strong>FREE TIER</strong>. Advanced Monte Carlo kernels and AI Oracle insights have been disabled.</p>
    </div>

    <a href="${APP_URL}/terminal/billing" class="btn" style="width: 100%; box-sizing: border-box;">Re-Activate Terminal</a>
    
    <p style="font-size: 11px; color: #64748b !important; line-height: 1.6; text-align: center;">Your portfolio nodes remain accessible but with restricted processing capacity.</p>
  `;
  return getQuantMindTemplate(content, "Node De-Provisioned", false);
}

/**
 * Admin OTP/MFA Template
 */
export function getQuantMindOTPTemplate(code: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>${COMMON_HEAD}</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <img src="${LOGO_URL}" alt="QuantMind" class="logo-img">
      </div>
      <div style="padding: 48px 32px; text-align: center;">
        <div style="display: inline-block; background: rgba(0, 245, 255, 0.1); color: ${BRAND_COLOR} !important; padding: 6px 20px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 2px; margin-bottom: 24px;">SECURITY_IDENTITY_CHALLENGE</div>
        <h1 style="font-size: 24px; margin: 0; color: #fff !important; font-weight: 900;">AUTHORIZATION CODE</h1>
        
        <p style="font-size: 15px; color: ${TEXT_SECONDARY} !important; margin: 32px 0; line-height: 1.6;">
          An administrative access attempt was detected. Enter the following zero-trust code into the terminal to synchronize your session:
        </p>

        <div style="background: #01040a !important; border: 1px solid rgba(0, 245, 255, 0.2); padding: 40px; border-radius: 20px; margin: 32px 0;">
          <div style="font-size: 56px; font-weight: 900; color: ${BRAND_COLOR} !important; letter-spacing: 0.3em; font-family: ui-monospace, monospace;">${code}</div>
        </div>

        <p style="font-size: 11px; color: #64748b !important; line-height: 1.6;">
          THIS CODE EXPIRES IN 600 SECONDS.<br>IF YOU DID NOT INITIATE THIS LOGIN, ALERT SECURITY IMMEDIATELY.
        </p>
      </div>
    </div>
    ${SHARED_FOOTER(false)}
  </div>
</body>
</html>`;
}

/**
 * Receipt Template
 */
/**
 * Receipt Template
 */
export function getQuantMindReceiptTemplate(details: { reference: string, amount: string, currency: string, tier: string, date: string, method: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>${COMMON_HEAD}</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <img src="${LOGO_URL}" alt="QuantMind" class="logo-img" style="float: left;">
        <div style="float: right; text-align: right;">
          <div style="font-size: 10px; color: ${TEXT_SECONDARY} !important; font-family: ui-monospace, monospace;">REF-ID // ${details.reference.toUpperCase()}</div>
          <div style="font-size: 10px; color: ${BRAND_COLOR} !important; font-weight: 900; margin-top: 4px;">PAID_IN_FULL</div>
        </div>
        <div style="clear: both;"></div>
      </div>
      <div style="padding: 48px 32px;">
        <div style="margin-bottom: 40px;">
          <h1 style="font-size: 32px; font-weight: 900; color: #fff !important; margin: 0;">${details.amount} ${details.currency}</h1>
          <div style="font-size: 14px; text-transform: uppercase; color: ${TEXT_SECONDARY} !important; margin-top: 8px; letter-spacing: 1px;">INSTITUTIONAL TIER: ${details.tier} ACCESS</div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.4) !important; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px; padding: 24px; margin-bottom: 32px;">
          <div style="font-size: 10px; font-weight: 900; color: #fff !important; margin-bottom: 20px; letter-spacing: 2px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px;">LEDGER RECORD</div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; font-size: 12px; color: ${TEXT_SECONDARY} !important;">Transaction Date</td>
              <td style="padding: 10px 0; font-size: 12px; color: #fff !important; text-align: right; font-family: ui-monospace, monospace;">${details.date}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-size: 12px; color: ${TEXT_SECONDARY} !important;">Payment Method</td>
              <td style="padding: 10px 0; font-size: 12px; color: #fff !important; text-align: right; text-transform: uppercase;">${details.method}</td>
            </tr>
            <tr style="border-top: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 16px 0 0 0; font-size: 12px; color: #fff !important; font-weight: 800;">TOTAL ALLOCATED</td>
              <td style="padding: 16px 0 0 0; font-size: 16px; color: ${BRAND_COLOR} !important; text-align: right; font-weight: 900;">${details.amount} ${details.currency}</td>
            </tr>
          </table>
        </div>

        <a href="${APP_URL}/terminal/billing" class="btn" style="width: 100%; box-sizing: border-box;">Download PDF Invoice</a>
      </div>
    </div>
    ${SHARED_FOOTER(false)}
  </div>
</body>
</html>`;
}

/**
 * Support Ticket Received Template
 */
export function getSupportTicketReceivedTemplate(ticketId: string, subject: string) {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <h2 style="font-size: 20px; font-weight: 800; color: #fff !important; margin: 0;">RE: ${subject}</h2>
      <div style="font-size: 12px; color: ${BRAND_COLOR} !important; font-weight: 900; margin-top: 8px; letter-spacing: 1px;">SUPPORT_SESSION_AUTHORIZED</div>
    </div>
    <p>Your support inquiry regarding <strong>"${subject}"</strong> has been successfully ingested. The QuantMind analytical team has been notified and will initialize a secure communication channel shortly.</p>
    <div style="margin-top: 32px; padding: 24px; background: rgba(0, 245, 255, 0.05) !important; border: 1px solid rgba(0, 245, 255, 0.1); border-radius: 16px;">
      <div style="font-size: 9px; color: ${BRAND_COLOR} !important; font-weight: 900; margin-bottom: 8px;">TICKET_IDENTIFIER</div>
      <div style="font-family: ui-monospace, monospace; font-size: 16px; font-weight: 800; word-break: break-all;">#${ticketId.toUpperCase()}</div>
    </div>
    <p style="font-size: 13px; margin-top: 32px; opacity: 0.8;">Average response latency for institutional requests is currently &lt; 4 hours.</p>
  `;
  return getQuantMindTemplate(content, "Ticket Initialized", true);
}

/**
 * Support Reply Template
 */
export function getSupportReplyTemplate(ticketId: string, content: string) {
  const brandedContent = `
    <div style="margin-bottom: 32px; display: table; width: 100%;">
      <div style="display: table-cell; width: 48px; vertical-align: top;">
         <img src="${LOGO_URL}" width="40" height="40" style="border-radius: 12px; border: 1px solid ${BRAND_COLOR};">
      </div>
      <div style="display: table-cell; padding-left: 16px; vertical-align: top;">
         <div style="font-size: 14px; font-weight: 900; color: #fff !important;">QuantMind Support</div>
         <div style="font-size: 10px; color: ${BRAND_COLOR} !important; font-weight: 900; margin-top: 2px;">CERTIFIED SPECIALIST</div>
      </div>
    </div>

    <div style="font-size: 16px; color: ${TEXT_PRIMARY} !important; line-height: 1.8; margin: 32px 0;">${content}</div>

    <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05);">
       <div style="font-size: 10px; color: ${TEXT_SECONDARY} !important; font-family: ui-monospace, monospace;">
          TICKET_REF: ${ticketId.toUpperCase()}<br>
          ENCRYPTION: E2EE_SUPPORT_RELAY<br>
          DOMAIN: QUANTMIND.CO.KE
       </div>
    </div>
  `;
  return getQuantMindTemplate(brandedContent, "Support Transmission", true);
}

/**
 * Password Rotation Reminder Template
 */
export function getQuantMindPasswordReminderTemplate(details: { daysLeft: number }) {
  const accent = details.daysLeft <= 3 ? "#ff3cac" : BRAND_COLOR;
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: rgba(255,255,255,0.02) !important; color: ${accent} !important; padding: 6px 20px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 2px; margin-bottom: 16px; border: 1px solid ${accent};">SECURITY_POLICY_ENFORCED</div>
      <h2 style="font-size: 24px; font-weight: 900; color: #fff !important; margin: 0;">Access Key Rotation Due</h2>
      <div style="font-size: 14px; color: ${TEXT_SECONDARY} !important; margin-top: 12px;">Your institutional access protocol requires periodic credential refreshing.</div>
    </div>

    <div style="border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px; padding: 32px; text-align: center; margin: 32px 0;" class="section-dark">
      <div style="font-size: 11px; text-transform: uppercase; color: ${TEXT_SECONDARY} !important; letter-spacing: 2px; margin-bottom: 8px;">ROTATION WINDOW CLOSING IN</div>
      <div style="font-size: 48px; font-weight: 900; color: ${accent} !important; font-family: ui-monospace, monospace;">${details.daysLeft} DAYS</div>
    </div>

    <p style="font-size: 15px; line-height: 1.7; color: ${TEXT_SECONDARY} !important;">To prevent service interruption and maintain zero-trust integrity, please initialize a password rotation via your terminal security settings.</p>
    
    <a href="${APP_URL}/terminal/security" class="btn" style="width: 100%; box-sizing: border-box; background-color: ${accent} !important;">Rotate Access Key</a>
    
    <p style="font-size: 11px; color: #64748b !important; line-height: 1.6; text-align: center;">If you have recently updated your credentials, please disregard this automated security transmission.</p>
  `;
  return getQuantMindTemplate(content, "Security Protocol Update", false);
}

/**
 * Institutional Sender Mapping (Verified Domains)
 */
export function getInstitutionalSender(type: string): string {
  const domain = "quantmind.co.ke"; // PRIMARY VERIFIED DOMAIN
  const mapping: Record<string, string> = {
    'signup': `QuantMind Verification <verify@${domain}>`,
    'email_change': `QuantMind Verification <verify@${domain}>`,
    'recovery': `QuantMind Security <security@${domain}>`,
    'magiclink': `QuantMind Access <verify@${domain}>`,
    'onboarding': `QuantMind Onboarding <onboarding@${domain}>`,
    'welcome': `QuantMind Onboarding <onboarding@${domain}>`,
    'review': `QuantMind Compliance <review@${domain}>`,
    'support': `QuantMind Support <support@${domain}>`,
    'system': `QuantMind Terminal <info@${domain}>`,
    'alert': `QuantMind Terminal <info@${domain}>`,
    'info': `QuantMind Information <info@${domain}>`,
    'password_expiry_reminder': `QuantMind Security <info@${domain}>`,
    'subscription_expiry': `QuantMind Terminal <info@${domain}>`,
    'subscription_expired': `QuantMind Terminal <info@${domain}>`,
    'admin_2fa_otp': `QuantMind Security <security@${domain}>`,
    'offers': `QuantMind Offers <offers@${domain}>`,
  };

  return mapping[type] || `QuantMind Operations <operations@${domain}>`;
}

// Additional helper functions for backward compatibility if needed
export function getQuantMindBasicWelcomeTemplate(userId: string) {
  return getQuantMindWelcomeTemplate("Standard", userId);
}

export function getQuantMindRecoveryTemplate(token: string, origin: string = APP_URL) {
  const resetLink = `${origin}/auth/callback?type=recovery&code=${token}`;
  const htmlContent = `
    <p>A request has been initiated to recover the access key for your node. Use the protocol link below to define a new authorization cipher.</p>
    <a href="${resetLink}" class="btn" style="width: 100%; box-sizing: border-box;">Initialize Cipher Reset</a>
    <div style="font-size: 11px; font-family: ui-monospace, monospace; color: ${TEXT_SECONDARY} !important; padding: 16px; background: rgba(0,0,0,0.2); border-radius: 8px; word-break: break-all;">
      ${resetLink}
    </div>
    <p style="font-size: 12px; margin-top: 32px; color: #64748b !important;">This protocol link will remain valid for 3600 seconds. If you did not initiate this recovery, please report it immediately.</p>
  `;
  return getQuantMindTemplate(htmlContent, "Recovery Protocol", false);
}

export function getQuantMindVerificationTemplate(otp: string) {
  const htmlContent = `
    <p>To authorize this terminal connection and verify your identity, enter the following ephemeral key:</p>
    <div style="background: rgba(0, 245, 255, 0.05) !important; border: 1px dashed ${BRAND_COLOR}; padding: 32px; border-radius: 20px; margin: 32px 0; text-align: center;">
      <div style="font-size: 48px; font-weight: 900; color: ${BRAND_COLOR} !important; letter-spacing: 0.3em; font-family: ui-monospace, monospace;">${otp}</div>
    </div>
    <p style="font-size: 12px; color: #64748b !important;">Authorization nodes will expire in 900 seconds.</p>
  `;
  return getQuantMindTemplate(htmlContent, "Identity Verification", false);
}
