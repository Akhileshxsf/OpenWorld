import process from "node:process";

const SEND_URL = "https://api.gupshup.io/wa/api/v1/msg";

export function normalizeGupshupBody(body) {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  const next = { ...body };
  if (typeof next.payload === "string") {
    try {
      next.payload = JSON.parse(next.payload);
    } catch {
      // keep original payload string
    }
  }
  return next;
}

export function extractInboundMessage(event) {
  if (!event || event.type === "message-event" || event.type === "billing-event" || event.type === "account-event" || event.type === "user-event" || event.type === "template-event") {
    return null;
  }

  const payload = event.payload || event;
  const phone =
    payload.source ||
    payload.sender?.phone ||
    payload.from ||
    event.source ||
    event.from;
  if (!phone) return null;

  const type = payload.type || event.messageType || "";
  const inner = payload.payload || payload;
  let text = "";

  if (type === "text" || type === "txt" || type === "message" || !type) {
    text = inner.text || payload.text || event.text || "";
  } else if (type === "button_reply") {
    text = inner.title || inner.postbackText || inner.text || "";
  } else if (type === "list_reply") {
    text = inner.title || inner.postbackText || "";
  } else if (event.type && event.type !== "message") {
    return null;
  } else {
    return {
      phone,
      name: payload.sender?.name || "",
      text: "",
      type,
      id: payload.id || event.id || "",
      unsupported: true,
    };
  }

  if (!text.trim()) return null;

  return {
    phone,
    name: payload.sender?.name || "",
    text: text.trim(),
    type,
    id: payload.id || event.id || inner.id || "",
    unsupported: false,
  };
}

export async function sendReadReceipt(messageId) {
  const apiKey = process.env.GUPSHUP_API_KEY;
  const appId = process.env.GUPSHUP_APP_ID;
  if (!apiKey || !appId || !messageId) return;

  try {
    const response = await fetch(
      `https://api.gupshup.io/wa/app/${appId}/msg/${encodeURIComponent(messageId)}/read`,
      {
        method: "PUT",
        headers: {
          apikey: apiKey,
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
        }),
        signal: AbortSignal.timeout(1500),
      }
    );

    const text = await response.text();
    console.log("read receipt result", {
      status: response.status,
      text: text.slice(0, 240),
    });
  } catch (error) {
    console.error("read receipt failed", error);
  }
}

const META_TYPING_BODY = (messageId) => ({
  messaging_product: "whatsapp",
  status: "read",
  message_id: messageId,
  typing_indicator: { type: "text" },
});

async function postJson(url, apiKey, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: apiKey,
      Authorization: apiKey,
      token: apiKey,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, ok: response.ok || response.status === 202, text: text.slice(0, 240) };
}

export async function sendTypingIndicator(messageId, destination = "") {
  const apiKey = process.env.GUPSHUP_API_KEY;
  const appId = process.env.GUPSHUP_APP_ID;
  if (!apiKey || !appId || !messageId) return;

  const attempts = [
    () => postJson(`https://api.gupshup.io/wa/app/${appId}/v3/message`, apiKey, META_TYPING_BODY(messageId)),
    () => postJson("https://api.gupshup.io/wa/api/v1/msg", apiKey, {
      channel: "whatsapp",
      source: process.env.GUPSHUP_SOURCE,
      destination: String(destination).replace(/\D/g, ""),
      "src.name": process.env.GUPSHUP_APP_NAME || "OpenworldX",
      message: JSON.stringify({
        type: "typing",
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
        typing_indicator: { type: "text" },
      }),
    }),
    async () => {
      const response = await fetch(
        `https://api.gupshup.io/wa/app/${appId}/msg/${encodeURIComponent(messageId)}/read`,
        {
          method: "PUT",
          headers: {
            apikey: apiKey,
            Authorization: apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(META_TYPING_BODY(messageId)),
        }
      );
      const text = await response.text();
      return { status: response.status, ok: response.ok || response.status === 202, text: text.slice(0, 240) };
    },
  ];

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      console.log("typing attempt", result);
      if (result.ok && !/error|invalid|not found|unauthor/i.test(result.text || "")) {
        return;
      }
    } catch (error) {
      console.error("typing attempt failed", error);
    }
  }
}

export async function sendWhatsAppText(destination, text) {
  const apiKey = process.env.GUPSHUP_API_KEY;
  const source = process.env.GUPSHUP_SOURCE;
  const appName = process.env.GUPSHUP_APP_NAME || "OpenworldX";

  if (!apiKey) throw new Error("GUPSHUP_API_KEY is missing");
  if (!source) throw new Error("GUPSHUP_SOURCE is missing");

  const params = new URLSearchParams();
  params.set("channel", "whatsapp");
  params.set("source", source.replace(/\D/g, ""));
  params.set("destination", String(destination).replace(/\D/g, ""));
  params.set("src.name", appName);
  params.set("message", JSON.stringify({ type: "text", text }));

  const response = await fetch(SEND_URL, {
    method: "POST",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: params,
  });

  const raw = await response.text();
  let data = raw;
  try {
    data = JSON.parse(raw);
  } catch {
    // Gupshup sometimes returns text
  }

  if (!response.ok) {
    throw new Error(`Gupshup send failed: ${response.status} ${raw}`);
  }

  return data;
}
