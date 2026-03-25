// Auth validation shared utilities for Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './cors.ts';

export interface AuthenticatedUser {
  id: string;
  email: string;
  tier: string;
  is_admin: boolean;
  role?: string;
}

export async function requireAuth(req: Request): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('ANON_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error('Unauthorized: Invalid or expired token');
  }

  // Get profile details from user_profiles
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('tier, is_admin')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email!,
    tier: profile?.tier || 'free',
    is_admin: !!profile?.is_admin,
    role: user.app_metadata?.role,
  };
}

export function unauthorizedResponse(message = 'Unauthorized', origin: string | null = null): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 
      'Content-Type': 'application/json',
      ...corsHeaders(origin)
    },
  });
}

export function forbiddenResponse(message = 'Forbidden', origin: string | null = null): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { 
      'Content-Type': 'application/json',
      ...corsHeaders(origin)
    },
  });
}

// Validate redirect URLs against allow-list
const ALLOWED_REDIRECTS = new Set([
  'http://localhost:3000/auth/callback',
  'https://quantmind-dashboard.vercel.app/auth/callback',
  'https://quantmind.app/auth/callback',
  'https://admin.quantmind.app/auth/callback',
  'https://dashboard.quantmind.app/auth/callback',
  'quantmind://auth/callback',
]);

export function validateRedirectUrl(url: string): string {
  try {
    if (ALLOWED_REDIRECTS.has(url)) return url;
    return 'https://quantmind.app';
  } catch {
    return 'https://quantmind.app';
  }
}
