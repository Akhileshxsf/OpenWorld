import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebaseAdmin.js";

const CHATS = "whatsappChats";
const PROCESSED_MESSAGES = "whatsappProcessedMessages";
const MAX_STORED_MESSAGES = 40;

const memoryChats = new Map();

export async function isFirstWhatsAppContact(phone) {
  const history = await loadChat(phone);
  return history.length === 0;
}

export async function loadChat(phone) {
  const firestore = getDb();
  if (!firestore) {
    return memoryChats.get(phone) || [];
  }

  try {
    const snap = await firestore.collection(CHATS).doc(phone).get();
    if (!snap.exists) return memoryChats.get(phone) || [];
    return snap.data()?.messages || [];
  } catch (error) {
    console.error("Failed to load WhatsApp chat", error);
    return memoryChats.get(phone) || [];
  }
}

export async function saveChat(phone, name, userText, botText) {
  const now = new Date().toISOString();
  await appendMessages(phone, name, [
    { sender: "user", text: userText, timestamp: now },
    { sender: "bot", text: botText, timestamp: now },
  ]);
}

/** Messages Mira sends on her own (welcome, upload confirmation, alerts) so later replies see them. */
export async function appendBotMessage(phone, text, { kind = "" } = {}) {
  await appendMessages(phone, "", [
    { sender: "bot", text, timestamp: new Date().toISOString(), ...(kind ? { kind } : {}) },
  ]);
}

export async function appendMessages(phone, name, newMessages) {
  memoryChats.set(phone, [...(memoryChats.get(phone) || []), ...newMessages].slice(-MAX_STORED_MESSAGES));

  const firestore = getDb();
  if (!firestore) return;

  const ref = firestore.collection(CHATS).doc(phone);
  try {
    await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const existing = snap.exists ? snap.data()?.messages || [] : [];
      tx.set(
        ref,
        {
          phone,
          ...(name ? { name } : {}),
          updatedAt: FieldValue.serverTimestamp(),
          messages: [...existing, ...newMessages].slice(-MAX_STORED_MESSAGES),
        },
        { merge: true }
      );
    });
  } catch (error) {
    console.error("Failed to save WhatsApp chat", error);
  }
}

/** Returns false if this inbound message id was already handled (Meta retries slow webhooks). */
export async function claimInboundMessage(messageId, phone) {
  const firestore = getDb();
  if (!firestore || !messageId) return true;

  try {
    await firestore.collection(PROCESSED_MESSAGES).doc(messageId).create({
      phone,
      receivedAt: FieldValue.serverTimestamp(),
    });
    return true;
  } catch (error) {
    if (error.code === 6) return false;
    console.error("claimInboundMessage failed; processing anyway", error.message);
    return true;
  }
}
