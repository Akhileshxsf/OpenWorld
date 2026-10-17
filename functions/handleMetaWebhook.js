import { extractMetaInboundMessages, sendMetaReadReceipt, sendMetaWhatsAppText } from "./meta.js";
import { generateMiraReply } from "./mira.js";
import { claimInboundMessage, loadChat, saveChat } from "./chatStore.js";
import { sendMetaResumeWelcome, buildResumeUploadUrl } from "./welcomeMessage.js";
import {
  getCandidate,
  getResume,
  hasResumeOnFile,
  mergeCandidate,
  needsResumeProcessing,
} from "./candidateStore.js";
import { updateProfileFromChat } from "./candidateProfile.js";
import { processResumeForPhone } from "./resumeProcessor.js";

export async function handleMetaWebhook(rawBody) {
  const { inbound, statuses } = extractMetaInboundMessages(rawBody);

  for (const status of statuses) {
    console.log("meta message status", {
      id: status.id,
      status: status.status,
      recipient: status.recipient,
      errors: status.errors.map((error) => ({
        code: error.code,
        title: error.title,
        message: error.message,
      })),
    });
  }

  if (!inbound.length) {
    return { ignored: true, type: statuses.length ? "status" : "unknown" };
  }

  const results = [];

  for (const message of inbound) {
    console.log("meta inbound message", {
      phone: message.phone,
      type: message.type,
      id: message.id,
      unsupported: message.unsupported,
      textPreview: message.text.slice(0, 80),
    });

    const phone = message.phone;
    if (!(await claimInboundMessage(message.id, phone))) {
      console.log("meta duplicate delivery skipped", { id: message.id, phone });
      results.push({ skipped: true, reason: "duplicate", phone });
      continue;
    }

    const readReceipt = sendMetaReadReceipt(message.id, message.phoneNumberId);

    let [history, resume, candidate] = await Promise.all([
      loadChat(phone),
      getResume(phone),
      getCandidate(phone, message.name || ""),
    ]);

    if (needsResumeProcessing(resume)) {
      try {
        await processResumeForPhone(phone, { notifyWhatsApp: false, phoneNumberId: message.phoneNumberId });
        [resume, candidate] = await Promise.all([getResume(phone), getCandidate(phone, message.name || "")]);
      } catch (error) {
        console.error("inline resume processing failed", phone, error.message);
      }
    }

    const hasResume = hasResumeOnFile(resume);
    const uploadUrl = buildResumeUploadUrl(phone);
    const firstContact = history.length === 0;

    if (message.name && !candidate.displayName) {
      await mergeCandidate(phone, { displayName: message.name });
      candidate.displayName = message.name;
    }

    if (firstContact && !message.unsupported) {
      await sendMetaResumeWelcome(phone, message.name, message.phoneNumberId);
    }

    const miraContext = { hasResume, uploadUrl, candidate };

    const reply = message.unsupported
      ? "I can read text on WhatsApp for now. Send me a short message — I'm Mira, and I help you find jobs that fit you."
      : await generateMiraReply(message.text, history, message.name, miraContext);
    await readReceipt;

    const sendResult = await sendMetaWhatsAppText(phone, reply, message.phoneNumberId);
    console.log("meta send result", sendResult);

    if (!message.unsupported) {
      await saveChat(phone, message.name, message.text, reply);

      try {
        const patch = await updateProfileFromChat(candidate, {
          userText: message.text,
          botText: reply,
        });
        if (message.name && !patch.displayName) {
          patch.displayName = message.name;
        }
        await mergeCandidate(phone, patch, { unionArrays: true });
      } catch (error) {
        console.error("profile update from chat failed", phone, error.message);
      }
    }

    results.push({ ok: true, phone, hasResume, sendResult });
  }

  return results.length === 1 ? results[0] : results;
}
