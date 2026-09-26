import { extractMetaInboundMessages, sendMetaReadReceipt, sendMetaWhatsAppText } from "./meta.js";
import { generateMiraReply } from "./mira.js";
import { loadChat, saveChat } from "./chatStore.js";

export async function handleMetaWebhook(rawBody) {
  const { inbound, statuses } = extractMetaInboundMessages(rawBody);

  for (const status of statuses) {
    console.log("meta message status", {
      id: status.id,
      status: status.status,
      recipient: status.recipient,
      errors: status.errors.map((error) => ({
        code: error.code,
        title: error.title,
        message: error.message,
      })),
    });
  }

  if (!inbound.length) {
    return { ignored: true, type: statuses.length ? "status" : "unknown" };
  }

  const results = [];

  for (const message of inbound) {
    console.log("meta inbound message", {
      phone: message.phone,
      type: message.type,
      id: message.id,
      unsupported: message.unsupported,
      textPreview: message.text.slice(0, 80),
    });

    const readReceipt = sendMetaReadReceipt(message.id, message.phoneNumberId);
    const reply = message.unsupported
      ? "I can read text on WhatsApp for now. Send me a short message and I'll help you connect with people on OpenWorld."
      : await generateMiraReply(message.text, await loadChat(message.phone), message.name);
    await readReceipt;

    const sendResult = await sendMetaWhatsAppText(message.phone, reply, message.phoneNumberId);
    console.log("meta send result", sendResult);

    if (!message.unsupported) {
      await saveChat(message.phone, message.name, message.text, reply);
    }

    results.push({ ok: true, phone: message.phone, sendResult });
  }

  return results.length === 1 ? results[0] : results;
}
