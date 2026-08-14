import type {
  AIProvider,
  AssetImageInput,
  Format,
  InitProjectInput,
  IterateAssetInput,
  ScreenplayInput,
  StoryboardInput,
} from "@/lib/ai/types";

// Browser-side wrapper that calls the server AI dispatcher. Typed to mirror the
// AIProvider surface the UI actually uses.

export interface DegradedNote {
  op: string;
  reason: string;
}

// ── Degradation channel ─────────────────────────────────────────────────────
// The server may answer with real data AND a note saying "this is sample
// output because the live call failed". Rather than thread that return value
// through every call site, subscribers (one Toaster) get notified directly.
type Listener = (notes: DegradedNote[]) => void;
const listeners = new Set<Listener>();

export function onDegraded(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(notes: DegradedNote[]) {
  if (!notes.length) return;
  listeners.forEach((fn) => fn(notes));
}

/** Thrown when the server call itself fails (not a graceful fallback). */
export class AIRequestError extends Error {}

async function call<T>(op: string, args: unknown[] = []): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/ai/${op}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ args }),
    });
  } catch {
    // Network-level failure: server down, offline, blocked.
    throw new AIRequestError(
      "Couldn't reach the studio server. Check that it's still running, then try again."
    );
  }

  let json: { data?: T; error?: string; degraded?: DegradedNote[] };
  try {
    json = await res.json();
  } catch {
    throw new AIRequestError(`The server returned an unreadable response (${res.status}).`);
  }

  if (!res.ok) throw new AIRequestError(json?.error ?? `Request failed (${res.status}).`);
  if (json.degraded?.length) emit(json.degraded);
  return json.data as T;
}

export const ai = {
  listFormats: () => call<Awaited<ReturnType<AIProvider["listFormats"]>>>("listFormats"),
  listSuggestions: () =>
    call<Awaited<ReturnType<AIProvider["listSuggestions"]>>>("listSuggestions"),
  generateOutlines: (idea: string, format: Format) =>
    call<Awaited<ReturnType<AIProvider["generateOutlines"]>>>("generateOutlines", [
      idea,
      format,
    ]),
  regenerateOutlines: (idea: string, format: Format) =>
    call<Awaited<ReturnType<AIProvider["regenerateOutlines"]>>>("regenerateOutlines", [
      idea,
      format,
    ]),
  listStyles: () => call<Awaited<ReturnType<AIProvider["listStyles"]>>>("listStyles"),
  initProject: (input: InitProjectInput) =>
    call<Awaited<ReturnType<AIProvider["initProject"]>>>("initProject", [input]),
  generateAssetImage: (input: AssetImageInput) =>
    call<Awaited<ReturnType<AIProvider["generateAssetImage"]>>>("generateAssetImage", [
      input,
    ]),
  iterateAsset: (input: IterateAssetInput) =>
    call<Awaited<ReturnType<AIProvider["iterateAsset"]>>>("iterateAsset", [input]),
  generateShotStoryboard: (input: StoryboardInput) =>
    call<Awaited<ReturnType<AIProvider["generateShotStoryboard"]>>>(
      "generateShotStoryboard",
      [input]
    ),
  generateScreenplay: (input: ScreenplayInput) =>
    call<Awaited<ReturnType<AIProvider["generateScreenplay"]>>>("generateScreenplay", [
      input,
    ]),
  generateVideo: (target: { sceneId?: string; shotId?: string }) =>
    call<Awaited<ReturnType<AIProvider["generateVideo"]>>>("generateVideo", [target]),
  runCommand: (prompt: string) =>
    call<Awaited<ReturnType<AIProvider["runCommand"]>>>("runCommand", [prompt]),
};
