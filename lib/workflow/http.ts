import { z } from "zod";
import type { WorkflowRepository } from "@/lib/workflow/repository";

export type WorkflowApiResult = {
  status: number;
  body: Record<string, unknown>;
};

const createProjectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  source: z.enum(["web", "telegram"]),
});

const workflowEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("idea.submitted"), idea: z.string().trim().min(1) }),
  z.object({ type: z.literal("script.generated"), script: z.string().trim().min(1) }),
  z.object({
    type: z.literal("script.revision_requested"),
    instructions: z.string().trim().min(1),
  }),
  z.object({ type: z.literal("script.approved") }),
  z.object({ type: z.literal("look.selected"), lookId: z.string().trim().min(1) }),
  z.object({
    type: z.literal("preview.generated"),
    assetIds: z.array(z.string().trim().min(1)).min(1),
    maximumCostInr: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("preview.revision_requested"),
    instructions: z.string().trim().min(1),
  }),
  z.object({
    type: z.literal("preview.approved"),
    approvedMaximumCostInr: z.number().int().nonnegative(),
  }),
  z.object({ type: z.literal("render.started") }),
  z.object({
    type: z.literal("render.completed"),
    finalVideoUrl: z.string().url(),
  }),
  z.object({ type: z.literal("render.failed"), message: z.string().trim().min(1) }),
]);

export function createWorkflowApi(repository: WorkflowRepository) {
  return {
    create(input: unknown): WorkflowApiResult {
      const parsed = createProjectSchema.safeParse(input);
      if (!parsed.success) {
        return {
          status: 400,
          body: { error: "Check the project details and try again." },
        };
      }
      return { status: 201, body: { project: repository.create(parsed.data) } };
    },
    list(): WorkflowApiResult {
      return { status: 200, body: { projects: repository.list() } };
    },
    get(id: string): WorkflowApiResult {
      const project = repository.get(id);
      return project
        ? { status: 200, body: { project } }
        : { status: 404, body: { error: "This project could not be found." } };
    },
    apply(id: string, input: unknown): WorkflowApiResult {
      const parsed = workflowEventSchema.safeParse(input);
      if (!parsed.success) {
        return {
          status: 400,
          body: { error: "Check this action and try again." },
        };
      }
      if (!repository.get(id)) {
        return { status: 404, body: { error: "This project could not be found." } };
      }
      try {
        return {
          status: 200,
          body: { project: repository.apply(id, parsed.data) },
        };
      } catch (error) {
        return {
          status: 409,
          body: {
            error: error instanceof Error ? error.message : "This action is not available now.",
          },
        };
      }
    },
  };
}