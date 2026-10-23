import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getBucket, getDb } from "../shared/firebaseAdmin.js";
import { processResumeForPhone } from "./resumeProcessor.js";
import { verifyUploadToken } from "./uploadToken.js";

export const MAX_RESUME_BYTES = 8 * 1024 * 1024;

/** Saves the file to Storage and resets processing state so the next run rebuilds the profile. */
export async function storeResumeFile(phone, buffer, rawFileName, { source }) {
  const fileName = String(rawFileName || "resume.pdf").replace(/[^\w.-]+/g, "_");
  const path = `whatsapp-resumes/${phone}/${Date.now()}-${fileName}`;
  const file = getBucket().file(path);
  const contentType = fileName.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : "application/octet-stream";

  const downloadToken = randomUUID();
  await file.save(buffer, {
    metadata: { contentType, metadata: { firebaseStorageDownloadTokens: downloadToken } },
  });

  const resumeUrl =
    `https://firebasestorage.googleapis.com/v0/b/${file.bucket.name}/o/` +
    `${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;

  const firestore = getDb();
  if (!firestore) {
    throw new Error("Database unavailable");
  }

  await firestore.collection("whatsappResumes").doc(phone).set(
    {
      phone,
      resumePath: path,
      resumeUrl,
      fileName,
      source,
      uploadedAt: new Date().toISOString(),
      uploadCount: FieldValue.increment(1),
      processingStatus: null,
      processingStartedAt: null,
      processingAttempts: 0,
      processingError: null,
      profileFromResumeAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { resumePath: path, resumeUrl };
}

export async function handleWhatsAppResumeUpload(body) {
  const phone = String(body.phone || "").replace(/\D/g, "");
  const fileBase64 = String(body.fileBase64 || "");

  if (phone.length < 10) {
    throw new Error("Invalid or missing phone. Open the link from WhatsApp.");
  }
  if (!verifyUploadToken(phone, body.token)) {
    throw new Error("This upload link is invalid or outdated. Message Mira on WhatsApp for a fresh link.");
  }
  if (!fileBase64) {
    throw new Error("Missing file data");
  }

  const buffer = Buffer.from(fileBase64, "base64");
  if (!buffer.length) {
    throw new Error("Empty file");
  }
  if (buffer.length > MAX_RESUME_BYTES) {
    throw new Error("File too large (max 8 MB)");
  }

  const { resumePath, resumeUrl } = await storeResumeFile(phone, buffer, body.fileName, { source: "web" });

  let processing = "done";
  let processingError = null;
  try {
    const result = await processResumeForPhone(phone, { notifyWhatsApp: true, force: true });
    if (result?.skipped) processing = "skipped";
  } catch (error) {
    console.error("processResumeForPhone after upload failed", phone, error.message);
    processing = "failed";
    processingError = error.message;
  }

  return { ok: true, phone, resumePath, resumeUrl, processing, processingError };
}
