import { describe, expect, it } from "vitest";
import { buildOperatorNodes } from "@/lib/workflow/operator-view";
import type { StoredWorkflowEvent } from "@/lib/workflow/repository";
import type { WorkflowProject } from "@/lib/workflow/types";

function project(overrides: Partial<WorkflowProject> = {}): WorkflowProject {
  return {
    id: "workflow-1",
    title: "Sunday lunch",
    source: "web",
    stage: "look",
    status: "awaiting_approval",
    idea: "A warm family film",
    script: "A family gathers for Sunday lunch.",
    selectedLookId: null,
    previewAssetIds: [],
    maximumCostInr: null,
    approvedMaximumCostInr: null,
    finalVideoUrl: null,
    errorMessage: null,
    createdAt: "2026-09-14T00:00:00.000Z",
    updatedAt: "2026-09-14T00:00:00.000Z",
    ...overrides,
  };
}

const events: StoredWorkflowEvent[] = [];

describe("operator workflow projection", () => {
  it("shows completed upstream nodes and blocks work that cannot start yet", () => {
    const nodes = buildOperatorNodes(project(), events);

    expect(nodes.map((node) => [node.id, node.status])).toEqual([
      ["idea", "complete"],
      ["script", "complete"],
      ["look", "waiting"],
      ["preview", "blocked"],
      ["render", "blocked"],
      ["delivery", "blocked"],
    ]);
  });

  it("marks a failed render as retryable without changing the client stage", () => {
    const nodes = buildOperatorNodes(
      project({ stage: "delivery", status: "failed", errorMessage: "Encoder stopped." }),
      events
    );
    const render = nodes.find((node) => node.id === "render");

    expect(render).toMatchObject({
      status: "failed",
      canRetry: true,
      detail: "Encoder stopped.",
    });
    expect(nodes.find((node) => node.id === "delivery")?.status).toBe("waiting");
  });

  it("keeps provider and cost detail available only to the operator node", () => {
    const nodes = buildOperatorNodes(
      project({ stage: "preview", status: "awaiting_approval", maximumCostInr: 500 }),
      events
    );
    const preview = nodes.find((node) => node.id === "preview");

    expect(preview?.detail).toContain("₹500");
    expect(preview?.provider).toBeDefined();
  });
});