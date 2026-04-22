import { renderTemplate } from "../types";
import type { HandlerResult, RunContext, WorkflowNode } from "../types";

export async function handleHttpRequest(
  node: WorkflowNode,
  ctx: RunContext,
): Promise<HandlerResult> {
  const data = node.data as {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    url?: string;
    headers?: Record<string, string>;
    bearer?: string;
    body?: string;
  };

  const url = renderTemplate(data.url ?? "", ctx);
  if (!url) return { status: "FAILED", error: "HTTP_REQUEST requires a url" };

  const method = data.method ?? "POST";
  const headers: Record<string, string> = {
    accept: "application/json",
    ...(data.headers ?? {}),
  };
  if (data.bearer) headers.authorization = `Bearer ${renderTemplate(data.bearer, ctx)}`;
  if (method !== "GET" && !headers["content-type"]) headers["content-type"] = "application/json";

  const renderedBody = data.body ? renderTemplate(data.body, ctx) : undefined;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: method !== "GET" ? renderedBody : undefined,
      signal: controller.signal,
    });
    const text = await res.text().catch(() => "");
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* leave as string */
    }
    if (!res.ok) {
      return {
        status: "FAILED",
        error: `HTTP ${res.status}`,
        output: { status: res.status, body: parsed },
      };
    }
    return {
      status: "SUCCESS",
      output: { status: res.status, body: parsed },
    };
  } catch (err) {
    return {
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(t);
  }
}
