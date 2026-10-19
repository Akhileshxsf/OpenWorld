/** Sends via Resend's REST API. Without RESEND_API_KEY it records the email as skipped instead of failing. */
export async function sendEmail({ to, subject, text, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY missing; email skipped", { to, subject });
    return { sent: false, reason: "no_api_key" };
  }

  const from = process.env.RESEND_FROM || "Mira at OpenWorldX <mira@openworldx.com>";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        ...(html ? { html } : {}),
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    const raw = await response.text();
    if (!response.ok) {
      console.error("Resend email failed", response.status, raw.slice(0, 300));
      return { sent: false, reason: `http_${response.status}`, error: raw.slice(0, 300) };
    }
    return { sent: true, id: JSON.parse(raw).id || "" };
  } catch (error) {
    console.error("Resend email failed", error.message);
    return { sent: false, reason: "network", error: error.message.slice(0, 300) };
  }
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
