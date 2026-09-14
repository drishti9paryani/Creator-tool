import { createHash } from "node:crypto";
import type { MediaProvider } from "@/lib/media/provider";
import type { MediaArtifact, MediaRequest } from "@/lib/media/types";

function seed(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function artifact(request: MediaRequest, suffix: string, kind: MediaArtifact["kind"], mimeType: string): MediaArtifact {
  const id = `${kind}-${seed(`${request.projectId}:${request.idempotencyKey}:${suffix}`)}`;
  return { id, kind, mimeType, fileName: `${id}.${mimeType === "image/svg+xml" ? "svg" : "json"}` };
}

export function createDemoMediaProvider(): MediaProvider {
  return {
    name: "demo",
    async estimate() {
      return { currency: "INR", maximumMinor: 0 };
    },
    async generateScript(request) {
      return {
        script: `${request.title}\n\n${request.idea}\n\nA clear beginning introduces the moment. The middle adds one meaningful change. The ending resolves it warmly.`,
      };
    },
    async generateImages(request) {
      return {
        artifacts: request.lookIds.map((lookId, index) => {
          const result = artifact(request, lookId, "image", "image/svg+xml");
          const hue = parseInt(seed(lookId).slice(0, 4), 16) % 360;
          result.content = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="100%" height="100%" fill="hsl(${hue} 35% 85%)"/><text x="64" y="360" font-size="48">${index + 1}. ${lookId}</text></svg>`;
          return result;
        }),
      };
    },
    async synthesizeVoice(request) {
      return { artifact: artifact(request, "voice", "voice", "application/json") };
    },
    async generateVideo(request) {
      return { artifact: artifact(request, "video", "video", "application/json"), serverRendered: false };
    },
  };
}