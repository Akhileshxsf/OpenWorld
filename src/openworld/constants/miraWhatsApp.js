/** Prefilled text when someone opens Mira on WhatsApp from the site or ice breakers. */
export const MIRA_WHATSAPP_STARTER_MESSAGE = "Hi Mira, find me a job";

export function miraWhatsAppHref(phone = import.meta.env.VITE_WHATSAPP_NUMBER || "919877174681") {
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  const text = encodeURIComponent(MIRA_WHATSAPP_STARTER_MESSAGE);
  return `https://wa.me/${digits}?text=${text}`;
}