// Shared Email Utility for QuantMind Edge Functions
// Implements Resend API with FX1 Professional Styling

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
      'Authorization': `Bearer ${RESEND_API_KEY}`,
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
    throw new Error(`Failed to send email: ${error.message || response.statusText}`);
  }

  return await response.json();
}

/**
 * FX1 Professional Email Template Wrapper
 * Wraps content in a dark-themed, institutional layout.
 */
export function getFX1Template(content: string, title: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
          
          body {
            background-color: #080810;
            color: #f3f4f6;
            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(17, 18, 30, 0.72);
            border: 1px solid rgba(0, 212, 255, 0.1);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 64px rgba(0, 0, 0, 0.8);
          }
          .header {
            padding: 40px 32px;
            background: linear-gradient(135deg, #09090b 0%, #111827 100%);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            text-align: center;
          }
          .logo {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #fff;
          }
          .accent { color: #00D4FF; }
          .subtitle {
            display: block;
            margin-top: 8px;
            font-size: 10px;
            letter-spacing: 0.4em;
            color: #94a3b8;
            text-transform: uppercase;
          }
          .content {
            padding: 40px 32px;
            line-height: 1.6;
            font-size: 15px;
            color: #e2e8f0;
          }
          h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 24px;
            color: #fff;
            letter-spacing: -0.02em;
          }
          .footer {
            padding: 32px;
            font-size: 11px;
            color: #64748b;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            background: rgba(0, 0, 0, 0.2);
          }
          .btn {
            display: inline-block;
            padding: 14px 28px;
            background: #00D4FF;
            color: #080810;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 24px;
            font-size: 13px;
          }
          .status-bubble {
            display: inline-block;
            padding: 4px 12px;
            background: rgba(0, 212, 255, 0.1);
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 100px;
            color: #00D4FF;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="logo">Quant<span class="accent">Mind</span></span>
            <span class="subtitle">FX1 Institutional Terminal</span>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            &copy; 2026 QuantMind Financial Intelligence. All rights reserved.<br>
            <span style="letter-spacing: 1px">LONDON // NEW YORK // SINGAPORE</span><br>
            <div style="margin-top: 12px; color: #475569">
              This communication is intended for the designated recipient only. Institutional node access is subject to terminal licensing agreements.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
