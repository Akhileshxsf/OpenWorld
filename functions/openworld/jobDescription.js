import { createRequire } from "node:module";
import { groqJsonPrompt } from "../shared/groqJson.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export const MAX_JD_BYTES = 8 * 1024 * 1024;
export const MAX_JD_CHARS = 16000;
const MIN_JD_CHARS = 80;
const MIN_PDF_TEXT_CHARS = 120;

const SKILL_ALIASES = new Map(
  Object.entries({
    "node.js": "node",
    nodejs: "node",
    reactjs: "react",
    "react.js": "react",
    "vue.js": "vue",
    golang: "go",
    "c++": "cpp",
    "c#": "csharp",
    aws: "amazon web services",
    gcp: "google cloud",
    k8s: "kubernetes",
    js: "javascript",
    ts: "typescript",
    ml: "machine learning",
    ai: "artificial intelligence",
  })
);

function clean(value, max = 200) {
  return String(value || "").trim().slice(0, max);
}

export async function readJobDescription({ jdText, fileBase64, fileName }) {
  if (fileBase64) {
    const buffer = Buffer.from(String(fileBase64), "base64");
    if (!buffer.length) throw new Error("The uploaded file is empty.");
    if (buffer.length > MAX_JD_BYTES) throw new Error("File too large (max 8 MB).");
    const isPdf = buffer.slice(0, 4).toString() === "%PDF" || /\.pdf$/i.test(fileName || "");
    const text = isPdf ? (await pdfParse(buffer)).text : buffer.toString("utf8");
    const normalized = text.replace(/\s+\n/g, "\n").trim();
    if (isPdf && normalized.replace(/\s+/g, "").length < MIN_PDF_TEXT_CHARS) {
      throw new Error(
        "We couldn't read much text from that PDF. Export the JD as text (not a scan) or paste it in the text box."
      );
    }
    return normalized;
  }
  return String(jdText || "").trim();
}

