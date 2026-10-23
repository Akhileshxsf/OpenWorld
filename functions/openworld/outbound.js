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

/**
 * Message Mira starts herself. Inside the 24h window it sends text/buttons; outside it needs an
 * approved template, otherwise it reports why nothing was delivered.
 */
export async function sendProactive(phone, candidate, { text, buttons, template, kind }) {
  if (!isAllowedRecipient(phone)) return { delivered: false, reason: "not_allowlisted" };

  try {
    if (inServiceWindow(candidate)) {
      const result = buttons?.length
        ? await sendBotButtons(phone, text, buttons, { kind })
        : await sendBotText(phone, text, { kind });
      return { delivered: true, via: "session", result };
    }

    if (template?.name) {
      const result = await sendMetaWhatsAppTemplate(phone, template.name, undefined, {
        languageCode: template.languageCode || "en",
        bodyParams: template.bodyParams || [],
        quickReplyPayloads: template.quickReplyPayloads || [],
      });
      await appendBotMessage(normalize(phone), template.historyText || text, { kind });
      return { delivered: true, via: "template", result };
    }

    return { delivered: false, reason: "outside_24h_no_template" };
  } catch (error) {
    console.error("sendProactive failed", kind, phone, error.message);
    return { delivered: false, reason: "send_failed", error: error.message.slice(0, 300) };
  }
}
