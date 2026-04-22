import { hasRealKey } from "@/lib/env";

export type TurnstileResult = {
  success: boolean;
  bypassed: boolean;
  errorCodes?: string[];
};

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Server-side verify a Turnstile token. When TURNSTILE_SECRET_KEY is not
 *  configured, bypass (return success=true, bypassed=true) so /apply keeps
 *  working during development and pre-key-rotation demos. */
export async function verifyTurnstile(
  token: string | undefined | null,
  ip?: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!hasRealKey(secret)) {
    console.warn("[turnstile] TURNSTILE_SECRET_KEY not set — bypassing verification");
    return { success: true, bypassed: true };
  }

  if (!token) {
    return { success: false, bypassed: false, errorCodes: ["missing-input-response"] };
  }

  try {
    const body = new URLSearchParams({ secret: secret!, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5_000),
    });
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    return {
      success: Boolean(data.success),
      bypassed: false,
      errorCodes: data["error-codes"],
    };
  } catch (err) {
    console.warn("[turnstile] verification threw, treating as failure:", (err as Error).message);
    return { success: false, bypassed: false, errorCodes: ["network-error"] };
  }
}
