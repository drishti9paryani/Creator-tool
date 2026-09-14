import type { Database as BetterSqliteDatabase } from "better-sqlite3";
import { openWorkflowDatabase } from "@/lib/workflow/db";
import { applyWorkflowEvent, createWorkflowProject } from "@/lib/workflow/state-machine";
import type { WorkflowEvent, WorkflowProject } from "@/lib/workflow/types";

export type StoredWorkflowEvent = {
  id: number;
  projectId: string;
  type: "project.created" | WorkflowEvent["type"];
  payload: Record<string, unknown>;
  createdAt: string;
};

export type WorkflowRepository = {
  create(input: { title: string; source: WorkflowProject["source"] }): WorkflowProject;
  get(id: string): WorkflowProject | null;
  list(): WorkflowProject[];
  apply(id: string, event: WorkflowEvent): WorkflowProject;
  events(id: string): StoredWorkflowEvent[];
  claimIntegrationEvent(eventId: string): boolean;
  close(): void;
};

type ProjectRow = { snapshot_json: string };
type EventRow = {
  event_id: number;
  project_id: string;
  type: StoredWorkflowEvent["type"];
  payload_json: string;
  created_at: string;
};

function parseProject(row: ProjectRow | undefined): WorkflowProject | null {
  return row ? (JSON.parse(row.snapshot_json) as WorkflowProject) : null;
}

export function createWorkflowRepository(path?: string): WorkflowRepository {
  const database = openWorkflowDatabase(path);

  const insertEvent = database.prepare(`
    INSERT INTO workflow_events (project_id, type, payload_json, created_at)
    VALUES (@projectId, @type, @payloadJson, @createdAt)
  `);
  const insertProject = database.prepare(`
    INSERT INTO workflow_projects
      (id, snapshot_json, stage, status, updated_at, last_event_id)
    VALUES
      (@id, @snapshotJson, @stage, @status, @updatedAt, 0)
  `);
  const claimIntegrationEvent = database.prepare(`
    INSERT OR IGNORE INTO integration_events (event_id, created_at)
    VALUES (?, ?)
  `);

  const updateProject = database.prepare(`
    UPDATE workflow_projects
    SET snapshot_json = @snapshotJson,
        stage = @stage,
        status = @status,
        updated_at = @updatedAt,
        last_event_id = @lastEventId
    WHERE id = @id
  `);

  const saveCreated = database.transaction(
    (input: { title: string; source: WorkflowProject["source"] }) => {
      const project = createWorkflowProject(input);
      insertProject.run({
        id: project.id,
        snapshotJson: JSON.stringify(project),
        stage: project.stage,
        status: project.status,
        updatedAt: project.updatedAt,
      });
      const result = insertEvent.run({
        projectId: project.id,
        type: "project.created",
        payloadJson: JSON.stringify(input),
        createdAt: project.createdAt,
      });
      updateProject.run({
        id: project.id,
        snapshotJson: JSON.stringify(project),
        stage: project.stage,
        status: project.status,
        updatedAt: project.updatedAt,
        lastEventId: Number(result.lastInsertRowid),
      });
      return project;
    }
  );

  const saveEvent = database.transaction((id: string, event: WorkflowEvent) => {
    const current = parseProject(
      database
        .prepare("SELECT snapshot_json FROM workflow_projects WHERE id = ?")
        .get(id) as ProjectRow | undefined
    );
    if (!current) throw new Error(`Workflow project not found: ${id}`);

    const updated = applyWorkflowEvent(current, event);
    const result = insertEvent.run({
      projectId: id,
      type: event.type,
      payloadJson: JSON.stringify(event),
      createdAt: updated.updatedAt,
    });
    updateProject.run({
      id,
      snapshotJson: JSON.stringify(updated),
      stage: updated.stage,
      status: updated.status,
      updatedAt: updated.updatedAt,
      lastEventId: Number(result.lastInsertRowid),
    });
    return updated;
  });

  return {
    create: saveCreated,
    get(id) {
      const row = database
        .prepare("SELECT snapshot_json FROM workflow_projects WHERE id = ?")
        .get(id) as ProjectRow | undefined;
      return parseProject(row);
    },
    list() {
      const rows = database
        .prepare(
          "SELECT snapshot_json FROM workflow_projects ORDER BY last_event_id DESC"
        )
        .all() as ProjectRow[];
      return rows.map((row) => parseProject(row) as WorkflowProject);
    },
    apply: saveEvent,
    claimIntegrationEvent(eventId) {
      const result = claimIntegrationEvent.run(eventId, new Date().toISOString());
      return result.changes === 1;
    },
    events(id) {
      const rows = database
        .prepare(
          `SELECT event_id, project_id, type, payload_json, created_at
           FROM workflow_events
           WHERE project_id = ?
           ORDER BY event_id ASC`
        )
        .all(id) as EventRow[];
      return rows.map((row) => ({
        id: row.event_id,
        projectId: row.project_id,
        type: row.type,
        payload: JSON.parse(row.payload_json) as Record<string, unknown>,
        createdAt: row.created_at,
      }));
    },
    close() {
      database.close();
    },
  };
}