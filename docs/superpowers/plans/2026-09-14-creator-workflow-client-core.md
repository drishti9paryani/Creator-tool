# Creator Workflow Client Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn CreatorStudio into a five-step, client-friendly journey with server persistence and a separate operator workflow screen.

**Architecture:** Keep the existing Next.js application and creative tools, then add a guided client route backed by a small server-side project repository. The client sees one decision at a time; the operator view exposes workflow state, retries, and provider details. Existing Zustand/IndexedDB projects remain readable during migration.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Zustand, Vitest, Testing Library, SQLite through `better-sqlite3`, Zod.

**Spec:** `docs/superpowers/specs/2026-09-14-creator-workflow-studio-design.md`

## Global Constraints

- The client journey has exactly five visible stages: idea, words, look, preview, delivery.
- Each client screen has one primary action, large type, large controls, Back, and automatic saving.
- A returning client can continue where they stopped.
- Provider names, logs, retry controls, and technical workflow nodes appear only in the operator view.
- Paid work cannot begin until the client has seen the maximum rupee amount and approved the preview.
- Voice input is optional; typing and Telegram remain complete alternatives.
- Interactive targets are at least 44 by 44 CSS pixels, keyboard reachable, visibly focused, usable at 200% zoom, and responsive on mobile.
- This plan makes no paid provider calls and performs no VPS, Telegram, OpenClaw, or Hermes changes.

---

### Task 1: Add the persisted workflow domain

**Files:**
- Create: `lib/workflow/types.ts`
- Create: `lib/workflow/state-machine.ts`
- Create: `lib/workflow/state-machine.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `ClientStage = "idea" | "words" | "look" | "preview" | "delivery"`
- Produces: `WorkflowProject`, `WorkflowEvent`, `createWorkflowProject()`, `applyWorkflowEvent()`
- Consumes: no new project interfaces.

- [ ] **Step 1: Add validation and SQLite packages**

Run: `npm install zod better-sqlite3 && npm install -D @types/better-sqlite3`

Expected: the packages appear in `package.json` and the lockfile resolves without peer-dependency errors.

- [ ] **Step 2: Write the failing state-machine tests**

Create tests covering these exact transitions:

```ts
const project = createWorkflowProject({ title: "Sunday lunch", source: "web" });
expect(project.stage).toBe("idea");

const scripted = applyWorkflowEvent(project, {
  type: "script.generated",
  script: "A family gathers for Sunday lunch.",
});
expect(scripted.stage).toBe("words");

const approved = applyWorkflowEvent(scripted, { type: "script.approved" });
expect(approved.stage).toBe("look");

expect(() => applyWorkflowEvent(project, { type: "preview.approved" }))
  .toThrow("Preview approval is not allowed during idea");
```

- [ ] **Step 3: Run the focused test and confirm the missing-module failure**

Run: `npm test -- --run lib/workflow/state-machine.test.ts`

Expected: FAIL because `lib/workflow/state-machine.ts` does not exist.

- [ ] **Step 4: Implement the state machine**

Define immutable transitions for `idea.submitted`, `script.generated`, `script.revision_requested`, `script.approved`, `look.selected`, `preview.generated`, `preview.revision_requested`, `preview.approved`, `render.started`, `render.completed`, and `render.failed`. Every transition sets `updatedAt`; illegal transitions throw a plain-English error that includes the current stage.

`WorkflowProject` must contain:

```ts
type WorkflowProject = {
  id: string;
  title: string;
  source: "web" | "telegram";
  stage: ClientStage;
  status: "draft" | "working" | "awaiting_approval" | "failed" | "complete";
  idea: string;
  script: string | null;
  selectedLookId: string | null;
  previewAssetIds: string[];
  maximumCostInr: number | null;
  finalVideoUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};
```

- [ ] **Step 5: Run the focused test**

Run: `npm test -- --run lib/workflow/state-machine.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the domain**

