import process from "node:process";
import { resolvePhoneNumberId } from "./metaConfig.js";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v22.0";

function graphUrl(path) {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${path}`;
}

export function extractMetaInboundMessages(body) {
  if (!body || body.object !== "whatsapp_business_account") return { inbound: [], statuses: [] };

  const inbound = [];
  const statuses = [];

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};

      for (const status of value.statuses || []) {
        statuses.push({
          id: status.id,
          status: status.status,
          recipient: status.recipient_id,
          errors: status.errors || [],
        });
      }

      const contactNames = Object.fromEntries(
        (value.contacts || [])
          .map((contact) => [String(contact.wa_id || "").replace(/\D/g, ""), contact.profile?.name || ""])
          .filter(([id]) => id)
      );
      const fallbackContactName = value.contacts?.[0]?.profile?.name || "";
      const phoneNumberId = value.metadata?.phone_number_id || "";

      for (const message of value.messages || []) {
        const type = message.type || "";
        let text = "";
        let buttonId = "";
        let media = null;

        if (type === "document" || type === "image") {
          const file = message[type] || {};
          media = {
            kind: type,
            id: file.id || "",
            mimeType: file.mime_type || "",
            fileName: file.filename || "",
          };
          text = file.caption || "";
        } else if (type === "text") {
          text = message.text?.body || "";
        } else if (type === "button") {
          text = message.button?.text || message.button?.payload || "";
          buttonId = message.button?.payload || "";
        } else if (type === "interactive") {
          const reply = message.interactive?.button_reply || message.interactive?.list_reply;
          text = reply?.title || "";
          buttonId = reply?.id || "";
        } else if (type === "reaction") {
          const from = String(message.from || "").replace(/\D/g, "");
          inbound.push({
            phone: from,
            name: contactNames[from] || fallbackContactName,
            text: "",
            buttonId: "",
            media: null,
            type,
            reaction: message.reaction || null,
            id: message.id || "",
            phoneNumberId,
            wabaId: entry.id || "",
            unsupported: false,
            ignore: true,
          });
          continue;
        }

        const from = String(message.from || "").replace(/\D/g, "");
        inbound.push({
          phone: from,
          name: contactNames[from] || fallbackContactName,
          text: text.trim(),
          buttonId,
          media,
          type,
          reaction: null,
          id: message.id || "",
          phoneNumberId,
          wabaId: entry.id || "",
          unsupported: !text.trim() && !media?.id,
          ignore: false,
        });
      }
    }
  }

  return { inbound, statuses };
}

async function postMessage(phoneNumberId, payload, { label = "send", timeoutMs } = {}) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN is missing");
  const fromId = await resolvePhoneNumberId(phoneNumberId);
  if (!fromId) throw new Error("META_PHONE_NUMBER_ID is missing");

  const response = await fetch(graphUrl(`${fromId}/messages`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Meta ${label} failed: ${response.status} ${raw}`);
  }
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** Media in webhooks is only an id; Graph returns a short-lived URL that also needs the token. */
export async function downloadMetaMedia(mediaId, { maxBytes } = {}) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN is missing");
  const headers = { Authorization: `Bearer ${token}` };

  const metaResponse = await fetch(graphUrl(mediaId), { headers });
  if (!metaResponse.ok) {
    throw new Error(`Meta media lookup failed: ${metaResponse.status} ${(await metaResponse.text()).slice(0, 300)}`);
  }
  const info = await metaResponse.json();
  if (maxBytes && Number(info.file_size) > maxBytes) {
    return { tooLarge: true, size: Number(info.file_size), mimeType: info.mime_type || "" };
  }

  const fileResponse = await fetch(info.url, { headers });
  if (!fileResponse.ok) throw new Error(`Meta media download failed: ${fileResponse.status}`);
  const buffer = Buffer.from(await fileResponse.arrayBuffer());
  if (maxBytes && buffer.length > maxBytes) {
    return { tooLarge: true, size: buffer.length, mimeType: info.mime_type || "" };
  }
  return { buffer, mimeType: info.mime_type || "" };
}

function to(destination) {
  return String(destination).replace(/\D/g, "");
}

export async function sendMetaReadReceipt(messageId, phoneNumberId) {
  if (!process.env.META_ACCESS_TOKEN || !messageId) return;
  try {
    await postMessage(phoneNumberId, { status: "read", message_id: messageId }, { label: "read receipt", timeoutMs: 1500 });
  } catch (error) {
    console.error("meta read receipt failed", error.message);
  }
}

export async function sendMetaWhatsAppText(destination, text, phoneNumberId) {
  return postMessage(phoneNumberId, {
    recipient_type: "individual",
    to: to(destination),
    type: "text",
    text: { body: text },
  });
}

/** Up to 3 quick-reply buttons; the tapped button's id comes back as message.buttonId. */
export async function sendMetaWhatsAppButtons(destination, bodyText, buttons, phoneNumberId) {
  return postMessage(
    phoneNumberId,
    {
      recipient_type: "individual",
      to: to(destination),
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText.slice(0, 1024) },
        action: {
          buttons: buttons.slice(0, 3).map((b) => ({
            type: "reply",
            reply: { id: b.id.slice(0, 256), title: b.title.slice(0, 20) },
          })),
        },
      },
    },
    { label: "buttons send" }
  );
}

export async function sendMetaWhatsAppInteractiveCta({
  destination,
  phoneNumberId,
  bodyText,
  buttonLabel,
  buttonUrl,
  headerText,
}) {
  const interactive = {
    type: "cta_url",
    body: { text: bodyText.slice(0, 1024) },
    action: {
      name: "cta_url",
      parameters: {
        display_text: buttonLabel.slice(0, 20),
        url: buttonUrl,
      },
    },
  };

  if (headerText) {
    interactive.header = { type: "text", text: headerText.slice(0, 60) };
  }

  return postMessage(
    phoneNumberId,
    { recipient_type: "individual", to: to(destination), type: "interactive", interactive },
    { label: "interactive send" }
  );
}

/**
 * Sends an approved WhatsApp template.
 * buttonUrlSuffix fills a dynamic URL button (e.g. https://openworldx.com/upload-resume?{{1}}).
 * quickReplyPayloads set the payload of each quick-reply button, in template order.
 */
export async function sendMetaWhatsAppTemplate(
  destination,
  templateName,
  phoneNumberId,
  { languageCode = "en", bodyParams = [], buttonUrlSuffix = "", quickReplyPayloads = [] } = {}
) {
  const components = [];
  if (bodyParams.length) {
    components.push({
      type: "body",
      parameters: bodyParams.map((text) => ({ type: "text", text: String(text).slice(0, 256) })),
    });
  }
  if (buttonUrlSuffix) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: String(buttonUrlSuffix).slice(0, 128) }],
    });
  }
  quickReplyPayloads.forEach((payload, index) => {
    components.push({
      type: "button",
      sub_type: "quick_reply",
      index: String(index),
      parameters: [{ type: "payload", payload: String(payload).slice(0, 256) }],
    });
  });

  return postMessage(
    phoneNumberId,
    {
      to: to(destination),
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components.length ? { components } : {}),
      },
    },
    { label: "template send" }
  );
}