function normalizeSkill(raw) {
  let t = clean(raw, 60).toLowerCase();
  if (!t) return "";
  t = SKILL_ALIASES.get(t) || t;
  return t
    .split(/\s+/)
    .map((w) => (w.length > 1 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function normalizeSkillList(values, max) {
  const seen = new Set();
  const out = [];
  for (const v of Array.isArray(values) ? values : []) {
    const n = normalizeSkill(v);
    const key = n.toLowerCase();
    if (!n || seen.has(key)) continue;
    seen.add(key);
    out.push(n);
    if (out.length >= max) break;
  }
  return out;
}

function parseExperienceHints(text) {
  const lower = text.toLowerCase();
  let experienceMin = null;
  let experienceMax = null;
  if (/\bfresher\b|\b0\s*[-–]\s*1\s*y/i.test(lower) || /\bno experience\b/.test(lower)) experienceMin = 0;
  const range = lower.match(/(\d+)\s*[-–to]+\s*(\d+)\+?\s*(?:years?|yrs?)/i);
  if (range) {
    experienceMin = Number(range[1]);
    experienceMax = Number(range[2]);
  } else {
    const minOnly = lower.match(/(?:minimum|min\.?|at least)\s*(\d+)\+?\s*(?:years?|yrs?)/i);
    if (minOnly) experienceMin = Number(minOnly[1]);
  }
  return { experienceMin, experienceMax };
}

/** Bullet lines after common JD section headers. */
export function fallbackExtractSkills(text) {
  const skills = [];
  const section =
    text.match(
      /(?:must[- ]?have|required skills|requirements|qualifications|what you.?ll bring|key skills)[:\s]*([\s\S]{0,2200})/i
    )?.[1] || "";
  const source = section || text.slice(0, 8000);
  for (const line of source.split("\n")) {
    const m = line.match(/^[\s•\-*\d.)]+(.{2,52})$/);
    if (!m) continue;
    const bit = m[1].replace(/\s*[.;]\s*$/, "").trim();
    if (bit.length >= 2 && bit.length <= 48 && !/^(and|or|the|we)\b/i.test(bit)) skills.push(bit);
  }
  return normalizeSkillList(skills, 12);
}

function buildParsePrompt(text) {
  return `
Extract hiring requirements from this job description. Use ONLY what the text says.
Return one JSON object with keys:
- title (string)
- company (string, "" if absent)
- location (string, "" if absent)
- remoteOk (boolean or null)
- experienceMin (number or null, years)
- experienceMax (number or null, years)
- mustHaveSkills (string array, REQUIRED skills/tools only, max 12)
- niceToHaveSkills (string array, preferred/optional, max 10)
- roleKeywords (string array, role title words and synonyms, max 10)
- summary (string, 1-2 sentences)

Rules:
- "Must have", "required" → mustHaveSkills. "Preferred", "nice to have" → niceToHaveSkills.
- Fresher / 0-1 year → experienceMin 0.

Job description:
"""
${text.slice(0, MAX_JD_CHARS)}
"""

Output valid JSON only:`.trim();
}

function coerceParsed(parsed, { companyName = "" } = {}) {
  const list = (v, n) => normalizeSkillList(v, n);
  const experienceMin = Number.isFinite(parsed.experienceMin) ? parsed.experienceMin : null;
  const experienceMax = Number.isFinite(parsed.experienceMax) ? parsed.experienceMax : null;

  return {
    title: clean(parsed.title, 120) || "Untitled role",
    company: clean(parsed.company, 120) || clean(companyName, 120),
    location: clean(parsed.location, 120),
    remoteOk: typeof parsed.remoteOk === "boolean" ? parsed.remoteOk : null,
    experienceMin,
    experienceMax,
    mustHaveSkills: list(parsed.mustHaveSkills, 12),
    niceToHaveSkills: list(parsed.niceToHaveSkills, 10),
    roleKeywords: list(parsed.roleKeywords, 10),
    summary: clean(parsed.summary, 400),
    parseMeta: parsed.parseMeta || { source: "groq" },
  };
}

function validateParsed(jd) {
  const issues = [];
  if (!jd.title || jd.title === "Untitled role") issues.push("missing_title");
  if (!jd.mustHaveSkills.length) issues.push("missing_must_have_skills");
  return issues;
}

async function parseWithGroq(text) {
  const parsed = await groqJsonPrompt(buildParsePrompt(text), { temperature: 0 });
  parsed.parseMeta = { source: "groq" };
  return coerceParsed(parsed);
}

export async function parseJobDescription(text, { companyName = "" } = {}) {
  if (text.length < MIN_JD_CHARS) {
    throw new Error("The job description is too short. Paste the full JD or upload the PDF.");
  }

  const expFromText = parseExperienceHints(text);
  let jd;
  try {
    jd = await parseWithGroq(text);
  } catch (error) {
    console.warn("parseJobDescription groq failed", error.message);
    jd = coerceParsed(
      {
        title: "",
        mustHaveSkills: fallbackExtractSkills(text),
        niceToHaveSkills: [],
        roleKeywords: [],
        summary: "",
        parseMeta: { source: "fallback" },
      },
      { companyName }
    );
  }

  if (!jd.mustHaveSkills.length) {
    jd.mustHaveSkills = fallbackExtractSkills(text);
    if (jd.mustHaveSkills.length) jd.parseMeta = { source: "fallback_skills", ...(jd.parseMeta || {}) };
  }

  if (jd.experienceMin == null && expFromText.experienceMin != null) jd.experienceMin = expFromText.experienceMin;
  if (jd.experienceMax == null && expFromText.experienceMax != null) jd.experienceMax = expFromText.experienceMax;

  const issues = validateParsed(jd);
  if (issues.includes("missing_must_have_skills")) {
    try {
      const retry = await groqJsonPrompt(
        `${buildParsePrompt(text)}\n\nPrevious attempt had no mustHaveSkills. List at least 3 required skills from the JD.`,
        { temperature: 0 }
      );
      const repaired = coerceParsed(retry, { companyName });
      if (repaired.mustHaveSkills.length) jd = { ...jd, ...repaired, parseMeta: { source: "groq_retry" } };
    } catch (error) {
      console.warn("parseJobDescription retry failed", error.message);
    }
  }

  return jd;
}

/** Recruiter-edited parse from hire page. */
export function applyConfirmedParsed(body, companyName) {
  const p = body?.parsed || body?.parsedConfirmed;
  if (!p || typeof p !== "object") return null;
  const jd = coerceParsed(p, { companyName });
  jd.parseMeta = { source: "recruiter_confirmed" };
  return jd;
}

export function assertJdReadyForMatch(jd) {
  if (!jd.mustHaveSkills.length) {
    throw new Error("Add at least one must-have skill for this role before searching.");
  }
}

export function parsedForClient(jd) {
  if (!jd || typeof jd !== "object") return jd;
  const { parseMeta, ...rest } = jd;
  return rest;
}