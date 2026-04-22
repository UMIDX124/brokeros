import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  NEXTAUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: z.string().url().optional(),

  GROQ_API_KEY: z.string().min(1),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),

  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email().default("onboarding@resend.dev"),

  APP_URL: z.string().url().default("http://localhost:3000"),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

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

export const env: Env =
  process.env.SKIP_ENV_VALIDATION === "true"
    ? (process.env as unknown as Env)
    : parseEnv();
