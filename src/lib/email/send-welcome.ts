import { Resend } from "resend";
import { hasRealKey } from "@/lib/env";

export type SendWelcomeInput = {
  to: string;
  firstName: string;
  businessName: string;
  loanAmount: number;
  score: number;
  tier: "HOT" | "WARM" | "COOL" | "COLD";
  leadId: string;
};

export type SendWelcomeResult = {
  sent: boolean;
  simulated: boolean;
  toUsed: string;
  providerId?: string;
  error?: string;
};

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function buildSubject(input: SendWelcomeInput): string {
  return `Welcome to BrokerOS, ${input.firstName} — next steps for your ${fmtMoney(input.loanAmount)} request`;
}

export function buildWelcomeHtml(input: SendWelcomeInput, appUrl: string): string {
  const docsUrl = `${appUrl}/apply/success?lead=${encodeURIComponent(input.leadId)}`;
  const tierColor = input.tier === "HOT" ? "#06A77D" : input.tier === "WARM" ? "#F4A261" : "#6B6B80";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Welcome to BrokerOS</title>
</head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:'Inter',Arial,sans-serif;color:#1A1A2E;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E8E6E1;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 32px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#1A1A2E;color:#FAF8F5;width:36px;height:36px;border-radius:10px;text-align:center;font-weight:700;font-size:16px;">B</td>
              <td style="padding-left:10px;font-weight:600;font-size:18px;letter-spacing:-0.01em;">BrokerOS</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 0;">
          <p style="margin:0 0 8px;font-size:12px;color:#6B6B80;text-transform:uppercase;letter-spacing:.12em;">Application received</p>
          <h1 style="margin:0;font-size:28px;line-height:1.2;letter-spacing:-0.01em;">Hi ${escapeHtml(input.firstName)} — we&rsquo;ve got your application.</h1>
          <p style="margin:16px 0 0;font-size:16px;line-height:1.55;color:#1A1A2E;">
            Thanks for applying for funding for <strong>${escapeHtml(input.businessName)}</strong>. Our underwriting AI just reviewed your file and you scored
            <strong style="color:${tierColor};">${input.score}/100 (${input.tier})</strong>.
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;border:1px solid #E8E6E1;border-radius:12px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 8px;font-size:12px;color:#6B6B80;text-transform:uppercase;letter-spacing:.12em;">What happens next</p>
              <ol style="margin:0;padding-left:20px;font-size:15px;line-height:1.7;color:#1A1A2E;">
                <li>Upload <strong>3 months of bank statements</strong> + your most recent <strong>tax return</strong>.</li>
                <li>A licensed broker will call you within <strong>1 business day</strong> to discuss lender options.</li>
                <li>Most files reach a soft offer within <strong>48&ndash;72 hours</strong>.</li>
              </ol>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr><td style="background:#F4A261;border-radius:12px;">
              <a href="${docsUrl}" style="display:inline-block;padding:14px 22px;font-weight:600;font-size:15px;color:#1A1A2E;text-decoration:none;">Upload my documents &rarr;</a>
            </td></tr>
          </table>
          <p style="margin:16px 0 0;font-size:13px;color:#6B6B80;line-height:1.55;">
            Reference: <span style="font-family:'JetBrains Mono',Menlo,monospace;">${escapeHtml(input.leadId)}</span> &middot; Reply to this email if you have questions.
          </p>
        </td></tr>
        <tr><td style="padding:0 32px 32px;border-top:1px solid #E8E6E1;">
          <p style="margin:24px 0 0;font-size:11px;color:#6B6B80;line-height:1.6;">
            You&rsquo;re receiving this because you submitted a loan inquiry through BrokerOS. We never share your data without consent.
          </p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#6B6B80;">© ${new Date().getFullYear()} BrokerOS</p>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildWelcomeText(input: SendWelcomeInput, appUrl: string): string {
  return [
    `Hi ${input.firstName},`,
    ``,
    `Thanks for applying for funding for ${input.businessName}.`,
    `Our underwriting AI scored your file ${input.score}/100 (${input.tier}).`,
    ``,
    `Next steps:`,
    `  1. Upload 3 months bank statements + most recent tax return`,
    `  2. A licensed broker will call you within 1 business day`,
    `  3. Most files reach a soft offer within 48-72 hours`,
    ``,
    `Upload your documents: ${appUrl}/apply/success?lead=${encodeURIComponent(input.leadId)}`,
    ``,
    `Reference: ${input.leadId}`,
    ``,
    `— BrokerOS`,
  ].join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&"
      ? "&amp;"
      : c === "<"
        ? "&lt;"
        : c === ">"
          ? "&gt;"
          : c === '"'
            ? "&quot;"
            : "&#39;",
  );
}

export async function sendWelcomeEmail(input: SendWelcomeInput): Promise<SendWelcomeResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const override = process.env.RESEND_TO_OVERRIDE;
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const toUsed = override?.trim() || input.to;
  const subject = buildSubject(input);
  const html = buildWelcomeHtml(input, appUrl);
  const text = buildWelcomeText(input, appUrl);

  if (!hasRealKey(apiKey)) {
    console.info("[send-welcome] RESEND_API_KEY missing — simulating email", {
      to: toUsed,
      subject,
      leadId: input.leadId,
      score: input.score,
      tier: input.tier,
    });
    return { sent: false, simulated: true, toUsed };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: `BrokerOS <${from}>`,
      to: [toUsed],
      replyTo: from,
      subject,
      html,
      text,
    });
    if (error) {
      console.warn("[send-welcome] Resend error, simulating:", error);
      return { sent: false, simulated: true, toUsed, error: error.message };
    }
    return { sent: true, simulated: false, toUsed, providerId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[send-welcome] Resend threw, simulating:", message);
    return { sent: false, simulated: true, toUsed, error: message };
  }
}
