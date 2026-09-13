import { NextRequest, NextResponse } from "next/server";
import { createWorkflowApi } from "@/lib/workflow/http";
import { getWorkflowRepository } from "@/lib/workflow/server-repository";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const result = createWorkflowApi(getWorkflowRepository()).apply(id, body);
  return NextResponse.json(result.body, { status: result.status });
}