import { createRequire } from "node:module";
import { getBucket } from "../shared/firebaseAdmin.js";
import { extractProfileFromResume } from "./candidateProfile.js";
import { claimResumeProcessing, getCandidate, mergeCandidate, patchResume } from "./candidateStore.js";
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

/** Short "here's what I read" message so the candidate can correct the profile before matching. */
export function buildResumeConfirmation(candidate, { updated = false } = {}) {
  const education = [candidate.degree, candidate.college].filter(Boolean).join(", ");
  const lines = [
    education && `🎓 ${education}${candidate.graduationYear ? ` (${candidate.graduationYear})` : ""}`,
    list(candidate.companies, 3) && `💼 ${list(candidate.companies, 3)}`,
    list(candidate.skills, 6) && `🛠 ${list(candidate.skills, 6)}`,
    list(candidate.roles, 3) && `🎯 Good fit for: ${list(candidate.roles, 3)}`,
  ].filter(Boolean);

  const opener = updated
    ? "Updated your profile with the new resume ✅"
    : "Got your resume ✅";
  const summary = lines.length ? `${opener} Here's what I picked up:\n\n${lines.join("\n")}` : opener;
  const nextGap = profileGaps(candidate)[0];
  const next = nextGap
    ? `Anything wrong or missing? Just tell me. Otherwise — ${nextGap.question.charAt(0).toLowerCase()}${nextGap.question.slice(1)}`
    : "Anything wrong or missing? Just tell me.";
  return `${summary}\n\n${next}`;
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
