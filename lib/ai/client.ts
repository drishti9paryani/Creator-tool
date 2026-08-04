import type {
  AIProvider,
  Asset,
  Format,
  InitProjectInput,
} from "@/lib/ai/types";

// Browser-side wrapper that calls the server AI dispatcher. Typed to mirror the
// AIProvider surface the UI actually uses.
async function call<T>(op: string, args: unknown[] = []): Promise<T> {
  const res = await fetch(`/api/ai/${op}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ args }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? "Request failed");
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
  generateAssetImage: (asset: Pick<Asset, "id" | "name" | "type" | "description">) =>
    call<Awaited<ReturnType<AIProvider["generateAssetImage"]>>>("generateAssetImage", [
      asset,
    ]),
  iterateAsset: (assetId: string, prompt: string) =>
    call<Awaited<ReturnType<AIProvider["iterateAsset"]>>>("iterateAsset", [
      assetId,
      prompt,
    ]),
  generateShotStoryboard: (shotId: string) =>
    call<Awaited<ReturnType<AIProvider["generateShotStoryboard"]>>>(
      "generateShotStoryboard",
      [shotId]
    ),
  generateVideo: (target: { sceneId?: string; shotId?: string }) =>
    call<Awaited<ReturnType<AIProvider["generateVideo"]>>>("generateVideo", [target]),
  runCommand: (prompt: string) =>
    call<Awaited<ReturnType<AIProvider["runCommand"]>>>("runCommand", [prompt]),
};
