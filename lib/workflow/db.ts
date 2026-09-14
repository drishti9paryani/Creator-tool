import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";

export type WorkflowDatabase = Database.Database;

export function workflowDatabasePath(): string {
  return process.env.CREATOR_STUDIO_DB_PATH
    ? resolve(process.env.CREATOR_STUDIO_DB_PATH)
    : resolve(process.cwd(), "data", "creator-studio.sqlite");
}

export function openWorkflowDatabase(path = workflowDatabasePath()): WorkflowDatabase {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const database = new Database(path);
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS workflow_projects (
      id TEXT PRIMARY KEY,
      snapshot_json TEXT NOT NULL,
      stage TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_event_id INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS workflow_events (
      event_id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES workflow_projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS workflow_projects_recent
      ON workflow_projects(last_event_id DESC);
    CREATE INDEX IF NOT EXISTS workflow_events_project
      ON workflow_events(project_id, event_id);

    CREATE TABLE IF NOT EXISTS integration_events (
      event_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );
  `);
  return database;
}