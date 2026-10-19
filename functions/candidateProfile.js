import { CANDIDATE_JSON_FIELDS, schemaPromptDescription } from "./candidateSchema.js";
import { groqJsonPrompt } from "./groqJson.js";

function pickCandidateFields(obj) {
  if (!obj || typeof obj !== "object") return {};
  const out = {};
  for (const key of CANDIDATE_JSON_FIELDS) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

export async function extractProfileFromResume(resumeText, { whatsAppDisplayName = "" } = {}) {
  const prompt = `
You extract a structured job-seeker profile from raw resume text for OpenWorldX (WhatsApp agent Mira).
${schemaPromptDescription()}

Rules:
- Use ONLY what appears in the resume. Never invent employers, dates, grades, or links.
- profileText is the main deliverable: write a rich, readable summary (aim for 150–350 words) in third person, as if briefing a recruiter. Include everything material from the resume, woven into clear prose — not a bullet dump:
  • Name and contact hints if present
  • Education (institute, degree, branch, year, CGPA/scores if listed)
  • Work experience and internships (company, role, duration, what they did)
  • Projects (what was built, stack, outcome)
  • Skills, tools, languages, frameworks
  • Achievements, hackathons, leadership, clubs, publications
  • Links (GitHub, LinkedIn, portfolio, LeetCode, etc.) woven into sentences
  Good tone: "They completed B.Tech in … from NIT Delhi … interned at … where they … Their projects include …"
- Still populate structured JSON fields; profileText should not replace them but should be the most complete narrative.
- Pull githubUrl, linkedInUrl, portfolioUrl whenever URLs appear in the resume text.
- intent: "looking_for_job"
- WhatsApp contact name (may differ from resume): ${whatsAppDisplayName || "unknown"}

Resume text:
"""
${String(resumeText).slice(0, 16000)}
"""

Output valid JSON only:
`.trim();

  const parsed = await groqJsonPrompt(prompt, { temperature: 0.2 });
  return pickCandidateFields(parsed);
}

export async function updateProfileFromChat(current, { userText, botText = "" }) {
  const prompt = `
You maintain a job-seeker profile JSON for WhatsApp candidate Mira.
${schemaPromptDescription()}

Rules:
- Merge NEW facts from the user's latest message into the profile.
- From chat, capture when mentioned: careerGoals, locationPreference, currentCtc, expectedCtc, availability, employmentType, jobSeekingStatus, target roles, remote preference — and weave them into profileText (still third-person, still detailed).
- If the user corrects something from their resume (e.g. "my graduation year is 2026", "I don't know Java"), apply the correction.
- Always rewrite profileText to reflect resume facts PLUS all chat facts (goals, location preference, current/expected CTC, etc.); do not shrink to a short blurb.
- Do not remove resume-derived fields unless the user explicitly corrects them.
- Leave currentCtc / expectedCtc / locationPreference / careerGoals / availability / employmentType / jobSeekingStatus empty until the user states them in chat.
- profileCompleteness: higher when resume is parsed AND goals + location preference + salary expectations are known.
- Jobs only; ignore social networking topics.

Current profile JSON:
${JSON.stringify(current, null, 2)}

User message:
${userText}

Mira reply (context only):
${botText}

Output the updated profile JSON only:
`.trim();

  const parsed = await groqJsonPrompt(prompt, { temperature: 0.35 });
  return pickCandidateFields(parsed);
}
