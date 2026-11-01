import { sendMetaWhatsAppButtons, sendMetaWhatsAppTemplate, sendMetaWhatsAppText } from "./meta.js";
import { appendBotMessage } from "../shared/chatStore.js";

// WhatsApp allows free-form messages for 24h after the user's last message; keep a margin.
const SERVICE_WINDOW_MS = 23.5 * 60 * 60 * 1000;

function normalize(phone) {
  return String(phone || "").replace(/\D/g, "");
}

/** Limits proactive WhatsApp only when ALERT_ALLOWLIST_ENABLED=true. Empty or off = message everyone. */
export function isAllowedRecipient(phone) {
  const enabled = String(process.env.ALERT_ALLOWLIST_ENABLED || "").toLowerCase() === "true";
  if (!enabled) return true;
  const list = String(process.env.ALERT_ALLOWLIST || "")
    .split(",")
    .map(normalize)
    .filter(Boolean);
  return !list.length || list.includes(normalize(phone));
}

export function inServiceWindow(candidate, now = Date.now()) {
  const last = Date.parse(candidate?.lastInboundAt || "");
  return Number.isFinite(last) && now - last < SERVICE_WINDOW_MS;
}

export async function sendBotText(phone, text, { phoneNumberId, kind } = {}) {
  const result = await sendMetaWhatsAppText(phone, text, phoneNumberId);
  await appendBotMessage(normalize(phone), text, { kind });
  return result;
}

export async function sendBotButtons(phone, text, buttons, { phoneNumberId, kind } = {}) {
  const result = await sendMetaWhatsAppButtons(phone, text, buttons, phoneNumberId);
  const labels = buttons.map((b) => `[${b.title}]`).join(" ");
  await appendBotMessage(normalize(phone), `${text}\n${labels}`, { kind });
  return result;
}

function metaErrorCode(error) {
  const match = String(error?.message || "").match(/"code"\s*:\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

function isRateOrThroughputError(error) {
  const code = metaErrorCode(error);
  return code === 130429 || code === 131056 || code === 80007 || code === 4;
}

function rateLimitRetryDelaysMs() {
  const raw = process.env.TEMPLATE_RATE_LIMIT_RETRY_MS || "8000,20000,45000";
  return raw
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function deliverApprovedTemplate(phone, template, { kind, historyText, phoneNumberId } = {}) {
  const languageCode =
    template.languageCode || process.env.META_MATCH_TEMPLATE_LANG || process.env.META_TEMPLATE_LANG || "en";
  const bodyParams = template.bodyParams || [];
  const quickReplyPayloads = template.quickReplyPayloads || [];
  const buttonUrlSuffix = template.buttonUrlSuffix || "";
  const payloads = buttonUrlSuffix
    ? [
        { languageCode, bodyParams, quickReplyPayloads, buttonUrlSuffix },
        { languageCode, bodyParams, quickReplyPayloads: [] },
      ]
    : [
        { languageCode, bodyParams, quickReplyPayloads },
        { languageCode, bodyParams, quickReplyPayloads: [] },
      ];

  let lastError;
  for (let attempt = 0; attempt < payloads.length; attempt += 1) {
    const opts = payloads[attempt];
    const rateRetries = rateLimitRetryDelaysMs();
    let rateTry = 0;
    while (true) {
      try {
        const result = await sendMetaWhatsAppTemplate(phone, template.name, phoneNumberId, opts);
        await appendBotMessage(normalize(phone), historyText || template.historyText || "", { kind });
        return { delivered: true, via: "template", result };
      } catch (error) {
        lastError = error;
        const rateLimited = isRateOrThroughputError(error);
        console.warn("template send attempt failed", template.name, {
          attempt: attempt + 1,
          rateTry,
          code: metaErrorCode(error),
          message: error.message.slice(0, 220),
        });
        if (rateLimited && rateTry < rateRetries.length) {
          await sleep(rateRetries[rateTry]);
          rateTry += 1;
          continue;
        }
        break;
      }
    }
    if (!isRateOrThroughputError(lastError)) break;
  }
  throw lastError || new Error("Template send failed");
}

/**
 * Message Mira starts herself.
 * useTemplate: "always" → approved template (recruiter reach-out); "when_required" → session in 24h, else template.
 */
export async function sendProactive(
  phone,
  candidate,
  { text, buttons, template, kind, useTemplate = "when_required", phoneNumberId } = {}
) {
  if (!isAllowedRecipient(phone)) return { delivered: false, reason: "not_allowlisted" };

  const sendOpts = { phoneNumberId, kind };

  try {
    const mustUseTemplate = useTemplate === "always";
    if (mustUseTemplate) {
      if (!template?.name) {
        return { delivered: false, reason: "missing_match_template" };
      }
      return await deliverApprovedTemplate(phone, template, {
        kind,
        historyText: template.historyText || text,
        phoneNumberId,
      });
    }

    if (inServiceWindow(candidate)) {
      const result = buttons?.length
        ? await sendBotButtons(phone, text, buttons, sendOpts)
        : await sendBotText(phone, text, sendOpts);
      return { delivered: true, via: "session", result };
    }

    if (template?.name) {
      return await deliverApprovedTemplate(phone, template, {
        kind,
        historyText: template.historyText || text,
        phoneNumberId,
      });
    }

    return { delivered: false, reason: "outside_24h_no_template" };
  } catch (error) {
    console.error("sendProactive failed", kind, phone, error.message);
    return { delivered: false, reason: "send_failed", error: error.message.slice(0, 300) };
  }
}
