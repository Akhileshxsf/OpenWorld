import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebaseAdmin.js";

const CONFIG_DOC = ["whatsappConfig", "meta"];

let cached = null;

/**
 * Webhook metadata carries the real phone_number_id / WABA id; the env values can be stale.
 * Outbound sends that don't originate from a webhook (uploads, intros, schedules) read these.
 */
export async function rememberMetaIds({ phoneNumberId, wabaId }) {
  if (!phoneNumberId) return;
  if (cached?.phoneNumberId === phoneNumberId && (!wabaId || cached?.wabaId === wabaId)) return;
  cached = { phoneNumberId, wabaId: wabaId || cached?.wabaId || "" };

  const firestore = getDb();
  if (!firestore) return;
  try {
    await firestore
      .collection(CONFIG_DOC[0])
      .doc(CONFIG_DOC[1])
      .set({ ...cached, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("rememberMetaIds failed", error.message);
  }
}

export async function getMetaIds() {
  if (cached?.phoneNumberId) return cached;
  const firestore = getDb();
  if (firestore) {
    try {
      const snap = await firestore.collection(CONFIG_DOC[0]).doc(CONFIG_DOC[1]).get();
      if (snap.exists && snap.data().phoneNumberId) {
        cached = { phoneNumberId: snap.data().phoneNumberId, wabaId: snap.data().wabaId || "" };
        return cached;
      }
    } catch (error) {
      console.error("getMetaIds failed", error.message);
    }
  }
  return { phoneNumberId: process.env.META_PHONE_NUMBER_ID || "", wabaId: process.env.META_WABA_ID || "" };
}

export async function resolvePhoneNumberId(phoneNumberId) {
  return phoneNumberId || (await getMetaIds()).phoneNumberId;
}
