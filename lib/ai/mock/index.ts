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
import {
  deriveAssets,
  deriveOutlines,
  deriveScenes,
  deriveTitle,
} from "@/lib/ai/story";
import { placeholderArt, placeholderFrame } from "@/lib/ai/placeholder";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// MockProvider — keyless demo mode.
//
// This used to return the same canned "Silent Sunbearer" story for every input:
// generateOutlines ignored the idea entirely and initProject always seeded
// Krishna's cast. Fine for reproducing a screen recording, fatal for a
// prototype real people test — everyone typed their own idea, got someone
// else's story, and concluded the product was fake.
//
// It now derives everything from the typed idea via lib/ai/story.ts: same idea
// in, same story out (demos stay reproducible), different idea in, genuinely
// different story out. No key, no cost, no network.
export class MockProvider implements AIProvider {
  async listFormats(): Promise<FormatOption[]> {
    return FORMATS;
  }

  async listSuggestions() {
    return SUGGESTIONS;
  }

  async listStyles(): Promise<VisualStyle[]> {
    return STYLES;
  }

  async generateOutlines(idea: string, format: Format): Promise<StoryOutline[]> {
    await delay(1800);
    return deriveOutlines(idea, format, 0);
  }

  async regenerateOutlines(idea: string, format: Format): Promise<StoryOutline[]> {
    await delay(1600);
    // variant 1 → a different trio for the same idea.
    return deriveOutlines(idea, format, 1);
  }

  async initProject(input: InitProjectInput): Promise<Project> {
    await delay(400);
    return {
      id: `proj_${Date.now()}`,
      title: deriveTitle(input.story, input.idea),
      format: input.format,
      styleId: input.style.id,
      storyId: input.story.id,
      assets: deriveAssets(input.story),
      scenes: deriveScenes(input.story, input.format),
      createdAt: Date.now(),
    };
  }

  async generateAssetImage(input: AssetImageInput) {
    await delay(900);
    return {
      id: input.id,
      image: placeholderArt(input.name, input.type, input.styleId),
    };
  }

  async iterateAsset(input: IterateAssetInput) {
    await delay(1200);
    // Fold the prompt into the seed so an iteration visibly changes the art.
    return {
      image: placeholderArt(`${input.name} ${input.prompt}`, input.type, input.styleId),
    };
  }

  async generateShotStoryboard(input: StoryboardInput) {
    await delay(1400);
    return { image: placeholderFrame(input.shotTitle, input.styleId) };
  }

  async generateScreenplay(input: ScreenplayInput) {
    await delay(800);
    const beat = input.sceneDescription || input.storySummary;
    return {
      text:
        `${input.shotTitle.toUpperCase()}\n\n${beat}\n\n` +
        (input.format === "short"
          ? "Hold two beats, then cut. No dialogue — the image carries it."
          : "Let the moment breathe before the cut. Keep the camera still; the performance moves."),
    };
  }

  async generateVideo(_target: { sceneId?: string; shotId?: string }) {
    await delay(1200);
    return { url: "" };
  }

  async runCommand(prompt: string) {
    await delay(700);
    return { message: `Applied: "${prompt}"` };
  }
}
