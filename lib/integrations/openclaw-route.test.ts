import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signRequest } from "@/lib/integrations/signatures";

const mocks = vi.hoisted(() => ({
  claimIntegrationEvent: vi.fn(),
  handleTelegramCommand: vi.fn(),
}));

vi.mock("@/lib/workflow/server-repository", () => ({
  getWorkflowRepository: () => ({ claimIntegrationEvent: mocks.claimIntegrationEvent }),
}));
vi.mock("@/lib/integrations/openclaw-handler", () => ({
  handleTelegramCommand: mocks.handleTelegramCommand,
}));

import { POST } from "@/app/api/integrations/openclaw/route";

const secret = "route-test-secret";
const senderId = "allowed-user";

function request(body: string) {
  const timestamp = new Date().toISOString();
  return new NextRequest("http://localhost/api/integrations/openclaw", {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      "x-openclaw-timestamp": timestamp,
      "x-openclaw-sender": senderId,
      "x-openclaw-signature": signRequest(body, timestamp, senderId, secret),
    },
  });
}

describe("OpenClaw webhook route", () => {
  beforeEach(() => {
    process.env.OPENCLAW_WEBHOOK_SECRET = secret;
    process.env.OPENCLAW_ALLOWED_SENDER_IDS = senderId;
    mocks.claimIntegrationEvent.mockReset();
    mocks.handleTelegramCommand.mockReset();
  });

  afterEach(() => {
    delete process.env.OPENCLAW_WEBHOOK_SECRET;
    delete process.env.OPENCLAW_ALLOWED_SENDER_IDS;
  });

  it("processes one delivery and acknowledges a duplicate without applying it twice", async () => {
    const body = JSON.stringify({ eventId: "telegram-update-1", projectId: "project-1", text: "status" });
    mocks.claimIntegrationEvent.mockReturnValueOnce(true).mockReturnValueOnce(false);
    mocks.handleTelegramCommand.mockReturnValue({ status: 200, body: { message: "The words are ready." } });

    const first = await POST(request(body));
    const duplicate = await POST(request(body));

    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ message: "The words are ready." });
    expect(await duplicate.json()).toEqual({
      message: "This Telegram update was already processed.",
      duplicate: true,
    });
    expect(mocks.claimIntegrationEvent).toHaveBeenCalledTimes(2);
    expect(mocks.handleTelegramCommand).toHaveBeenCalledTimes(1);
  });

  it("rejects a sender whose identity is not covered by the signature", async () => {
    const body = JSON.stringify({ eventId: "telegram-update-2", text: "status" });
    const valid = request(body);
    const tampered = new NextRequest(valid.url, {
      method: "POST",
      body,
      headers: { ...Object.fromEntries(valid.headers), "x-openclaw-sender": "different-user" },
    });

    const response = await POST(tampered);

    expect(response.status).toBe(401);
    expect(mocks.claimIntegrationEvent).not.toHaveBeenCalled();
  });
});