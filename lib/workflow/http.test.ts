import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { createWorkflowApi } from "@/lib/workflow/http";
import { createWorkflowRepository } from "@/lib/workflow/repository";

const directories: string[] = [];
const repositories: Array<ReturnType<typeof createWorkflowRepository>> = [];
function setup() {
  const directory = mkdtempSync(join(tmpdir(), "creator-api-test-"));
  directories.push(directory);
  const repository = createWorkflowRepository(join(directory, "workflow.sqlite"));
  repositories.push(repository);
  return { repository, api: createWorkflowApi(repository) };
}

afterEach(() => {
  for (const repository of repositories.splice(0)) repository.close();
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("workflow API", () => {
  it("creates and lists projects", () => {
    const { api, repository } = setup();
    const created = api.create({ title: "Sunday lunch", source: "web" });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      project: { title: "Sunday lunch", stage: "idea" },
    });
    expect(api.list().body).toMatchObject({
      projects: [{ title: "Sunday lunch" }],
    });
  });

  it("returns a plain validation error for malformed input", () => {
    const { api, repository } = setup();

    expect(api.create({ title: "", source: "email" })).toEqual({
      status: 400,
      body: { error: "Check the project details and try again." },
    });
    expect(repository.list()).toHaveLength(0);
  });

  it("applies a validated event and returns the updated project", () => {
    const { api, repository } = setup();
    const project = repository.create({ title: "Sunday lunch", source: "web" });

    const result = api.apply(project.id, {
      type: "idea.submitted",
      idea: "A warm family film",
    });

    expect(result).toMatchObject({
      status: 200,
      body: {
        project: {
          idea: "A warm family film",
          stage: "words",
          status: "awaiting_approval",
        },
      },
    });
    const returned = result.body.project as { script: string };
    expect(returned.script.length).toBeGreaterThan(40);
  });

  it("creates a no-cost preview after the client chooses a look", () => {
    const { api, repository } = setup();
    const project = repository.create({ title: "Sunday lunch", source: "web" });
    api.apply(project.id, { type: "idea.submitted", idea: "A warm family film" });
    api.apply(project.id, { type: "script.approved" });

    const result = api.apply(project.id, {
      type: "look.selected",
      lookId: "warm-natural",
    });

    expect(result).toMatchObject({
      status: 200,
      body: {
        project: {
          stage: "preview",
          status: "awaiting_approval",
          maximumCostInr: 0,
        },
      },
    });
    const returned = result.body.project as { previewAssetIds: string[] };
    expect(returned.previewAssetIds).toHaveLength(2);
    expect(returned.previewAssetIds[0]).toMatch(/^data:image\/svg\+xml/);
  });
  it("distinguishes missing projects from rejected transitions", () => {
    const { api, repository } = setup();
    const project = repository.create({ title: "Sunday lunch", source: "web" });

    expect(api.get("missing")).toEqual({
      status: 404,
      body: { error: "This project could not be found." },
    });
    expect(api.apply(project.id, { type: "script.approved" })).toEqual({
      status: 409,
      body: { error: "Script approval is not allowed during idea" },
    });
  });
});