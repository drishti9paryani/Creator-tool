import type {
  AIProvider,
  AssetImageInput,
  Format,
  FormatOption,
  InitProjectInput,
  IterateAssetInput,
  Project,
  ScreenplayInput,
  StoryOutline,
  StoryboardInput,
  VisualStyle,
} from "@/lib/ai/types";
import { FORMATS } from "@/data/formats";
import { SUGGESTIONS } from "@/data/suggestions";
import { STYLES } from "@/data/styles";
import { chatComplete, parseJsonLoose, generateImage } from "@/lib/ai/http";
import { systemFor } from "@/lib/ai/prompts";
import {
  deriveAssets,
  deriveOutlines,
  deriveScenes,
  deriveTitle,
} from "@/lib/ai/story";
import { placeholderArt, placeholderFrame } from "@/lib/ai/placeholder";
import { noteDegraded, reasonOf } from "@/lib/ai/degraded";
import { chargeImage } from "@/lib/ai/budget";

// RealProvider — wires the app to live backends:
//   • text  (outlines, screenplay, command bar) → opencode Zen / Gemini
//   • images (asset art, storyboards)           → OpenAI Images
//   • static lists (formats/styles)             → deterministic local data
//   • video                                     → stubbed (no cheap model)
//
// Two rules this class follows:
//  1. STATELESS. Style and all other context arrive per-call. An earlier
//     version cached `this.styleId` on the module-level singleton, so two
//     concurrent users leaked visual styles into each other's images.
//  2. NEVER FAIL SILENTLY. Every fallback calls noteDegraded(), which the API
//     route returns to the browser and the UI surfaces as a warning toast. A
//     fallback the tester can't see is indistinguishable from a lie.

function styleLabel(styleId: string): string {
  return STYLES.find((s) => s.id === styleId)?.label ?? "cinematic";
}

