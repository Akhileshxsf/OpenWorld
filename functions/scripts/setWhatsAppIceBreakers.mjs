/**
 * Set WhatsApp chat ice breakers (tappable prompts when a user opens Mira for the first time).
 * Usage: node scripts/setWhatsAppIceBreakers.mjs
 */
import dotenv from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env") });

const STARTER = "Hi Mira, find me a job";
const v = process.env.META_GRAPH_VERSION || "v22.0";
const phoneId = process.env.META_PHONE_NUMBER_ID;
const token = process.env.META_ACCESS_TOKEN;

const body = {
  enable_welcome_message: false,
  prompts: [STARTER, "I want to upload my resume", "What can you help me with?"],
};

const res = await fetch(`https://graph.facebook.com/${v}/${phoneId}/conversational_automation`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

console.log(res.status, await res.text());