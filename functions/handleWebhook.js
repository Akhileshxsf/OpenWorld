import { extractInboundMessage, normalizeGupshupBody, sendReadReceipt, sendWhatsAppText } from "./gupshup.js";
import { generateMiraReply } from "./mira.js";
import { loadChat, saveChat } from "./chatStore.js";

export async function handleGupshupWebhook(rawBody) {
  const events = Array.isArray(rawBody) ? rawBody : [rawBody];
  const results = [];

  for (const item of events) {
    const event = normalizeGupshupBody(item);
    if (event.type === "message-event") {
      console.log("message-event", {
        status: event.payload?.type,
        destination: event.payload?.destination,
        code: event.payload?.payload?.code,
        reason: event.payload?.payload?.reason,
        id: event.payload?.id,
      });
    }

    const inbound = extractInboundMessage(event);

    if (!inbound) {
      results.push({ ignored: true, type: event.type || "unknown" });
      continue;
    }

    console.log("inbound message", {
      phone: inbound.phone,
      type: inbound.type,
      id: inbound.id,
      unsupported: inbound.unsupported,
      textPreview: inbound.text.slice(0, 80),
    });

    const readReceipt = sendReadReceipt(inbound.id);
    const reply = inbound.unsupported
      ? "I can read text on WhatsApp for now. Send me a short message and I'll help you connect with people on OpenWorld."
      : await generateMiraReply(
          inbound.text,
          await loadChat(inbound.phone),
          inbound.name
        );
    await readReceipt;

    const sendResult = await sendWhatsAppText(inbound.phone, reply);
    console.log("gupshup send result", sendResult);

    if (!inbound.unsupported) {
      await saveChat(inbound.phone, inbound.name, inbound.text, reply);
    }

    results.push({ ok: true, phone: inbound.phone, sendResult });
  }

  return results.length === 1 ? results[0] : results;
}
