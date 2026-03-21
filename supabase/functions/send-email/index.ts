// QuantMind Edge Function: send-email (FX1 Centralized Mailer)
// Single Source of Truth for Institutional FX1 Templates.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

/**
 * FX1 Institutional Templates (Refactored for Centralized Maintenance)
 */

function getFX1RiskAlertTemplate(details: any) {
  const alertColor = "#FF3CAC";
  const esValue = details.expectedShortfall || (parseFloat(details.valueAtRisk) * 1.2).toFixed(4);
  const volValue = details.volatility || "14.2%";

  return '<!DOCTYPE html><html><body style="background:#020617;color:#fff;font-family:sans-serif;margin:0;padding:20px;"><div style="max-width:600px;margin:0 auto;background:#020617;border:1px solid rgba(255,60,172,0.3);border-radius:12px;overflow:hidden;"><div style="padding:24px;background:#01040a;border-bottom:1px solid rgba(255,255,255,0.05);"><span style="float:right;color:' + alertColor + ';font-size:10px;font-weight:900;">CRITICAL BREACH</span><div style="font-size:18px;font-weight:900;">FX1 Risk</div></div><div style="padding:40px;text-align:center;"><h1>CRITICAL RISK ALERT</h1><div style="font-family:monospace;font-size:11px;color:#64748b;">ALRT-ID: ' + details.eventId + '</div><div style="display:table;width:100%;margin-top:32px;"><div style="display:table-cell;padding:12px;"><div style="font-size:10px;color:#64748b;text-transform:uppercase;">VaR (99.0%)</div><div style="font-size:24px;font-weight:900;color:' + alertColor + ';">' + details.valueAtRisk + '</div></div><div style="display:table-cell;padding:12px;"><div style="font-size:10px;color:#64748b;text-transform:uppercase;">Expected Shortfall</div><div style="font-size:24px;font-weight:900;color:' + alertColor + ';">' + esValue + '</div></div></div></div><div style="padding:0 32px 32px 32px;"><div style="background:rgba(30,41,59,0.4);padding:24px;border-radius:12px;"><div style="font-size:11px;font-weight:900;color:#fff;margin-bottom:8px;">EXPOSURE SOURCE: ' + details.title.toUpperCase() + '</div><div style="font-size:13px;line-height:1.6;color:#94a3b8;">Significant risk threshold breach identified. Current portfolio volatility indexed at ' + volValue + '. Immediate rebalancing recommended.</div></div><a href="https://quantmind.app/terminal" style="display:block;background:' + alertColor + ';color:#fff;text-align:center;padding:18px;border-radius:8px;font-weight:900;text-decoration:none;margin-top:24px;">LAUNCH RISK TERMINAL</a></div><div style="padding:32px;background:#01040a;font-size:10px;color:#475569;font-family:monospace;">Timestamp: ' + details.timestamp + '</div></div></body></html>';
}

function getFX1WelcomeTemplate(tier: string, userId: string) {
  const accentColor = "#00f5ff";
  const tierLabel = tier.toUpperCase();
  return '<!DOCTYPE html><html><body style="background:#050505;color:#cbd5e1;font-family:sans-serif;margin:0;padding:20px;"><div style="max-width:600px;margin:0 auto;background:#050505;border-radius:12px;overflow:hidden;border:1px solid #1e293b;"><div style="padding:64px 32px;text-align:center;background:radial-gradient(circle at top right, #0f172a, #050505);"><div style="display:inline-block;background:rgba(0,245,255,0.1);color:' + accentColor + ';padding:4px 16px;border-radius:999px;font-size:10px;font-weight:900;margin-bottom:24px;">' + tierLabel + ' NODE INITIALIZED</div><h1>Welcome to QuantMind</h1><p style="color:#64748b;font-family:monospace;">NODE-ID: QM-' + userId.substring(0,8) + '</p></div><div style="padding:40px 32px;background:#01040a;"><div style="font-size:11px;font-weight:900;margin-bottom:32px;color:#fff;">INSTITUTIONAL ROADMAP</div><div style="margin-bottom:24px;"><strong>01 Portfolio Ingestion</strong><br><span style="font-size:13px;color:#64748b;">Connect asset nodes for simulation.</span></div><div style="margin-bottom:24px;"><strong>02 Engine Calibration</strong><br><span style="font-size:13px;color:#64748b;">Configure VaR sensitivity.</span></div><div style="margin-bottom:32px;"><strong>03 Live Monitoring</strong><br><span style="font-size:13px;color:#64748b;">Enable secure real-time alerts.</span></div><a href="https://quantmind.app/terminal" style="display:block;background:' + accentColor + ';color:#050505;text-align:center;padding:18px;border-radius:8px;font-weight:900;text-decoration:none;">ENTER TERMINAL</a></div></div></body></html>';
}

function getFX1SubscriptionTemplate(details: any) {
  const accentColor = "#00f5ff";
  return '<!DOCTYPE html><html><body style="background:#050505;color:#cbd5e1;font-family:sans-serif;padding:20px;"><div style="max-width:600px;margin:0 auto;background:#050505;border-radius:12px;overflow:hidden;border:1px solid #1e293b;"><div style="padding:40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.05);"><div style="color:' + accentColor + ';font-size:10px;font-weight:900;margin-bottom:8px;">TRANSACTION RECORD</div><h1 style="color:#fff;">TERMINAL ALLOCATED</h1></div><div style="padding:32px;"><table style="width:100%;margin-bottom:32px;"><tr><td style="color:#64748b;font-size:12px;">Allocated Access</td><td style="color:#64748b;font-size:12px;">Value</td></tr><tr><td style="color:#fff;font-size:18px;font-weight:700;">' + details.tier.toUpperCase() + ' Node</td><td style="color:' + accentColor + ';font-size:18px;font-weight:700;">' + details.amount + '</td></tr></table><div style="background:rgba(30,41,59,0.4);padding:24px;border-radius:12px;"><div style="font-size:11px;font-weight:900;color:#fff;margin-bottom:12px;">ACTIVE CAPACITY RESERVATIONS</div><div style="font-size:13px;margin-bottom:8px;">✓ High-Frequency Pipeline</div><div style="font-size:13px;margin-bottom:8px;">✓ Priority AI Node Access</div><div style="font-size:13px;">✓ Cross-Asset Intelligence</div></div><a href="https://quantmind.app/terminal" style="display:block;background:' + accentColor + ';color:#050505;text-align:center;padding:18px;border-radius:8px;font-weight:900;text-decoration:none;margin-top:32px;">LAUNCH RESERVED TERMINAL</a></div><div style="padding:32px;background:#01040a;color:#475569;font-size:10px;font-family:monospace;">Next Validation: ' + details.nextBilling + '</div></div></body></html>';
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
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
