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
}

/**
 * Sends an email using the Resend API
 */
export async function sendEmail(options: EmailOptions) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured in environment variables.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: options.from || Deno.env.get('RESEND_FROM_EMAIL') || 'QuantMind <onboarding@resend.dev>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      reply_to: options.reply_to,
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

const COMMON_HEAD = `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark only">
  <style>
    :root { color-scheme: dark only; supported-color-schemes: dark only; }
    body { background-color: ${BG_DARK} !important; color: ${TEXT_PRIMARY} !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${BG_DARK} !important; }
    .card { background-color: ${CARD_DARK} !important; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; overflow: hidden; margin: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .header { padding: 32px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); background-color: rgba(15, 23, 42, 0.8) !important; }
    .logo { font-size: 22px; font-weight: 900; color: ${BRAND_COLOR} !important; letter-spacing: -0.02em; text-decoration: none; }
    .logo span { color: #fff !important; }
    .footer { padding: 40px 32px; text-align: center; color: ${TEXT_SECONDARY} !important; font-size: 11px; letter-spacing: 0.05em; font-family: ui-monospace, monospace; }
    h1, h2, h3, p, span, div { color: inherit !important; }
    .btn { display: inline-block; background-color: ${BRAND_COLOR} !important; color: ${BG_DARK} !important; text-decoration: none; text-align: center; padding: 18px 32px; border-radius: 12px; font-weight: 800; font-size: 14px; letter-spacing: 0.05em; text-transform: uppercase; margin: 32px 0; }
    @media (max-width: 600px) {
      .card { margin: 10px !important; border-radius: 16px !important; }
      .header, .content { padding: 24px !important; }
      h1 { font-size: 24px !important; }
    }
  </style>
`;

const SHARED_FOOTER = `
  <div class="footer">
    QUANTMIND_SYSTEMS // SECURE_COMM_LAYER_E2EE<br>
    © 2024 QUANTMIND GLOBAL. LONDON // NYC // SINGAPORE
  </div>
`;

/**
 * Standard QuantMind Template Wrapper
 */
export function getQuantMindTemplate(htmlContent: string, title: string = "TERMINAL NOTIFICATION") {
  return `<!DOCTYPE html>
<html lang="en">
<head>${COMMON_HEAD}</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">Quant<span>Mind</span>.</div>
      </div>
      <div style="padding: 48px 32px;" class="content">
        <h1 style="font-size: 28px; font-weight: 900; margin: 0 0 24px 0; border-left: 4px solid ${BRAND_COLOR}; padding-left: 16px;">${title.toUpperCase()}</h1>
        <div style="font-size: 16px; line-height: 1.6; color: ${TEXT_SECONDARY} !important;">${htmlContent}</div>
      </div>
    </div>
    ${SHARED_FOOTER}
  </div>
</body>
</html>`;
}

/**
 * Risk Alert Template
 */
