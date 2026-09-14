import { afterEach, describe, expect, it } from "vitest";
import { createDemoMediaProvider } from "@/lib/media/demo-provider";
import { getMediaProvider } from "@/lib/media/provider";

const scriptRequest = {
  kind: "script" as const,
  projectId: "project-1",
  idempotencyKey: "script-v1",
  title: "Sunday lunch",
  idea: "A family gathers for lunch",
};

afterEach(() => delete process.env.MEDIA_PROVIDER);

describe("media provider contract", () => {
  it("returns the same demo script for the same idempotency key", async () => {
    const provider = createDemoMediaProvider();
    expect(await provider.generateScript(scriptRequest)).toEqual(
      await provider.generateScript(scriptRequest)
    );
  });

  it("returns three local look previews and a zero-cost estimate", async () => {
    const provider = createDemoMediaProvider();
    const estimate = await provider.estimate(scriptRequest);
    const images = await provider.generateImages({
      kind: "images",
      projectId: "project-1",
      idempotencyKey: "looks-v1",
      prompt: "Warm family lunch",
      lookIds: ["warm-natural", "storybook", "cinematic"],
    });

    expect(estimate).toEqual({ currency: "INR", maximumMinor: 0 });
    expect(images.artifacts).toHaveLength(3);
    expect(images.artifacts.every((artifact) => artifact.mimeType === "image/svg+xml")).toBe(true);
  });

  it("defaults to demo and rejects unknown providers", () => {
    expect(getMediaProvider().name).toBe("demo");
    process.env.MEDIA_PROVIDER = "paid-mystery";
    expect(() => getMediaProvider()).toThrow("Unknown media provider: paid-mystery");
  });
});