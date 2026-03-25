import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!resendApiKey || !supabaseUrl || !serviceRoleKey) {
      console.error('CRITICAL: Environment configuration incomplete:', {
        hasResend: !!resendApiKey,
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceRole: !!serviceRoleKey
      });
      return NextResponse.json({ error: 'System configuration terminal offline. Please contact administrator.' }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);

    const { email } = await request.json();
    console.log('--- RECOVERY DISPATCH INITIATED ---');
    console.log('Target Email:', email);

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Verify institutional record exists
    const { data: exists, error: rpcError } = await supabaseAdmin
      .rpc('check_institutional_record', { p_email: email });

    console.log('Institutional Verification:', { exists, rpcError });

    if (rpcError || !exists) {
      return NextResponse.json({ 
        error: 'Institutional record not found. Access recovery denied for unregistered entities.' 
      }, { status: 404 });
    }

    // 2. Generate recovery link using Administrative bypass
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery&t=${Date.now()}`
      }
    });

    if (linkError) {
      console.error('Supabase Admin Link Generation Error:', linkError);
      throw linkError;
    }

    // We use the hashed_token to perform a server-side verification in our own callback
    // This is the most reliable method for Next.js SSR
    const hashedToken = data.properties.hashed_token;
    const recoveryLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?token_hash=${hashedToken}&type=recovery&t=${Date.now()}`;
    
    console.log('Recovery Link Generated successfully (token_hash flow)');

    // 3. Dispatch branded email via Resend
    console.log('Dispatching via Resend SDK...');
    const resendResult = await resend.emails.send({
      from: 'QuantMind <onboarding@resend.dev>', // Change to your verified domain in production
      to: email,
      subject: '[QuantMind] Action Required: Access Recovery Initiation',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #05070A; color: #FFFFFF; }
                .container { max-width: 600px; margin: 40px auto; padding: 40px; background-color: #0A0C10; border: 1px solid #1E293B; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                .header { text-align: center; margin-bottom: 40px; }
                .logo-text { font-size: 24px; font-weight: 800; color: #00D9FF; letter-spacing: 2px; }
                .content { line-height: 1.6; color: #848D97; text-align: center; }
                .title { font-size: 24px; font-weight: 700; color: #FFFFFF; margin-bottom: 16px; letter-spacing: -0.02em; }
                .btn-container { text-align: center; margin: 40px 0; }
                .btn { background-color: #00D9FF; color: #05070A !important; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; font-size: 13px; display: inline-block; box-shadow: 0 4px 20px rgba(0,217,255,0.3); }
                .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #1E293B; font-size: 11px; color: #4B5563; text-align: center; letter-spacing: 0.05em; line-height: 1.5; }
                .highlight { color: #00D9FF; font-weight: bold; }
                .warning { color: #848D97; font-size: 12px; margin-top: 30px; border: 1px solid #1E293B; padding: 15px; border-radius: 12px; background: rgba(255,255,255,0.02); }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo-text">QUANTMIND</div>
                </div>
                <div class="content">
                    <h1 class="title">Access Recovery Initiation</h1>
                    <p>Our systems have logged a request to re-initiate the access cipher for your institutional account.</p>
                    <p>To commit a new security key to your profile repository, proceed to the secure reset terminal via the link below.</p>
                </div>
                <div class="btn-container">
                    <a href="${recoveryLink}" class="btn">Commit Reset Protocol</a>
                </div>
                <div class="content">
                    <div class="warning">
                        <span style="color: #00D9FF; display: block; margin-bottom: 5px; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Security Notice</span>
                        PROTOCOL NOTICE: This recovery link will self-terminate in <span class="highlight">10 minutes</span>. If this request was not authorized by your authority, please initiate immediate security measures.
                    </div>
                </div>
                <div class="footer">
                    QUANTMIND INSTITUTIONAL ASSET MANAGEMENT &copy; 2026. ALL RIGHTS RESERVED.<br>
                    SECURE REPOSITORY TRANSMISSION #RECOV-CIPHER-COMMIT
                </div>
            </div>
        </body>
        </html>
      `
    });

    const { data: resendData, error: resendError } = resendResult;
    console.log('Resend API Result:', { resendData, resendError });

    if (resendError) throw resendError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Recovery dispatch error:', error);
    return NextResponse.json({ 
      error: error.message || 'Reset protocol dispatch failed. Please check institutional connectivity.' 
    }, { status: 500 });
  }
}
