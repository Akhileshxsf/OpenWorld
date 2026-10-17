import { createHmac, timingSafeEqual } from "node:crypto";

function getSecret() {
  const secret = process.env.UPLOAD_LINK_SECRET;
  if (!secret) throw new Error("UPLOAD_LINK_SECRET is not configured");
  return secret;
}

export function signUploadToken(phone) {
  const id = String(phone || "").replace(/\D/g, "");
  return createHmac("sha256", getSecret()).update(`resume-upload:${id}`).digest("base64url").slice(0, 32);
}

export function verifyUploadToken(phone, token) {
  if (!token) return false;
  const expected = Buffer.from(signUploadToken(phone));
  const given = Buffer.from(String(token));
  return expected.length === given.length && timingSafeEqual(expected, given);
}
