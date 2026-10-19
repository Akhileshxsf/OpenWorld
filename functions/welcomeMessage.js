import { sendMetaWhatsAppTemplate, sendMetaWhatsAppText } from "./meta.js";
import { signUploadToken } from "./uploadToken.js";

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

export function welcomeBodyText(name) {
  const hi = name ? `Hi ${name.split(" ")[0]}! ` : "Hi! ";
  return (
    `${hi}I'm Mira on OpenWorldX — I help you find jobs that fit you.\n\n` +
    `Step 1: Send me your resume as a PDF right here in this chat 📄\n` +
    `Step 2: Chat with me so I understand your skills, goals, and what roles you want.\n\n` +
    `Then I'll suggest jobs that actually fit you.`
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

async function sendWelcomeTemplate(phone, templateName, name, phoneNumberId) {
  const options = {
    languageCode: process.env.META_RESUME_TEMPLATE_LANG || "en",
    bodyParams: [name?.split(" ")[0] || "there"],
  };
  try {
    // The template's button URL is https://openworldx.com/upload-resume{{1}}, so the suffix carries the "?".
    return await sendMetaWhatsAppTemplate(phone, templateName, phoneNumberId, {
      ...options,
      buttonUrlSuffix: `?${uploadQuery(phone)}`,
    });
  } catch (error) {
    // Templates without a dynamic URL button reject the button parameter.
    if (!/button|parameter/i.test(error.message)) throw error;
    return sendMetaWhatsAppTemplate(phone, templateName, phoneNumberId, options);
  }
}

/**
 * Sends the approved welcome template (META_RESUME_TEMPLATE_NAME), plus a "send the PDF here" hint
 * while that template still points at the upload button. Falls back to plain text. Returns the text to store.
 */
export async function sendMetaResumeWelcome(phone, name, phoneNumberId) {
  const templateName = process.env.META_RESUME_TEMPLATE_NAME;

  if (templateName) {
    try {
      await sendWelcomeTemplate(phone, templateName, name, phoneNumberId);
      let history = templateHistoryText(templateName, name);
      if (process.env.META_WELCOME_CHAT_HINT === "true") {
        await sendMetaWhatsAppText(phone, CHAT_HINT, phoneNumberId);
        history += `\n${CHAT_HINT}`;
      }
      return history;
    } catch (error) {
      console.warn("Meta template welcome failed, falling back to text:", error.message);
    }
  }

  const text = welcomeBodyText(name);
  await sendMetaWhatsAppText(phone, text, phoneNumberId);
  return text;
}
