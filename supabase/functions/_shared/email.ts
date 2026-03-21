// Shared Email Utility for QuantMind Edge Functions
// Implements Resend API with FX1 Institutional High-Fidelity Styling
// Refactored for robust serialization and data-rich quantitative reporting.

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
 * Standard FX1 Institutional Wrapper for generic emails.
 */
export function getFX1Template(htmlContent: string, title: string = "TERMINAL NOTIFICATION") {
  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '  <meta charset="utf-8">\n' +
    '  <style>\n' +
    '    body { background-color: #050505; color: #cbd5e1; font-family: \'Public Sans\', sans-serif; margin: 0; padding: 0; }\n' +
    '    .container { max-width: 600px; margin: 0 auto; background: #050505; border-radius: 12px; overflow: hidden; }\n' +
    '    .header { padding: 32px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); background: #020617; }\n' +
    '    .logo { font-size: 20px; font-weight: 900; color: #fff; letter-spacing: -0.05em; }\n' +
    '    .content { padding: 48px 32px; background: radial-gradient(circle at top right, #0f172a, #050505); }\n' +
    '    h1 { font-size: 24px; font-weight: 900; color: #fff; margin: 0 0 24px 0; letter-spacing: -0.01em; border-left: 4px solid #00f5ff; padding-left: 16px; }\n' +
    '    .body-text { font-size: 16px; line-height: 1.6; color: #94a3b8; }\n' +
    '    .footer { padding: 32px; background: #01040a; border-top: 1px solid rgba(255, 255, 255, 0.05); }\n' +
    '    .legal { font-family: monospace; font-size: 10px; color: #475569; }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <div class="container">\n' +
    '    <div class="header"><div class="logo">FX1 Risk</div></div>\n' +
    '    <div class="content">\n' +
    '      <h1>' + title.toUpperCase() + '</h1>\n' +
    '      <div class="body-text">' + htmlContent + '</div>\n' +
    '    </div>\n' +
    '    <div class="footer">\n' +
    '      <div class="legal">© 2024 FX1 Financial Risk Systems. LONDON // NEW YORK // SINGAPORE</div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</body>\n' +
    '</html>';
}

/**
 * Generates a data-rich FX1 Risk Alert Email with expansion metrics.
 */
export function getFX1RiskAlertTemplate(details: { eventId: string, title: string, valueAtRisk: string, expectedShortfall?: string, volatility?: string, confidence?: string, timestamp: string }) {
  const alertColor = "#FF3CAC"; // primary-alert
  const esValue = details.expectedShortfall || (parseFloat(details.valueAtRisk) * 1.2).toFixed(4);
  const volValue = details.volatility || "14.2%";

  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '  <meta charset="utf-8">\n' +
    '  <style>\n' +
    '    body { background-color: #020617; color: #fff; font-family: \'Public Sans\', sans-serif; margin: 0; padding: 0; }\n' +
    '    .container { max-width: 600px; margin: 20px auto; background: #020617; border: 1px solid rgba(255, 60, 172, 0.3); border-radius: 12px; overflow: hidden; }\n' +
    '    .status-tag { float: right; background: rgba(255, 60, 172, 0.1); color: ' + alertColor + '; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 999px; border: 1px solid rgba(255, 60, 172, 0.2); text-transform: uppercase; letter-spacing: 0.1em; }\n' +
    '    .hero { padding: 48px 24px; text-align: center; background: radial-gradient(circle at center, rgba(255, 60, 172, 0.15) 0%, transparent 80%); }\n' +
    '    h1 { font-size: 36px; font-weight: 900; margin: 16px 0 8px 0; color: #fff; }\n' +
    '    .event-id { font-family: monospace; font-size: 11px; color: #64748b; letter-spacing: 0.2em; }\n' +
    '    .metric-grid { padding: 0 24px 32px 24px; display: table; width: 100%; border-spacing: 8px; }\n' +
    '    .metric-item { display: table-cell; background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 12px; text-align: center; }\n' +
    '    .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }\n' +
    '    .value { font-size: 24px; font-weight: 700; font-family: monospace; color: ' + alertColor + '; }\n' +
    '    .info-box { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.05); margin: 0 24px 32px 24px; padding: 24px; border-radius: 12px; }\n' +
    '    .info-title { font-size: 12px; font-weight: 900; color: #fff; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }\n' +
    '    .info-text { font-size: 14px; line-height: 1.6; color: #94a3b8; }\n' +
    '    .btn { display: block; background: ' + alertColor + '; color: #fff; text-decoration: none; text-align: center; padding: 20px 0; border-radius: 8px; font-weight: 900; margin: 0 24px 32px 24px; text-transform: uppercase; letter-spacing: 1px; }\n' +
    '    .footer { padding: 32px; background: #01040a; border-top: 1px solid rgba(255, 255, 255, 0.05); }\n' +
    '    .legal { font-family: monospace; font-size: 10px; color: #475569; line-height: 1.6; }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <div class="container">\n' +
    '    <div style="padding: 24px;"><div class="status-tag">CRITICAL BREACH</div><div style="font-size: 18px; font-weight: 900;">FX1 Risk</div></div>\n' +
    '    <div class="hero">\n' +
    '      <h1>RISK ALERT</h1>\n' +
    '      <div class="event-id">ALRT-ID: ' + details.eventId + '</div>\n' +
    '    </div>\n' +
    '    <div class="metric-grid">\n' +
    '      <div class="metric-item"><div class="label">VaR (99.0%)</div><div class="value">' + details.valueAtRisk + '</div></div>\n' +
    '      <div class="metric-item"><div class="label">Exp Shortfall</div><div class="value">' + esValue + '</div></div>\n' +
    '    </div>\n' +
    '    <div class="info-box">\n' +
    '      <div class="info-title">EXPOSURE SOURCE: ' + details.title + '</div>\n' +
    '      <div class="info-text">The analytical engine has identified a significant risk threshold breach. Portfolio volatility is currently indexed at ' + volValue + ' with a recorded confidence interval of ' + (details.confidence || "99.0%") + '.</div>\n' +
    '    </div>\n' +
    '    <div class="info-box" style="border-left: 4px solid ' + alertColor + ';">\n' +
    '      <div class="info-title" style="color: ' + alertColor + ';">MITIGATION PROTOCOL</div>\n' +
    '      <div class="info-text">Immediate portfolio rebalancing or hedge adjustment is recommended. Review the specific exposure nodes in the QuantMind Terminal for granular attribution analysis.</div>\n' +
    '    </div>\n' +
    '    <a href="https://quantmind.app/terminal" class="btn">Launch Risk Terminal</a>\n' +
    '    <div class="footer"><div class="legal">© 2024 FX1 Financial Risk Systems. Confidential Institutional Data.<br>Timestamp: ' + details.timestamp + '</div></div>\n' +
    '  </div>\n' +
    '</body>\n' +
    '</html>';
}

