export type CostEstimate = { currency: "INR"; maximumMinor: number };
export type MediaArtifactKind = "image" | "voice" | "video" | "captions";
export type MediaArtifact = {
  id: string;
  kind: MediaArtifactKind;
  mimeType: string;
  fileName: string;
  content?: string;
};

type BaseRequest = { projectId: string; idempotencyKey: string };
export type ScriptRequest = BaseRequest & { kind: "script"; title: string; idea: string };
export type ImageRequest = BaseRequest & { kind: "images"; prompt: string; lookIds: string[] };
export type VoiceRequest = BaseRequest & { kind: "voice"; text: string };
export type VideoRequest = BaseRequest & {
  kind: "video";
  script: string;
  imageArtifactIds: string[];
  voiceArtifactId?: string;
};
export type MediaRequest = ScriptRequest | ImageRequest | VoiceRequest | VideoRequest;
export type ScriptResult = { script: string };
export type ImageResult = { artifacts: MediaArtifact[] };
export type VoiceResult = { artifact: MediaArtifact };
export type VideoResult = { artifact: MediaArtifact; serverRendered: boolean };
export type MediaJob = {
  id: string;
  projectId: string;
  request: MediaRequest;
  status: "queued" | "running" | "complete" | "failed";
};