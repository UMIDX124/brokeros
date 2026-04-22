import { z } from "zod";

// All API-key-style fields are intentionally permissive — the demo must
// degrade gracefully when keys are placeholder/missing (see ai/score-lead.ts
// and email/send-welcome.ts for the fallback paths).
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  NEXTAUTH_SECRET: z.string().min(16).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  AUTH_URL: z.string().url().optional(),

  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),

  RESEND_API_KEY: z.string().optional(),
  AUTH_RESEND_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().default("onboarding@resend.dev"),
  RESEND_TO_OVERRIDE: z.string().email().optional(),

  CRON_SECRET: z.string().optional(),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),

  APP_URL: z.string().url().default("http://localhost:3000"),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/** True when the key is present, non-empty, and not an obvious placeholder. */
export function hasRealKey(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  if (v.length < 8) return false;
  if (v.startsWith("placeholder")) return false;
  if (v === "dev" || v === "test" || v === "changeme") return false;
  return true;
}

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
    );
    throw new Error("Invalid environment variables — see .env.example");
  }
  return parsed.data;
}

/**
 * Resolve env lazily.
 *
 * The module used to call parseEnv() at import time and throw if DATABASE_URL
 * was missing. That crashed Vercel's `Collecting page data` step (a static-
 * analysis worker where Vercel project env vars aren't always injected),
 * even though the vars are present at real request time.
 *
 * Fix: return a Proxy that only validates on the first property access. During
 * Next.js's build phase (`NEXT_PHASE === 'phase-production-build'`) or when
 * SKIP_ENV_VALIDATION is set, we return raw process.env so the build never
 * throws. Real routes still fail loudly at runtime if vars are genuinely missing.
 */
const envProxy = new Proxy({} as Env, {
  get(_target, prop: string) {
    const skip =
      process.env.SKIP_ENV_VALIDATION === "true" ||
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.NEXT_PHASE === "phase-development-server";
    if (skip) {
      return (process.env as unknown as Record<string, unknown>)[prop];
    }
    // First real access in a request handler: validate once and cache.
    const validated = parseEnv() as unknown as Record<string, unknown>;
    // Freeze onto the proxy's target for subsequent reads.
    for (const [k, v] of Object.entries(validated)) {
      (envProxy as unknown as Record<string, unknown>)[k] = v;
    }
    return validated[prop];
  },
});

export const env: Env = envProxy;
