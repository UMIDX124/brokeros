import { hasRealKey } from "@/lib/env";

type Result<T> = { ok: true; simulated: boolean; data: T } | { ok: false; simulated: boolean; error: string };

export type SmsResult = Result<{ sid: string; to: string; body: string }>;
export type CallResult = Result<{ sid: string; to: string; durationSec?: number }>;

/** Sends an SMS via Twilio REST API. Simulates cleanly when keys missing. */
export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!hasRealKey(sid) || !hasRealKey(token) || !from) {
    console.info("[twilio] simulating SMS", { to, bodyPreview: body.slice(0, 80) });
    return { ok: true, simulated: true, data: { sid: `SIM-${Date.now()}`, to, body } };
  }

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          authorization: `Basic ${auth}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, simulated: false, error: `twilio ${res.status}: ${text.slice(0, 200)}` };
    }
    const json = (await res.json()) as { sid?: string };
    return { ok: true, simulated: false, data: { sid: json.sid ?? "unknown", to, body } };
  } catch (err) {
    return {
      ok: false,
      simulated: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Initiates a voice call via Twilio. Expects twiml or callback URL.
 *  Simulates cleanly when keys missing. */
export async function makeCall(
  to: string,
  opts: { twimlUrl?: string; message?: string },
): Promise<CallResult> {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!hasRealKey(sid) || !hasRealKey(token) || !from) {
    console.info("[twilio] simulating voice call", { to, message: opts.message?.slice(0, 80) });
    return { ok: true, simulated: true, data: { sid: `SIM-CALL-${Date.now()}`, to, durationSec: 30 } };
  }

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const body = new URLSearchParams({
      From: from,
      To: to,
      ...(opts.twimlUrl
        ? { Url: opts.twimlUrl }
        : { Twiml: `<Response><Say voice="alice">${opts.message ?? "Hello from BrokerOS."}</Say></Response>` }),
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`,
      {
        method: "POST",
        headers: {
          authorization: `Basic ${auth}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, simulated: false, error: `twilio ${res.status}: ${text.slice(0, 200)}` };
    }
    const json = (await res.json()) as { sid?: string };
    return { ok: true, simulated: false, data: { sid: json.sid ?? "unknown", to } };
  } catch (err) {
    return {
      ok: false,
      simulated: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
