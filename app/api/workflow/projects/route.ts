import { NextRequest, NextResponse } from "next/server";
import { createWorkflowApi } from "@/lib/workflow/http";
import { getWorkflowRepository } from "@/lib/workflow/server-repository";

export const runtime = "nodejs";

function response(result: ReturnType<ReturnType<typeof createWorkflowApi>["list"]>) {
  return NextResponse.json(result.body, { status: result.status });
}

export function GET() {
  return response(createWorkflowApi(getWorkflowRepository()).list());
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  return response(createWorkflowApi(getWorkflowRepository()).create(body));
}