import { downloadMetaMedia } from "./meta.js";
import { appendMessages } from "./chatStore.js";
import { groqJsonPrompt } from "./groqJson.js";
import { sendBotText } from "./outbound.js";
import { extractTextFromBuffer, processResumeForPhone } from "./resumeProcessor.js";
import { MAX_RESUME_BYTES, storeResumeFile } from "./uploadResume.js";

const MIN_READABLE_CHARS = 150;

const ASK_FOR_PDF =
  "Could you send your resume as a PDF? In Word or Google Docs use File → Save as / Download → PDF, then share it here 📄";

function isPdfFile(media) {
  return /pdf/i.test(media.mimeType) || /\.pdf$/i.test(media.fileName);
}

async function classifyDocument(text) {
  try {
    const parsed = await groqJsonPrompt(
      `Is this document a person's resume/CV? Reply JSON only: {"is_resume": true|false, "looks_like": "<2-4 words, e.g. fee receipt, offer letter, certificate>"}

Document text (start):
"""
${text.slice(0, 3000)}
"""`,
      { temperature: 0 }
    );
    return { isResume: parsed.is_resume !== false, looksLike: String(parsed.looks_like || "").slice(0, 40) };
  } catch (error) {
    console.warn("resume classification failed; accepting file", error.message);
    return { isResume: true, looksLike: "" };
  }
}

/** A file sent in the WhatsApp chat. Replies are sent here; returns a short result for logs. */
export async function handleChatResume(phone, message) {
  const { media } = message;
  const reply = (text, kind) => sendBotText(phone, text, { phoneNumberId: message.phoneNumberId, kind });

  await appendMessages(phone, message.name, [
    {
      sender: "user",
      text: `[Sent ${media.kind === "image" ? "a photo" : `a file: ${media.fileName || "document"}`}]${message.text ? ` ${message.text}` : ""}`,
      timestamp: new Date().toISOString(),
    },
  ]);

  if (media.kind === "image") {
    await reply(`Thanks! I can't read resumes from photos reliably. ${ASK_FOR_PDF}`, "resume_rejected");
    return { resume: "rejected", reason: "image" };
  }
  if (!isPdfFile(media)) {
    await reply(`Got your file, but I can only read PDFs right now. ${ASK_FOR_PDF}`, "resume_rejected");
    return { resume: "rejected", reason: "not_pdf" };
  }

  await reply("Got your resume 📄 Reading it now — give me a few seconds…", "resume_received");

  const download = await downloadMetaMedia(media.id, { maxBytes: MAX_RESUME_BYTES });
  if (download.tooLarge) {
    await reply("That file is over 8 MB — could you send a smaller PDF? Exporting it again usually shrinks it.", "resume_rejected");
    return { resume: "rejected", reason: "too_large" };
  }

  const { buffer } = download;
  const text = buffer.slice(0, 4).toString() === "%PDF" ? await extractTextFromBuffer(buffer, "resume.pdf").catch(() => "") : "";
  if (text.replace(/\s+/g, "").length < MIN_READABLE_CHARS) {
    await reply(
      "I couldn't read any text in that PDF — it may be a scan or photo. Could you export your resume directly from Word/Google Docs as a PDF and send it again?",
      "resume_rejected"
    );
    return { resume: "rejected", reason: "unreadable" };
  }

  const { isResume, looksLike } = await classifyDocument(text);
  if (!isResume) {
    await reply(
      `Hmm, that looks like ${looksLike ? `a ${looksLike}` : "a different document"}, not a resume. Could you send your resume PDF instead?`,
      "resume_rejected"
    );
    return { resume: "rejected", reason: "not_resume", looksLike };
  }

  const fileName = /\.pdf$/i.test(media.fileName) ? media.fileName : `${media.fileName || "resume"}.pdf`;
  await storeResumeFile(phone, buffer, fileName, { source: "whatsapp" });

  try {
    await processResumeForPhone(phone, { notifyWhatsApp: true, phoneNumberId: message.phoneNumberId });
    return { resume: "processed" };
  } catch (error) {
    return { resume: "failed", error: error.message.slice(0, 200) };
  }
}
