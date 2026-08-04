import type { AIProvider } from "@/lib/ai/types";
import { MockProvider } from "@/lib/ai/mock";
import { RealProvider } from "@/lib/ai/real";

// Provider selector, chosen by the AI_PROVIDER env var. Keys are read
// server-side only (inside the providers), never shipped to the browser.
//   AI_PROVIDER=real  → live Gemini (text) + OpenAI (images)
//   AI_PROVIDER=mock  → canned data (default; needs no keys)
let cached: AIProvider | null = null;

export function getProvider(): AIProvider {
  if (cached) return cached;
  const which = process.env.AI_PROVIDER ?? "mock";
  switch (which) {
    case "real":
      cached = new RealProvider();
      break;
    case "mock":
    default:
      cached = new MockProvider();
  }
  return cached;
}
