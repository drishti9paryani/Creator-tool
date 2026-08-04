import type {
  AIProvider,
  Asset,
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

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "asset"
  );
}

// Turn "Name: description" outline lines (as produced by the story-outline
// prompt, see lib/ai/prompts.ts) into Assets so the images generated for a
// project actually match its brief instead of a fixed demo cast.
function assetsFromLines(lines: string[], type: Asset["type"]): Asset[] {
  return lines
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":");
      const name = (idx >= 0 ? line.slice(0, idx) : line).trim();
      const description = idx >= 0 ? line.slice(idx + 1).trim() : "";
      return {
        id: slugify(name),
        type,
        name,
        subtitle: type === "character" ? "Character" : "Location",
        description,
        status: "generating" as const,
      };
    });
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

  // ── Project assembly (local; derived from the chosen story outline) ──────
  async initProject(input: InitProjectInput): Promise<Project> {
    this.styleId = input.style.id;
    // The outline's characters/settings (from generateOutlines, see
    // lib/ai/prompts.ts) drive which assets get generated — falls back to
    // the bundled demo cast only if the outline came back with none.
    const assets = [
      ...assetsFromLines(input.story.characters, "character"),
      ...assetsFromLines(input.story.settings, "location"),
    ];
    return {
      id: `proj_${Date.now()}`,
      title: input.story.title || SAMPLE_PROJECT_TITLE,
      format: input.format,
      styleId: input.style.id,
      storyId: input.story.id,
      // Seed assets as "generating"; the assets page reveals each via
      // generateAssetImage below.
      assets: assets.length
        ? assets
        : SAMPLE_ASSETS.map((a) => ({ ...a, image: undefined, status: "generating" as const })),
      scenes: SAMPLE_SCENES.map((s) => ({ ...s, shots: [...s.shots] })),
      createdAt: Date.now(),
    };
  }

  // ── Image generation → OpenAI ────────────────────────────────────────────
  async generateAssetImage(asset: Pick<Asset, "id" | "name" | "type" | "description">) {
    const subject = `${asset.name}. ${asset.description ?? ""}`;
    try {
      const image = await generateImage(
        `${styleLabel(this.styleId)} style. ${subject} Single subject, clean background, high detail.`
      );
      return { id: asset.id, image };
    } catch (e) {
      console.error("[RealProvider] generateAssetImage failed:", e);
      // Fall back to any known still so the tile resolves instead of spinning.
      const fallback = SAMPLE_ASSETS.find((a) => a.id === asset.id);
      return { id: asset.id, image: fallback?.image ?? "" };
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
