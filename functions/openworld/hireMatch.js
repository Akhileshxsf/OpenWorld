import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../shared/firebaseAdmin.js";
import { groqJsonPrompt } from "../shared/groqJson.js";
import {
  anonymize,
  buildLlmShortlist,
  buildMatchRetrievePool,
} from "./candidatePool.js";
import {
  applyConfirmedParsed,
  assertJdReadyForMatch,
  parseJobDescription,
  parsedForClient,
  readJobDescription,
} from "./jobDescription.js";
import { INTROS, OFFERABLE, createIntro, getOpenIntros, introId, offerIntro } from "./intros.js";
import { parseRecruiterQuestions } from "./introQuestions.js";

const JOBS = "hiringJobs";
const AUTO_OFFER_MIN_SCORE = 75;
const AUTO_OFFERS_PER_JOB = 3;
const LLM_RANK_BATCH = 10;
/** Firestore job doc safety cap (set HIRE_MAX_MATCH_RESULTS to override). */
const DEFAULT_MAX_MATCHES = 2000;
export const DEFAULT_MATCH_PAGE_SIZE = 5;
const MAX_MATCH_PAGE_SIZE = 50;

function parseMatchPage(body) {
  const pageSize = Math.min(
    MAX_MATCH_PAGE_SIZE,
    Math.max(5, Number(body.pageSize) || DEFAULT_MATCH_PAGE_SIZE)
  );
  const page = Math.max(0, Number(body.page) || 0);
  return { page, pageSize };
}

function prescoreRankFallback(shortlist) {
  return shortlist.map((item) => ({
    ...item,
    score: item.coverage,
    headline: clean(
      [
        item.candidate?.degree,
        (item.matchedSkills || []).slice(0, 3).join(" · ") || "Profile from OpenWorldX",
      ]
        .filter(Boolean)
        .join(" — "),
      120
    ),
    reasons: (item.matchedSkills || []).length
      ? [`Matching skills: ${item.matchedSkills.slice(0, 4).join(", ")}`]
      : ["Keyword overlap with your job requirements"],
    gaps: [],
  }));
}

function clean(value, max = 200) {
  return String(value || "").trim().slice(0, max);
}

