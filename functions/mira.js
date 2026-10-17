import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export function buildMiraPrompt(userText, history = [], senderName = "", context = {}) {
  const recentHistory = history
    .slice(-8)
    .map((msg) => `${msg.sender === "user" ? "User" : "Mira"}: ${msg.text}`)
    .join("\n");

  const { hasResume = false, uploadUrl = "", candidate = null } = context;
  const profileBlock = candidate?.profileText
    ? `\nCandidate profile (from resume + chat):\n${candidate.profileText}\nCompleteness: ${candidate.profileCompleteness ?? 0}\nRoles: ${(candidate.roles || []).join(", ") || "unknown"}\nLocation (resume): ${candidate.location || "unknown"}\nLocation preference: ${candidate.locationPreference || "unknown"}\nGoals: ${candidate.careerGoals || "unknown"}\nCurrent CTC: ${candidate.currentCtc || "unknown"}\nExpected CTC: ${candidate.expectedCtc || "unknown"}\n`
    : "";

  const linkRule =
    "- NEVER write any URL or link yourself. When an upload link is relevant, say it is just below — the system appends their personal link after your reply.";
  const resumeInstruction = hasResume
    ? `- Resume is on file. Do NOT ask them to upload again unless they say they want to replace it. Use the profile below. If careerGoals, locationPreference, currentCtc, or expectedCtc are unknown, ask ONE focused question about what is missing (goals, where they want to work, current vs expected salary in LPA).\n${linkRule}`
    : `- No resume yet. Briefly ask them to upload their resume (PDF or Word) using the link below.\n${linkRule}`;

  return `
You are Mira from OpenWorldX on WhatsApp${senderName ? `, talking with ${senderName}` : ""}. You only help candidates find jobs: upload resume, chat to understand them, suggest roles that fit.

CRITICAL GUIDELINES:
- Speak like a supportive career buddy: casual, warm, occasional emojis. Not corporate HR speak.
- Keep replies short: 1-3 sentences. No markdown, tables, or long bullet lists.
${resumeInstruction}
- Ask one focused question at a time until you have a clear picture, then suggest specific job types, companies, or next steps — explain briefly why each fits.
- Stay on careers only. If the topic isn't jobs, resume, or interview prep, gently bring them back to their job search.
- Never mention or offer: introducing them to other users, "connect me", matchmaking between people, buying/selling time, paid sessions, or marketplace features.
- If they ask what OpenWorldX is: WhatsApp career assistant for campus talent — resume, then a short chat, then job suggestions that fit.

Tone: Friendly, honest, job-focused peer mentor.
${profileBlock}

Recent conversation:
${recentHistory || "None yet"}

User: ${userText}

Mira:`.trim();
}

export async function generateMiraReply(userText, history = [], senderName = "", context = {}) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
  }

  const { text } = await generateText({
    model: groqClient("openai/gpt-oss-120b"),
    prompt: buildMiraPrompt(userText, history, senderName, context),
    temperature: 0.8,
  });

  const fallback = context.hasResume
    ? "Tell me more about the kind of jobs you want — role and location."
    : "Hey! Upload your resume first so I can help 👇";

  const reply = (text || fallback)
    .replace(/\*\*/g, "")
    .replace(/https?:\/\/\S*upload-resume\S*/gi, "")
    .trim();

  if (context.uploadUrl && (!context.hasResume || wantsUploadLink(userText))) {
    return `${reply}\n\n${context.uploadUrl}`;
  }
  return reply;
}

/** Users with a resume on file get a fresh signed link only when they ask for one. */
export function wantsUploadLink(userText = "") {
  return /\b(upload|re-?upload|link|resume|cv|replace|update)\b/i.test(userText);
}
