import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const memoryChats = new Map();
let db = undefined;

function getDb() {
  if (db !== undefined) return db;

  try {
    if (!getApps().length) {
      initializeApp();
    }
    db = getFirestore();
  } catch (error) {
    console.warn("Firestore unavailable, using in-memory WhatsApp chats:", error.message);
    db = null;
  }

  return db;
}

export async function loadChat(phone) {
  const firestore = getDb();
  if (!firestore) {
    return memoryChats.get(phone) || [];
  }

  try {
    const snap = await firestore.collection("whatsappChats").doc(phone).get();
    if (!snap.exists) return memoryChats.get(phone) || [];
    return snap.data()?.messages || [];
  } catch (error) {
    console.error("Failed to load WhatsApp chat", error);
    return memoryChats.get(phone) || [];
  }
}

export async function saveChat(phone, name, userText, botText) {
  const now = new Date().toISOString();
  const nextMessages = [
    ...(memoryChats.get(phone) || []),
    { sender: "user", text: userText, timestamp: now },
    { sender: "bot", text: botText, timestamp: now },
  ].slice(-20);
  memoryChats.set(phone, nextMessages);

  const firestore = getDb();
  if (!firestore) return;

  try {
    await firestore.collection("whatsappChats").doc(phone).set(
      {
        phone,
        name: name || "",
        updatedAt: FieldValue.serverTimestamp(),
        messages: FieldValue.arrayUnion(
          { sender: "user", text: userText, timestamp: now },
          { sender: "bot", text: botText, timestamp: now }
        ),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to save WhatsApp chat", error);
  }
}
