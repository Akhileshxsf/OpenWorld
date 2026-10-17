import { createRequire } from "node:module";
import { getBucket } from "./firebaseAdmin.js";
import { extractProfileFromResume } from "./candidateProfile.js";
import { claimResumeProcessing, getCandidate, mergeCandidate, patchResume } from "./candidateStore.js";
import { sendMetaWhatsAppText } from "./meta.js";

const require = createRequire(import.meta.url);
// The package root runs a debug self-test when it has no module.parent (true under createRequire).
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

async function downloadResumeBuffer(resumePath) {
  const [buffer] = await getBucket().file(resumePath).download();
  return buffer;
}

async function extractTextFromBuffer(buffer, fileName = "") {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf") || buffer.slice(0, 4).toString() === "%PDF") {
    const data = await pdfParse(buffer);
    return data.text || "";
  }
  return buffer.toString("utf8").slice(0, 12000);
}

export async function processResumeForPhone(phone, { notifyWhatsApp = true, phoneNumberId } = {}) {
  const id = String(phone).replace(/\D/g, "");
  const resume = await claimResumeProcessing(id);
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

    if (existing.displayName) {
      patch.displayName = existing.displayName;
    }

    await mergeCandidate(id, patch);
    await patchResume(id, {
      processingStatus: "done",
      profileFromResumeAt: new Date().toISOString(),
    });

    if (notifyWhatsApp) {
      try {
        await sendMetaWhatsAppText(
          id,
          "Got your resume — tell me what kind of jobs you're looking for (role, location, timeline).",
          phoneNumberId
        );
      } catch (error) {
        console.warn("post-resume WhatsApp notify failed", error.message);
      }
    }

    return { ok: true, phone: id };
  } catch (error) {
    console.error("processResumeForPhone failed", id, error);
    await patchResume(id, { processingStatus: "failed", processingError: error.message });
    throw error;
  }
}
