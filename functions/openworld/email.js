/** Sends via Resend's REST API. Without RESEND_API_KEY it records the email as skipped instead of failing. */
const DEFAULT_FROM = "Mira at OpenWorldX <mira@openworldx.com>";
const DEFAULT_FALLBACK_FROM = "Mira at OpenWorldX <onboarding@resend.dev>";

function fromAddress(envKey, fallback) {
  return String(process.env[envKey] || fallback).trim();
}

async function sendViaResend(apiKey, { from, to, subject, text, html, replyTo }) {
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
  return { ok: response.ok, status: response.status, raw };
}

function shouldTryFallback(primaryFrom, fallbackFrom, status, raw) {
  if (!fallbackFrom || primaryFrom === fallbackFrom) return false;
  if (status === 403 || status === 422) return true;
  return /domain is not verified|not verified|validation_error/i.test(raw);
}

export async function sendEmail({ to, subject, text, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY missing; email skipped", { to, subject });
    return { sent: false, reason: "no_api_key" };
  }

  const primaryFrom = fromAddress("RESEND_FROM", DEFAULT_FROM);
  const fallbackFrom = fromAddress("RESEND_FALLBACK_FROM", DEFAULT_FALLBACK_FROM);
  const payload = { to, subject, text, html, replyTo };

  try {
    let result = await sendViaResend(apiKey, { ...payload, from: primaryFrom });
    if (result.ok) {
      return { sent: true, id: JSON.parse(result.raw).id || "", from: primaryFrom };
    }

    if (shouldTryFallback(primaryFrom, fallbackFrom, result.status, result.raw)) {
      console.warn("Resend primary sender failed; retrying with fallback", {
        to,
        subject,
        status: result.status,
        primaryFrom,
        fallbackFrom,
      });
      result = await sendViaResend(apiKey, { ...payload, from: fallbackFrom });
      if (result.ok) {
        return { sent: true, id: JSON.parse(result.raw).id || "", from: fallbackFrom, usedFallback: true };
      }
    }

    console.error("Resend email failed", result.status, result.raw.slice(0, 300));
    return { sent: false, reason: `http_${result.status}`, error: result.raw.slice(0, 300) };
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
