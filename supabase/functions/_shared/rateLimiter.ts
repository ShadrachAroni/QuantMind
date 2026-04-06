// Rate limiter using Upstash Redis
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_TOKEN')!,
});

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSecs: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `ratelimit:${key}:${Math.floor(now / windowSecs)}`;

  const count = await redis.incr(windowKey);
  if (count === 1) await redis.expire(windowKey, windowSecs);

  const resetAt = (Math.floor(now / windowSecs) + 1) * windowSecs;
  const retryAfter = resetAt - now;

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
    retryAfter,
  };
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please wait a moment before trying again.',
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfter),
        'X-RateLimit-Limit': String(0),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.resetAt),
        'Content-Type': 'application/json',
      },
    }
  );
}

// Password reset rate limiter (in-memory for singletons, Redis-backed version below)
export async function checkPasswordResetLimit(email: string): Promise<boolean> {
  const key = `pwreset:${email.toLowerCase().trim()}`;
  const MAX_ATTEMPTS = 3;
  const WINDOW_SECS = 3600; // 1 hour

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, WINDOW_SECS);
  return count <= MAX_ATTEMPTS;
}
