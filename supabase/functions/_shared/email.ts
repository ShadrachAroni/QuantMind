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
      from: options.from || 'QuantMind <no-reply@quantmind.app>',
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
          body {
            background-color: #030712;
            color: #f3f4f6;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(17, 24, 39, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
          }
          .header {
            padding: 32px;
            background: linear-gradient(135deg, #09090b 0%, #111827 100%);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            text-align: center;
          }
          .logo {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.05em;
            color: #fff;
            text-decoration: none;
          }
          .accent { color: #00D9FF; }
          .content {
            padding: 40px 32px;
            line-height: 1.6;
          }
          h1 {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 24px;
            color: #fff;
          }
          .footer {
            padding: 32px;
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #00D9FF;
            color: #000;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 24px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="logo">Quant<span class="accent">Mind</span></span>
          </div>
          <div class="content">
            <h1>${title}</h1>
            ${content}
          </div>
          <div class="footer">
            &copy; 2026 QuantMind Financial. Institutional Grade Intelligence.<br>
            London // New York // Singapore
          </div>
        </div>
      </body>
    </html>
  `;
}
