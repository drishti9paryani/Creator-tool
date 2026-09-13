import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { createWorkflowRepository } from "@/lib/workflow/repository";

const tempDirectories: string[] = [];

function tempDatabase(): string {
  const directory = mkdtempSync(join(tmpdir(), "creator-workflow-test-"));
  tempDirectories.push(directory);
  return join(directory, "workflow.sqlite");
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("workflow repository", () => {
  it("persists a project and its events across repository restarts", () => {
    const path = tempDatabase();
    const first = createWorkflowRepository(path);
    const project = first.create({ title: "Sunday lunch", source: "web" });
    first.apply(project.id, {
      type: "idea.submitted",
      idea: "A warm family film",
    });
    first.close();

    const reopened = createWorkflowRepository(path);
    expect(reopened.get(project.id)).toMatchObject({
      id: project.id,
      idea: "A warm family film",
      status: "working",
    });
    expect(reopened.events(project.id).map((event) => event.type)).toEqual([
      "project.created",
      "idea.submitted",
    ]);
    reopened.close();
  });

  it("returns recent projects with the newest update first", () => {
    const repository = createWorkflowRepository(tempDatabase());
    const first = repository.create({ title: "First", source: "web" });
    const second = repository.create({ title: "Second", source: "telegram" });
    repository.apply(first.id, { type: "idea.submitted", idea: "Updated later" });

    expect(repository.list().map((project) => project.id)).toEqual([
      first.id,
      second.id,
    ]);
    repository.close();
  });

  it("does not record an event when a transition is rejected", () => {
    const repository = createWorkflowRepository(tempDatabase());
    const project = repository.create({ title: "Sunday lunch", source: "web" });

    expect(() => repository.apply(project.id, { type: "script.approved" })).toThrow(
      "Script approval is not allowed during idea"
    );
    expect(repository.events(project.id)).toHaveLength(1);
    expect(repository.get(project.id)?.stage).toBe("idea");
    repository.close();
  });

  it("returns null for an unknown project and rejects unknown event targets", () => {
    const repository = createWorkflowRepository(tempDatabase());

    expect(repository.get("missing")).toBeNull();
    expect(() =>
      repository.apply("missing", { type: "idea.submitted", idea: "Anything" })
    ).toThrow("Workflow project not found: missing");
    repository.close();
  });
});