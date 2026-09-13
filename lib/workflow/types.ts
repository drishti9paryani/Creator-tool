export type ClientStage = "idea" | "words" | "look" | "preview" | "delivery";

export type WorkflowStatus =
  | "draft"
  | "working"
  | "awaiting_approval"
  | "failed"
  | "complete";

export type WorkflowProject = {
  id: string;
  title: string;
  source: "web" | "telegram";
  stage: ClientStage;
  status: WorkflowStatus;
  idea: string;
  script: string | null;
  selectedLookId: string | null;
  previewAssetIds: string[];
  maximumCostInr: number | null;
  approvedMaximumCostInr: number | null;
  finalVideoUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowEvent =
  | { type: "idea.submitted"; idea: string }
  | { type: "script.generated"; script: string }
  | { type: "script.revision_requested"; instructions: string }
  | { type: "script.approved" }
  | { type: "look.selected"; lookId: string }
  | {
      type: "preview.generated";
      assetIds: string[];
      maximumCostInr: number;
    }
  | { type: "preview.revision_requested"; instructions: string }
  | { type: "preview.approved"; approvedMaximumCostInr: number }
  | { type: "render.started" }
  | { type: "render.completed"; finalVideoUrl: string }
  | { type: "render.failed"; message: string };