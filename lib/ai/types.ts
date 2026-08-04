// Shared domain + AI-provider types. The AIProvider interface is the single
// seam between the app and any generation backend (mock now, real later).

export type Format = "short" | "video";

export interface FormatOption {
  id: Format;
  title: string;
  ratio: string; // "9:16" | "16:9"
}

export interface StoryOutline {
  id: string;
  title: string;
  description: string;
  characters: string[]; // "Name: detail" lines
  settings: string[];
}

export interface VisualStyle {
  id: string;
  label: string;
  thumbnail: string; // /assets/styles/*.png
  description?: string; // shown on the "Your visual style" confirm step
}

export type AssetType = "character" | "location" | "prop";

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  subtitle: string; // "Character" | "Location" | "Prop"
  description?: string;
  voiceDescription?: string;
  image?: string; // /assets/*/*.png ; undefined = still generating
  status: "generating" | "ready";
}

export interface Shot {
  id: string;
  title: string; // "Unnamed Shot"
  screenplay?: string;
  image?: string; // storyboard frame
  status: "empty" | "generating" | "ready";
}

export interface Scene {
  id: string;
  title: string; // "Untitled Scene"
  description: string;
  shots: Shot[];
}

// The wizard's collected brief, persisted on the project so the TopBar
// "Creative Brief" button can reopen it after creation.
export interface CreativeBrief {
  title: string;
  summary: string; // editable flattened story
  characters: string[];
  settings: string[];
  format: Format;
  styleId: string;
  styleLabel: string;
  styleThumbnail: string;
}

export interface Project {
  id: string;
  title: string;
  format: Format;
  styleId: string;
  storyId: string;
  brief?: CreativeBrief;
  assets: Asset[];
  scenes: Scene[];
  createdAt: number;
}

export interface InitProjectInput {
  format: Format;
  idea: string;
  story: StoryOutline;
  style: VisualStyle;
}

// The one interface every generation backend implements.
export interface AIProvider {
  listFormats(): Promise<FormatOption[]>;
  listSuggestions(): Promise<{ id: string; icon: string; text: string }[]>;
  generateOutlines(idea: string, format: Format): Promise<StoryOutline[]>;
  regenerateOutlines(idea: string, format: Format): Promise<StoryOutline[]>;
  listStyles(): Promise<VisualStyle[]>;
  initProject(input: InitProjectInput): Promise<Project>;
  generateAssetImage(assetId: string): Promise<{ id: string; image: string }>;
  iterateAsset(assetId: string, prompt: string): Promise<{ image: string }>;
  generateShotStoryboard(shotId: string): Promise<{ image: string }>;
  generateVideo(target: { sceneId?: string; shotId?: string }): Promise<{ url: string }>;
  runCommand(prompt: string): Promise<{ message: string }>;
}
