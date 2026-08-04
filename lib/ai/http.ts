// Low-level calls to the two real backends. Server-only: these read API keys
// from process.env and are only ever invoked from the /api/ai route, so keys
// never reach the browser. No SDKs — plain fetch keeps the dependency surface
// (and supply-chain risk) at zero.
//
// NOTE: only import this module from server code (the /api/ai route). It reads
// secrets from process.env; never import it into a Client Component.

// ── Text: opencode Zen (OpenAI-compatible chat completions), routed to Gemini ──

const OPENCODE_BASE_URL =
  process.env.OPENCODE_BASE_URL ?? "https://opencode.ai/zen/v1";
const OPENCODE_MODEL = process.env.OPENCODE_MODEL ?? "gemini-3.5-flash-lite";

export async function chatComplete(
  system: string,
  user: string,
  opts: { temperature?: number } = {}
): Promise<string> {
  const key = process.env.OPENCODE_API_KEY;
  if (!key) throw new Error("OPENCODE_API_KEY is not set");

  const res = await fetch(`${OPENCODE_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: OPENCODE_MODEL,
      temperature: opts.temperature ?? 0.8,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`opencode ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("opencode: empty completion");
  return content;
}

// Parse a model reply that should be JSON, tolerating stray prose or ```json
// fences. Returns null on failure so callers can fall back gracefully.
export function parseJsonLoose<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();
  // Grab the outermost array/object if there's surrounding noise.
  const start = candidate.search(/[[{]/);
  const end = Math.max(candidate.lastIndexOf("]"), candidate.lastIndexOf("}"));
  const slice = start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
  try {
    return JSON.parse(slice) as T;
  } catch {
    return null;
  }
}

// ── Images: OpenAI Images API. Returns a base64 data URL (no storage needed). ─

const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
const OPENAI_IMAGE_SIZE = process.env.OPENAI_IMAGE_SIZE ?? "1024x1024";
const OPENAI_IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY ?? "low";

export async function generateImage(prompt: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  // Param shapes differ per model family; send only what each accepts.
  const body: Record<string, unknown> = {
    model: OPENAI_IMAGE_MODEL,
    prompt,
    size: OPENAI_IMAGE_SIZE,
    n: 1,
  };
  if (OPENAI_IMAGE_MODEL.startsWith("gpt-image")) {
    body.quality = OPENAI_IMAGE_QUALITY; // low|medium|high|auto
  } else if (OPENAI_IMAGE_MODEL.startsWith("dall-e")) {
    body.response_format = "b64_json"; // gpt-image-1 always returns b64
  }

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`openai images ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  const url = json?.data?.[0]?.url;
  if (b64) return `data:image/png;base64,${b64}`;
  if (url) return url; // some models/config return a hosted URL
  throw new Error("openai images: no image in response");
}
