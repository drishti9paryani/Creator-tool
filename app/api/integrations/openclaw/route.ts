import { NextRequest, NextResponse } from "next/server";
import { parseTelegramAction } from "@/lib/integrations/commands";
import { handleTelegramCommand } from "@/lib/integrations/openclaw-handler";
import { verifySignedRequest } from "@/lib/integrations/signatures";
import { getWorkflowRepository } from "@/lib/workflow/server-repository";

export const runtime = "nodejs";

function clientError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function POST(request: NextRequest) {
  const secret = process.env.OPENCLAW_WEBHOOK_SECRET;
  if (!secret) return clientError("OpenClaw integration is not configured.", 503);

  const rawBody = await request.text();
  const verification = verifySignedRequest(
    rawBody,
    {
      "x-openclaw-timestamp": request.headers.get("x-openclaw-timestamp") ?? undefined,
      "x-openclaw-sender": request.headers.get("x-openclaw-sender") ?? undefined,
      "x-openclaw-signature": request.headers.get("x-openclaw-signature") ?? undefined,
    },
    secret
  );
  if (!verification.ok) return clientError("This Telegram request could not be verified.", 401);

  const allowedSenders = (process.env.OPENCLAW_ALLOWED_SENDER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!allowedSenders.includes(verification.senderId)) return clientError("This Telegram account is not connected.", 403);

  let envelope: { eventId?: string; projectId?: string; text?: string };
  try {
    envelope = JSON.parse(rawBody) as typeof envelope;
  } catch {
    return clientError("This message could not be read.", 400);
  }
  if (!envelope.eventId || !envelope.text) return clientError("This message is incomplete.", 400);

  const command = parseTelegramAction(envelope.text);
  if (!command) return clientError("I did not recognise that. Try status or tell me what to make.", 400);

  const repository = getWorkflowRepository();
  if (!repository.claimIntegrationEvent(envelope.eventId)) {
    return NextResponse.json({ message: "This Telegram update was already processed.", duplicate: true });
  }

  const result = handleTelegramCommand(repository, command, envelope.projectId);
  return NextResponse.json(result.body, { status: result.status });
}
