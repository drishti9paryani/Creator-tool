import { NextResponse } from "next/server";
import { createWorkflowApi } from "@/lib/workflow/http";
import { getWorkflowRepository } from "@/lib/workflow/server-repository";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const result = createWorkflowApi(getWorkflowRepository()).get(id);
  return NextResponse.json(result.body, { status: result.status });
}