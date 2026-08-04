import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/ai/provider";
import type { AIProvider } from "@/lib/ai/types";

// Thin server dispatcher. The browser calls /api/ai/<op> with an args array;
// this runs the selected provider server-side so real API keys never ship to
// the client.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ op: string }> }
) {
  const { op } = await ctx.params;
  const provider = getProvider() as unknown as Record<
    string,
    (...args: unknown[]) => Promise<unknown>
  >;

  const fn = provider[op];
  if (typeof fn !== "function") {
    return NextResponse.json({ error: `Unknown op: ${op}` }, { status: 404 });
  }

  let args: unknown[] = [];
  try {
    const body = await req.json();
    args = Array.isArray(body?.args) ? body.args : [];
  } catch {
    args = [];
  }

  try {
    const result = await fn.apply(getProvider() as AIProvider, args);
    return NextResponse.json({ data: result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Provider error" },
      { status: 500 }
    );
  }
}
