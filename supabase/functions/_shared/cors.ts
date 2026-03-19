// CORS configuration for Supabase Edge Functions
// Only allows approved origins; mobile app JWT-validated separately

const ALLOWED_ORIGINS = new Set([
  'https://quantmind.app',
  'https://admin.quantmind.app',
  'https://dashboard.quantmind.app',
]);

export function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://quantmind.app',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-client-info, apikey',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCors(req: Request): Response | null {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  return null;
}
