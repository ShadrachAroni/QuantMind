import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  // 1. Verify Webhook Signature (Section 13.3)
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest('hex');

  if (hash !== signature) {
    return new Response('TRANS_SIG_INVALID', { status: 401 });
  }

  const event = JSON.parse(body);
  const { data } = event;

  // 2. Process Events
  if (event.event === 'charge.success') {
    const { user_id, tier, plan_id } = data.metadata;

    // Use a service role or bypass cookies for webhook if needed, 
    // but here we'll use a direct supabase client since it's server-to-server.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    // Update User Profile (Tier Upgrade)
    const { error } = await supabase
      .from('user_profiles')
      .update({
        tier: tier,
        subscription_status: 'active',
        subscription_id: data.id.toString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (error) console.error('[Webhook_DB_Update_Error]', error);
  }

  return new Response('EVENT_RECEIVED', { status: 200 });
}
