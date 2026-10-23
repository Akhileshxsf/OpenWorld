import { groqJsonPrompt } from "../shared/groqJson.js";

const MAX_QUESTIONS = 6;

function clean(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function knownFacts(candidate) {
  const facts = {
    expectedCtc: candidate.expectedCtc,
    currentCtc: candidate.currentCtc,
    availability: candidate.availability,
    locationPreference: candidate.locationPreference,
    currentLocation: candidate.location,
    employmentType: candidate.employmentType,
    experienceYears: candidate.experienceYears,
    graduationYear: candidate.graduationYear,
    githubUrl: candidate.githubUrl,
    linkedInUrl: candidate.linkedInUrl,
    portfolioUrl: candidate.portfolioUrl,
    targetRoles: candidate.careerGoals,
  };
  return Object.fromEntries(Object.entries(facts).filter(([, v]) => v !== "" && v != null));
}

/**
 * Splits the recruiter's free text into short questions for WhatsApp. When the profile already
 * answers one, `prefill` holds that answer so Mira only asks the candidate to confirm it.
 */
export async function parseRecruiterQuestions(questionsText, candidate) {
  const text = clean(questionsText, 1500);
  if (!text) return [];

  const parsed = await groqJsonPrompt(
    `A recruiter wrote what they need to know from a job candidate. Split it into separate, short questions
Mira can ask the candidate on WhatsApp, in the recruiter's order. Rephrase each as a friendly direct question
to the candidate ("What's your notice period?"). Merge duplicates. Max ${MAX_QUESTIONS} questions.
Ignore anything that is not a question for the candidate (greetings, instructions to us).

For each question, if the candidate facts below clearly answer it, put that answer in "prefill" (short, in
the candidate's terms). Otherwise prefill is "".

Candidate facts:
${JSON.stringify(knownFacts(candidate))}

Recruiter wrote:
"""
${text}
"""

JSON only: {"questions": [{"text": "...", "prefill": "..."}]}`,
    { temperature: 0 }
  );

  return (Array.isArray(parsed.questions) ? parsed.questions : [])
    .map((q) => ({ text: clean(q.text, 200), prefill: clean(q.prefill, 120) }))
    .filter((q) => q.text)
    .slice(0, MAX_QUESTIONS)
    .map((q) => ({ ...q, status: "pending", answer: "" }));
}

/**
 * Reads the candidate's reply to one recruiter question.
 * kind: "answer" | "confirm" (prefill still right) | "role_question" | "off_topic"
 */
export async function interpretAnswer({ question, prefill, reply, role }) {
  const parsed = await groqJsonPrompt(
    `Mira asked a job candidate a question on behalf of a recruiter and got a reply. Classify the reply.

Question: ${question}
${prefill ? `Mira suggested this answer from their profile and asked if it's still right: "${prefill}"` : ""}
Candidate replied: "${clean(reply, 600)}"

Role info (to answer candidate questions): ${clean(role, 2500)}

Return JSON only:
{"kind": "answer" | "confirm" | "role_question" | "off_topic",
 "answer": "<the candidate's answer, cleaned up but in their words; '' unless kind is answer>",
 "candidate_question": "<their question about the role/company; '' unless kind is role_question>",
 "reply": "<only for role_question: 1-2 friendly sentences answering from the role info, or saying you'll pass it to the recruiter if the info doesn't say>"}

Rules: "confirm" only when there is a suggested answer and they agree with it (yes / correct / same).
A reply that answers the question (even briefly, e.g. "30 days", "8 LPA", "yes I can relocate") is "answer".
If they answer AND ask something, use "answer" and also fill candidate_question.`,
    { temperature: 0 }
  );

  const kind = ["answer", "confirm", "role_question", "off_topic"].includes(parsed.kind) ? parsed.kind : "answer";
  return {
    kind,
    answer: clean(parsed.answer, 300) || (kind === "answer" ? clean(reply, 300) : ""),
    candidateQuestion: clean(parsed.candidate_question, 300),
    reply: clean(parsed.reply, 400),
  };
}
