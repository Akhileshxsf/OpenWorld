import { createRequire } from "node:module";
import { getBucket } from "../shared/firebaseAdmin.js";
import { extractProfileFromResume } from "./candidateProfile.js";
import { claimResumeProcessing, getCandidate, getResume, mergeCandidate, patchResume } from "./candidateStore.js";
import { profileGaps, resolveDisplayName } from "../shared/candidateSchema.js";
import { sendBotText } from "./outbound.js";

const require = createRequire(import.meta.url);
// The package root runs a debug self-test when it has no module.parent (true under createRequire).
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

async function downloadResumeBuffer(resumePath) {
  const [buffer] = await getBucket().file(resumePath).download();
  return buffer;
}

export async function extractTextFromBuffer(buffer, fileName = "") {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf") || buffer.slice(0, 4).toString() === "%PDF") {
    const data = await pdfParse(buffer);
    return data.text || "";
  }
  return buffer.toString("utf8").slice(0, 12000);
}

function list(values, max) {
  return (Array.isArray(values) ? values : []).filter(Boolean).slice(0, max).join(", ");
}

function conciseSummary(profileText, max = 120) {
  const t = String(profileText || "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const period = cut.lastIndexOf(". ");
  if (period >= 40) return cut.slice(0, period + 1);
  return `${cut.trimEnd()}…`;
}

/** 2–3 lines only; full profileText stays in Firestore for recruiters. */
function profilePreviewBody(candidate) {
  const first = String(candidate.displayName || "")
    .trim()
    .split(/\s+/)[0];
  const edu = [candidate.college, candidate.degree].filter(Boolean).join(" · ");
  const parts = [];
  if (first) parts.push(`👤 ${first}`);
  if (edu) {
    const year = candidate.graduationYear ? ` '${String(candidate.graduationYear).slice(-2)}` : "";
    parts.push(`🎓 ${edu}${year}`);
  }
  const skills = list(candidate.skills, 4);
  if (skills) parts.push(`🛠 ${skills}`);
  if (!parts.length) return conciseSummary(candidate.profileText) || "Resume saved.";
  return parts.slice(0, 3).join("\n");
}

function profileCompletionMessage(candidate) {
  const gaps = profileGaps(candidate);
  if (!gaps.length) {
    return "✅ Your profile is ready for recruiter matching. Reply here if anything looks wrong.";
  }
  const need = gaps
    .slice(0, 4)
    .map((g) => g.label)
    .join(", ");
  const extra = gaps.length > 4 ? ` (+${gaps.length - 4} more)` : "";
  return (
    `A few more details will complete your profile: ${need}${extra}.\n\n` +
    `First up — ${gaps[0].question}`
  );
}

/** Sent after parsing; candidate can correct before matching. */
export function buildResumeConfirmation(candidate, { updated = false } = {}) {
  const headline = updated ? "Updated snapshot:" : "Quick snapshot:";
  const body = profilePreviewBody(candidate);
  const footer = profileCompletionMessage(candidate);
  return `${headline}\n\n${body}\n\n${footer}`;
}

export async function processResumeForPhone(phone, { notifyWhatsApp = true, phoneNumberId, force = false } = {}) {
  const id = String(phone).replace(/\D/g, "");
  const resume = await claimResumeProcessing(id, { force });
  if (!resume) {
    return { skipped: true, reason: "not_needed_or_in_progress" };
  }

  try {
    const buffer = await downloadResumeBuffer(resume.resumePath);
    const extractedText = await extractTextFromBuffer(buffer, resume.fileName || "");
    await patchResume(id, {
      extractedText: extractedText.slice(0, 50000),
      processingStatus: "parsed",
    });

    const existing = await getCandidate(id, "");
    const patch = await extractProfileFromResume(extractedText, {
      whatsAppDisplayName: existing.displayName || "",
    });

    const isReupload = (resume.uploadCount || 0) > 1;
    patch.displayName = resolveDisplayName({
      existing: existing.displayName,
      fromResume: patch.displayName,
      fromWhatsApp: existing.displayName,
      preferResume: isReupload || !existing.displayName,
    });

    await mergeCandidate(id, patch);
    await patchResume(id, {
      processingStatus: "done",
      profileFromResumeAt: new Date().toISOString(),
    });

    if (notifyWhatsApp) {
      try {
        const [updated, latestResume] = await Promise.all([getCandidate(id, ""), getResume(id)]);
        const text = buildResumeConfirmation(updated, { updated: (latestResume?.uploadCount || resume.uploadCount || 0) > 1 });
        await sendBotText(id, text, { phoneNumberId, kind: "resume_confirmation" });
      } catch (error) {
        console.warn("post-resume WhatsApp notify failed", error.message);
      }
    }

    return { ok: true, phone: id };
  } catch (error) {
    console.error("processResumeForPhone failed", id, error);
    await patchResume(id, { processingStatus: "failed", processingError: error.message });
    if (notifyWhatsApp) {
      await sendBotText(
        id,
        "I received your file but couldn't read it 😕 Could you send it again here as a PDF (File → Save as PDF)?",
        { phoneNumberId, kind: "resume_failed" }
      ).catch((notifyError) => console.warn("resume failure notify failed", notifyError.message));
    }
    throw error;
  }
}
