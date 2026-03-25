import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PaystackHelper } from '@/lib/paystack';
import { SUBSCRIPTION_PLANS } from '@/config/plans';

export async function POST(request: Request) {
  try {
    const { planId } = await request.json();
    const cookieStore = await cookies();
    
    // 1. Authenticate User
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'TRANS_AUTH_FAILURE' }, { status: 401 });
    }

    // 2. Check for Existing Active Subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSub && existingSub.status === 'active') {
        // Prevent duplicate subscriptions; redirect to dashboard/subscription (where they can manage via portal)
        return NextResponse.json({ error: 'ACTIVE_PROTOCOL_DETECTED' }, { status: 400 });
    }

    // 3. Resolve Plan
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan || plan.price === 0) {
      return NextResponse.json({ error: 'INVALID_PLAN_PROTOCOL' }, { status: 400 });
    }

    // 4. Trial Logic (7-day trial for new subs)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('has_used_trial')
      .eq('id', user.id)
      .single();

    let startDate: string | undefined;
    if (profile && !profile.has_used_trial) {
      const trialDate = new Date();
      trialDate.setDate(trialDate.getDate() + 7);
      startDate = trialDate.toISOString();
    }

    // 5. Initialize Paystack Transaction
    const checkoutData = await PaystackHelper.initializeTransaction(
      user.email!,
      plan.price,
      {
        user_id: user.id,
        plan_id: plan.id,
        tier: plan.tier,
        is_trial: !!startDate
      },
      plan.paystack_plan_code,
      startDate
    );
    // 4. Validate and Redirect
    if (!checkoutData || !checkoutData.authorization_url) {
      return NextResponse.json({ error: 'TRANS_INIT_PROTOCOL_ERROR' }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutData.authorization_url });
  } catch (error: any) {
    console.error('[Checkout_Route_Error]', error);
    return NextResponse.json({ error: 'INTERNAL_TERMINAL_ERROR' }, { status: 500 });
  }
}
