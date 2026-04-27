import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { warrantService } from './lib/services/warrant-client';

// Rate Limiting Config
const RATELIMIT_CONFIG: Record<string, { limit: number, windowMs: number }> = {
  free: { limit: 20, windowMs: 60 * 1000 },
  plus: { limit: 100, windowMs: 60 * 1000 },
  pro: { limit: 1000, windowMs: 60 * 1000 },
  admin: { limit: 9999, windowMs: 60 * 1000 }
};

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // 1. Scalable Rate Limiting Protocol
  if (session && request.nextUrl.pathname.startsWith('/api')) {
    // In production, this would use Redis for cross-node synchronization
    // For now, we simulate the tier-based logic
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier, is_admin')
      .eq('id', session.user.id)
      .single();

    const tier = profile?.is_admin ? 'admin' : (profile?.tier || 'free');
    const config = RATELIMIT_CONFIG[tier as keyof typeof RATELIMIT_CONFIG] || RATELIMIT_CONFIG.free;
    
    // Simulate Redis hit/increment
    const currentUsage = 5; // Placeholder for redis.get(key)
    
    if (currentUsage > config.limit) {
      return new NextResponse('RATE_LIMIT_EXCEEDED: Termination of terminal sequence.', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + config.windowMs).toString(),
          'Retry-After': '60'
        }
      });
    }

    supabaseResponse.headers.set('X-RateLimit-Limit', config.limit.toString());
    supabaseResponse.headers.set('X-RateLimit-Remaining', (config.limit - currentUsage).toString());
  }

  // Route Protection Logic
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');
  const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding');
  const isProtectedPage = isDashboardPage || isOnboardingPage;

  // 2. Auth Redirects
  const isResetPage = request.nextUrl.pathname === '/auth/reset-password';
  if (session && isAuthPage && !isResetPage && request.nextUrl.pathname !== '/auth/callback') {
    const url = new URL('/dashboard', request.url);
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (!session && isProtectedPage) {
    const url = new URL('/auth/login', request.url);
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  // 3. Authorization (Warrant)
  if (session && isDashboardPage) {
    const isAuthorized = await warrantService.isAuthorized(session.user.id, {
      objectType: 'portfolio',
      objectId: 'default',
      relation: 'viewer'
    });

    if (!isAuthorized) {
      const url = new URL('/unauthorized', request.url);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