export class RealProvider implements AIProvider {
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
    return this.outlines("generateOutlines", idea, format, 0);
  }

  async regenerateOutlines(idea: string, format: Format): Promise<StoryOutline[]> {
    return this.outlines("regenerateOutlines", idea, format, 1);
  }

  private async outlines(
    op: string,
    idea: string,
    format: Format,
    variant: number
  ): Promise<StoryOutline[]> {
    try {
      const fmt =
        format === "short" ? "YouTube Short (9:16, ~30s)" : "YouTube Video (16:9)";
      const reply = await chatComplete(
        systemFor(op),
        `Idea: ${idea || "surprise me"}\nFormat: ${fmt}`
      );
      const parsed = parseJsonLoose<StoryOutline[]>(reply);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map((o, i) => ({
          ...o,
          id: o.id || `outline-${variant}-${i + 1}`,
          characters: o.characters ?? [],
          settings: o.settings ?? [],
        }));
      }
      noteDegraded(op, "The model returned an unreadable response.");
    } catch (e) {
      console.error(`[RealProvider] ${op} failed:`, e);
      noteDegraded(op, reasonOf(e));
    }
    // Fall back to the offline story engine — still derived from THIS idea, so
    // the tester at least gets a story about what they asked for.
    return deriveOutlines(idea, format, variant);
  }

  // ── Project assembly (local, derived from the chosen outline) ────────────
  async initProject(input: InitProjectInput): Promise<Project> {
    const assets = deriveAssets(input.story);
    return {
      id: `proj_${Date.now()}`,
      title: deriveTitle(input.story, input.idea),
      format: input.format,
      styleId: input.style.id,
      storyId: input.story.id,
      assets,
      scenes: deriveScenes(input.story, input.format),
      createdAt: Date.now(),
    };
  }

  // ── Image generation → OpenAI, behind the spend guard ───────────────────
  async generateAssetImage(input: AssetImageInput) {
    const fallback = () => placeholderArt(input.name, input.type, input.styleId);

    const verdict = chargeImage(input.projectId);
    if (!verdict.ok) {
      noteDegraded("generateAssetImage", verdict.reason ?? "Image budget reached.");
      return { id: input.id, image: fallback() };
    }

    try {
      const image = await generateImage(
        `${styleLabel(input.styleId)} style. ${input.name}. ${input.description ?? ""} ` +
          `Single subject, clean uncluttered background, high detail, consistent character design.`
      );
      return { id: input.id, image };
    } catch (e) {
      console.error("[RealProvider] generateAssetImage failed:", e);
      noteDegraded("generateAssetImage", reasonOf(e));
      return { id: input.id, image: fallback() };
    }
  }

  async iterateAsset(input: IterateAssetInput) {
    const fallback = () =>
      placeholderArt(`${input.name} ${input.prompt}`, input.type, input.styleId);

    const verdict = chargeImage(input.projectId);
    if (!verdict.ok) {
      noteDegraded("iterateAsset", verdict.reason ?? "Image budget reached.");
      return { image: fallback() };
    }

    try {
      const image = await generateImage(
        `${styleLabel(input.styleId)} style. ${input.name}. ${input.description ?? ""} ` +
          `Change requested: ${input.prompt}. Single subject, clean background, high detail.`
      );
      return { image };
    } catch (e) {
      console.error("[RealProvider] iterateAsset failed:", e);
      noteDegraded("iterateAsset", reasonOf(e));
      return { image: fallback() };
    }
  }

  async generateShotStoryboard(input: StoryboardInput) {
    const fallback = () => placeholderFrame(input.shotTitle, input.styleId);

    const verdict = chargeImage(input.projectId);
    if (!verdict.ok) {
      noteDegraded("generateShotStoryboard", verdict.reason ?? "Image budget reached.");
      return { image: fallback() };
    }

    // The whole point of this rewrite: the prompt now carries the scene, the
    // screenplay and the cast. It previously read "storyboard frame for shot
    // scene-1-shot-2" — an id the model could do nothing with.
    const aspect = input.format === "short" ? "vertical 9:16 framing" : "widescreen 16:9 framing";
    const cast = input.castNotes?.length
      ? ` Featuring: ${input.castNotes.slice(0, 3).join("; ")}.`
      : "";
    const prompt =
      `${styleLabel(input.styleId)} style cinematic storyboard frame, ${aspect}. ` +
      `Scene "${input.sceneTitle ?? ""}": ${input.sceneDescription ?? ""} ` +
      `Shot "${input.shotTitle}": ${input.screenplay ?? ""}.${cast} ` +
      `Strong composition, clear focal subject, cinematic lighting. No text or captions in the image.`;

    try {
      return { image: await generateImage(prompt) };
    } catch (e) {
      console.error("[RealProvider] generateShotStoryboard failed:", e);
      noteDegraded("generateShotStoryboard", reasonOf(e));
      return { image: fallback() };
    }
  }

  async generateScreenplay(input: ScreenplayInput) {
    try {
      const text = await chatComplete(
        systemFor("generateScreenplay"),
        `Story: ${input.storySummary}\nScene: ${input.sceneTitle} — ${input.sceneDescription}\n` +
          `Shot: ${input.shotTitle}\nFormat: ${input.format === "short" ? "9:16 short, ~30s total" : "16:9 video"}`
      );
      if (text.trim()) return { text: text.trim() };
      noteDegraded("generateScreenplay", "The model returned an empty response.");
    } catch (e) {
      console.error("[RealProvider] generateScreenplay failed:", e);
      noteDegraded("generateScreenplay", reasonOf(e));
    }
    return {
      text: `${input.shotTitle.toUpperCase()}\n\n${input.sceneDescription}`,
    };
  }

  // ── Video: no generation model wired. Honest empty result. ───────────────
  async generateVideo(_target: { sceneId?: string; shotId?: string }) {
    return { url: "" };
  }

  // ── Command bar → Gemini ─────────────────────────────────────────────────
  async runCommand(prompt: string) {
    try {
      const message = await chatComplete(systemFor("runCommand"), prompt, {
        temperature: 0.5,
      });
      if (message.trim()) return { message: message.trim() };
      noteDegraded("runCommand", "The model returned an empty response.");
    } catch (e) {
      console.error("[RealProvider] runCommand failed:", e);
      noteDegraded("runCommand", reasonOf(e));
    }
    return { message: `Noted: "${prompt}"` };
  }
}
