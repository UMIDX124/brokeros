import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { hasRealKey } from "@/lib/env";

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // ms epoch
  reason: "ok" | "limited" | "disabled";
};

let cachedClient: Ratelimit | null = null;

/** Build (and cache) the Ratelimit client from env. Returns null when
 *  Upstash credentials aren't configured — caller should treat as disabled. */
function getClient(): Ratelimit | null {
  if (cachedClient) return cachedClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!hasRealKey(url) || !hasRealKey(token)) return null;

  const redis = new Redis({ url: url!, token: token! });
  cachedClient = new Ratelimit({
    redis,
    // Sliding window: 5 requests per 60 seconds per identifier.
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "brokeros:apply",
  });
  return cachedClient;
}

/** Extract the caller IP. Vercel sets x-forwarded-for; fall back to a
 *  stable stand-in so we still limit something in environments without it. */
export function clientIdentifier(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  // In dev or tests, fall back to user-agent so at least headers can differentiate.
  return request.headers.get("user-agent") ?? "anonymous";
}

/** Consume one token from the rate limiter for this identifier. When the
 *  limiter is disabled (no Upstash creds) returns success with reason=disabled
 *  so the demo never breaks if the user hasn't wired Upstash yet. */
export async function consumeApplyRate(identifier: string): Promise<LimitResult> {
  const client = getClient();
  if (!client) {
    return { success: true, limit: 0, remaining: 0, reset: 0, reason: "disabled" };
  }
  const { success, limit, remaining, reset } = await client.limit(identifier);
  return {
    success,
    limit,
    remaining,
    reset,
    reason: success ? "ok" : "limited",
  };
}
