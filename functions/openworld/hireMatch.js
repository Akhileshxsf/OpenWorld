import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { createRequire } from "node:module";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../shared/firebaseAdmin.js";
import { groqJsonPrompt } from "../shared/groqJson.js";
import { INTROS, OFFERABLE, createIntro, getOpenIntros, introId, offerIntro } from "./intros.js";
import { parseRecruiterQuestions } from "./introQuestions.js";

const require = createRequire(import.meta.url);
// The package root runs a debug self-test when it has no module.parent (true under createRequire).
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const JOBS = "hiringJobs";
const AUTO_OFFER_MIN_SCORE = 75;
const AUTO_OFFERS_PER_JOB = 3;
const MAX_JD_BYTES = 8 * 1024 * 1024;
const MAX_JD_CHARS = 12000;
const SHORTLIST_SIZE = 15;
const MAX_RESULTS = 10;

function clean(value, max = 200) {
  return String(value || "").trim().slice(0, max);
}

async function readJobDescription({ jdText, fileBase64, fileName }) {
  if (fileBase64) {
    const buffer = Buffer.from(String(fileBase64), "base64");
    if (!buffer.length) throw new Error("The uploaded file is empty.");
    if (buffer.length > MAX_JD_BYTES) throw new Error("File too large (max 8 MB).");
    const isPdf = buffer.slice(0, 4).toString() === "%PDF" || /\.pdf$/i.test(fileName || "");
    const text = isPdf ? (await pdfParse(buffer)).text : buffer.toString("utf8");
    return text.replace(/\s+\n/g, "\n").trim();
  }
  return String(jdText || "").trim();
}

async function parseJobDescription(text) {
  const prompt = `
Extract the hiring requirements from this job description. Use only what the text says.
Return one JSON object with keys:
- title (string)
- company (string, "" if absent)
- location (string, "" if absent)
- remoteOk (boolean or null)
- experienceMin (number or null, years)
- experienceMax (number or null, years)
- mustHaveSkills (string array, core required skills/tools, max 12)
- niceToHaveSkills (string array, max 10)
- roleKeywords (string array, job-title words and synonyms, e.g. "backend", "sde", "ml engineer", max 8)
- summary (string, 1-2 sentence plain summary of the role)

Job description:
"""
${text.slice(0, MAX_JD_CHARS)}
"""

Output valid JSON only:`.trim();

  const parsed = await groqJsonPrompt(prompt, { temperature: 0 });
  const list = (v, n) => (Array.isArray(v) ? v.map((s) => clean(s, 60)).filter(Boolean).slice(0, n) : []);
  return {
    title: clean(parsed.title, 120) || "Untitled role",
    company: clean(parsed.company, 120),
    location: clean(parsed.location, 120),
    remoteOk: typeof parsed.remoteOk === "boolean" ? parsed.remoteOk : null,
    experienceMin: Number.isFinite(parsed.experienceMin) ? parsed.experienceMin : null,
    experienceMax: Number.isFinite(parsed.experienceMax) ? parsed.experienceMax : null,
    mustHaveSkills: list(parsed.mustHaveSkills, 12),
    niceToHaveSkills: list(parsed.niceToHaveSkills, 10),
    roleKeywords: list(parsed.roleKeywords, 8),
    summary: clean(parsed.summary, 400),
  };
}

function norm(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim();
}

function candidateHaystack(c) {
  return norm(
    [
      ...(c.skills || []),
      ...(c.roles || []),
      ...(c.projects || []),
      ...(c.certifications || []),
      c.degree,
      c.education,
      c.careerGoals,
      c.profileText,
    ].join(" ")
  );
}

function hasTerm(haystack, term) {
  const t = norm(term);
  if (!t) return false;
  return ` ${haystack} `.includes(` ${t} `) || (t.length > 4 && haystack.includes(t));
}

