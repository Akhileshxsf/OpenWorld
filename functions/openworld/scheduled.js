import { getDb } from "../shared/firebaseAdmin.js";
import { getCandidate } from "./candidateStore.js";
import { INTROS, finalizeIntro } from "./intros.js";
import { emailCandidateDeclined, emailNoResponse } from "./introEmails.js";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const OFFER_EXPIRES_AFTER = 7 * DAY;
const QUESTIONS_PARTIAL_AFTER = 2 * DAY;
const FINALIZE_STUCK_AFTER = 10 * 60 * 1000;
const DECLINE_EMAIL_AFTER = 3 * HOUR;

function olderThan(iso, ms, now) {
  const time = Date.parse(iso || "");
  return Number.isFinite(time) && now - time > ms;
}

async function introsWithStatus(firestore, status) {
  const snap = await firestore.collection(INTROS).where("status", "==", status).get();
  return snap.docs.map((doc) => ({ ref: doc.ref, intro: { id: doc.id, ...doc.data() } }));
}

/** Each task is independent; one failing intro must not stop the rest. */
async function each(items, fn) {
  let done = 0;
  for (const item of items) {
    try {
      if (await fn(item)) done += 1;
    } catch (error) {
      console.error("scheduled task item failed", item.intro?.id || item.id, error.message);
    }
  }
  return done;
}

/** Expire stale offers and email recruiters; no scheduled WhatsApp reminders. */
async function expireOffers(firestore, now) {
  const waiting = await introsWithStatus(firestore, "awaiting_candidate");

  const expired = await each(waiting, async ({ ref, intro }) => {
    if (!olderThan(intro.offeredAt, OFFER_EXPIRES_AFTER, now)) return false;
    await ref.set({ status: "expired", statusChangedAt: new Date(now).toISOString() }, { merge: true });
    if (intro.recruiterRequested) {
      const email = await emailNoResponse(intro, await getCandidate(intro.candidatePhone, ""));
      await ref.set({ recruiterEmail: email }, { merge: true });
    }
    return true;
  });

  return { expired };
}

async function closeStaleQuestionFlows(firestore, now) {
  const collecting = await introsWithStatus(firestore, "collecting_info");

  const partial = await each(collecting, async ({ intro }) => {
    if (!olderThan(intro.lastCandidateActivityAt, QUESTIONS_PARTIAL_AFTER, now)) return false;
    return Boolean(await finalizeIntro(intro.id, { partial: true }));
  });

  const stuck = await introsWithStatus(firestore, "finalizing");
  const recovered = await each(stuck, async ({ intro }) => {
    if (!olderThan(intro.statusChangedAt, FINALIZE_STUCK_AFTER, now)) return false;
    return Boolean(await finalizeIntro(intro.id, { partial: Boolean(intro.partial) }));
  });

  return { partial, recovered };
}

/** Declines wait briefly for a reason button; recruiters who asked hear back either way. */
async function sendPendingDeclineEmails(firestore, now) {
  const declined = await introsWithStatus(firestore, "declined");
  return each(declined, async ({ ref, intro }) => {
    if (!intro.recruiterRequested || intro.declineEmailSentAt) return false;
    if (!olderThan(intro.respondedAt, DECLINE_EMAIL_AFTER, now)) return false;
    const email = await emailCandidateDeclined(intro, await getCandidate(intro.candidatePhone, ""));
    await ref.set({ declineEmailSentAt: new Date(now).toISOString(), recruiterEmail: email }, { merge: true });
    return true;
  });
}

export async function runDailyCandidateJobs(now = Date.now()) {
  const firestore = getDb();
  if (!firestore) throw new Error("Database unavailable");
  return {
    offers: await expireOffers(firestore, now),
    questions: await closeStaleQuestionFlows(firestore, now),
    declineEmails: await sendPendingDeclineEmails(firestore, now),
  };
}
