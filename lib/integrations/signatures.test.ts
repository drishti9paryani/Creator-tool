import { describe, expect, it } from "vitest";
import { signRequest, verifySignedRequest } from "@/lib/integrations/signatures";

const secret = "local-test-secret";
const body = JSON.stringify({ eventId: "telegram-1", command: "status" });

function signedHeaders(timestamp = "2026-09-14T15:00:00.000Z", senderId = "allowed-user") {
  return {
    "x-openclaw-timestamp": timestamp,
    "x-openclaw-sender": senderId,
    "x-openclaw-signature": signRequest(body, timestamp, senderId, secret),
  };
}

describe("OpenClaw webhook signatures", () => {
  it("accepts an authentic recent request", () => {
    const result = verifySignedRequest(
      body,
      signedHeaders(),
      secret,
      new Date("2026-09-14T15:02:00.000Z")
    );

    expect(result).toEqual({ ok: true, senderId: "allowed-user" });
  });

  it("rejects a changed body and a stale timestamp", () => {
    expect(
      verifySignedRequest(
        body + "changed",
        signedHeaders(),
        secret,
        new Date("2026-09-14T15:02:00.000Z")
      )
    ).toEqual({ ok: false, reason: "invalid_signature" });

    expect(
      verifySignedRequest(
        body,
        signedHeaders("2026-09-14T14:50:00.000Z"),
        secret,
        new Date("2026-09-14T15:02:00.000Z")
      )
    ).toEqual({ ok: false, reason: "stale_request" });
  });

  it("binds the sender identity into the signature", () => {
    const headers = signedHeaders();
    expect(
      verifySignedRequest(
        body,
        { ...headers, "x-openclaw-sender": "different-user" },
        secret,
        new Date("2026-09-14T15:02:00.000Z")
      )
    ).toEqual({ ok: false, reason: "invalid_signature" });
  });

  it("rejects missing signature fields", () => {
    expect(
      verifySignedRequest(body, { "x-openclaw-sender": "allowed-user" }, secret, new Date())
    ).toEqual({ ok: false, reason: "missing_signature" });
  });
});