/**
 * Generates a robust FX1 Welcome Email with institutional roadmap.
 */
export function getFX1WelcomeTemplate(tier: string, userId: string) {
  const accentColor = "#00f5ff"; // cyber-cyan
  const tierLabel = tier.toUpperCase();

  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '  <meta charset="utf-8">\n' +
    '  <style>\n' +
    '    body { background-color: #050505; color: #cbd5e1; font-family: \'Public Sans\', sans-serif; margin: 0; padding: 0; }\n' +
    '    .container { max-width: 600px; margin: 0 auto; background: #050505; border-radius: 12px; overflow: hidden; }\n' +
    '    .hero { padding: 64px 32px; text-align: center; background: radial-gradient(circle at top right, #0f172a, #050505); }\n' +
    '    .badge { display: inline-block; background: rgba(0, 245, 255, 0.1); color: ' + accentColor + '; padding: 4px 16px; border-radius: 999px; font-size: 10px; font-weight: 900; letter-spacing: 2px; margin-bottom: 24px; }\n' +
    '    h1 { font-size: 42px; font-weight: 900; color: #fff; margin: 0 0 16px 0; }\n' +
    '    .roadmap { padding: 40px 32px; background: #01040a; }\n' +
    '    .step { display: table; width: 100%; margin-bottom: 32px; }\n' +
    '    .step-num { display: table-cell; width: 48px; height: 48px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; color: ' + accentColor + '; text-align: center; vertical-align: middle; font-weight: 900; }\n' +
    '    .step-content { display: table-cell; padding-left: 24px; vertical-align: middle; }\n' +
    '    .step-title { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 4px; }\n' +
    '    .step-text { font-size: 14px; color: #64748b; }\n' +
    '    .btn { display: block; background: ' + accentColor + '; color: #050505; text-decoration: none; text-align: center; padding: 20px 0; border-radius: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <div class="container">\n' +
    '    <div class="hero">\n' +
    '      <div class="badge">' + tierLabel + ' NODE INITIALIZED</div>\n' +
    '      <h1>Welcome to the Terminal</h1>\n' +
    '      <p style="color: #64748b; font-family: monospace;">NODE-ID: QM-' + userId.substring(0,8) + '-' + tierLabel + '</p>\n' +
    '    </div>\n' +
    '    <div class="roadmap">\n' +
    '      <div style="font-size: 12px; font-weight: 900; color: #fff; margin-bottom: 32px; letter-spacing: 2px;">INSTITUTIONAL ROADMAP</div>\n' +
    '      <div class="step"><div class="step-num">01</div><div class="step-content"><div class="step-title">Portfolio Ingestion</div><div class="step-text">Connect your first asset node to begin real-time risk simulation.</div></div></div>\n' +
    '      <div class="step"><div class="step-num">02</div><div class="step-content"><div class="step-title">Engine Calibration</div><div class="step-text">Configure your Alpha-Beta sensitivity and VaR confidence intervals.</div></div></div>\n' +
    '      <div class="step"><div class="step-num">03</div><div class="step-content"><div class="step-title">Live Monitoring</div><div class="step-text">Enable push and secure email alerts for instant threat detection.</div></div></div>\n' +
    '      <a href="https://quantmind.app/terminal" class="btn">Enter QuantMind Terminal</a>\n' +
    '    </div>\n' +
    '    <div style="padding: 32px; background: #020617; border-top: 1px solid rgba(255,255,255,0.05); font-family: monospace; font-size: 10px; color: #475569;">© 2024 FX1 Financial Risk Systems. LONDON // NYC // SG</div>\n' +
    '  </div>\n' +
    '</body>\n' +
    '</html>';
}

