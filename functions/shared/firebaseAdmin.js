import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let db = undefined;

export function ensureAdminApp() {
  if (!getApps().length) {
    initializeApp();
  }
}

export function getDb() {
  if (db !== undefined) return db;

  try {
    ensureAdminApp();
    db = getFirestore();
  } catch (error) {
    console.warn("Firestore unavailable:", error.message);
    db = null;
  }

  return db;
}

export function getBucket() {
  ensureAdminApp();
  return getStorage().bucket();
}
