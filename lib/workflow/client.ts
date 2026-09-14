import type { WorkflowEvent, WorkflowProject } from "@/lib/workflow/types";

export const workflowClient = {
  async apply(projectId: string, event: WorkflowEvent): Promise<WorkflowProject> {
    const response = await fetch(`/api/workflow/projects/${projectId}/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
    });
    const body = (await response.json()) as {
      project?: WorkflowProject;
      error?: string;
    };
    if (!response.ok || !body.project) {
      throw new Error(body.error ?? "This step could not be saved");
    }
    return body.project;
  },
};