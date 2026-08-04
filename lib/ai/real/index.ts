import type {
  AIProvider,
  Format,
  FormatOption,
  InitProjectInput,
  Project,
  StoryOutline,
  VisualStyle,
} from "@/lib/ai/types";
import { FORMATS } from "@/data/formats";
import { SUGGESTIONS } from "@/data/suggestions";
import { OUTLINE_TRIO_A, OUTLINE_TRIO_B } from "@/data/outlines";
import { STYLES } from "@/data/styles";
import {
  SAMPLE_ASSETS,
  SAMPLE_PROJECT_TITLE,
  SAMPLE_SCENES,
} from "@/data/sampleProject";
import { chatComplete, parseJsonLoose, generateImage } from "@/lib/ai/http";
import { systemFor } from "@/lib/ai/prompts";

// RealProvider — wires the app to live backends:
//   • text  (story outlines, command bar) → opencode Zen / Gemini
//   • images (asset art, storyboards)      → OpenAI Images
//   • static lists (formats/styles/etc.)   → deterministic local data
//   • video                                → stubbed (no cheap video model)
// Every generative call falls back to canned data on error so the demo never
// breaks mid-flow; failures are logged server-side.

function styleLabel(styleId: string): string {
  return STYLES.find((s) => s.id === styleId)?.label ?? "cinematic";
}

export class RealProvider implements AIProvider {
  // The style chosen at project creation, used to keep generated art on-theme.
  private styleId = "3d-cinematic";

  // ── Static / deterministic ──────────────────────────────────────────────
  async listFormats(): Promise<FormatOption[]> {
    return FORMATS;
  }

  async listSuggestions() {
    return SUGGESTIONS;
  }

  async listStyles(): Promise<VisualStyle[]> {
    return STYLES;
  }

  // ── Text generation → Gemini via opencode ────────────────────────────────
  async generateOutlines(idea: string, format: Format): Promise<StoryOutline[]> {
    return this.outlines("generateOutlines", idea, format, OUTLINE_TRIO_A);
  }

  async regenerateOutlines(idea: string, format: Format): Promise<StoryOutline[]> {
    return this.outlines("regenerateOutlines", idea, format, OUTLINE_TRIO_B);
  }

  private async outlines(
    op: string,
    idea: string,
    format: Format,
    fallback: StoryOutline[]
  ): Promise<StoryOutline[]> {
    try {
      const fmt = format === "short" ? "YouTube Short (9:16, ~30s)" : "YouTube Video (16:9)";
      const reply = await chatComplete(
        systemFor(op),
        `Idea: ${idea || "surprise me"}\nFormat: ${fmt}`
      );
      const parsed = parseJsonLoose<StoryOutline[]>(reply);
      if (Array.isArray(parsed) && parsed.length) {
        // Guarantee an id on every outline for stable React keys / selection.
        return parsed.map((o, i) => ({
          ...o,
          id: o.id || `outline-${i + 1}`,
          characters: o.characters ?? [],
          settings: o.settings ?? [],
        }));
      }
      return fallback;
    } catch (e) {
      console.error(`[RealProvider] ${op} failed, using fallback:`, e);
      return fallback;
    }
  }

  // ── Project assembly (local; no model needed) ────────────────────────────
  async initProject(input: InitProjectInput): Promise<Project> {
    this.styleId = input.style.id;
    return {
      id: `proj_${Date.now()}`,
      title: input.story.title || SAMPLE_PROJECT_TITLE,
      format: input.format,
      styleId: input.style.id,
      storyId: input.story.id,
      // Seed assets as "generating"; the assets page reveals each via
      // generateAssetImage below.
      assets: SAMPLE_ASSETS.map((a) => ({ ...a, image: undefined, status: "generating" as const })),
      scenes: SAMPLE_SCENES.map((s) => ({ ...s, shots: [...s.shots] })),
      createdAt: Date.now(),
    };
  }

  // ── Image generation → OpenAI ────────────────────────────────────────────
  async generateAssetImage(assetId: string) {
    const asset = SAMPLE_ASSETS.find((a) => a.id === assetId);
    const subject = asset
      ? `${asset.name}. ${asset.description ?? ""}`
      : assetId;
    try {
      const image = await generateImage(
        `${styleLabel(this.styleId)} style. ${subject} Single subject, clean background, high detail.`
      );
      return { id: assetId, image };
    } catch (e) {
      console.error("[RealProvider] generateAssetImage failed:", e);
      // Fall back to any known still so the tile resolves instead of spinning.
      return { id: assetId, image: asset?.image ?? "" };
    }
  }

  async iterateAsset(assetId: string, prompt: string) {
    const asset = SAMPLE_ASSETS.find((a) => a.id === assetId);
    const subject = asset ? `${asset.name}. ${asset.description ?? ""}` : assetId;
    try {
      const image = await generateImage(
        `${styleLabel(this.styleId)} style. ${subject} Modification: ${prompt}. Single subject, clean background.`
      );
      return { image };
    } catch (e) {
      console.error("[RealProvider] iterateAsset failed:", e);
      return { image: asset?.image ?? "" };
    }
  }

  async generateShotStoryboard(shotId: string) {
    try {
      const image = await generateImage(
        `${styleLabel(this.styleId)} style cinematic storyboard frame for shot ${shotId}. Dramatic composition.`
      );
      return { image };
    } catch (e) {
      console.error("[RealProvider] generateShotStoryboard failed:", e);
      return { image: "/assets/locations/govardhan-hill.png" };
    }
  }

  // ── Video: no cheap generation model wired; returns empty (UI shows the
  // storyboard still). Swap in a video backend here when available. ──────────
  async generateVideo(_target: { sceneId?: string; shotId?: string }) {
    return { url: "" };
  }

  // ── Command bar → Gemini ─────────────────────────────────────────────────
  async runCommand(prompt: string) {
    try {
      const message = await chatComplete(systemFor("runCommand"), prompt, {
        temperature: 0.5,
      });
      return { message: message.trim() || `Applied: "${prompt}"` };
    } catch (e) {
      console.error("[RealProvider] runCommand failed:", e);
      return { message: `Applied: "${prompt}"` };
    }
  }
}
