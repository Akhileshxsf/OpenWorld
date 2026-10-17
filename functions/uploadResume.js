import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getBucket, getDb } from "./firebaseAdmin.js";
import { processResumeForPhone } from "./resumeProcessor.js";
import { verifyUploadToken } from "./uploadToken.js";

const MAX_BYTES = 8 * 1024 * 1024;

export async function handleWhatsAppResumeUpload(body) {
  const phone = String(body.phone || "").replace(/\D/g, "");
  const fileName = String(body.fileName || "resume.pdf").replace(/[^\w.-]+/g, "_");
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
  if (buffer.length > MAX_BYTES) {
    throw new Error("File too large (max 8 MB)");
  }

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
      processingStatus: null,
      processingStartedAt: null,
      processingAttempts: 0,
      processingError: null,
      profileFromResumeAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  let processing = "done";
  let processingError = null;
  try {
    const result = await processResumeForPhone(phone, { notifyWhatsApp: true });
    if (result?.skipped) processing = "skipped";
  } catch (error) {
    console.error("processResumeForPhone after upload failed", phone, error.message);
    processing = "failed";
    processingError = error.message;
  }

  return { ok: true, phone, resumePath: path, resumeUrl, processing, processingError };
}
