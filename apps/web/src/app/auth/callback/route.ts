import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = (searchParams.get('type') || 'signup') as any;
  const next = searchParams.get('next') ?? '/dashboard';
  const t = searchParams.get('t');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      return NextResponse.redirect(`${origin}/auth/login?error=callback_failed&details=${encodeURIComponent(error.message)}`);
    }

    return handleSuccessfulAuth(type, origin, next, t, cookieStore);
  }

  if (token_hash && type) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (error) {
      console.error('Token verification error:', error);
      return NextResponse.redirect(`${origin}/auth/login?error=callback_failed&details=${encodeURIComponent(error.message)}`);
    }

    return handleSuccessfulAuth(type, origin, next, t, cookieStore);
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed&details=Missing+authentication+parameters`);
}

function handleSuccessfulAuth(type: string, origin: string, next: string, t: string | null, cookieStore: any) {
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/reset-password${t ? `?t=${t}` : ''}`);
  }
    
  if (type === 'signup') {
    const planCookie = cookieStore.get('plan_preference');
    if (planCookie) {
      return NextResponse.redirect(`${origin}/dashboard/subscription?plan=${planCookie.value}`);
    }
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  if (type === 'invite') {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