/**
 * Generates a detailed FX1 Subscription Receipt.
 */
export function getFX1SubscriptionTemplate(details: { tier: string, status: string, amount: string, nextBilling: string, userId: string }) {
  const accentColor = "#00f5ff";
  const tierLabel = details.tier.toUpperCase();

  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '  <meta charset="utf-8">\n' +
    '  <style>\n' +
    '    body { background-color: #050505; color: #cbd5e1; font-family: sans-serif; margin: 0; padding: 0; }\n' +
    '    .container { max-width: 600px; margin: 0 auto; background: #050505; border-radius: 12px; overflow: hidden; }\n' +
    '    .header { padding: 40px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05); }\n' +
    '    .table { width: 100%; margin: 32px 0; border-collapse: collapse; }\n' +
    '    .td-label { font-size: 12px; color: #64748b; padding-bottom: 8px; }\n' +
    '    .td-value { font-size: 18px; color: #fff; font-weight: 700; }\n' +
    '    .benefit-matrix { background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); margin: 32px; padding: 24px; border-radius: 12px; }\n' +
    '    .benefit { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 12px; }\n' +
    '    .benefit::before { content: "✓ "; color: ' + accentColor + '; font-weight: bold; }\n' +
    '    .btn { display: block; background: ' + accentColor + '; color: #050505; text-decoration: none; text-align: center; padding: 18px 0; border-radius: 8px; font-weight: 900; margin: 0 32px 32px 32px; }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <div class="container">\n' +
    '    <div class="header">\n' +
    '      <div style="font-size: 10px; color: ' + accentColor + '; font-weight: 900; letter-spacing: 2px; margin-bottom: 8px;">TRANSACTION RECORD</div>\n' +
    '      <h1 style="color: #fff; margin: 0;">TERMINAL ALLOCATED</h1>\n' +
    '    </div>\n' +
    '    <div style="padding: 0 32px;">\n' +
    '      <table class="table">\n' +
    '        <tr><td class="td-label">Allocated Tier</td><td class="td-label">Transaction Value</td></tr>\n' +
    '        <tr><td class="td-value">' + tierLabel + ' Access</td><td class="td-value" style="color: ' + accentColor + ';">' + details.amount + '</td></tr>\n' +
    '      </table>\n' +
    '      <div class="benefit-matrix">\n' +
    '        <div style="font-size: 10px; font-weight: 900; color: #fff; margin-bottom: 16px; letter-spacing: 1px;">ACTIVE CAPACITY RESERVATIONS</div>\n' +
    '        <span class="benefit">High-Frequency Simulation Pipeline</span>\n' +
    '        <span class="benefit">Priority AI Analysis Node Access</span>\n' +
    '        <span class="benefit">Unlimited Real-time Portfolio Watchlists</span>\n' +
    '        <span class="benefit">Cross-Asset Correlation Intelligence</span>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '    <a href="https://quantmind.app/terminal" class="btn">Launch Reserved Terminal</a>\n' +
    '    <div style="padding: 32px; background: #01040a; border-top: 1px solid rgba(255,255,255,0.05); font-family: monospace; font-size: 10px; color: #475569;">Next Validation: ' + details.nextBilling + '</div>\n' +
    '  </div>\n' +
    '</body>\n' +
    '</html>';
}

/**
 * Basic Welcome for Free Tier.
 */
export function getFX1BasicWelcomeTemplate(userId: string) {
  return getFX1Template('<p>Your terminal node has been successfully provisioned on the standard FX1 tier. You can now begin analyzing basic market risks and portfolio configurations.</p><p style="font-family: monospace; color: #64748b;">NODE: QM-' + userId.substring(0,8) + '-STND</p>', "Node Initialized");
}
