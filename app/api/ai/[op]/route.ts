import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/ai/provider";
import type { AIProvider } from "@/lib/ai/types";
import { withDegradedTracking } from "@/lib/ai/degraded";

// Thin server dispatcher. The browser calls /api/ai/<op> with an args array;
// this runs the selected provider server-side so real API keys never ship to
// the client.

// Explicit allowlist. `op` comes straight from the URL, and the previous
// version did `provider[op]` — an arbitrary property lookup on a live object,
// which happily resolves inherited members like `constructor`. Only these
// eleven names are callable.
const ALLOWED_OPS = new Set<keyof AIProvider>([
  "listFormats",
  "listSuggestions",
  "generateOutlines",
  "regenerateOutlines",
  "listStyles",
  "initProject",
  "generateAssetImage",
  "iterateAsset",
  "generateShotStoryboard",
  "generateScreenplay",
  "generateVideo",
  "runCommand",
]);

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ op: string }> }
) {
  const { op } = await ctx.params;

  if (!ALLOWED_OPS.has(op as keyof AIProvider)) {
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
    const provider = getProvider();
    const fn = provider[op as keyof AIProvider] as (
      ...a: unknown[]
    ) => Promise<unknown>;

    // Collect any fallback notices raised while this one call runs, and return
    // them alongside the data so the UI can tell the tester that what they're
    // looking at is sample output rather than live generation.
    const { data, degraded } = await withDegradedTracking(() =>
      fn.apply(provider, args)
    );

    return NextResponse.json(degraded.length ? { data, degraded } : { data });
  } catch (e) {
    console.error(`[api/ai/${op}]`, e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Provider error" },
      { status: 500 }
    );
  }
}
