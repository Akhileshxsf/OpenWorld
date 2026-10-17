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
    `Step 1: Upload your resume (PDF) using the link below.\n` +
    `Step 2: Chat with me here so I understand your skills, goals, and what roles you want.\n\n` +
    `Then I'll suggest jobs that actually fit you.`
  );
}

/** Welcome with plain-text upload link (no button). Template used when META_RESUME_TEMPLATE_NAME is set. */
export async function sendMetaResumeWelcome(phone, name, phoneNumberId) {
  const uploadUrl = buildResumeUploadUrl(phone);
  const templateName = process.env.META_RESUME_TEMPLATE_NAME;

  if (templateName) {
    try {
      return await sendMetaWhatsAppTemplate(phone, templateName, phoneNumberId, {
        bodyParams: [name?.split(" ")[0] || "there"],
        buttonUrlSuffix: uploadQuery(phone),
      });
    } catch (error) {
      console.warn("Meta template welcome failed, falling back to text:", error.message);
    }
  }

  const text = `${welcomeBodyText(name)}\n\nUpload here:\n${uploadUrl}`;
  return sendMetaWhatsAppText(phone, text, phoneNumberId);
}
