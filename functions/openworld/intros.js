import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../shared/firebaseAdmin.js";
import { getCandidate, getResume, mergeCandidate } from "./candidateStore.js";
import { updateProfileFromChat } from "./candidateProfile.js";
import { sendBotButtons, sendProactive } from "./outbound.js";
import { interpretAnswer } from "./introQuestions.js";
import {
  emailCandidateDeclined,
  emailCandidateInterested,
  emailFollowUpNudge,
} from "./introEmails.js";

export const INTROS = "hiringIntroRequests";

/**
 * pending_offer → awaiting_candidate → collecting_info → accepted
 *                                    ↘ declined / withdrawn / expired
 * undeliverable and candidate_not_looking are terminal until a recruiter re-requests.
 */
export const OFFERABLE = ["pending_offer", "awaiting_candidate", "undeliverable"];
const OPEN_STATUSES = ["awaiting_candidate", "collecting_info", "accepted"];

function nowIso() {
  return new Date().toISOString();
}

function firstName(candidate) {
  return String(candidate?.displayName || "").trim().split(/\s+/)[0] || "there";
}

function company(intro) {
  return intro.companyName || "the recruiter";
}

function roleLabel(intro) {
  return `${intro.roleTitle || "a role"}${intro.companyName ? ` at ${intro.companyName}` : ""}`;
}

function introRef(id) {
  return getDb().collection(INTROS).doc(id);
}

export function introId(jobId, matchId) {
  return `${jobId}_${matchId}`;
}

/** Moves an intro between statuses atomically; returns the intro as it was, or null if it wasn't in `from`. */
async function transition(id, from, to, extra = {}) {
  const firestore = getDb();
  const ref = introRef(id);
  return firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || !from.includes(snap.data().status)) return null;
    tx.set(ref, { status: to, statusChangedAt: nowIso(), ...extra }, { merge: true });
    return { id, ...snap.data() };
  });
}

async function loadIntro(id) {
  const snap = await introRef(id).get();
  return snap.exists ? { id, ...snap.data() } : null;
}

/** Creates the intro once; returns { intro, created }. A recruiter request upgrades an existing auto intro. */
export async function createIntro({ jobId, job, match, source, note = "", questions = [] }) {
  const firestore = getDb();
  const ref = introRef(introId(jobId, match.matchId));
  return firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      const existing = { id: ref.id, ...snap.data() };
      if (source === "recruiter") {
        const update = { recruiterRequested: true, recruiterNote: note || existing.recruiterNote || "" };
        // Questions can only change before the candidate starts answering.
        if (OFFERABLE.includes(existing.status)) update.questions = questions;
        tx.set(ref, update, { merge: true });
        return { intro: { ...existing, ...update }, created: false };
      }
      return { intro: existing, created: false };
    }
    const intro = {
      jobId,
      matchId: match.matchId,
      candidatePhone: match.phone,
      score: match.score,
      reasons: match.reasons || [],
      roleTitle: job.parsed?.title || "",
      roleLocation: job.parsed?.location || "",
      roleSummary: job.parsed?.summary || "",
      companyName: job.companyName || "",
      contactName: job.contactName || "",
      email: job.email || "",
      source,
      recruiterRequested: source === "recruiter",
      recruiterNote: note,
      questions,
      questionIndex: 0,
      candidateQuestions: [],
      status: "pending_offer",
      requestedAt: FieldValue.serverTimestamp(),
    };
    tx.set(ref, intro);
    return { intro: { id: ref.id, ...intro }, created: true };
  });
}

