import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PaystackHelper } from '@/lib/paystack';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const reference = searchParams.get('reference');
  const platform = searchParams.get('platform');
  
  const isMobile = platform === 'mobile';
  const baseUrl = isMobile 
    ? 'quantmind://operator/billing' 
    : `${origin}/dashboard/settings?tab=billing`;

  if (!reference) {
    return NextResponse.redirect(`${baseUrl}${isMobile ? '?' : '&'}status=error&message=MISSING_REFERENCE`);
  }

  try {
    // Verify with Paystack
    const data = await PaystackHelper.verifyTransaction(reference);

    if (!data || data.status !== 'success') {
      return NextResponse.redirect(`${baseUrl}${isMobile ? '?' : '&'}status=failed`);
    }

    // Transaction successful
    return NextResponse.redirect(`${baseUrl}${isMobile ? '?' : '&'}status=success&ref=${reference}`);
  } catch (error) {
    console.error('[Callback_Error]', error);
    return NextResponse.redirect(`${baseUrl}${isMobile ? '?' : '&'}status=error`);
  }
}