async function rankShortlist(jd, shortlist) {
  const profiles = shortlist.map(({ ref, candidate }) => ({
    ref,
    ...anonymize(candidate),
    companies: (candidate.companies || []).slice(0, 4),
    summary: clean(candidate.profileText, 400),
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

Keep every reason/gap under 80 characters. Output JSON only: {"matches": [ ... ]} with at most ${profiles.length} entries.`.trim();

  try {
    const parsed = await groqJsonPrompt(prompt, { temperature: 0 });
    const byRef = new Map((parsed.matches || []).map((m) => [String(m.ref), m]));
    return shortlist.map((item) => {
      const m = byRef.get(item.ref) || {};
      const modelScore = Math.max(0, Math.min(100, Number(m.score) || 0));
      const score = Math.round(modelScore * 0.5 + item.coverage * 0.5);
      return {
        ...item,
        score,
        headline: clean(m.headline, 120),
        reasons: (Array.isArray(m.reasons) ? m.reasons : []).map((r) => clean(r, 200)).filter(Boolean).slice(0, 3),
        gaps: (Array.isArray(m.gaps) ? m.gaps : []).map((g) => clean(g, 200)).filter(Boolean).slice(0, 2),
      };
    });
  } catch (error) {
    console.warn("rankShortlist LLM failed, prescore fallback", error.message);
    return prescoreRankFallback(shortlist);
  }
}

async function rankShortlistBatched(jd, shortlist) {
  const merged = [];
  for (let i = 0; i < shortlist.length; i += LLM_RANK_BATCH) {
    const batch = shortlist.slice(i, i + LLM_RANK_BATCH);
    const ranked = await rankShortlist(jd, batch);
    merged.push(...ranked);
  }
  return merged;
}

/** Everyone in retrievePool gets a row; LLM enriches the shortlist, prescore covers the rest. */
function mergeRetrievePoolWithRank(llmRanked, retrievePool) {
  const byPhone = new Map(llmRanked.map((m) => [m.phone, m]));
  return retrievePool
    .map((item) => {
      if (byPhone.has(item.phone)) return byPhone.get(item.phone);
      return prescoreRankFallback([item])[0];
    })
    .sort((a, b) => b.score - a.score);
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

  const confirmed = applyConfirmedParsed(body, contact.companyName);
  const jd = confirmed || (await parseJobDescription(jdText, { companyName: contact.companyName }));
  assertJdReadyForMatch(jd);

  const { eligibleCount, retrievePool, mustGuarantee } = await buildMatchRetrievePool(firestore, jd);
  const shortlist = buildLlmShortlist(retrievePool, mustGuarantee, jd);

  let llmRanked = [];
  if (shortlist.length) {
    try {
      llmRanked = await rankShortlistBatched(jd, shortlist);
    } catch (error) {
      console.warn("rankShortlistBatched failed, prescore fallback", error.message);
      llmRanked = prescoreRankFallback(shortlist);
    }
  }
  const merged = mergeRetrievePoolWithRank(llmRanked, retrievePool);
  const maxMatches = Math.max(50, Number(process.env.HIRE_MAX_MATCH_RESULTS) || DEFAULT_MAX_MATCHES);
  if (merged.length > maxMatches) {
    console.warn("hire match truncated", { eligibleCount, merged: merged.length, maxMatches });
  }
  const top = merged.slice(0, maxMatches).map((m) => ({ ...m, matchId: randomUUID() }));

  const jobRef = firestore.collection(JOBS).doc();
  const accessKey = randomBytes(18).toString("base64url");
  const job = {
    ...contact,
    accessKey,
    requester,
    jdText: jdText.slice(0, 50000),
    jdFileName: clean(body.fileName, 200),
    parsed: jd,
    parsedConfirmed: Boolean(confirmed),
    poolSize: eligibleCount,
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

  return { ...(await buildJobView(jobRef.id, job, { page: 0, pageSize: DEFAULT_MATCH_PAGE_SIZE })), accessKey };
}

/** Parse JD only; recruiter can confirm skills on hire page before match. */
export async function handleParseJob(body) {
  const companyName = clean(body.companyName, 120);
  const jdText = await readJobDescription(body);
  const parsed = await parseJobDescription(jdText, { companyName });
  return { parsed: parsedForClient(parsed), jdTextChars: jdText.length };
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
    delivery:
      intro.offerDelivery?.webhookError ||
      (intro.offerDelivery?.reason === "rate_limited"
        ? "WhatsApp limit (130429) — try again later"
        : intro.offerDelivery?.reason) ||
      (intro.offerDelivery?.error ? `send_failed: ${intro.offerDelivery.error}` : null),
    note: intro.recruiterNote || "",
    questions,
    candidateQuestions: intro.candidateQuestions || [],
    declineReason: intro.declineReason || null,
    partial: Boolean(intro.partial),
  };
}

async function getAllChunked(firestore, docRefs, chunkSize = 100) {
  if (!docRefs.length) return [];
  const snaps = [];
  for (let i = 0; i < docRefs.length; i += chunkSize) {
    const batch = docRefs.slice(i, i + chunkSize);
    snaps.push(...(await firestore.getAll(...batch)));
  }
  return snaps;
}

/** Results as the recruiter sees them: paginated profiles + contact + intro status. */
export async function buildJobView(jobId, job, { page = 0, pageSize = DEFAULT_MATCH_PAGE_SIZE } = {}) {
  const firestore = getDb();
  const sorted = [...(job.matches || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
  const matchTotal = sorted.length;
  const safeSize = Math.min(MAX_MATCH_PAGE_SIZE, Math.max(5, pageSize));
  const maxPage = matchTotal ? Math.ceil(matchTotal / safeSize) - 1 : 0;
  const safePage = Math.min(Math.max(0, page), maxPage);
  const start = safePage * safeSize;
  const pageRows = sorted.slice(start, start + safeSize);

  const [candidateSnaps, resumeSnaps, introSnaps] = await Promise.all([
    getAllChunked(
      firestore,
      pageRows.map((m) => firestore.collection("whatsappCandidates").doc(m.phone))
    ),
    getAllChunked(
      firestore,
      pageRows.map((m) => firestore.collection("whatsappResumes").doc(m.phone))
    ),
    getAllChunked(
      firestore,
      pageRows.map((m) => firestore.collection(INTROS).doc(introId(jobId, m.matchId)))
    ),
  ]);

  return {
    jobId,
    job: job.parsed,
    poolSize: job.poolSize,
    matchTotal,
    page: safePage,
    pageSize: safeSize,
    pageCount: Math.max(1, Math.ceil(matchTotal / safeSize)),
    matches: pageRows.map((m, i) => {
      const candidate = candidateSnaps[i]?.data() || {};
      const intro = introSnaps[i]?.exists ? introSnaps[i].data() : null;
      return {
        matchId: m.matchId,
        score: m.score,
        headline: m.headline || "",
        reasons: m.reasons || [],
        gaps: m.gaps || [],
        matchedSkills: m.matchedSkills || [],
        rank: start + i + 1,
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
  const { page, pageSize } = parseMatchPage(body);
  return {
    ...(await buildJobView(jobId, job, { page, pageSize })),
    recruiter: { companyName: job.companyName, contactName: job.contactName, email: job.email },
  };
}

/** "Reach out via Mira": stores the recruiter's note + questions and asks the candidate on WhatsApp. */
export async function handleReachOut(body) {
  if (!process.env.META_MATCH_TEMPLATE_NAME) {
    throw new Error(
      "Recruiter reach-out requires META_MATCH_TEMPLATE_NAME (your approved WhatsApp template, e.g. openworldx_recruiter_request_u1)."
    );
  }
  const { jobId, job } = await loadAuthorizedJob(body);
  const match = job.matches?.find((m) => m.matchId === clean(body.matchId, 100));
  if (!match) throw new Error("This candidate is no longer in your results.");

  const note = clean(body.note, 500);
  const questionsText = clean(body.questions, 1500);
  const candidate = (await getDb().collection("whatsappCandidates").doc(match.phone).get()).data() || {};
  let questions = [];
  if (questionsText) {
    try {
      questions = await parseRecruiterQuestions(questionsText, candidate);
    } catch (error) {
      console.error("parseRecruiterQuestions failed, using single question", error.message);
      questions = [{ text: questionsText.slice(0, 200), prefill: "", status: "pending", answer: "" }];
    }
  }

  console.log("[reach-out] requested", {
    jobId,
    matchId: match.matchId,
    phone: match.phone,
    questionCount: questions.length,
    company: job.companyName || "",
    role: job.parsed?.title || "",
  });

  const { intro, created } = await createIntro({ jobId, job, match, source: "recruiter", note, questions });
  if (created || OFFERABLE.includes(intro.status)) {
    await offerIntro({ ...intro, recruiterRequested: true, recruiterNote: note, questions });
  } else {
    console.log("[reach-out] skipped offer", { introId: intro.id, status: intro.status });
  }

  const fresh = (await getDb().collection(INTROS).doc(intro.id).get()).data();
  console.log("[reach-out] done", {
    introId: intro.id,
    status: fresh?.status,
    delivery: fresh?.offerDelivery || null,
  });
  return { ok: true, intro: introView(fresh) };
}
