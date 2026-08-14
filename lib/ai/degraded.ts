// Per-request degradation tracking (SERVER ONLY).
//
// The real provider falls back to bundled sample data whenever a live call
// fails, so the demo never dies mid-flow. That's good behaviour with one fatal
// flaw: it's invisible. A dead API key produced the same canned story every
// time, and a tester would reasonably conclude "the AI doesn't work" — or
// worse, that it does and is just bad.
//
// AsyncLocalStorage (Node stdlib) gives each in-flight request its own notes
// bucket, so concurrent users never see each other's warnings — a plain
// module-level variable would cross-talk under load.

import { AsyncLocalStorage } from "node:async_hooks";

export interface DegradedNote {
  op: string;
  reason: string;
}

const store = new AsyncLocalStorage<DegradedNote[]>();

/** Run one provider call with a fresh notes bucket; returns data + notes. */
export async function withDegradedTracking<T>(
  fn: () => Promise<T>
): Promise<{ data: T; degraded: DegradedNote[] }> {
  const notes: DegradedNote[] = [];
  const data = await store.run(notes, fn);
  return { data, degraded: notes };
}

/** Called by a provider when it serves fallback data instead of live output. */
export function noteDegraded(op: string, reason: string): void {
  store.getStore()?.push({ op, reason: reason.slice(0, 300) });
}

/** Normalise any thrown value into a short, user-safe reason string. */
export function reasonOf(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  // Never surface a key, header or token to the browser.
  return raw.replace(/Bearer\s+\S+/gi, "Bearer ***").replace(/sk-[A-Za-z0-9-_]+/g, "sk-***");
}
