import type {
  CostEstimate,
  ImageRequest,
  ImageResult,
  MediaRequest,
  ScriptRequest,
  ScriptResult,
  VideoRequest,
  VideoResult,
  VoiceRequest,
  VoiceResult,
} from "@/lib/media/types";
import { createDemoMediaProvider } from "@/lib/media/demo-provider";

export interface MediaProvider {
  readonly name: string;
  estimate(request: MediaRequest): Promise<CostEstimate>;
  generateScript(request: ScriptRequest): Promise<ScriptResult>;
  generateImages(request: ImageRequest): Promise<ImageResult>;
  synthesizeVoice(request: VoiceRequest): Promise<VoiceResult>;
  generateVideo(request: VideoRequest): Promise<VideoResult>;
}

export function getMediaProvider(): MediaProvider {
  const name = process.env.MEDIA_PROVIDER?.trim() || "demo";
  if (name === "demo") return createDemoMediaProvider();
  throw new Error(`Unknown media provider: ${name}`);
}