import { getDb } from "./firebaseAdmin.js";
import { getCandidate, mergeCandidate } from "./candidateStore.js";
import { INTROS, finalizeIntro, offerMessage, questionPrompt } from "./intros.js";
import { emailCandidateDeclined, emailNoResponse } from "./introEmails.js";
import { sendProactive } from "./outbound.js";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const OFFER_REMINDER_AFTER = DAY;
const OFFER_EXPIRES_AFTER = 7 * DAY;
const QUESTIONS_REMINDER_AFTER = 20 * HOUR;
const QUESTIONS_PARTIAL_AFTER = 2 * DAY;
const FINALIZE_STUCK_AFTER = 10 * 60 * 1000;
const DECLINE_EMAIL_AFTER = 3 * HOUR;
const FOLLOW_UP_AFTER = 4 * DAY;
const FRESHNESS_AFTER = 45 * DAY;

function olderThan(iso, ms, now) {
  const time = Date.parse(iso || "");
  return Number.isFinite(time) && now - time > ms;
}

function firstName(candidate) {
  return String(candidate?.displayName || "").trim().split(/\s+/)[0] || "there";
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

async function remindOrExpireOffers(firestore, now) {
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

  const reminded = await each(waiting, async ({ ref, intro }) => {
    if (!intro.recruiterRequested || intro.offerReminderAt) return false;
    if (!olderThan(intro.offeredAt, OFFER_REMINDER_AFTER, now) || olderThan(intro.offeredAt, OFFER_EXPIRES_AFTER, now)) return false;
    const candidate = await getCandidate(intro.candidatePhone, "");
    const delivery = await sendProactive(intro.candidatePhone, candidate, offerMessage(intro, candidate, { reminder: true }));
    await ref.set({ offerReminderAt: new Date(now).toISOString(), offerReminderDelivery: delivery.reason || "delivered" }, { merge: true });
    return delivery.delivered;
  });

  return { expired, reminded };
}

async function nudgeOrCloseQuestions(firestore, now) {
  const collecting = await introsWithStatus(firestore, "collecting_info");

  const partial = await each(collecting, async ({ intro }) => {
    if (!olderThan(intro.lastCandidateActivityAt, QUESTIONS_PARTIAL_AFTER, now)) return false;
    return Boolean(await finalizeIntro(intro.id, { partial: true }));
  });

  const reminded = await each(collecting, async ({ ref, intro }) => {
    if (intro.questionsReminderAt) return false;
    if (!olderThan(intro.lastCandidateActivityAt, QUESTIONS_REMINDER_AFTER, now)) return false;
    if (olderThan(intro.lastCandidateActivityAt, QUESTIONS_PARTIAL_AFTER, now)) return false;
    const candidate = await getCandidate(intro.candidatePhone, "");
    const company = intro.companyName || "The recruiter";
    const delivery = await sendProactive(intro.candidatePhone, candidate, {
      kind: "questions_reminder",
      text: `Quick reminder 👋 ${company} is still waiting for your answers about ${intro.roleTitle || "the role"}.\n\n${questionPrompt(intro)}`,
      template: process.env.META_QUESTIONS_REMINDER_TEMPLATE_NAME
        ? {
            name: process.env.META_QUESTIONS_REMINDER_TEMPLATE_NAME,
            bodyParams: [firstName(candidate), intro.companyName || "the company", intro.roleTitle || "the role"],
            quickReplyPayloads: [`collect:resume:${intro.id}`],
          }
        : null,
    });
    await ref.set({ questionsReminderAt: new Date(now).toISOString(), questionsReminderDelivery: delivery.reason || "delivered" }, { merge: true });
    return delivery.delivered;
  });

  const stuck = await introsWithStatus(firestore, "finalizing");
  const recovered = await each(stuck, async ({ intro }) => {
    if (!olderThan(intro.statusChangedAt, FINALIZE_STUCK_AFTER, now)) return false;
    return Boolean(await finalizeIntro(intro.id, { partial: Boolean(intro.partial) }));
  });

  return { partial, reminded, recovered };
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

async function sendFollowUps(firestore, now) {
  const accepted = await introsWithStatus(firestore, "accepted");
  return each(accepted, async ({ ref, intro }) => {
    if (intro.followUpSentAt || !olderThan(intro.acceptedAt || intro.respondedAt, FOLLOW_UP_AFTER, now)) return false;

    const candidate = await getCandidate(intro.candidatePhone, "");
    const company = intro.companyName || "the recruiter";
    const delivery = await sendProactive(intro.candidatePhone, candidate, {
      kind: "intro_follow_up",
      text: `Quick check-in 👋 Has ${company} reached out about ${intro.roleTitle || "the role"} yet?`,
      buttons: [
        { id: `follow:yes:${intro.id}`, title: "Yes, in touch" },
        { id: `follow:no:${intro.id}`, title: "Not yet" },
      ],
      template: process.env.META_FOLLOWUP_TEMPLATE_NAME
        ? {
            name: process.env.META_FOLLOWUP_TEMPLATE_NAME,
            bodyParams: [firstName(candidate), company, intro.roleTitle || "the role"],
            quickReplyPayloads: [`follow:yes:${intro.id}`, `follow:no:${intro.id}`],
          }
        : null,
    });
    await ref.set(
      { followUpSentAt: new Date(now).toISOString(), followUpDelivery: { delivered: delivery.delivered, reason: delivery.reason || null } },
      { merge: true }
    );
    return delivery.delivered;
  });
}

async function sendFreshnessCheckIns(firestore, now) {
  const snap = await firestore.collection("whatsappCandidates").get();
  const candidates = snap.docs.map((doc) => ({ id: doc.id, candidate: { phone: doc.id, ...doc.data() } }));
  return each(candidates, async ({ candidate }) => {
    if (candidate.jobSeekingStatus === "not_looking") return false;
    if (!olderThan(candidate.lastInboundAt, FRESHNESS_AFTER, now)) return false;
    if (candidate.freshnessPingAt && !olderThan(candidate.freshnessPingAt, FRESHNESS_AFTER, now)) return false;

    const delivery = await sendProactive(candidate.phone, candidate, {
      kind: "freshness_check_in",
      text: `Hi ${firstName(candidate)} 👋 Are you still looking for a new role?`,
      buttons: [
        { id: "fresh:yes", title: "Still looking" },
        { id: "fresh:no", title: "Not right now" },
      ],
      template: process.env.META_CHECKIN_TEMPLATE_NAME
        ? {
            name: process.env.META_CHECKIN_TEMPLATE_NAME,
            bodyParams: [firstName(candidate)],
            quickReplyPayloads: ["fresh:yes", "fresh:no"],
          }
        : null,
    });
    if (delivery.reason === "not_allowlisted") return false;
    await mergeCandidate(candidate.phone, {
      freshnessPingAt: new Date(now).toISOString(),
      freshnessDelivery: delivery.delivered ? "delivered" : delivery.reason,
    });
    return delivery.delivered;
  });
}

export async function runDailyCandidateJobs(now = Date.now()) {
  const firestore = getDb();
  if (!firestore) throw new Error("Database unavailable");
  return {
    offers: await remindOrExpireOffers(firestore, now),
    questions: await nudgeOrCloseQuestions(firestore, now),
    declineEmails: await sendPendingDeclineEmails(firestore, now),
    followUps: await sendFollowUps(firestore, now),
    freshness: await sendFreshnessCheckIns(firestore, now),
  };
}
