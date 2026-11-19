import { FieldPath } from "firebase-admin/firestore";

const POOL_PAGE_SIZE = 500;
/** How many top prescore candidates get full LLM ranking (rest use prescore-only). */
export const SHORTLIST_FOR_LLM = 50;
const MUST_GUARANTEE_RATIO = 0.5;

function clean(value, max = 200) {
  return String(value || "").trim().slice(0, max);
}

function norm(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ")
    .trim();
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

export function preScore(candidate, jd) {
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
      : norm(jd.location)
          .split(" ")
          .some((w) => w.length > 2 && where.includes(w))
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
  return {
    score,
    coverage,
    mustMatched: matchedMust.length,
    matchedSkills: [...matchedMust, ...matchedNice],
  };
}

function isEligible(candidate) {
  if (candidate.jobSeekingStatus === "not_looking") return false;
  return Boolean(candidate.profileText || (candidate.skills || []).length);
}

function upsertScored(map, item) {
  const prev = map.get(item.phone);
  if (!prev || item.score > prev.score) map.set(item.phone, item);
}

function meetsMustGuarantee(item, jd) {
  if (!jd.mustHaveSkills.length) return false;
  const need = Math.max(1, Math.ceil(jd.mustHaveSkills.length * MUST_GUARANTEE_RATIO));
  return item.mustMatched >= need;
}

async function querySkillHits(firestore, jd) {
  const skills = jd.mustHaveSkills.map((s) => clean(s, 60)).filter(Boolean).slice(0, 10);
  if (!skills.length) return [];

  const hits = [];
  const chunkSize = 10;
  for (let i = 0; i < skills.length; i += chunkSize) {
    const batch = skills.slice(i, i + chunkSize);
    try {
      const snap = await firestore
        .collection("whatsappCandidates")
        .where("skills", "array-contains-any", batch)
        .limit(200)
        .get();
      for (const doc of snap.docs) {
        const candidate = doc.data();
        if (!isEligible(candidate)) continue;
        hits.push({ phone: doc.id, candidate, ...preScore(candidate, jd) });
      }
    } catch (error) {
      console.warn("skill index query skipped", error.message);
      break;
    }
  }
  return hits;
}

/**
 * Scan the candidate pool in pages (scales to large collections) and retrieve top preScore + skill hits.
 */
export async function buildMatchRetrievePool(firestore, jd) {
  const scoredByPhone = new Map();
  const mustGuarantee = new Map();
  let eligibleCount = 0;

  const skillHits = await querySkillHits(firestore, jd);
  for (const item of skillHits) {
    upsertScored(scoredByPhone, item);
    if (meetsMustGuarantee(item, jd)) mustGuarantee.set(item.phone, item);
  }

  let lastId = null;
  for (;;) {
    let q = firestore.collection("whatsappCandidates").orderBy(FieldPath.documentId()).limit(POOL_PAGE_SIZE);
    if (lastId) q = q.startAfter(lastId);
    const snap = await q.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      lastId = doc.id;
      const candidate = doc.data();
      if (!isEligible(candidate)) continue;
      eligibleCount += 1;
      const item = { phone: doc.id, candidate, ...preScore(candidate, jd) };
      upsertScored(scoredByPhone, item);
      if (meetsMustGuarantee(item, jd)) mustGuarantee.set(item.phone, item);
    }

    if (snap.size < POOL_PAGE_SIZE) break;
  }

  const retrievePool = [...scoredByPhone.values()].sort((a, b) => b.score - a.score);

  return { eligibleCount, retrievePool, mustGuarantee: [...mustGuarantee.values()] };
}

export function buildLlmShortlist(retrievePool, mustGuarantee, jd) {
  const seen = new Set();
  const shortlist = [];

  for (const item of retrievePool.sort((a, b) => b.score - a.score)) {
    if (seen.has(item.phone)) continue;
    seen.add(item.phone);
    shortlist.push(item);
    if (shortlist.length >= SHORTLIST_FOR_LLM) break;
  }

  for (const item of mustGuarantee.sort((a, b) => b.mustMatched - a.mustMatched || b.score - a.score)) {
    if (shortlist.length >= SHORTLIST_FOR_LLM) break;
    if (seen.has(item.phone)) continue;
    seen.add(item.phone);
    shortlist.push(item);
  }

  return shortlist.map((item, i) => ({ ...item, ref: `C${i + 1}` }));
}

export function anonymize(candidate) {
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