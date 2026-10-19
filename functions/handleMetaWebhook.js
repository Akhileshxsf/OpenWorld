import { extractMetaInboundMessages, sendMetaReadReceipt, sendMetaWhatsAppText } from "./meta.js";
import { generateMiraReply } from "./mira.js";
import { appendMessages, claimInboundMessage, loadChat, saveChat } from "./chatStore.js";
import { sendMetaResumeWelcome, buildResumeUploadUrl } from "./welcomeMessage.js";
import { getCandidate, getResume, hasResumeOnFile, mergeCandidate, needsResumeProcessing } from "./candidateStore.js";
import { profileGaps } from "./candidateSchema.js";
import { updateProfileFromChat } from "./candidateProfile.js";
import { processResumeForPhone } from "./resumeProcessor.js";
import { rememberMetaIds } from "./metaConfig.js";
import { getOpenIntros, handleCandidateAction } from "./intros.js";
import { sendBotText } from "./outbound.js";
import { handleChatResume } from "./chatResume.js";

const PROFILE_READY_TEXT =
  "Your profile is ready ✅ Recruiters hiring on OpenWorldX can now find you, and I'll message you here whenever one is interested — you decide yes or no. " +
  "Want to change anything? Just tell me anytime.";

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
      buttonId: message.buttonId,
      unsupported: message.unsupported,
      textPreview: message.text.slice(0, 80),
    });

    const phone = message.phone;
    if (!(await claimInboundMessage(message.id, phone))) {
      console.log("meta duplicate delivery skipped", { id: message.id, phone });
      results.push({ skipped: true, reason: "duplicate", phone });
      continue;
    }

    await rememberMetaIds({ phoneNumberId: message.phoneNumberId, wabaId: message.wabaId });
    const readReceipt = sendMetaReadReceipt(message.id, message.phoneNumberId);

    let [history, resume, candidate] = await Promise.all([
      loadChat(phone),
      getResume(phone),
      getCandidate(phone, message.name || ""),
    ]);

    await mergeCandidate(phone, {
      lastInboundAt: new Date().toISOString(),
      ...(message.name && !candidate.displayName ? { displayName: message.name } : {}),
    });
    candidate.lastInboundAt = new Date().toISOString();
    if (message.name && !candidate.displayName) candidate.displayName = message.name;

    if (message.unsupported) {
      await readReceipt;
      const reply =
        "I can read text messages and PDF resumes here. Send me a message or your resume PDF — I'm Mira, and I help you find jobs that fit you.";
      const sendResult = await sendMetaWhatsAppText(phone, reply, message.phoneNumberId);
      results.push({ ok: true, phone, unsupported: true, sendResult });
      continue;
    }

    if (message.media?.id) {
      await readReceipt;
      try {
        results.push({ ok: true, phone, ...(await handleChatResume(phone, message)) });
      } catch (error) {
        console.error("chat resume failed", phone, error.message);
        await sendBotText(
          phone,
          "Sorry, I couldn't open that file 😕 Could you send it again? If it keeps failing, ask me for the upload link.",
          { phoneNumberId: message.phoneNumberId, kind: "resume_failed" }
        ).catch(() => {});
        results.push({ ok: false, phone, error: error.message.slice(0, 200) });
      }
      continue;
    }

    const action = await handleCandidateAction(phone, { buttonId: message.buttonId, text: message.text });
    if (action.handled) {
      await readReceipt;
      if (action.reply) {
        await sendMetaWhatsAppText(phone, action.reply, message.phoneNumberId);
        await saveChat(phone, message.name, message.text, action.reply);
      } else {
        await appendMessages(phone, message.name, [{ sender: "user", text: message.text, timestamp: new Date().toISOString() }]);
      }
      results.push({ ok: true, phone, action: message.buttonId || "intro_reply" });
      continue;
    }

    if (history.length === 0 && !hasResumeOnFile(resume)) {
      await readReceipt;
      const welcome = await sendMetaResumeWelcome(phone, candidate.displayName, message.phoneNumberId);
      const now = new Date().toISOString();
      await appendMessages(phone, message.name, [
        { sender: "user", text: message.text, timestamp: now },
        { sender: "bot", text: welcome, timestamp: now, kind: "welcome" },
      ]);
      results.push({ ok: true, phone, welcome: true });
      continue;
    }

    if (needsResumeProcessing(resume)) {
      try {
        await processResumeForPhone(phone, { notifyWhatsApp: false, phoneNumberId: message.phoneNumberId });
        [resume, candidate] = await Promise.all([getResume(phone), getCandidate(phone, message.name || "")]);
      } catch (error) {
        console.error("inline resume processing failed", phone, error.message);
        resume = await getResume(phone);
      }
    }

    const intros = await getOpenIntros(phone).catch((error) => {
      console.error("getOpenIntros failed", error.message);
      return [];
    });

    const reply = await generateMiraReply(message.text, history, message.name, {
      resume,
      candidate,
      intros,
      uploadUrl: buildResumeUploadUrl(phone),
    });
    await readReceipt;

    const sendResult = await sendMetaWhatsAppText(phone, reply, message.phoneNumberId);
    console.log("meta send result", sendResult);
    await saveChat(phone, message.name, message.text, reply);

    try {
      const patch = await updateProfileFromChat(candidate, { userText: message.text, botText: reply });
      if (message.name && !patch.displayName) patch.displayName = message.name;
      await mergeCandidate(phone, patch, { unionArrays: true });

      const updated = await getCandidate(phone, "");
      if (resume?.profileFromResumeAt && !updated.profileReadyAt && !profileGaps(updated).length) {
        await sendBotText(phone, PROFILE_READY_TEXT, { phoneNumberId: message.phoneNumberId, kind: "profile_ready" });
        await mergeCandidate(phone, { profileReadyAt: new Date().toISOString() });
      }
    } catch (error) {
      console.error("profile update from chat failed", phone, error.message);
    }

    results.push({ ok: true, phone, hasResume: hasResumeOnFile(resume), sendResult });
  }

  return results.length === 1 ? results[0] : results;
}
