import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PaystackHelper } from '@/lib/paystack';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.redirect(`${origin}/dashboard/settings?tab=billing&status=error&message=MISSING_REFERENCE`);
  }

  try {
    const cookieStore = await cookies();
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

    // Verify with Paystack
    const data = await PaystackHelper.verifyTransaction(reference);

    if (!data || data.status !== 'success') {
      return NextResponse.redirect(`${origin}/dashboard/settings?tab=billing&status=failed`);
    }

    // Transaction successful. 
    // Note: Webhook handles the actual database update for robustness,
    // but we can provide immediate feedback here.
    return NextResponse.redirect(`${origin}/dashboard/settings?tab=billing&status=success&ref=${reference}`);
  } catch (error) {
    console.error('[Callback_Error]', error);
    return NextResponse.redirect(`${origin}/dashboard/settings?tab=billing&status=error`);
  }
}
