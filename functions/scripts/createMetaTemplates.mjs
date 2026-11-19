/**
 * Create WhatsApp message templates on your WABA via Graph API.
 *
 * Usage:
 *   node scripts/createMetaTemplates.mjs              # create default UTILITY batch (u1)
 *   node scripts/createMetaTemplates.mjs --list       # list openworldx templates + category
 *   node scripts/createMetaTemplates.mjs --dry-run    # print payloads only
 */
import dotenv from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env") });

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v22.0";
const WABA_ID = process.env.META_WABA_ID;
const TOKEN = process.env.META_ACCESS_TOKEN;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const listOnly = args.has("--list");

/** Utility-oriented copy (Meta may still reclassify — appeal as “recruiter request notification”). */
export const UTILITY_TEMPLATE_BATCH = [
  {
    name: "openworldx_recruiter_request_u1",
    category: "UTILITY",
    language: "en",
    parameter_format: "POSITIONAL",
    components: [
      {
        type: "BODY",
        text:
          "Hi {{1}}, OpenWorldX received a recruiter request for you: {{2}} at {{3}}.\n\n" +
          "Please confirm below if you want to proceed. If yes, we will ask their screening questions and send your answers to the recruiter.",
        example: { body_text: [["Rahul", "Backend Developer", "Acme Corp"]] },
      },
      { type: "FOOTER", text: "OpenWorldX" },
      {
        type: "BUTTONS",
        buttons: [
          { type: "QUICK_REPLY", text: "Yes, proceed" },
          { type: "QUICK_REPLY", text: "No thanks" },
        ],
      },
    ],
    /** Same body vars as openworldx_recruiter_interest → drop-in for META_MATCH_TEMPLATE_NAME */
    envHint: "META_MATCH_TEMPLATE_NAME",
  },
  {
    name: "openworldx_profile_setup_u1",
    category: "UTILITY",
    language: "en",
    parameter_format: "POSITIONAL",
    components: [
      {
        type: "BODY",
        text:
          "Hi {{1}}, your OpenWorldX job profile setup is ready.\n\n" +
          "Send your resume as a PDF in this chat, or use the button below to upload. " +
          "This helps us match you with recruiter requests on OpenWorldX.",
        example: { body_text: [["Rahul"]] },
      },
      { type: "FOOTER", text: "OpenWorldX" },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "URL",
            text: "Upload resume",
            url: "https://openworldx.com/upload-resume{{1}}",
            example: ["https://openworldx.com/upload-resume?phone=919618069125&t=example"],
          },
        ],
      },
    ],
    envHint: "META_RESUME_TEMPLATE_NAME",
  },
  {
    name: "openworldx_recruiter_followup_u1",
    category: "UTILITY",
    language: "en",
    parameter_format: "POSITIONAL",
    components: [
      {
        type: "BODY",
        text:
          "Hi {{1}}, status update on your OpenWorldX introduction: has {{2}} contacted you about the {{3}} role yet?",
        example: { body_text: [["Rahul", "Acme Corp", "Backend Developer"]] },
      },
      { type: "FOOTER", text: "OpenWorldX" },
      {
        type: "BUTTONS",
        buttons: [
          { type: "QUICK_REPLY", text: "Yes, in touch" },
          { type: "QUICK_REPLY", text: "Not yet" },
        ],
      },
    ],
    envHint: "META_FOLLOWUP_TEMPLATE_NAME (optional)",
  },
  {
    name: "openworldx_job_status_u1",
    category: "UTILITY",
    language: "en",
    parameter_format: "POSITIONAL",
    components: [
      {
        type: "BODY",
        text:
          "Hi {{1}}, update your job search preferences on OpenWorldX: are you still open to new roles? " +
          "Your answer controls whether we send you recruiter requests.",
        example: { body_text: [["Rahul"]] },
      },
      { type: "FOOTER", text: "OpenWorldX" },
      {
        type: "BUTTONS",
        buttons: [
          { type: "QUICK_REPLY", text: "Still looking" },
          { type: "QUICK_REPLY", text: "Not right now" },
        ],
      },
    ],
    envHint: "META_CHECKIN_TEMPLATE_NAME (optional)",
  },
  {
    name: "openworldx_screening_continue_u1",
    category: "UTILITY",
    language: "en",
    parameter_format: "POSITIONAL",
    components: [
      {
        type: "BODY",
        text:
          "Hi {{1}}, your screening answers for {{2}} ({{3}} role) are incomplete. " +
          "Tap below to continue when you are ready.",
        example: { body_text: [["Rahul", "Acme Corp", "Backend Developer"]] },
      },
      { type: "FOOTER", text: "OpenWorldX" },
      {
        type: "BUTTONS",
        buttons: [{ type: "QUICK_REPLY", text: "Continue" }],
      },
    ],
    envHint: "META_QUESTIONS_REMINDER_TEMPLATE_NAME (optional)",
  },
];

async function graph(path, { method = "GET", body } = {}) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.error?.message || res.statusText);
    err.response = json;
    err.status = res.status;
    throw err;
  }
  return json;
}

async function listTemplates() {
  const data = await graph(
    `${WABA_ID}/message_templates?fields=name,status,category,language&limit=100`
  );
  const rows = (data.data || [])
    .filter((t) => String(t.name || "").startsWith("openworldx"))
    .sort((a, b) => a.name.localeCompare(b.name));
  console.log(JSON.stringify(rows, null, 2));
}

async function createTemplate(spec) {
  const payload = {
    name: spec.name,
    category: spec.category,
    language: spec.language,
    parameter_format: spec.parameter_format,
    components: spec.components,
  };
  if (dryRun) {
    console.log("\n--- dry-run ---\n", JSON.stringify(payload, null, 2));
    return { dryRun: true, name: spec.name };
  }
  try {
    const result = await graph(`${WABA_ID}/message_templates`, { method: "POST", body: payload });
    console.log("created", spec.name, result);
    return result;
  } catch (error) {
    const sub = error.response?.error?.error_subcode;
    const msg = error.response?.error?.message || error.message;
    if (msg.includes("already exists") || sub === 2388024) {
      console.warn("skip (exists)", spec.name);
      return { skipped: true, name: spec.name };
    }
    console.error("failed", spec.name, msg, JSON.stringify(error.response?.error || {}));
    return { failed: true, name: spec.name, error: msg };
  }
}

async function main() {
  if (!TOKEN || !WABA_ID) {
    console.error("Set META_ACCESS_TOKEN and META_WABA_ID in functions/.env");
    process.exit(1);
  }
  if (listOnly) {
    await listTemplates();
    return;
  }

  console.log("Creating UTILITY template batch on WABA", WABA_ID, dryRun ? "(dry-run)" : "");
  const results = [];
  for (const spec of UTILITY_TEMPLATE_BATCH) {
    results.push(await createTemplate(spec));
    if (!dryRun) await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\nDone. After Meta approves, set env (Firebase + local .env):");
  for (const spec of UTILITY_TEMPLATE_BATCH) {
    console.log(`  ${spec.envHint}=${spec.name}`);
  }
  console.log("\nReach-out body params unchanged: firstName, roleTitle, companyName.");
  console.log("Run: node scripts/createMetaTemplates.mjs --list");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
