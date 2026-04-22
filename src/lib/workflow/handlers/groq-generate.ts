import Groq from "groq-sdk";
import { hasRealKey } from "@/lib/env";
import { renderTemplate } from "../types";
import type { HandlerResult, RunContext, WorkflowNode } from "../types";

export async function handleGroqGenerate(
  node: WorkflowNode,
  ctx: RunContext,
): Promise<HandlerResult> {
  const data = node.data as {
    system?: string;
    prompt?: string;
    temperature?: number;
    maxTokens?: number;
  };
  const system = renderTemplate(data.system ?? "You are a concise, professional US small-business loan broker assistant.", ctx);
  const prompt = renderTemplate(data.prompt ?? "", ctx);
  if (!prompt) return { status: "FAILED", error: "GROQ_GENERATE requires a prompt" };

  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  if (!hasRealKey(apiKey)) {
    // Deterministic fallback so the demo never breaks
    const stub = `[[ simulated Groq output ]]\n\nHi ${(ctx.lead?.ownerName as string | undefined) ?? "there"},\n\n${prompt.slice(0, 200)}\n\n— BrokerOS`;
    return { status: "SUCCESS", output: { text: stub, simulated: true, model: "fallback" } };
  }

  try {
    const client = new Groq({ apiKey });
    const res = await client.chat.completions.create({
      model,
      temperature: data.temperature ?? 0.4,
      max_tokens: data.maxTokens ?? 400,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    });
    const text = res.choices?.[0]?.message?.content?.trim() ?? "";
    return { status: "SUCCESS", output: { text, simulated: false, model } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stub = `[[ Groq unreachable — fallback ]]\n\nHi,\n\n${prompt.slice(0, 200)}\n\n— BrokerOS`;
    return { status: "SUCCESS", output: { text: stub, simulated: true, error: message } };
  }
}