```bash
git add package.json package-lock.json lib/workflow/types.ts lib/workflow/state-machine.ts lib/workflow/state-machine.test.ts
git commit -m "feat: add creator workflow state machine"
```

### Task 2: Persist projects in SQLite

**Files:**
- Create: `lib/workflow/db.ts`
- Create: `lib/workflow/repository.ts`
- Create: `lib/workflow/repository.test.ts`
- Create: `app/api/workflow/projects/route.ts`
- Create: `app/api/workflow/projects/[id]/route.ts`
- Create: `app/api/workflow/projects/[id]/events/route.ts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `WorkflowProject`, `WorkflowEvent`, `applyWorkflowEvent()` from Task 1.
- Produces: `WorkflowRepository` with `create(input)`, `get(id)`, `list()`, and `apply(id, event)`; JSON endpoints for those operations.

- [ ] **Step 1: Write a failing repository contract test**

Use a temporary database path and assert create, reload, transition, and process-restart persistence:

```ts
const repo = createWorkflowRepository(tempDbPath);
const project = repo.create({ title: "Sunday lunch", source: "web" });
repo.apply(project.id, { type: "idea.submitted", idea: "A warm family film" });
repo.close();

const reopened = createWorkflowRepository(tempDbPath);
expect(reopened.get(project.id)?.idea).toBe("A warm family film");
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- --run lib/workflow/repository.test.ts`

Expected: FAIL because `createWorkflowRepository` is missing.

- [ ] **Step 3: Implement the database and repository**

Create `workflow_projects` and append-only `workflow_events` tables during initialization. Store the full project snapshot as JSON plus indexed `stage`, `status`, and `updated_at` columns. Wrap event insert and snapshot update in one SQLite transaction. Default the database path to `data/creator-studio.sqlite`, configurable with `CREATOR_STUDIO_DB_PATH`.

- [ ] **Step 4: Add route handlers with Zod validation**

Implement:

```text
POST /api/workflow/projects              create a project
GET  /api/workflow/projects              list recent projects
GET  /api/workflow/projects/:id          load one project
POST /api/workflow/projects/:id/events   validate and apply one event
```

Return `400` for malformed input, `404` for an unknown project, and `{ project }` on success. Do not return stack traces.

- [ ] **Step 5: Ignore local runtime data and run tests**

Add `data/*.sqlite*` to `.gitignore`.

Run: `npm test -- --run lib/workflow/repository.test.ts`

Expected: PASS, including reopen persistence and an invalid-transition rollback.

- [ ] **Step 6: Commit persistence**

```bash
git add .gitignore lib/workflow/db.ts lib/workflow/repository.ts lib/workflow/repository.test.ts app/api/workflow/projects
git commit -m "feat: persist creator workflow projects"
```

### Task 3: Build the five-step client shell

**Files:**
- Create: `app/workflow/[id]/page.tsx`
- Create: `components/client-workflow/ClientWorkflow.tsx`
- Create: `components/client-workflow/ClientStageHeader.tsx`
- Create: `components/client-workflow/PrimaryAction.tsx`
- Create: `components/client-workflow/ClientWorkflow.test.tsx`
- Create: `lib/workflow/client.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: project and event HTTP endpoints from Task 2.
- Produces: `ClientWorkflow({ initialProject })` and `workflowClient.get/apply`.

- [ ] **Step 1: Write the failing accessibility and progression test**

Render an idea-stage project and assert the page contains one `main`, the heading `Tell us your idea`, a multiline idea field, `Back`, and one emphasized `Continue` button. Simulate submission, return the updated words-stage project from the mock API, and assert the heading changes to `Approve the words`.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- --run components/client-workflow/ClientWorkflow.test.tsx`

Expected: FAIL because `ClientWorkflow` is missing.

- [ ] **Step 3: Implement the shared shell**

Use a centered content column with a persistent `Step N of 5` indicator, stage heading, plain-language helper text, stage body, error region with `role="alert"`, and sticky mobile action area. Use minimum `min-h-11` controls and `focus-visible:ring-4`. Save each decision through `workflowClient.apply`; disable the primary action only while saving or when required input is empty.

- [ ] **Step 4: Add route-level loading and resume behavior**

`app/workflow/[id]/page.tsx` loads the current project on the server. Unknown IDs use `notFound()`. The persisted stage determines the rendered step, so reopening the URL resumes the latest completed decision.

- [ ] **Step 5: Run the focused test**

Run: `npm test -- --run components/client-workflow/ClientWorkflow.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the client shell**

```bash
git add app/workflow components/client-workflow lib/workflow/client.ts app/globals.css
git commit -m "feat: add guided client workflow"
```

### Task 4: Implement idea, script approval, and look selection

**Files:**
- Create: `components/client-workflow/stages/IdeaStage.tsx`
- Create: `components/client-workflow/stages/WordsStage.tsx`
- Create: `components/client-workflow/stages/LookStage.tsx`
- Create: `components/client-workflow/stages/stages.test.tsx`
- Create: `lib/workflow/look-options.ts`
- Modify: `components/client-workflow/ClientWorkflow.tsx`

**Interfaces:**
- Consumes: `ClientWorkflow` stage rendering and `workflowClient.apply` from Task 3.
- Produces: stage components with `onSubmit(event: WorkflowEvent): Promise<void>`.

- [ ] **Step 1: Write failing stage behavior tests**

Cover: idea typing and submission; optional Web Speech API button hidden when unsupported; words actions labeled `Yes, continue` and `I want a change`; revision text required before sending; three keyboard-selectable look cards; selected card announced with `aria-checked="true"`.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `npm test -- --run components/client-workflow/stages/stages.test.tsx`

Expected: FAIL because the stage components are missing.

- [ ] **Step 3: Implement the three stages**

Use these client-facing labels exactly:

```text
Tell us your idea
Approve the words
Choose the look
Yes, continue
I want a change
```

The three initial look options are `Warm and natural`, `Bold and cinematic`, and `Clean and modern`, each with a locally bundled color/typography preview. Do not generate images in this task.

- [ ] **Step 4: Run the focused tests**

Run: `npm test -- --run components/client-workflow/stages/stages.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the decision stages**

```bash
git add components/client-workflow lib/workflow/look-options.ts
git commit -m "feat: add client idea and approval stages"
```

### Task 5: Add preview approval, cost gate, and delivery

**Files:**
- Create: `components/client-workflow/stages/PreviewStage.tsx`
- Create: `components/client-workflow/stages/DeliveryStage.tsx`
- Create: `components/client-workflow/stages/final-stages.test.tsx`
- Modify: `components/client-workflow/ClientWorkflow.tsx`
- Modify: `lib/workflow/state-machine.ts`
- Modify: `lib/workflow/state-machine.test.ts`

**Interfaces:**
- Consumes: `maximumCostInr`, preview assets, and final URL from `WorkflowProject`.
- Produces: an explicit paid-render approval event containing `approvedMaximumCostInr: number`.

- [ ] **Step 1: Write failing cost-gate tests**

Assert that preview approval cannot advance unless `maximumCostInr` is a positive integer and the event repeats the same amount. Assert the client sees `Maximum charge: ₹{amount}` immediately above `Approve and create video`.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- --run lib/workflow/state-machine.test.ts components/client-workflow/stages/final-stages.test.tsx`

Expected: FAIL on the missing amount guard and missing components.

- [ ] **Step 3: Implement preview and delivery screens**

Preview displays approved script excerpts and preview image cards, plus `Approve and create video` and `I want a change`. Delivery displays progress as `Creating your video — about {minutes} minutes`, then a large `Download video` link and `Send to Telegram` action after completion. Failure displays `Try again` and `Ask for help`; details remain hidden.

- [ ] **Step 4: Implement the amount-matching transition**

Reject `preview.approved` if the project has no maximum, the maximum is not a positive integer, or the event amount differs. On success set `stage: "delivery"` and `status: "working"`.

- [ ] **Step 5: Run focused and full tests**

Run: `npm test -- --run lib/workflow/state-machine.test.ts components/client-workflow`

Expected: PASS.

Run: `npm test -- --run && npx tsc --noEmit`

Expected: all tests and type checking pass.

- [ ] **Step 6: Commit the cost gate and delivery**

```bash
git add components/client-workflow lib/workflow/state-machine.ts lib/workflow/state-machine.test.ts
git commit -m "feat: add preview cost gate and delivery stage"
```

### Task 6: Build the private operator workflow view

**Files:**
- Create: `app/operator/workflows/[id]/page.tsx`
- Create: `components/operator-workflow/WorkflowBoard.tsx`
- Create: `components/operator-workflow/WorkflowNode.tsx`
- Create: `components/operator-workflow/WorkflowBoard.test.tsx`
- Create: `lib/workflow/operator-view.ts`
- Modify: `components/workspace/Sidebar.tsx`

**Interfaces:**
- Consumes: persisted `WorkflowProject` and append-only events from Task 2.
- Produces: operator-only node status projection through `buildOperatorNodes(project, events)`.

- [ ] **Step 1: Write a failing projection test**

For a look-stage project, expect nodes `Idea` and `Script` to be `complete`, `Look` to be `waiting`, and `Preview`, `Render`, `Delivery` to be `blocked`. For a failed render, expect only the `Render` node to expose `Retry` and the plain failure message.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- --run components/operator-workflow/WorkflowBoard.test.tsx`

Expected: FAIL because the projection and board are missing.

- [ ] **Step 3: Implement the operator projection and board**

Render six connected nodes with status badges, last-updated time, and a selected-node detail panel. Keep provider, cost, event history, and retry controls in this route. The board must remain usable without dragging: selecting a node by mouse or keyboard opens its details.

- [ ] **Step 4: Add operator navigation**

Add an `Operator workflow` link to the existing project sidebar only when the current project has a linked workflow ID. Preserve all current CreatorStudio routes.

- [ ] **Step 5: Run verification**

Run: `npm test -- --run components/operator-workflow/WorkflowBoard.test.tsx && npm test -- --run && npx tsc --noEmit`

Expected: all checks pass.

- [ ] **Step 6: Commit the operator board**

```bash
git add app/operator components/operator-workflow lib/workflow/operator-view.ts components/workspace/Sidebar.tsx
git commit -m "feat: add private operator workflow board"
```

### Task 7: Verify the client journey end to end

**Files:**
- Create: `docs/verification/client-workflow.md`
- Modify: only files required to fix defects found by this task.

**Interfaces:**
- Consumes: all tasks in this plan.
- Produces: repeatable local acceptance evidence.

- [ ] **Step 1: Start a clean local instance**

Run: `$env:CREATOR_STUDIO_DB_PATH="$env:TEMP\creator-studio-acceptance.sqlite"; npm run dev`

Expected: the development server starts and reports its local URL.

- [ ] **Step 2: Complete the browser acceptance path**

Create a project, submit an idea, approve the script, choose a look, review the preview and rupee maximum, approve the render, reload during delivery, and confirm the same stage resumes. Repeat at 375 CSS pixels wide, keyboard-only, and 200% browser zoom.

- [ ] **Step 3: Verify operator separation**

Confirm the client screens contain no provider names, logs, event IDs, stack traces, or retry metadata. Confirm the operator route shows stage state and event history.

- [ ] **Step 4: Record exact evidence**

Write commands, check results, browser sizes, and any limitation to `docs/verification/client-workflow.md`. Do not claim Telegram, AI generation, paid rendering, push, or deployment in this document.

- [ ] **Step 5: Run final automated checks**

Run: `npm test -- --run && npx tsc --noEmit && npm run build`

Expected: tests, type checking, and production build all pass.

- [ ] **Step 6: Commit verification and fixes**

```bash
git add docs/verification/client-workflow.md
git commit -m "test: verify guided creator workflow"
```