function offerText(intro) {
  const where = intro.roleLocation ? ` · ${intro.roleLocation}` : "";
  const count = (intro.questions || []).length;
  const opener =
    intro.source === "recruiter" || intro.recruiterRequested
      ? `${intro.contactName ? `${intro.contactName} from ` : "A recruiter at "}${company(intro)} is interested in you 🎯`
      : "New role that fits you 🎯";
  return [
    `${opener}\n${intro.roleTitle || "A role"}${intro.companyName ? ` at ${intro.companyName}` : ""}${where}`,
    intro.recruiterNote && `They wrote: "${intro.recruiterNote}"`,
    !intro.recruiterRequested && (intro.reasons || []).length && `Why you: ${intro.reasons.slice(0, 2).join("; ")}`,
    count
      ? `Interested? If yes, I'll ask you ${count === 1 ? "1 quick question" : `${count} quick questions`} from them and send your answers.`
      : "Interested? If yes, I'll let them know so they can reach out.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function offerMessage(intro, candidate, { reminder = false } = {}) {
  return {
    kind: reminder ? "intro_offer_reminder" : "intro_offer",
    text: reminder ? `Just checking 👋 ${offerText(intro)}` : offerText(intro),
    buttons: [
      { id: `intro:yes:${intro.id}`, title: "Yes, interested" },
      { id: `intro:no:${intro.id}`, title: "No thanks" },
    ],
    template: process.env.META_MATCH_TEMPLATE_NAME
      ? {
          name: process.env.META_MATCH_TEMPLATE_NAME,
          bodyParams: [firstName(candidate), intro.roleTitle || "a role", intro.companyName || "a company"],
          quickReplyPayloads: [`intro:yes:${intro.id}`, `intro:no:${intro.id}`],
          historyText: offerText(intro),
        }
      : null,
  };
}

/** Asks the candidate yes/no. Records delivery so the recruiter sees whether the candidate was reached. */
export async function offerIntro(intro) {
  const ref = introRef(intro.id);
  const candidate = await getCandidate(intro.candidatePhone, "");

  if (candidate.jobSeekingStatus === "not_looking") {
    await ref.set({ status: "candidate_not_looking", statusChangedAt: nowIso() }, { merge: true });
    return { delivered: false, reason: "not_looking" };
  }

  const delivery = await sendProactive(intro.candidatePhone, candidate, offerMessage(intro, candidate));

  await ref.set(
    {
      status: delivery.delivered ? "awaiting_candidate" : "undeliverable",
      statusChangedAt: nowIso(),
      offeredAt: nowIso(),
      offerDelivery: { delivered: delivery.delivered, via: delivery.via || null, reason: delivery.reason || null },
    },
    { merge: true }
  );
  return delivery;
}

export async function getOpenIntros(phone) {
  const firestore = getDb();
  if (!firestore) return [];
  const snap = await firestore
    .collection(INTROS)
    .where("candidatePhone", "==", phone)
    .where("status", "in", OPEN_STATUSES)
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export function questionPrompt(intro) {
  const questions = intro.questions || [];
  const i = intro.questionIndex || 0;
  const q = questions[i];
  const head = questions.length > 1 ? `${i + 1}/${questions.length}: ` : "";
  return q.prefill
    ? `${head}${q.text}\nYou told me "${q.prefill}" — still right? Reply yes, or send the updated answer.`
    : `${head}${q.text}`;
}

/** Sends the recruiter everything, marks the intro accepted, and folds the answers into the profile. */
export async function finalizeIntro(id, { partial = false } = {}) {
  const intro = await transition(id, ["collecting_info", "finalizing"], "finalizing");
  if (!intro) return null;

  const [candidate, resume] = await Promise.all([getCandidate(intro.candidatePhone, ""), getResume(intro.candidatePhone)]);
  const email = await emailCandidateInterested(intro, candidate, resume, { partial });
  await introRef(id).set(
    { status: "accepted", statusChangedAt: nowIso(), acceptedAt: nowIso(), partial, recruiterEmail: email },
    { merge: true }
  );

  const answered = (intro.questions || []).filter((q) => q.status === "answered");
  if (answered.length) {
    try {
      const qa = answered.map((q) => `${q.text} — ${q.answer}`).join("\n");
      const patch = await updateProfileFromChat(candidate, { userText: `Answers to a recruiter:\n${qa}` });
      await mergeCandidate(intro.candidatePhone, patch, { unionArrays: true });
    } catch (error) {
      console.error("profile update from intro answers failed", id, error.message);
    }
  }
  return { ...intro, partial };
}

function doneText(intro) {
  return `Done ✅ I've sent your ${(intro.questions || []).length ? "answers and " : ""}profile to ${company(intro)} for ${intro.roleTitle || "the role"}. They'll reach out to you directly — I'll check in with you in a few days.`;
}

/** Candidate tapped Yes/No (or typed it). Returns the WhatsApp reply text. */
export async function respondToIntro(phone, id, accept) {
  const intro = await loadIntro(id);
  if (!intro || intro.candidatePhone !== phone) {
    return "I couldn't find that role anymore — it may have been closed. I'll keep looking for you 👍";
  }
  if (!OFFERABLE.includes(intro.status)) {
    if (intro.status === "collecting_info") return questionPrompt(intro);
    if (intro.status === "accepted") return `You already said yes for ${roleLabel(intro)} — they have your details ✅`;
    return `Got it — you've already answered for ${roleLabel(intro)}.`;
  }

  if (!accept) {
    const declined = await transition(id, OFFERABLE, "declined", { respondedAt: nowIso() });
    if (!declined) return "Got it 👍";
    await sendBotButtons(
      phone,
      "No problem — I won't take this further. Mind telling me why? It helps me find better roles for you.",
      [
        { id: `why:compensation:${id}`, title: "Salary / location" },
        { id: `why:role_fit:${id}`, title: "Not the right role" },
        { id: `why:not_looking:${id}`, title: "Not looking now" },
      ],
      { kind: "decline_reason" }
    ).catch((error) => console.warn("decline reason prompt failed", error.message));
    return null;
  }

  const busy = (await getOpenIntros(phone)).find((i) => i.status === "collecting_info" && i.id !== id);
  if (busy) {
    return `Let's finish ${company(busy)}'s questions first, then tap Yes on this one again 🙂\n\n${questionPrompt(busy)}`;
  }

  const hasQuestions = (intro.questions || []).length > 0;
  const started = await transition(id, OFFERABLE, "collecting_info", {
    respondedAt: nowIso(),
    questionIndex: 0,
    lastCandidateActivityAt: nowIso(),
  });
  if (!started) return "Got it 👍";

  if (!hasQuestions) {
    const done = await finalizeIntro(id);
    return done ? doneText(done) : "Got it 👍";
  }

  const count = intro.questions.length;
  return `Great! ${company(intro)} has ${count === 1 ? "one quick question" : `${count} quick questions`}. Reply "skip" to skip one or "cancel" to stop.\n\n${questionPrompt({ ...intro, questionIndex: 0 })}`;
}

const SKIP = /^(skip|pass|next)\b/i;
const CANCEL = /^(cancel|stop|not interested|nevermind|never mind)\b/i;
const CONFIRM = /^(yes|yep|yeah|correct|right|same|still (the )?same|that'?s right)\b[\s.!]*$/i;

/** A text message while the candidate is answering a recruiter's questions. Returns the reply text. */
async function handleCollectingReply(phone, intro, text) {
  const ref = introRef(intro.id);
  const questions = [...(intro.questions || [])];
  const index = intro.questionIndex || 0;
  const current = questions[index];
  const update = { lastCandidateActivityAt: nowIso() };

  if (CANCEL.test(text)) {
    const withdrawn = await transition(intro.id, ["collecting_info"], "withdrawn", { declineReason: "withdrew" });
    if (withdrawn?.recruiterRequested) {
      const candidate = await getCandidate(phone, "");
      const email = await emailCandidateDeclined({ ...withdrawn, declineReason: "withdrew" }, candidate);
      await ref.set({ declineEmailSentAt: nowIso(), recruiterEmail: email }, { merge: true });
    }
    return `Okay, I've stopped — ${company(intro)} won't get your answers. I'll keep looking for other roles 👍`;
  }

  let prefix = "";
  if (SKIP.test(text)) {
    questions[index] = { ...current, status: "skipped", answer: "" };
  } else if (current.prefill && CONFIRM.test(text)) {
    questions[index] = { ...current, status: "answered", answer: current.prefill };
  } else {
    const job = await getDb().collection("hiringJobs").doc(intro.jobId).get();
    const role = [intro.roleTitle, intro.roleLocation, intro.roleSummary, job.data()?.jdText?.slice(0, 2500)].filter(Boolean).join("\n");
    const read = await interpretAnswer({ question: current.text, prefill: current.prefill, reply: text, role });

    if (read.candidateQuestion) {
      update.candidateQuestions = FieldValue.arrayUnion(read.candidateQuestion);
    }
    if (read.kind === "role_question") {
      await ref.set(update, { merge: true });
      const answer = read.reply || "Good question — I'll pass it to the recruiter.";
      return `${answer}\n\nBack to their question — ${questionPrompt(intro)}`;
    }
    if (read.kind === "off_topic") {
      await ref.set(update, { merge: true });
      return `Let's finish ${company(intro)}'s questions first (or reply "cancel" to stop).\n\n${questionPrompt(intro)}`;
    }
    questions[index] = {
      ...current,
      status: "answered",
      answer: read.kind === "confirm" ? current.prefill : read.answer,
    };
    if (read.candidateQuestion) prefix = "Noted — I'll pass your question to them too. ";
  }

  const nextIndex = index + 1;
  // Two quick messages can both answer the same question; only the first one advances.
  const saved = await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const latest = snap.data();
    if (latest?.status !== "collecting_info" || (latest.questionIndex || 0) !== index) return false;
    tx.set(ref, { ...update, questions, questionIndex: nextIndex }, { merge: true });
    return true;
  });
  if (!saved) return "Got it 👍";

  if (nextIndex < questions.length) {
    return `${prefix || "Got it 👍 "}\n\n${questionPrompt({ ...intro, questions, questionIndex: nextIndex })}`.trim();
  }
  const done = await finalizeIntro(intro.id);
  return done ? `${prefix}${doneText(done)}`.trim() : "Thanks! 🙌";
}

/** Decline reason button. Emails the recruiter (if they asked for this intro) with the reason. */
export async function recordDeclineReason(phone, id, reason) {
  const intro = await loadIntro(id);
  if (!intro || intro.candidatePhone !== phone || intro.status !== "declined") return "Thanks for telling me 🙏";
  if (intro.declineReason) return "Thanks — noted already 👍";

  await introRef(id).set({ declineReason: reason }, { merge: true });
  if (intro.recruiterRequested && !intro.declineEmailSentAt) {
    const candidate = await getCandidate(phone, "");
    const email = await emailCandidateDeclined({ ...intro, declineReason: reason }, candidate);
    await introRef(id).set({ declineEmailSentAt: nowIso(), recruiterEmail: email }, { merge: true });
  }

  if (reason === "not_looking") {
    await mergeCandidate(phone, { jobSeekingStatus: "not_looking" });
    return "Got it — I'll pause new roles for now. Message me anytime when you're looking again 👋";
  }
  return reason === "compensation"
    ? "Thanks! If your salary or location expectations changed, tell me and I'll update your profile so the next matches fit better."
    : "Thanks! Tell me what kind of role you'd prefer and I'll use it for the next matches.";
}

export async function respondToFollowUp(phone, id, inTouch) {
  const intro = await loadIntro(id);
  if (!intro || intro.candidatePhone !== phone) return "Thanks for letting me know!";
  if (intro.followUpStatus) return "Thanks — noted already 👍";

  await introRef(id).set({ followUpStatus: inTouch ? "in_touch" : "not_yet", followUpAnsweredAt: nowIso() }, { merge: true });
  if (inTouch) {
    return `Awesome 🙌 Good luck with ${company(intro)}! Want a few tips to prepare for the interview?`;
  }

  const candidate = await getCandidate(phone, "");
  const nudge = await emailFollowUpNudge(intro, candidate);
  await introRef(id).set({ recruiterNudge: nudge }, { merge: true });
  return `Thanks for telling me — I've nudged ${company(intro)}. Meanwhile I'll keep looking for other roles for you.`;
}

export async function respondToFreshness(phone, stillLooking) {
  await mergeCandidate(phone, {
    jobSeekingStatus: stillLooking ? "actively_looking" : "not_looking",
    freshnessAnsweredAt: nowIso(),
  });
  return stillLooking
    ? "Great 💪 Has anything changed — new skills, projects, location or salary expectations? Tell me and I'll update your profile. If your resume changed, just send the new PDF here."
    : "Got it — I'll pause role alerts. Message me anytime when you're looking again 👋";
}

/** Questions reminder template button: re-ask where they left off. */
async function resumeCollecting(phone, id) {
  const intro = await loadIntro(id);
  if (!intro || intro.candidatePhone !== phone || intro.status !== "collecting_info") {
    return "All good — nothing pending right now 👍";
  }
  await introRef(id).set({ lastCandidateActivityAt: nowIso() }, { merge: true });
  return `Thanks for coming back! ${questionPrompt(intro)}`;
}

const ACTION_PATTERN = /^(intro|follow):(yes|no):(.+)$|^why:(compensation|role_fit|not_looking):(.+)$|^collect:resume:(.+)$|^fresh:(yes|no)$/;

const YES = /^(yes|y|yeah|yep|sure|ok|okay|interested|yes,? interested)\b/i;
const NO = /^(no|n|nope|nah|not interested|no thanks)\b/i;

/**
 * Routes button taps, answers to recruiter questions, and a plain "yes"/"no" when exactly one offer
 * is waiting. Returns { handled, reply } — reply may be null when the handler already messaged.
 */
export async function handleCandidateAction(phone, { buttonId, text }) {
  const m = ACTION_PATTERN.exec(buttonId || "");
  if (m) {
    let reply;
    if (m[1] === "intro") reply = await respondToIntro(phone, m[3], m[2] === "yes");
    else if (m[1] === "follow") reply = await respondToFollowUp(phone, m[3], m[2] === "yes");
    else if (m[4]) reply = await recordDeclineReason(phone, m[5], m[4]);
    else if (m[6]) reply = await resumeCollecting(phone, m[6]);
    else reply = await respondToFreshness(phone, m[7] === "yes");
    return { handled: true, reply };
  }

  const trimmed = String(text || "").trim();
  if (!trimmed) return { handled: false };

  const open = await getOpenIntros(phone);
  const collecting = open.find((i) => i.status === "collecting_info");
  if (collecting) {
    return { handled: true, reply: await handleCollectingReply(phone, collecting, trimmed) };
  }

  if (trimmed.length > 30 || !(YES.test(trimmed) || NO.test(trimmed))) return { handled: false };
  const waiting = open.filter((i) => i.status === "awaiting_candidate");
  if (waiting.length !== 1) return { handled: false };
  return { handled: true, reply: await respondToIntro(phone, waiting[0].id, YES.test(trimmed)) };
}