/** Cheap keyword pre-score so only a shortlist goes to the model. */
function preScore(candidate, jd) {
  const haystack = candidateHaystack(candidate);
  const matchedMust = jd.mustHaveSkills.filter((s) => hasTerm(haystack, s));
  const matchedNice = jd.niceToHaveSkills.filter((s) => hasTerm(haystack, s));
  const roleHits = jd.roleKeywords.filter((k) => hasTerm(haystack, k)).length;

  const years = Number(candidate.experienceYears);
  const experienceFit =
    !Number.isFinite(years) || jd.experienceMin == null
      ? 0.5
      : years >= jd.experienceMin && (jd.experienceMax == null || years <= jd.experienceMax + 1)
        ? 1
        : 0;
  const where = norm(`${candidate.location} ${candidate.locationPreference}`);
  const locationFit =
    !jd.location || jd.remoteOk || /remote/.test(where)
      ? 1
      : norm(jd.location).split(" ").some((w) => w.length > 2 && where.includes(w))
        ? 1
        : 0;

  const share = (hit, total) => (total ? hit / total : 0.5);
  const coverage = Math.round(
    share(matchedMust.length, jd.mustHaveSkills.length) * 70 +
      share(matchedNice.length, jd.niceToHaveSkills.length) * 15 +
      experienceFit * 10 +
      locationFit * 5
  );

  const score = matchedMust.length * 3 + matchedNice.length + roleHits * 2 + experienceFit * 2 + locationFit;
  return { score, coverage, matchedSkills: [...matchedMust, ...matchedNice] };
}

function anonymize(candidate) {
  return {
    college: clean(candidate.college, 120),
    degree: clean(candidate.degree, 120),
    graduationYear: Number.isFinite(candidate.graduationYear) ? candidate.graduationYear : null,
    experienceYears: Number.isFinite(candidate.experienceYears) ? candidate.experienceYears : null,
    roles: (candidate.roles || []).slice(0, 4),
    skills: (candidate.skills || []).slice(0, 14),
    location: clean(candidate.locationPreference || candidate.location, 120),
  };
}

async function rankShortlist(jd, shortlist) {
  const profiles = shortlist.map(({ ref, candidate }) => ({
    ref,
    ...anonymize(candidate),
    companies: (candidate.companies || []).slice(0, 4),
    summary: clean(candidate.profileText, 1200),
  }));

  const prompt = `
You are a technical recruiter matching candidates to a role. Be honest and specific.
Role:
${JSON.stringify(jd, null, 2)}

Candidates:
${JSON.stringify(profiles, null, 2)}

For EACH candidate return:
- ref (copy exactly)
- score (integer 0-100: how well they fit this role; 80+ strong, 60-79 good, 40-59 partial, <40 weak)
- headline (max 12 words, e.g. "Backend-focused CS grad with strong Node.js internships". NEVER include names, emails, phone numbers, company names or URLs)
- reasons (2-3 short strings: concrete evidence why they fit; no names or company names)
- gaps (0-2 short strings: missing requirements)

Output JSON only: {"matches": [ ... ]}`.trim();

  const parsed = await groqJsonPrompt(prompt, { temperature: 0 });
  const byRef = new Map((parsed.matches || []).map((m) => [String(m.ref), m]));
  return shortlist.map((item) => {
    const m = byRef.get(item.ref) || {};
    const modelScore = Math.max(0, Math.min(100, Number(m.score) || 0));
    // The model's score drifts between identical runs; anchoring half on skill coverage keeps results stable.
    const score = Math.round(modelScore * 0.5 + item.coverage * 0.5);
    return {
      ...item,
      score,
      headline: clean(m.headline, 120),
      reasons: (Array.isArray(m.reasons) ? m.reasons : []).map((r) => clean(r, 200)).filter(Boolean).slice(0, 3),
      gaps: (Array.isArray(m.gaps) ? m.gaps : []).map((g) => clean(g, 200)).filter(Boolean).slice(0, 2),
    };
  });
}

const SEARCH_LIMITS = { email: 20, ip: 40 };

/** Contact details are visible in results, so searches are capped per email and per IP each day. */
async function enforceSearchLimit(firestore, { email, ip }) {
  const day = new Date().toISOString().slice(0, 10);
  const keys = [
    ["email", email],
    ["ip", ip],
  ].filter(([, value]) => value);

  await firestore.runTransaction(async (tx) => {
    const refs = keys.map(([kind, value]) =>
      firestore.collection("hireRateLimits").doc(createHash("sha256").update(`${kind}:${value}:${day}`).digest("hex").slice(0, 40))
    );
    const snaps = await Promise.all(refs.map((ref) => tx.get(ref)));
    snaps.forEach((snap, i) => {
      if ((snap.data()?.count || 0) >= SEARCH_LIMITS[keys[i][0]]) {
        throw new Error("You've reached today's search limit. Please try again tomorrow or contact us.");
      }
    });
    refs.forEach((ref, i) => tx.set(ref, { kind: keys[i][0], day, count: (snaps[i].data()?.count || 0) + 1 }, { merge: true }));
  });
}

