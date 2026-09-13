import { describe, expect, it } from "vitest";
import {
  applyWorkflowEvent,
  createWorkflowProject,
} from "@/lib/workflow/state-machine";

describe("creator workflow state machine", () => {
  it("starts every project at the idea step", () => {
    const project = createWorkflowProject({
      title: "Sunday lunch",
      source: "web",
    });

    expect(project.stage).toBe("idea");
    expect(project.status).toBe("draft");
    expect(project.idea).toBe("");
  });

  it("moves through the client approval journey in order", () => {
    const started = createWorkflowProject({ title: "Sunday lunch", source: "web" });
    const idea = applyWorkflowEvent(started, {
      type: "idea.submitted",
      idea: "A warm family film",
    });
    const scripted = applyWorkflowEvent(idea, {
      type: "script.generated",
      script: "A family gathers for Sunday lunch.",
    });
    const approved = applyWorkflowEvent(scripted, { type: "script.approved" });
    const styled = applyWorkflowEvent(approved, {
      type: "look.selected",
      lookId: "warm-natural",
    });
    const previewed = applyWorkflowEvent(styled, {
      type: "preview.generated",
      assetIds: ["preview-1", "preview-2"],
      maximumCostInr: 500,
    });
    const rendering = applyWorkflowEvent(previewed, {
      type: "preview.approved",
      approvedMaximumCostInr: 500,
    });
    const complete = applyWorkflowEvent(rendering, {
      type: "render.completed",
      finalVideoUrl: "https://example.test/video.mp4",
    });

    expect(scripted.stage).toBe("words");
    expect(scripted.status).toBe("awaiting_approval");
    expect(approved.stage).toBe("look");
    expect(styled.stage).toBe("preview");
    expect(previewed.status).toBe("awaiting_approval");
    expect(rendering).toMatchObject({ stage: "delivery", status: "working" });
    expect(complete).toMatchObject({
      stage: "delivery",
      status: "complete",
      finalVideoUrl: "https://example.test/video.mp4",
    });
  });

  it("rejects approvals that skip required stages", () => {
    const project = createWorkflowProject({ title: "Sunday lunch", source: "web" });

    expect(() => applyWorkflowEvent(project, { type: "script.approved" })).toThrow(
      "Script approval is not allowed during idea"
    );
    expect(() =>
      applyWorkflowEvent(project, {
        type: "preview.approved",
        approvedMaximumCostInr: 500,
      })
    ).toThrow("Preview approval is not allowed during idea");
  });

  it("requires the approved render maximum to match the shown rupee amount", () => {
    const previewed = applyWorkflowEvent(
      applyWorkflowEvent(
        applyWorkflowEvent(
          applyWorkflowEvent(
            applyWorkflowEvent(
              createWorkflowProject({ title: "Sunday lunch", source: "web" }),
              { type: "idea.submitted", idea: "A warm family film" }
            ),
            { type: "script.generated", script: "A family gathers." }
          ),
          { type: "script.approved" }
        ),
        { type: "look.selected", lookId: "warm-natural" }
      ),
      {
        type: "preview.generated",
        assetIds: ["preview-1"],
        maximumCostInr: 500,
      }
    );

    expect(() =>
      applyWorkflowEvent(previewed, {
        type: "preview.approved",
        approvedMaximumCostInr: 600,
      })
    ).toThrow("Approved maximum must match the shown maximum of ₹500");
  });

  it("keeps revision requests at the same approval step", () => {
    const words = applyWorkflowEvent(
      applyWorkflowEvent(
        createWorkflowProject({ title: "Sunday lunch", source: "telegram" }),
        { type: "idea.submitted", idea: "A warm family film" }
      ),
      { type: "script.generated", script: "A family gathers." }
    );

    const revised = applyWorkflowEvent(words, {
      type: "script.revision_requested",
      instructions: "Make it gentler",
    });

    expect(revised).toMatchObject({ stage: "words", status: "working" });
    expect(revised.script).toBe("A family gathers.");
  });

  it("returns a new project object for every accepted event", () => {
    const before = createWorkflowProject({ title: "Sunday lunch", source: "web" });
    const after = applyWorkflowEvent(before, {
      type: "idea.submitted",
      idea: "A warm family film",
    });

    expect(after).not.toBe(before);
    expect(before.idea).toBe("");
    expect(after.idea).toBe("A warm family film");
  });
});