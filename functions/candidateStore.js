import { FieldValue } from "firebase-admin/firestore";
import { defaultCandidate } from "./candidateSchema.js";
import { getDb } from "./firebaseAdmin.js";

const RESUMES = "whatsappResumes";
const CANDIDATES = "whatsappCandidates";

export const PROCESSING_STALE_MS = 5 * 60 * 1000;
export const MAX_PROCESSING_ATTEMPTS = 3;

function normalizePhone(phone) {
  return String(phone).replace(/\D/g, "");
}

export async function getResume(phone) {
  const firestore = getDb();
  if (!firestore) return null;

  const id = normalizePhone(phone);
  const snap = await firestore.collection(RESUMES).doc(id).get();
  return snap.exists ? { id, ...snap.data() } : null;
}

export async function getCandidate(phone, displayName = "") {
  const firestore = getDb();
  const id = normalizePhone(phone);
  if (!firestore) return defaultCandidate(id, displayName);

  const snap = await firestore.collection(CANDIDATES).doc(id).get();
  if (!snap.exists) return defaultCandidate(id, displayName);
  return { ...defaultCandidate(id, displayName), ...snap.data(), phone: id };
}

function isEmpty(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && !value.trim()) ||
    (Array.isArray(value) && value.length === 0)
  );
}

function itemKey(item) {
  return typeof item === "string" ? item.trim().toLowerCase() : JSON.stringify(item);
}

function unionList(existing, incoming) {
  const seen = new Set();
  const out = [];
  for (const item of [...(Array.isArray(existing) ? existing : []), ...incoming]) {
    const key = itemKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Model output is a full profile rewrite, so it routinely omits facts it was given.
 * Empty values never overwrite stored ones; with unionArrays, lists only grow.
 */
export function mergeProfile(existing, patch, { unionArrays = false } = {}) {
  const out = {};
  for (const [key, value] of Object.entries(patch || {})) {
    if (key === "phone" || isEmpty(value)) continue;
    if (Array.isArray(value)) {
      out[key] = unionArrays ? unionList(existing?.[key], value) : value;
    } else {
      out[key] = value;
    }
  }
  return out;
}

export async function mergeCandidate(phone, patch, { unionArrays = false } = {}) {
  const firestore = getDb();
  const id = normalizePhone(phone);
  if (!firestore || !patch || typeof patch !== "object") return;

  const ref = firestore.collection(CANDIDATES).doc(id);
  await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const merged = mergeProfile(snap.exists ? snap.data() : {}, patch, { unionArrays });
    tx.set(ref, { ...merged, phone: id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}

export async function patchResume(phone, patch) {
  const firestore = getDb();
  const id = normalizePhone(phone);
  if (!firestore) return;

  await firestore.collection(RESUMES).doc(id).set(
    { ...patch, phone: id, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}

export function hasResumeOnFile(resume) {
  return Boolean(resume?.resumePath || resume?.resumeUrl);
}

function isProcessingActive(resume, now = Date.now()) {
  if (resume?.processingStatus !== "running") return false;
  const startedAt = Date.parse(resume.processingStartedAt || "");
  return Number.isFinite(startedAt) && now - startedAt < PROCESSING_STALE_MS;
}

/** True when a stored resume still needs (re)processing and isn't being handled right now. */
export function needsResumeProcessing(resume) {
  return (
    Boolean(resume?.resumePath) &&
    !resume.profileFromResumeAt &&
    !isProcessingActive(resume) &&
    (resume.processingAttempts || 0) < MAX_PROCESSING_ATTEMPTS
  );
}

/** Atomically marks the resume as running; returns the resume, or null if another run owns it. */
export async function claimResumeProcessing(phone) {
  const firestore = getDb();
  const id = normalizePhone(phone);
  if (!firestore) return null;

  const ref = firestore.collection(RESUMES).doc(id);
  return firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const resume = snap.exists ? { id, ...snap.data() } : null;
    if (!needsResumeProcessing(resume)) return null;

    tx.set(
      ref,
      {
        processingStatus: "running",
        processingStartedAt: new Date().toISOString(),
        processingAttempts: (resume.processingAttempts || 0) + 1,
        processingError: null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return resume;
  });
}
