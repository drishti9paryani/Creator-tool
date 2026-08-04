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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// MockProvider — returns canned data after realistic delays. Swap for a real
// backend (Gemini, etc.) by implementing AIProvider and selecting it in
// getProvider(); the app never changes.
export class MockProvider implements AIProvider {
  async listFormats(): Promise<FormatOption[]> {
    return FORMATS;
  }

  async listSuggestions() {
    return SUGGESTIONS;
  }

  async generateOutlines(_idea: string, _format: Format): Promise<StoryOutline[]> {
    await delay(2600);
    return OUTLINE_TRIO_A;
  }

  async regenerateOutlines(_idea: string, _format: Format): Promise<StoryOutline[]> {
    await delay(2400);
    return OUTLINE_TRIO_B;
  }

  async listStyles(): Promise<VisualStyle[]> {
    return STYLES;
  }

  async initProject(input: InitProjectInput): Promise<Project> {
    await delay(400);
    return {
      id: `proj_${Date.now()}`,
      title: SAMPLE_PROJECT_TITLE,
      format: input.format,
      styleId: input.style.id,
      storyId: input.story.id,
      // Seed assets as "generating" so the UI can reveal them progressively.
      assets: SAMPLE_ASSETS.map((a) => ({ ...a, status: "generating" as const })),
      scenes: SAMPLE_SCENES.map((s) => ({ ...s, shots: [...s.shots] })),
      createdAt: Date.now(),
    };
  }

  async generateAssetImage(assetId: string) {
    await delay(1200);
    const asset = SAMPLE_ASSETS.find((a) => a.id === assetId);
    return { id: assetId, image: asset?.image ?? "" };
  }

  async iterateAsset(assetId: string, _prompt: string) {
    await delay(1600);
    const asset = SAMPLE_ASSETS.find((a) => a.id === assetId);
    return { image: asset?.image ?? "" };
  }

  async generateShotStoryboard(_shotId: string) {
    await delay(1800);
    return { image: "/assets/locations/govardhan-hill.png" };
  }

  async generateVideo(_target: { sceneId?: string; shotId?: string }) {
    await delay(2600);
    return { url: "" };
  }

  async runCommand(prompt: string) {
    await delay(900);
    return { message: `Applied: "${prompt}"` };
  }
}
