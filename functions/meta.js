import process from "node:process";

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

      const contactName = value.contacts?.[0]?.profile?.name || "";
      const phoneNumberId = value.metadata?.phone_number_id || process.env.META_PHONE_NUMBER_ID || "";

      for (const message of value.messages || []) {
        const type = message.type || "";
        let text = "";

        if (type === "text") {
          text = message.text?.body || "";
        } else if (type === "button") {
          text = message.button?.text || message.button?.payload || "";
        } else if (type === "interactive") {
          text =
            message.interactive?.button_reply?.title ||
            message.interactive?.list_reply?.title ||
            "";
        }

        inbound.push({
          phone: String(message.from || "").replace(/\D/g, ""),
          name: contactName,
          text: text.trim(),
          type,
          id: message.id || "",
          phoneNumberId,
          unsupported: !text.trim(),
        });
      }
    }
  }

  return { inbound, statuses };
}

export async function sendMetaReadReceipt(messageId, phoneNumberId = process.env.META_PHONE_NUMBER_ID) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token || !phoneNumberId || !messageId) return;

  try {
    const response = await fetch(graphUrl(`${phoneNumberId}/messages`), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
      signal: AbortSignal.timeout(1500),
    });
    const text = await response.text();
    console.log("meta read receipt", { status: response.status, text: text.slice(0, 240) });
  } catch (error) {
    console.error("meta read receipt failed", error);
  }
}

export async function sendMetaWhatsAppText(destination, text, phoneNumberId = process.env.META_PHONE_NUMBER_ID) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN is missing");
  if (!phoneNumberId) throw new Error("META_PHONE_NUMBER_ID is missing");

  const response = await fetch(graphUrl(`${phoneNumberId}/messages`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: String(destination).replace(/\D/g, ""),
      type: "text",
      text: { body: text },
    }),
  });

  const raw = await response.text();
  let data = raw;
  try {
    data = JSON.parse(raw);
  } catch {
    // Meta sometimes returns text
  }

  if (!response.ok) {
    throw new Error(`Meta send failed: ${response.status} ${raw}`);
  }

  return data;
}

export async function sendMetaWhatsAppInteractiveCta({
  destination,
  phoneNumberId = process.env.META_PHONE_NUMBER_ID,
  bodyText,
  buttonLabel,
  buttonUrl,
  headerText,
}) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN is missing");
  if (!phoneNumberId) throw new Error("META_PHONE_NUMBER_ID is missing");

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

  const response = await fetch(graphUrl(`${phoneNumberId}/messages`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: String(destination).replace(/\D/g, ""),
      type: "interactive",
      interactive,
    }),
  });

  const raw = await response.text();
  let data = raw;
  try {
    data = JSON.parse(raw);
  } catch {
    // keep raw
  }

  if (!response.ok) {
    throw new Error(`Meta interactive send failed: ${response.status} ${raw}`);
  }

  return data;
}

/**
 * Sends an approved WhatsApp template. URL button suffix is appended to the URL defined in the template.
 * Create template in Meta Business Manager with a dynamic URL button, e.g.
 * https://openworldx.com/upload-resume?{{1}}
 */
export async function sendMetaWhatsAppTemplate(
  destination,
  templateName,
  phoneNumberId = process.env.META_PHONE_NUMBER_ID,
  { languageCode = "en", bodyParams = [], buttonUrlSuffix = "" } = {}
) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN is missing");
  if (!phoneNumberId) throw new Error("META_PHONE_NUMBER_ID is missing");

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

  const response = await fetch(graphUrl(`${phoneNumberId}/messages`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: String(destination).replace(/\D/g, ""),
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components.length ? { components } : {}),
      },
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Meta template send failed: ${response.status} ${raw}`);
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
