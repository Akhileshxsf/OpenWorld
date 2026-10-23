import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { parseJsonFromModel } from "./groqJson.js";
import { profileGaps } from "./candidateSchema.js";

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

function formatDate(iso) {
  const time = Date.parse(iso || "");
  if (!Number.isFinite(time)) return "";
  return new Date(time).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** "done" | "processing" | "failed" | "none" */
export function resumeState(resume) {
  if (!resume?.resumePath && !resume?.resumeUrl) return "none";
  if (resume.profileFromResumeAt) return "done";
  if (resume.processingStatus === "failed") return "failed";
  return "processing";
}

function resumeBlock(resume) {
  const state = resumeState(resume);
  if (state === "done") {
    const when = formatDate(resume.uploadedAt || resume.profileFromResumeAt);
    return `RESUME: On file${resume.fileName ? ` (${resume.fileName}` : ""}${when ? `, uploaded ${when}` : ""}${resume.fileName ? ")" : ""}. It is already read and in the profile below.
- NEVER ask them to upload or send their resume again. If they say "I uploaded it" / "did you get it", confirm you have it and continue.
- If they want to update their resume, tell them to just send the new PDF here in this chat.`;
  }
  if (state === "processing") {
    return `RESUME: Uploaded, still being read. Tell them you have it and are reading it; do not ask for it again.`;
  }
  if (state === "failed") {
    return `RESUME: Uploaded but the file couldn't be read. Ask them to send it again here as a PDF (exported from Word/Google Docs, not a scan).`;
  }
  return `RESUME: Not received yet. Briefly ask them to send their resume as a PDF right here in this WhatsApp chat (attach → Document).`;
}

const LINK_RULE = `UPLOAD LINK: Sending the PDF in this chat is the normal way. Set share_upload_link to true ONLY if they ask for a link, say they're on a laptop/computer, or say sending the file in WhatsApp isn't working. Otherwise false.`;

function profileBlock(candidate) {
  if (!candidate?.profileText) return "";
  return `
Candidate profile (from resume + chat):
${candidate.profileText}
Roles: ${(candidate.roles || []).join(", ") || "unknown"}
Location (resume): ${candidate.location || "unknown"}
Target roles: ${candidate.careerGoals || "unknown"}
Internship / full-time: ${candidate.employmentType || "unknown"}
Location preference: ${candidate.locationPreference || "unknown"}
Current CTC: ${candidate.currentCtc || "unknown"}
Expected CTC: ${candidate.expectedCtc || "unknown"}
Availability: ${candidate.availability || "unknown"}
Job search status: ${candidate.jobSeekingStatus || "unknown"}`;
}

function gapsBlock(candidate, state) {
  if (state !== "done") return "";
  const gaps = profileGaps(candidate);
  if (!gaps.length) {
    return "PROFILE: Complete. Suggest specific role types that fit and say you'll message them when a matching role comes in.";
  }
  return `PROFILE GAPS (ask about the FIRST one only, in your own words, one question per reply): ${gaps
    .map((g) => g.ask)
    .join("; ")}.`;
}

function introsBlock(intros = []) {
  if (!intros.length) return "";
  const lines = intros.map((i) => {
    const what = `${i.roleTitle || "a role"}${i.companyName ? ` at ${i.companyName}` : ""}`;
    if (i.status === "awaiting_candidate") return `- ${what}: recruiter is interested; waiting for their yes/no (they can tap the buttons above)`;
    if (i.status === "accepted") return `- ${what}: they said yes; recruiter has their details and will contact them`;
    return `- ${what}: ${i.status}`;
  });
  return `OPEN INTROS (you can reference these if they ask):\n${lines.join("\n")}`;
}

export function buildMiraPrompt(userText, history = [], senderName = "", context = {}) {
  const recentHistory = history
    .slice(-10)
    .map((msg) => `${msg.sender === "user" ? "User" : "Mira"}: ${msg.text}`)
    .join("\n");

  const { resume = null, candidate = null, intros = [] } = context;
  const state = resumeState(resume);

  return `
You are Mira from OpenWorldX on WhatsApp${senderName ? `, talking with ${senderName}` : ""}. You only help candidates find jobs: get their resume, chat to understand them, suggest roles that fit, and connect them with interested recruiters.

CRITICAL GUIDELINES:
- Speak like a supportive career buddy: casual, warm, occasional emojis. Not corporate HR speak.
- Keep replies short: 1-3 sentences. No markdown, tables, or long bullet lists.
- NEVER write any URL or link. If you set share_upload_link to true, say the upload link is just below — the system appends their personal link.
- Ask one focused question at a time until you have a clear picture, then suggest specific job types or next steps — explain briefly why each fits.
- If they say they got a job or want to pause, congratulate/acknowledge and say you'll stop sending roles until they message again.
- Stay on careers only. If the topic isn't jobs, resume, or interview prep, gently bring them back to their job search.
- Never mention or offer: introducing them to other users, matchmaking between people, buying/selling time, paid sessions, or marketplace features.
- If they ask what OpenWorldX is: WhatsApp career assistant for campus talent — resume, a short chat, then roles that fit.
- If they ask who can see their profile: recruiters hiring on OpenWorldX can see their profile, resume and contact details; when a recruiter is interested Mira asks them first, and they can say "pause" anytime to stop new roles.

${resumeBlock(resume)}
${LINK_RULE}
${gapsBlock(candidate, state)}
${introsBlock(intros)}
${profileBlock(candidate)}

Recent conversation:
${recentHistory || "None yet"}

User: ${userText}

Respond with JSON only: {"reply": "<your WhatsApp message>", "share_upload_link": true|false}`.trim();
}

export async function generateMiraReply(userText, history = [], senderName = "", context = {}) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
  }

  const state = resumeState(context.resume);
  const { text } = await generateText({
    model: groqClient("openai/gpt-oss-120b"),
    prompt: buildMiraPrompt(userText, history, senderName, context),
    temperature: 0.7,
  });

  let reply = "";
  let shareLink = false;
  try {
    const parsed = parseJsonFromModel(text);
    reply = String(parsed.reply || "");
    shareLink = parsed.share_upload_link === true;
  } catch {
    // Model ignored the JSON format; use its text as the reply.
    reply = String(text || "");
  }

  const fallback =
    state === "none" || state === "failed"
      ? "Hey! Send me your resume as a PDF right here in this chat so I can help 📄"
      : "Tell me more about the kind of jobs you want — role and location.";

  reply = (reply || fallback)
    .replace(/\*\*/g, "")
    .replace(/https?:\/\/\S*upload-resume\S*/gi, "")
    .trim();

  if (context.uploadUrl && shareLink && state !== "processing") {
    return `${reply}\n\n${context.uploadUrl}`;
  }
  return reply;
}
