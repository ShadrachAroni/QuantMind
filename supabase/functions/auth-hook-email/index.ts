import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { 
  sendEmail, 
  getQuantMindVerificationTemplate, 
  getQuantMindRecoveryTemplate,
  getInstitutionalSender
} from '../_shared/email.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { user, email_action_type, token, token_hash, redirect_to } = payload;
    
    console.log(`[Auth Hook] Processing ${email_action_type} for ${user.email}`);

    let html = '';
    let subject = '';
    let type = email_action_type;

    // Map Supabase Auth Types to QuantMind Templates
    if (email_action_type === 'signup' || email_action_type === 'invite') {
      html = getQuantMindVerificationTemplate(token || token_hash);
      subject = 'Verify your QuantMind Terminal Access';
      type = 'signup';
    } else if (email_action_type === 'recovery') {
      html = getQuantMindRecoveryTemplate(token || token_hash);
      subject = 'Reset your QuantMind Password';
      type = 'recovery';
    } else if (email_action_type === 'email_change') {
      html = getQuantMindVerificationTemplate(token || token_hash);
      subject = 'Confirm your new QuantMind Email Address';
      type = 'email_change';
    } else if (email_action_type === 'magiclink') {
      html = getQuantMindRecoveryTemplate(token || token_hash); // Reusing recovery-style for magic links
      subject = 'Your QuantMind One-Time Access Link';
      type = 'magiclink';
    } else {
      throw new Error(`Unsupported email action type: ${email_action_type}`);
    }

    // Send via Resend with Secure Verification
    await sendEmail({
      to: user.email,
      from: getInstitutionalSender(type),
      subject,
      html,
      userId: user.id
    }, supabase);

    return new Response(JSON.stringify({ status: 'success' }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[Auth Hook Error]: ${errorMessage}`);
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
