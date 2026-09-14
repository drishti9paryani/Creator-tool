import { describe, expect, it } from "vitest";
import { parseTelegramAction } from "@/lib/integrations/commands";

describe("Telegram workflow command parsing", () => {
  it("turns a new-project message into a plain project command", () => {
    expect(parseTelegramAction("new: Sunday lunch | A family gathers for lunch")).toEqual({
      type: "project.create",
      title: "Sunday lunch",
      idea: "A family gathers for lunch",
    });
  });

  it("parses approval callbacks without exposing technical actions", () => {
    expect(parseTelegramAction("status")).toEqual({ type: "project.status" });
    expect(parseTelegramAction("approve:script")).toEqual({ type: "script.approve" });
    expect(parseTelegramAction("change:script:Make it gentler")).toEqual({
      type: "script.revision",
      instructions: "Make it gentler",
    });
    expect(parseTelegramAction("look:warm-natural")).toEqual({
      type: "look.select",
      lookId: "warm-natural",
    });
    expect(parseTelegramAction("approve:preview:500")).toEqual({
      type: "preview.approve",
      maximumCostInr: 500,
    });
  });

  it("returns null for unknown or incomplete messages", () => {
    expect(parseTelegramAction("restart service")).toBeNull();
    expect(parseTelegramAction("approve:preview:not-a-number")).toBeNull();
    expect(parseTelegramAction("")).toBeNull();
  });
});