export function getQuantMindRiskAlertTemplate(details: { eventId: string, title: string, valueAtRisk: string, expectedShortfall?: string, volatility?: string, confidence?: string, timestamp: string }) {
  const accent = "#ff3cac"; // Primary Alert Pink
  const esValue = details.expectedShortfall || (parseFloat(details.valueAtRisk) * 1.2).toFixed(4);
  const volValue = details.volatility || "14.2%";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${COMMON_HEAD}
  <style>
    .metric-box { background: rgba(15, 23, 42, 0.6) !important; border: 1px solid rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 16px; text-align: center; }
    .metric-label { font-size: 10px; color: ${TEXT_SECONDARY} !important; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .metric-value { font-size: 24px; font-weight: 800; color: ${accent} !important; font-family: ui-monospace, monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card" style="border: 1px solid rgba(255, 60, 172, 0.3) !important;">
      <div class="header">
        <span style="float: right; color: ${accent} !important; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; background: rgba(255, 60, 172, 0.1); padding: 4px 12px; border-radius: 999px;">CRITICAL_BREACH</span>
        <div class="logo">Quant<span>Mind</span>.</div>
      </div>
      <div style="padding: 48px 32px; text-align: center;">
        <h1 style="font-size: 32px; font-weight: 900; margin: 0; color: #fff !important;">RISK ALERT</h1>
        <div style="font-family: ui-monospace, monospace; font-size: 11px; color: ${TEXT_SECONDARY} !important; margin-top: 12px; letter-spacing: 0.2em;">EVENT-ID: ${details.eventId}</div>
        
        <div style="margin-top: 40px; display: table; width: 100%; border-spacing: 12px 0;">
          <div style="display: table-cell;" class="metric-box">
            <div class="metric-label">VaR (99.0%)</div>
            <div class="metric-value">${details.valueAtRisk}</div>
          </div>
          <div style="display: table-cell;" class="metric-box">
            <div class="metric-label">Exp. Shortfall</div>
            <div class="metric-value">${esValue}</div>
          </div>
        </div>

        <div style="margin-top: 32px; background: rgba(30, 41, 59, 0.4) !important; padding: 24px; border-radius: 16px; text-align: left; border: 1px solid rgba(255, 255, 255, 0.05);">
          <div style="font-size: 12px; font-weight: 900; color: #fff !important; margin-bottom: 12px; text-transform: uppercase;">EXPOSURE: ${details.title}</div>
          <p style="font-size: 14px; line-height: 1.6; color: ${TEXT_SECONDARY} !important; margin: 0;">
            The analytical engine has identified a significant risk threshold breach. Portfolio volatility is indexed at <span style="color: ${accent} !important; font-weight: 700;">${volValue}</span>. Immediate mitigation is recommended.
          </p>
        </div>

        <a href="https://quantmind.app/terminal/risk/${details.eventId}" class="btn" style="background-color: ${accent} !important; width: 100%; box-sizing: border-box;">Launch Risk Terminal</a>
      </div>
    </div>
    ${SHARED_FOOTER}
  </div>
</body>
</html>`;
}

/**
 * Welcome Template
 */
export function getQuantMindWelcomeTemplate(tier: string, userId: string) {
  const tierLabel = tier.toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head>${COMMON_HEAD}</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">Quant<span>Mind</span>.</div>
      </div>
      <div style="padding: 64px 32px; text-align: center; background: radial-gradient(circle at top right, #0f172a, #020617);">
        <div style="display: inline-block; background: rgba(0, 245, 255, 0.1); color: ${BRAND_COLOR} !important; padding: 6px 16px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 2px; margin-bottom: 24px;">${tierLabel} NODE INITIALIZED</div>
        <h1 style="font-size: 36px; font-weight: 900; margin: 0; line-height: 1.2;">Welcome to the<br>Terminal</h1>
        <div style="font-family: ui-monospace, monospace; font-size: 11px; color: ${TEXT_SECONDARY} !important; margin-top: 16px;">SYS-ID: QM-${userId.substring(0,8)}-${tierLabel}</div>
      </div>
      <div style="padding: 48px 32px; background-color: #01040a !important;">
        <div style="font-size: 12px; font-weight: 900; color: #fff !important; margin-bottom: 32px; letter-spacing: 2px;">INSTITUTIONAL ROADMAP</div>
        
        <div style="margin-bottom: 32px; display: table; width: 100%;">
          <div style="display: table-cell; width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 50%; color: ${BRAND_COLOR} !important; text-align: center; vertical-align: middle; font-weight: 900; font-size: 14px;">01</div>
          <div style="display: table-cell; padding-left: 20px; vertical-align: middle;">
            <div style="font-size: 16px; font-weight: 700; color: #fff !important; margin-bottom: 4px;">Portfolio Ingestion</div>
            <div style="font-size: 14px; color: ${TEXT_SECONDARY} !important;">Connect asset nodes for real-time simulation.</div>
          </div>
        </div>
        
        <div style="margin-bottom: 32px; display: table; width: 100%;">
          <div style="display: table-cell; width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 50%; color: ${BRAND_COLOR} !important; text-align: center; vertical-align: middle; font-weight: 900; font-size: 14px;">02</div>
          <div style="display: table-cell; padding-left: 20px; vertical-align: middle;">
            <div style="font-size: 16px; font-weight: 700; color: #fff !important; margin-bottom: 4px;">Engine Calibration</div>
            <div style="font-size: 14px; color: ${TEXT_SECONDARY} !important;">Configure VaR sensitivity and confidence intervals.</div>
          </div>
        </div>

        <a href="https://quantmind.app/terminal" class="btn" style="width: 100%; box-sizing: border-box;">Enter QuantMind Terminal</a>
      </div>
    </div>
    ${SHARED_FOOTER}
  </div>
</body>
</html>`;
}

/**
 * Subscription Template
 */
export function getQuantMindSubscriptionTemplate(details: { tier: string, amount: string, nextBilling: string }) {
  const tierLabel = details.tier.toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head>${COMMON_HEAD}</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">Quant<span>Mind</span>.</div>
      </div>
      <div style="padding: 48px 32px; text-align: center;">
        <div style="font-size: 11px; color: ${BRAND_COLOR} !important; font-weight: 900; letter-spacing: 2px; margin-bottom: 8px;">TRANSACTION_RECORD</div>
        <h1 style="font-size: 28px; margin: 0; color: #fff !important;">TERMINAL ALLOCATED</h1>
        
        <div style="margin: 40px 0; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 24px 0;">
          <div style="display: table; width: 100%;">
            <div style="display: table-cell; text-align: left;">
              <div style="font-size: 12px; color: ${TEXT_SECONDARY} !important; margin-bottom: 8px;">ALLOCATED TIER</div>
              <div style="font-size: 18px; color: #fff !important; font-weight: 800;">${tierLabel} ACCESS</div>
            </div>
            <div style="display: table-cell; text-align: right;">
              <div style="font-size: 12px; color: ${TEXT_SECONDARY} !important; margin-bottom: 8px;">DAILY_CAPACITY</div>
              <div style="font-size: 18px; color: ${BRAND_COLOR} !important; font-weight: 800;">${details.amount}</div>
            </div>
          </div>
        </div>

        <div style="background: rgba(30, 41, 59, 0.4) !important; padding: 24px; border-radius: 16px; text-align: left; border: 1px solid rgba(255, 255, 255, 0.05);">
          <div style="font-size: 11px; font-weight: 900; color: #fff !important; margin-bottom: 16px; letter-spacing: 1px;">ACTIVE CAPACITY RESERVATIONS</div>
          <div style="font-size: 13px; color: ${TEXT_SECONDARY} !important; margin-bottom: 10px;">✓ High-Frequency Simulation Pipeline</div>
          <div style="font-size: 13px; color: ${TEXT_SECONDARY} !important; margin-bottom: 10px;">✓ Priority AI Analysis Node Access</div>
          <div style="font-size: 13px; color: ${TEXT_SECONDARY} !important;">✓ Institutional Real-time Watchlists</div>
        </div>

        <a href="https://quantmind.app/terminal" class="btn" style="width: 100%; box-sizing: border-box;">Activate Terminal</a>
        <div style="font-size: 11px; color: ${TEXT_SECONDARY} !important; font-family: ui-monospace, monospace;">NEXT VALIDATION: ${details.nextBilling}</div>
      </div>
    </div>
    ${SHARED_FOOTER}
  </div>
</body>
</html>`;
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
        <div class="logo">Quant<span>Mind</span>.</div>
      </div>
      <div style="padding: 48px 32px; text-align: center;">
        <div style="display: inline-block; background: rgba(0, 245, 255, 0.1); color: ${BRAND_COLOR} !important; padding: 6px 16px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 1px; margin-bottom: 24px;">AUTHORIZATION_CHALLENGE</div>
        <h1 style="font-size: 26px; margin: 0; color: #fff !important;">ADMIN ACCESS CODE</h1>
        
        <p style="font-size: 15px; color: ${TEXT_SECONDARY} !important; margin: 32px 0;">
          An administrative login attempt was detected. Enter the following zero-trust code to verify your identity:
        </p>

        <div style="background: rgba(0, 245, 255, 0.05) !important; border: 1px dashed ${BRAND_COLOR}; padding: 32px; border-radius: 20px; margin: 32px 0;">
          <div style="font-size: 48px; font-weight: 900; color: ${BRAND_COLOR} !important; letter-spacing: 0.2em; font-family: ui-monospace, monospace;">${code}</div>
        </div>

        <p style="font-size: 12px; color: #64748b !important; margin: 0;">
          This code will expire in 10 minutes. If you did not initiate this request, contact system security immediately.
        </p>
      </div>
    </div>
    ${SHARED_FOOTER}
  </div>
</body>
</html>`;
}

/**
 * Password Rotation Template
 */
export function getQuantMindPasswordReminderTemplate(details: { daysLeft: number }) {
  const accent = "#ff9d00"; // Warning Orange
  return `<!DOCTYPE html>
<html lang="en">
<head>${COMMON_HEAD}</head>
<body>
  <div class="container">
    <div class="card" style="border: 1px solid rgba(255, 157, 0, 0.3) !important;">
      <div class="header">
        <div class="logo">Quant<span>Mind</span>.</div>
      </div>
      <div style="padding: 48px 32px; text-align: center;">
        <div style="display: inline-block; background: rgba(255, 157, 0, 0.1); color: ${accent} !important; padding: 6px 16px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 1px; margin-bottom: 24px;">SECURITY_MAINTENANCE</div>
        <h1 style="font-size: 26px; margin: 0; color: #fff !important;">ACCESS KEY ROTATION</h1>
        
        <p style="font-size: 16px; line-height: 1.6; color: ${TEXT_SECONDARY} !important; margin: 32px 0;">
          Institutional security protocols require a mandatory access key rotation. Your current key expires in <span style="color: ${accent} !important; font-weight: 800;">${details.daysLeft} days</span>.
        </p>

        <a href="https://quantmind.app/terminal/security" class="btn" style="background-color: ${accent} !important; width: 100%; box-sizing: border-box;">Rotate Access Key</a>
      </div>
    </div>
    ${SHARED_FOOTER}
  </div>
</body>
</html>`;
}

/**
 * Basic Welcome for Free Tier
 */
export function getQuantMindBasicWelcomeTemplate(userId: string) {
  return getQuantMindTemplate(
    `<p>Your terminal node has been successfully provisioned on the standard tier. You can now begin analyzing basic market risks and portfolio configurations.</p>
     <p style="font-family: ui-monospace, monospace; color: ${TEXT_SECONDARY} !important;">NODE_HASH: QM-${userId.substring(0,8)}-STND</p>`,
    "Node Initialized"
  );
}

/**
 * Recovery / Reset Password Template
 */
export function getQuantMindRecoveryTemplate(token: string, origin: string = "https://quantmind.app") {
  const accent = BRAND_COLOR;
  const resetLink = `${origin}/auth/callback?type=recovery&code=${token}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>${COMMON_HEAD}</head>
<body>
  <div class="container">
    <div class="card" style="border: 1px solid rgba(0, 245, 255, 0.3) !important;">
      <div class="header">
        <div class="logo">Quant<span>Mind</span>.</div>
      </div>
      <div style="padding: 48px 32px; text-align: center;">
        <div style="display: inline-block; background: rgba(0, 245, 255, 0.1); color: ${accent} !important; padding: 6px 16px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 1px; margin-bottom: 24px;">ACCESS_RECOVERY_PROTOCOL</div>
        <h1 style="font-size: 26px; margin: 0; color: #fff !important;">PASSWORD RESET REQUEST</h1>
        
        <p style="font-size: 15px; line-height: 1.6; color: ${TEXT_SECONDARY} !important; margin: 32px 0;">
          A security credential reset has been initiated for your QuantMind Terminal node. Use the following encrypted link to define a new access cipher:
        </p>

        <a href="${resetLink}" class="btn" style="width: 100%; box-sizing: border-box;">Initialize Cipher Reset</a>

        <div style="margin-top: 32px; padding: 20px; background: rgba(255, 255, 255, 0.03) !important; border-radius: 12px; font-family: ui-monospace, monospace; font-size: 11px; color: ${TEXT_SECONDARY} !important; word-break: break-all;">
          ${resetLink}
        </div>

        <p style="font-size: 12px; color: #64748b !important; margin-top: 32px;">
          This link will expire in 60 minutes. If you did not request this recovery, please notify the QuantMind Security Operations Center (SOC) immediately.
        </p>
      </div>
    </div>
    ${SHARED_FOOTER}
  </div>
</body>
</html>`;
}

/**
 * Institutional Receipt Template
 */
export function getQuantMindReceiptTemplate(details: { 
  reference: string, 
  amount: string, 
  currency: string,
  tier: string,
  date: string,
  method: string
}) {
  const tierLabel = (details.tier || "Standard").toUpperCase();
  const brandAlt = "#00D9FF";

  return `<!DOCTYPE html>
<html lang="en">
<head>${COMMON_HEAD}</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">Quant<span>Mind</span>.</div>
        <div style="float: right; font-size: 10px; color: ${TEXT_SECONDARY} !important; font-family: ui-monospace, monospace; margin-top: 6px;">RECEIPT_ID: ${details.reference}</div>
      </div>
      <div style="padding: 48px 32px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="display: inline-block; background: rgba(0, 217, 255, 0.1); color: ${brandAlt} !important; padding: 6px 16px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 2px; margin-bottom: 16px;">TRANSACTION_SUCCESSFUL</div>
          <h1 style="font-size: 32px; font-weight: 900; margin: 0; color: #fff !important;">${details.amount} ${details.currency}</h1>
          <p style="font-size: 14px; color: ${TEXT_SECONDARY} !important; margin-top: 8px;">Institutional Node Allotted: ${tierLabel} TIER</p>
        </div>

        <div style="background: rgba(15, 23, 42, 0.4) !important; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px; padding: 24px; margin-bottom: 32px;">
          <div style="font-size: 10px; font-weight: 900; color: #fff !important; margin-bottom: 20px; letter-spacing: 1.5px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 8px;">LEDGER_DETAILS</div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 12px; color: ${TEXT_SECONDARY} !important;">Transaction Date</td>
              <td style="padding: 8px 0; font-size: 12px; color: #fff !important; text-align: right; font-family: ui-monospace, monospace;">${details.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 12px; color: ${TEXT_SECONDARY} !important;">Payment Method</td>
              <td style="padding: 8px 0; font-size: 12px; color: #fff !important; text-align: right; text-transform: uppercase;">${details.method}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 12px; color: ${TEXT_SECONDARY} !important;">Service Tier</td>
              <td style="padding: 8px 0; font-size: 12px; color: ${brandAlt} !important; text-align: right; font-weight: 900;">${tierLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 12px; color: ${TEXT_SECONDARY} !important;">Transaction Reference</td>
              <td style="padding: 8px 0; font-size: 12px; color: #fff !important; text-align: right; font-family: ui-monospace, monospace;">${details.reference}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center;">
          <p style="font-size: 13px; line-height: 1.6; color: ${TEXT_SECONDARY} !important; margin-bottom: 32px;">
            Your institutional nodes have been provisioned. Access the terminal to initialize your simulation pipelines.
          </p>
          <a href="https://quantmind.app/dashboard/subscription" class="btn" style="width: 100%; box-sizing: border-box;">Enter Invoice Vault</a>
        </div>
      </div>
    </div>
    ${SHARED_FOOTER}
  </div>
</body>
</html>`;
}

