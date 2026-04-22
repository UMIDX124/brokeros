import { hasRealKey } from "@/lib/env";

export type VoiceResult =
  | { ok: true; simulated: boolean; audioUrl: string; durationSec?: number }
  | { ok: false; simulated: boolean; error: string };

/** Generate speech from text via ElevenLabs. Falls back to a stub URL when key missing. */
export async function generateVoice(
  text: string,
  voiceId?: string,
): Promise<VoiceResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voice = voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? "EXAVITQu4vr4xnSDxMaL";

  if (!hasRealKey(apiKey)) {
    console.info("[elevenlabs] simulating voice generation", { chars: text.length, voice });
    return {
      ok: true,
      simulated: true,
      audioUrl: `data:audio/mpeg;base64,SIMULATED-${Buffer.from(text.slice(0, 32)).toString("base64")}`,
      durationSec: Math.min(120, Math.ceil(text.length / 15)),
    };
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}`,
      {
        method: "POST",
        headers: {
          accept: "audio/mpeg",
          "content-type": "application/json",
          "xi-api-key": apiKey!,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, simulated: false, error: `elevenlabs ${res.status}: ${t.slice(0, 200)}` };
    }
    // In production you'd upload the audio to object storage; for now return
    // a data: URL so the caller has a handle. Useful for stubbing + piping
    // to Twilio <Play>.
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      ok: true,
      simulated: false,
      audioUrl: `data:audio/mpeg;base64,${buf.toString("base64")}`,
      durationSec: Math.min(120, Math.ceil(text.length / 15)),
    };
  } catch (err) {
    return {
      ok: false,
      simulated: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
