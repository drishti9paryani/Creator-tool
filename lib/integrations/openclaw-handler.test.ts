import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { handleTelegramCommand } from "@/lib/integrations/openclaw-handler";
import { createWorkflowRepository } from "@/lib/workflow/repository";
import type { TelegramCommand } from "@/lib/integrations/commands";

const directories: string[] = [];
const repositories: Array<ReturnType<typeof createWorkflowRepository>> = [];
function setup() {
  const directory = mkdtempSync(join(tmpdir(), "openclaw-handler-test-"));
  directories.push(directory);
  const repository = createWorkflowRepository(join(directory, "workflow.sqlite"));
  repositories.push(repository);
  return repository;
}

afterEach(() => {
  for (const repository of repositories.splice(0)) repository.close();
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("OpenClaw workflow handler", () => {
  it("creates a project and starts the same client workflow as the web", () => {
    const repository = setup();
    const result = handleTelegramCommand(repository, {
      type: "project.create",
      title: "Sunday lunch",
      idea: "A family gathers for lunch",
    });

    expect(result).toMatchObject({
      status: 201,
      body: {
        message: "I saved your idea and prepared the words for review.",
        stage: "words",
      },
    });
    expect(result.body.projectId).toBeTruthy();
  });

  it("requires a project and returns client-safe progress copy", () => {
    const repository = setup();
    expect(handleTelegramCommand(repository, { type: "project.status" })).toEqual({
      status: 400,
      body: { message: "Tell me which project you want to check." },
    });

    const project = repository.create({ title: "Sunday lunch", source: "telegram" });
    const result = handleTelegramCommand(repository, { type: "project.status" }, project.id);
    expect(result).toMatchObject({
      status: 200,
      body: { projectId: project.id, stage: "idea" },
    });
    expect(result.body.message).not.toMatch(/provider|node|stack|webhook/i);
  });

  it("maps approvals to the shared state machine", () => {
    const repository = setup();
    const created = handleTelegramCommand(repository, {
      type: "project.create",
      title: "Sunday lunch",
      idea: "A family gathers for lunch",
    });
    const projectId = created.body.projectId as string;
    const result = handleTelegramCommand(repository, { type: "script.approve" }, projectId);

    expect(result).toMatchObject({ status: 200, body: { stage: "look" } });
  });
});