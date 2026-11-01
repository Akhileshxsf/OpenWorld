import { sendMetaWhatsAppText } from "./meta.js";
import { signUploadToken } from "./uploadToken.js";
import { inServiceWindow, sendBotText, sendProactive } from "./outbound.js";

function uploadQuery(phone) {
  const normalized = String(phone || "").replace(/\D/g, "");
  return new URLSearchParams({ phone: normalized, t: signUploadToken(normalized) }).toString();
}

export function buildResumeUploadUrl(phone) {
  const base =
    process.env.RESUME_UPLOAD_BASE_URL ||
    process.env.PUBLIC_APP_URL ||
    "https://openworldx.com";
  const url = new URL("/upload-resume", base.replace(/\/$/, ""));
  if (String(phone || "").replace(/\D/g, "")) url.search = uploadQuery(phone);
  return url.toString();
}

export function welcomeBodyText(name, phone) {
  const hi = name ? `Hi ${name.split(" ")[0]}! ` : "Hi! ";
  const uploadLine = phone
    ? `\n\nUpload your resume (PDF) here if you prefer the website:\n${buildResumeUploadUrl(phone)}`
    : "";
  return (
    `${hi}I'm Mira on OpenWorldX — I help you find jobs that fit you.\n\n` +
    `Step 1: Send me your resume as a PDF right here in this chat 📄\n` +
    `Step 2: Chat with me so I understand your skills, goals, and what roles you want.\n\n` +
    `Then I'll suggest jobs that actually fit you.${uploadLine}`
  );
}

const CHAT_HINT = "Or just send your resume PDF right here in this chat 📄";

/** What the user saw, for chat history. The original template's body is known; others are summarized. */
function templateHistoryText(templateName, name) {
  if (templateName === "openworldx_mira_start") {
    return (
      `Hi ${name?.split(" ")[0] || "there"}, I'm Mira. I help you find jobs that fit you. ` +
      `Step 1: Upload your resume (PDF) using the button below. ` +
      `Step 2: Chat with me here so I understand your skills and goals. ` +
      `Then I'll suggest the right jobs for you.\n[Upload Resume]`
    );
  }
  return `[Welcome message: introduced Mira and asked them to send their resume PDF in this chat]`;
}

function welcomeTemplate(name, phone) {
  const templateName = process.env.META_RESUME_TEMPLATE_NAME;
  if (!templateName) return null;
  return {
    name: templateName,
    languageCode: process.env.META_RESUME_TEMPLATE_LANG || "en",
    bodyParams: [name?.split(" ")[0] || "there"],
    buttonUrlSuffix: `?${uploadQuery(phone)}`,
    historyText: templateHistoryText(templateName, name),
  };
}

/**
 * Welcome after a user's first message: session text inside the 24h window (same as reach-out when_required),
 * approved template only when the window is closed. Template sends use shared backoff retries.
 */
export async function sendMetaResumeWelcome(phone, name, phoneNumberId, candidate = {}) {
  const template = welcomeTemplate(name, phone);
  const text = welcomeBodyText(name, phone);
  const inWindow = inServiceWindow(candidate);

  const delivery = await sendProactive(phone, candidate, {
    kind: "welcome",
    text,
    template,
    useTemplate: "when_required",
    phoneNumberId,
  });

  console.log("[welcome] whatsapp send", {
    phone,
    inServiceWindow: inWindow,
    delivered: delivery.delivered,
    via: delivery.via || null,
    reason: delivery.reason || null,
    messageId: delivery.result?.messages?.[0]?.id || null,
  });

  if (delivery.delivered) {
    let history = template && delivery.via === "template" ? template.historyText : text;
    if (process.env.META_WELCOME_CHAT_HINT === "true" && delivery.via === "template") {
      await sendBotText(phone, CHAT_HINT, { phoneNumberId, kind: "welcome_hint" });
      history += `\n${CHAT_HINT}`;
    }
    return history;
  }

  console.warn("[welcome] sendProactive failed, plain text fallback", delivery.reason || delivery.error);
  try {
    await sendMetaWhatsAppText(phone, text, phoneNumberId);
    return text;
  } catch (error) {
    console.error("[welcome] text fallback failed", error.message);
    throw error;
  }
}
