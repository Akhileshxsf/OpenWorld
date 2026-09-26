import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({
  region: "asia-south1",
  maxInstances: 10,
});

function parseRequestBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body) && Object.keys(req.body).length) {
    return req.body;
  }

  const raw = req.rawBody?.toString("utf8") || "";
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    // Gupshup sometimes sends form-encoded JSON
  }

  try {
    const params = Object.fromEntries(new URLSearchParams(raw));
    if (params.payload) {
      try {
        params.payload = JSON.parse(params.payload);
      } catch {
        // keep string payload
      }
    }
    return params;
  } catch {
    return { raw };
  }
}

export const whatsappWebhook = onRequest(
  {
    cors: true,
    invoker: "public",
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (req, res) => {
    if (req.method === "GET") {
      res.status(200).send("OpenWorld WhatsApp webhook is live");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    try {
      const body = parseRequestBody(req);
      console.log("webhook hit", {
        contentType: req.get("content-type") || "",
        hasApiKey: Boolean(process.env.GUPSHUP_API_KEY),
        source: process.env.GUPSHUP_SOURCE || "",
        type: body.type || body.eventType || "unknown",
        keys: Object.keys(body),
      });
      const { handleGupshupWebhook } = await import("./handleWebhook.js");
      const result = await handleGupshupWebhook(body);
      console.log("webhook result", result);
      res.status(200).send();
    } catch (error) {
      console.error("WhatsApp webhook failed", error);
      res.status(200).send();
    }
  }
);

export const metaWhatsappWebhook = onRequest(
  {
    cors: true,
    invoker: "public",
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (req, res) => {
    if (req.method === "GET") {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token && token === process.env.META_VERIFY_TOKEN && challenge) {
        res.status(200).send(challenge);
        return;
      }

      res.status(403).send("Forbidden");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    try {
      const body = parseRequestBody(req);
      console.log("meta webhook hit", {
        object: body.object || "",
        hasAccessToken: Boolean(process.env.META_ACCESS_TOKEN),
        phoneNumberId: process.env.META_PHONE_NUMBER_ID || "",
        entries: Array.isArray(body.entry) ? body.entry.length : 0,
      });
      const { handleMetaWebhook } = await import("./handleMetaWebhook.js");
      const result = await handleMetaWebhook(body);
      console.log("meta webhook result", result);
      res.status(200).send();
    } catch (error) {
      console.error("Meta WhatsApp webhook failed", error);
      res.status(200).send();
    }
  }
);
