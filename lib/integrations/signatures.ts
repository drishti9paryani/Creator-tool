import { createHmac, timingSafeEqual } from "node:crypto";

export type SignedRequestResult =
  | { ok: true; senderId: string }
  | { ok: false; reason: "missing_signature" | "invalid_signature" | "stale_request" };

export function signRequest(
  body: string,
  timestamp: string,
  senderId: string,
  secret: string
): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${senderId}.${body}`)
    .digest("hex");
}

function sameSignature(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifySignedRequest(
  body: string,
  headers: Record<string, string | undefined>,
  secret: string,
  now = new Date()
): SignedRequestResult {
  const timestamp = headers["x-openclaw-timestamp"];
  const senderId = headers["x-openclaw-sender"];
  const signature = headers["x-openclaw-signature"];
  if (!timestamp || !senderId || !signature) return { ok: false, reason: "missing_signature" };

  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed) || Math.abs(now.getTime() - parsed) > 5 * 60 * 1000) {
    return { ok: false, reason: "stale_request" };
  }

  const expected = signRequest(body, timestamp, senderId, secret);
  if (!sameSignature(signature, expected)) return { ok: false, reason: "invalid_signature" };
  return { ok: true, senderId };
}