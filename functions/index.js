import { createHmac, timingSafeEqual } from "node:crypto";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
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

/** Meta signs webhook bodies with the app secret; without META_APP_SECRET the check is skipped. */
function hasValidMetaSignature(req) {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return true;
  const header = String(req.get("x-hub-signature-256") || "");
  const expected = `sha256=${createHmac("sha256", secret).update(req.rawBody || Buffer.alloc(0)).digest("hex")}`;
  return header.length === expected.length && timingSafeEqual(Buffer.from(header), Buffer.from(expected));
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
    timeoutSeconds: 120,
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

    if (!hasValidMetaSignature(req)) {
      console.warn("meta webhook rejected: bad signature");
      res.status(401).send("Invalid signature");
      return;
    }

    try {
      const body = parseRequestBody(req);
      console.log("meta webhook hit", {
        object: body.object || "",
        hasAccessToken: Boolean(process.env.META_ACCESS_TOKEN),
        phoneNumberId: body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id || "",
        wabaId: body.entry?.[0]?.id || "",
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

export const hireApi = onRequest(
  {
    cors: true,
    invoker: "public",
    timeoutSeconds: 120,
    memory: "512MiB",
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const body = parseRequestBody(req);
      const { handleHireMatch, handleGetJob, handleReachOut } = await import("./hireMatch.js");
      const action = req.path.split("/").filter(Boolean).pop();
      const ip = String(req.get("x-forwarded-for") || req.ip || "").split(",")[0].trim();
      const result =
        action === "job"
          ? await handleGetJob(body)
          : action === "reach-out" || action === "intro"
            ? await handleReachOut(body)
            : await handleHireMatch(body, { ip, userAgent: req.get("user-agent") || "" });
      res.status(200).json(result);
    } catch (error) {
      console.error("hireApi failed", req.path, error);
      res.status(400).json({ error: error.message || "Something went wrong" });
    }
  }
);

export const whatsappResumeUpload = onRequest(
  {
    cors: true,
    invoker: "public",
    timeoutSeconds: 120,
    memory: "512MiB",
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const body = parseRequestBody(req);
      const { handleWhatsAppResumeUpload } = await import("./uploadResume.js");
      const result = await handleWhatsAppResumeUpload(body);
      res.status(200).json(result);
    } catch (error) {
      console.error("whatsappResumeUpload failed", error);
      res.status(400).json({ error: error.message || "Upload failed" });
    }
  }
);

export const dailyCandidateJobs = onSchedule(
  {
    schedule: "0 8-22/2 * * *",
    timeZone: "Asia/Kolkata",
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async () => {
    const { runDailyCandidateJobs } = await import("./scheduled.js");
    const result = await runDailyCandidateJobs();
    console.log("daily candidate jobs", result);
  }
);