export async function handleHireMatch(body, meta = {}) {
  const contact = {
    companyName: clean(body.companyName, 120),
    contactName: clean(body.contactName, 120),
    email: clean(body.email, 160).toLowerCase(),
  };
  if (!contact.companyName || !contact.contactName) throw new Error("Please add your company and your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) throw new Error("Please enter a valid work email.");

  const jdText = await readJobDescription(body);
  if (jdText.length < 80) {
    throw new Error("The job description is too short. Paste the full JD or upload the PDF.");
  }

  const firestore = getDb();
  if (!firestore) throw new Error("Database unavailable");

  const requester = { ip: clean(meta.ip, 64), userAgent: clean(meta.userAgent, 200) };
  await enforceSearchLimit(firestore, { email: contact.email, ip: requester.ip });

  const [jd, snap] = await Promise.all([
    parseJobDescription(jdText),
    firestore.collection("whatsappCandidates").get(),
  ]);

  const pool = snap.docs
    .map((doc) => ({ phone: doc.id, candidate: doc.data() }))
    .filter(({ candidate }) => candidate.profileText || (candidate.skills || []).length)
    .filter(({ candidate }) => candidate.jobSeekingStatus !== "not_looking");

  const shortlist = pool
    .map(({ phone, candidate }) => ({ phone, candidate, ...preScore(candidate, jd) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, SHORTLIST_SIZE)
    .map((item, i) => ({ ...item, ref: `C${i + 1}` }));

  const ranked = shortlist.length ? await rankShortlist(jd, shortlist) : [];
  const top = ranked
    .filter((m) => m.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((m) => ({ ...m, matchId: randomUUID() }));

  const jobRef = firestore.collection(JOBS).doc();
  const accessKey = randomBytes(18).toString("base64url");
  const job = {
    ...contact,
    accessKey,
    requester,
    jdText: jdText.slice(0, 50000),
    jdFileName: clean(body.fileName, 200),
    parsed: jd,
    poolSize: pool.length,
    matches: top.map((m) => ({
      matchId: m.matchId,
      phone: m.phone,
      score: m.score,
      headline: m.headline,
      reasons: m.reasons,
      gaps: m.gaps,
      matchedSkills: m.matchedSkills,
    })),
    createdAt: FieldValue.serverTimestamp(),
  };
  await jobRef.set(job);

  if (process.env.AUTO_OFFER_STRONG_MATCHES === "true") {
    const autoOffers = await autoOfferStrongMatches(jobRef.id, job);
    if (autoOffers.length) await jobRef.set({ autoOffers }, { merge: true });
  }

  return { ...(await buildJobView(jobRef.id, job)), accessKey };
}

/** Strong matches hear about a new role right away; one pending offer per candidate at a time. */
async function autoOfferStrongMatches(jobId, job) {
  const strong = job.matches.filter((m) => m.score >= AUTO_OFFER_MIN_SCORE).slice(0, AUTO_OFFERS_PER_JOB);
  const results = [];
  for (const match of strong) {
    try {
      const open = await getOpenIntros(match.phone);
      if (open.some((i) => i.status === "awaiting_candidate")) {
        results.push({ matchId: match.matchId, skipped: "offer_pending" });
        continue;
      }
      const { intro, created } = await createIntro({ jobId, job, match, source: "auto" });
      if (!created) continue;
      const delivery = await offerIntro(intro);
      results.push({ matchId: match.matchId, delivered: delivery.delivered, reason: delivery.reason || null });
    } catch (error) {
      console.error("auto offer failed", jobId, match.matchId, error.message);
      results.push({ matchId: match.matchId, error: error.message.slice(0, 200) });
    }
  }
  return results;
}

function contactView(phone, candidate, resume) {
  return {
    name: clean(candidate.displayName, 120),
    phone: `+${phone}`,
    whatsappUrl: `https://wa.me/${phone}`,
    email: clean(candidate.email, 160),
    resumeUrl: resume?.resumeUrl || "",
    linkedInUrl: clean(candidate.linkedInUrl, 300),
    githubUrl: clean(candidate.githubUrl, 300),
    portfolioUrl: clean(candidate.portfolioUrl, 300),
  };
}

function profileView(candidate) {
  return {
    ...anonymize(candidate),
    companies: (candidate.companies || []).slice(0, 6),
    projects: (candidate.projects || []).slice(0, 6),
    summary: clean(candidate.profileText, 2500),
    lookingFor: clean(candidate.careerGoals, 200),
    employmentType: clean(candidate.employmentType, 40),
    expectedCtc: clean(candidate.expectedCtc, 60),
    availability: clean(candidate.availability, 120),
  };
}

function introView(intro) {
  if (!intro) return null;
  const questions = (intro.questions || []).map((q) => ({
    text: q.text,
    answer: q.status === "answered" ? q.answer : "",
    status: q.status,
  }));
  return {
    status: intro.status,
    delivery: intro.offerDelivery?.reason || null,
    note: intro.recruiterNote || "",
    questions,
    candidateQuestions: intro.candidateQuestions || [],
    declineReason: intro.declineReason || null,
    partial: Boolean(intro.partial),
  };
}

/** Results as the recruiter sees them: current profile + contact + intro status for each match. */
export async function buildJobView(jobId, job) {
  const firestore = getDb();
  const matches = job.matches || [];
  const phones = matches.map((m) => m.phone);
  const [candidateSnaps, resumeSnaps, introSnaps] = await Promise.all([
    phones.length ? firestore.getAll(...phones.map((p) => firestore.collection("whatsappCandidates").doc(p))) : [],
    phones.length ? firestore.getAll(...phones.map((p) => firestore.collection("whatsappResumes").doc(p))) : [],
    matches.length ? firestore.getAll(...matches.map((m) => firestore.collection(INTROS).doc(introId(jobId, m.matchId)))) : [],
  ]);

  return {
    jobId,
    job: job.parsed,
    poolSize: job.poolSize,
    matches: matches.map((m, i) => {
      const candidate = candidateSnaps[i]?.data() || {};
      const intro = introSnaps[i]?.exists ? introSnaps[i].data() : null;
      return {
        matchId: m.matchId,
        score: m.score,
        headline: m.headline || "",
        reasons: m.reasons || [],
        gaps: m.gaps || [],
        matchedSkills: m.matchedSkills || [],
        paused: candidate.jobSeekingStatus === "not_looking",
        ...profileView(candidate),
        contact: contactView(m.phone, candidate, resumeSnaps[i]?.data()),
        intro: introView(intro),
      };
    }),
  };
}

async function loadAuthorizedJob(body) {
  const jobId = clean(body.jobId, 100);
  const key = clean(body.key, 100);
  if (!jobId || !key) throw new Error("This results link is incomplete.");

  const firestore = getDb();
  if (!firestore) throw new Error("Database unavailable");
  const snap = await firestore.collection(JOBS).doc(jobId).get();
  const job = snap.data();
  const expected = Buffer.from(String(job?.accessKey || ""));
  const given = Buffer.from(key);
  if (!job || expected.length !== given.length || !timingSafeEqual(expected, given)) {
    throw new Error("This results link is invalid or has expired.");
  }
  return { jobId, job };
}

export async function handleGetJob(body) {
  const { jobId, job } = await loadAuthorizedJob(body);
  return {
    ...(await buildJobView(jobId, job)),
    recruiter: { companyName: job.companyName, contactName: job.contactName, email: job.email },
  };
}

/** "Reach out via Mira": stores the recruiter's note + questions and asks the candidate on WhatsApp. */
export async function handleReachOut(body) {
  const { jobId, job } = await loadAuthorizedJob(body);
  const match = job.matches?.find((m) => m.matchId === clean(body.matchId, 100));
  if (!match) throw new Error("This candidate is no longer in your results.");

  const note = clean(body.note, 500);
  const questionsText = clean(body.questions, 1500);
  const candidate = (await getDb().collection("whatsappCandidates").doc(match.phone).get()).data() || {};
  const questions = await parseRecruiterQuestions(questionsText, candidate);

  const { intro, created } = await createIntro({ jobId, job, match, source: "recruiter", note, questions });
  if (created || OFFERABLE.includes(intro.status)) {
    await offerIntro({ ...intro, recruiterRequested: true, recruiterNote: note, questions });
  }

  const fresh = (await getDb().collection(INTROS).doc(intro.id).get()).data();
  return { ok: true, intro: introView(fresh) };
}
