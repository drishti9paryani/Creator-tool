# Creator Workflow Agent and Telegram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the workflow to Telegram through OpenClaw, with Codex as controller and Hermes as reviewer and fallback.

**Architecture:** CreatorStudio exposes a narrow, signed webhook API. OpenClaw owns Telegram conversation routing and translates approved chat actions into those API calls. Hermes is reached only through its loopback OpenAI-compatible API for script review or fallback; all cross-service requests use idempotency keys and auditable event IDs.

**Tech Stack:** Next.js 15 route handlers, TypeScript, HMAC-SHA256 signed webhooks, OpenClaw agent hooks, Hermes OpenAI-compatible loopback API, Telegram through the existing OpenClaw channel, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-14-creator-workflow-studio-design.md`

## Global Constraints

- OpenClaw is the Telegram controller; CreatorStudio does not introduce a second Telegram bot token.
- Codex controls workflow actions; Hermes reviews scripts and acts as a configured fallback.
- Telegram supports create, approve, monitor, and receive actions.
- Every incoming webhook is signed, timestamped, allowlisted, rate-limited, and idempotent.
- Client messages use plain language and never expose provider names, stack traces, job IDs, or server paths.
- A real Telegram reply is required before live integration can be called verified.
- VPS configuration, service restart, nginx change, credential change, push, and deployment remain separate approval gates.

---

### Task 1: Add signed integration endpoints

**Files:**
- Create: `lib/integrations/signatures.ts`
- Create: `lib/integrations/signatures.test.ts`
- Create: `lib/integrations/commands.ts`
- Create: `app/api/integrations/openclaw/route.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `verifySignedRequest(body, headers, secret, now)`, `IntegrationCommand`, and `POST /api/integrations/openclaw`.
- Consumes: workflow project/event repository and render enqueue endpoint.

- [ ] **Step 1: Write failing signature tests**

Cover valid signature, modified body, timestamp older than five minutes, unknown sender ID, duplicate event ID, and constant-time signature comparison.

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- --run lib/integrations/signatures.test.ts`

Expected: FAIL because signature verification is missing.

- [ ] **Step 3: Implement the signed command envelope**

```ts
type IntegrationEnvelope = {
  eventId: string;
  timestamp: string;
  senderId: string;
  chatId: string;
  command: IntegrationCommand;
};
```

Sign `timestamp + "." + rawBody` using HMAC-SHA256. Read `OPENCLAW_WEBHOOK_SECRET` and comma-separated `OPENCLAW_ALLOWED_SENDER_IDS`. Store processed event IDs in SQLite with a unique constraint.

- [ ] **Step 4: Implement commands**

Support `project.create`, `script.approve`, `script.revision`, `look.select`, `preview.approve`, `project.status`, and `delivery.link`. Return a client-safe response with `message`, `projectId`, `stage`, and optional `actionUrl`.

- [ ] **Step 5: Run and commit**

Run: `npm test -- --run lib/integrations/signatures.test.ts`

Expected: PASS.

```bash
git add lib/integrations app/api/integrations/openclaw .env.example
git commit -m "feat: add signed OpenClaw workflow API"
```

### Task 2: Create the OpenClaw workflow agent bundle

**Files:**
- Create: `integrations/openclaw/creator-workflow/AGENT.md`
- Create: `integrations/openclaw/creator-workflow/commands.ts`
- Create: `integrations/openclaw/creator-workflow/client.ts`
- Create: `integrations/openclaw/creator-workflow/client.test.ts`
- Create: `integrations/openclaw/creator-workflow/README.md`

**Interfaces:**
- Produces: `parseTelegramAction(text, callbackData)`, `sendWorkflowCommand(envelope)`, and an installable OpenClaw agent definition.
- Consumes: signed API from Task 1.

- [ ] **Step 1: Write failing command parsing tests**

Cover natural-language idea creation, callback approvals, `status`, `send video`, unknown input, and retries using the same Telegram update ID as idempotency key.

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- --run integrations/openclaw/creator-workflow/client.test.ts`

Expected: FAIL because the OpenClaw client is missing.

- [ ] **Step 3: Implement the narrow OpenClaw client**

Use `CREATOR_STUDIO_BASE_URL`, `OPENCLAW_WEBHOOK_SECRET`, and the Telegram update ID. Apply a 15-second timeout and one retry only for connection failures. Never retry a rejected approval with a new event ID.

- [ ] **Step 4: Write client-facing Telegram copy**

Use these response patterns:

```text
I saved your idea. I am preparing the words now.
Here are the words. Choose “Yes, continue” or tell me what to change.
Your preview is ready. The maximum charge is ₹{amount}.
Your video is ready: {short-lived download link}
I could not finish that step. You can try again or ask for help.
```

- [ ] **Step 5: Document local installation without secrets**

List exact destination paths, environment variable names, OpenClaw hook route, health check, disable steps, and rollback steps. Do not include production values.

- [ ] **Step 6: Run and commit**

Run: `npm test -- --run integrations/openclaw/creator-workflow/client.test.ts`

Expected: PASS.

```bash
git add integrations/openclaw
git commit -m "feat: add OpenClaw creator workflow agent"
```

### Task 3: Add Hermes review and fallback

**Files:**
- Create: `lib/integrations/hermes.ts`
- Create: `lib/integrations/hermes.test.ts`
- Create: `lib/workflow/script-review.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `reviewScriptWithHermes(request)` and `reviewScript(request)`.
- Consumes: Hermes loopback `/v1/chat/completions` API and the generated script.

- [ ] **Step 1: Write failing review tests**

Mock the Hermes API and assert the request asks for a JSON verdict with `approved`, `clientSummary`, and `issues`; the client sees only the summary. Cover timeout, malformed JSON, and disabled Hermes.

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- --run lib/integrations/hermes.test.ts`

Expected: FAIL because the Hermes client is missing.

- [ ] **Step 3: Implement the loopback client**

Read `HERMES_API_URL` with default `http://127.0.0.1:8642/v1/chat/completions` and `HERMES_API_KEY`. Use a 45-second timeout. Validate the response with Zod. On failure, record `review_unavailable` and let the operator review manually; never auto-approve.

- [ ] **Step 4: Implement review policy**

Hermes checks clarity, continuity, requested duration, unsafe claims, and whether visual directions match the approved idea. It cannot advance the client stage; only the client or allowlisted operator can approve.

- [ ] **Step 5: Run and commit**

Run: `npm test -- --run lib/integrations/hermes.test.ts`

Expected: PASS.

```bash
git add lib/integrations/hermes.ts lib/integrations/hermes.test.ts lib/workflow/script-review.ts .env.example
git commit -m "feat: add Hermes script review fallback"
```

### Task 4: Add status callbacks and Telegram delivery

**Files:**
- Create: `lib/integrations/outbox.ts`
- Create: `lib/integrations/outbox.test.ts`
- Create: `scripts/integration-outbox-worker.ts`
- Modify: `lib/jobs/execute.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: durable `IntegrationOutbox.enqueue`, `claim`, `complete`, and `fail`.
- Consumes: project progress events and OpenClaw `/hooks/agent` callback configuration.

- [ ] **Step 1: Write failing outbox tests**

Cover unique event keys, atomic claim, bounded retries, short-lived delivery URL generation, and redaction of provider output.

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- --run lib/integrations/outbox.test.ts`

Expected: FAIL because the outbox is missing.

- [ ] **Step 3: Implement durable callbacks**

Enqueue only meaningful client updates: script ready, preview ready, render started, render failed, video ready. Sign each callback and send it to the configured loopback OpenClaw hook with `waitForCompletion` disabled. Use the outbox row ID as the callback idempotency key.

- [ ] **Step 4: Implement safe delivery links**

Generate a 15-minute object-storage download URL only when handling `delivery.link` or a `video ready` notification. Never send object-store credentials or a permanent public object URL.

- [ ] **Step 5: Add worker command, run, and commit**

Add `"worker:integrations": "tsx scripts/integration-outbox-worker.ts"`.

Run: `npm test -- --run lib/integrations/outbox.test.ts`

Expected: PASS.

```bash
git add lib/integrations scripts/integration-outbox-worker.ts lib/jobs/execute.ts package.json
git commit -m "feat: deliver workflow updates through OpenClaw"
```

### Task 5: Prepare the VPS change set without applying it

**Files:**
- Create: `ops/creator-workflow/creator-studio.service`
- Create: `ops/creator-workflow/creator-studio-media-worker.service`
- Create: `ops/creator-workflow/creator-studio-outbox-worker.service`
- Create: `ops/creator-workflow/env.example`
- Create: `ops/creator-workflow/nginx-location.conf`
- Create: `ops/creator-workflow/deploy.ps1`
- Create: `ops/creator-workflow/rollback.md`

**Interfaces:**
- Produces: a reviewable deployment bundle.
- Consumes: built application, worker commands, existing OpenClaw/Hermes loopback services, and external object storage.

- [ ] **Step 1: Write service files with resource limits**

Use a dedicated unprivileged service user, restart-on-failure with backoff, explicit working directory, environment file, and filesystem protections. Keep generated media off the root disk.

- [ ] **Step 2: Write the narrow nginx location**

Proxy only the application route chosen during deployment review. Include request-size and timeout limits suitable for signed commands; media uploads continue directly to object storage.

- [ ] **Step 3: Write backup, deploy, health-check, and rollback commands**

`deploy.ps1` must stop before remote execution unless passed an explicit `-Apply` switch. It creates a timestamped code/config backup, checks free disk, installs from the lockfile, builds, migrates, restarts only named services, and checks local and public health. `rollback.md` names the restore order and verification criteria.

- [ ] **Step 4: Review without deploying**

Run local syntax checks and inspect every path, service name, port, and secret variable. Do not SSH, push, copy files, edit nginx, install packages, restart services, or change OpenClaw/Hermes configuration in this task.

- [ ] **Step 5: Commit the reviewable bundle**

```bash
git add ops/creator-workflow
git commit -m "ops: prepare creator workflow deployment bundle"
```

### Task 6: Execute approved live cutover and prove Telegram delivery

**Files:**
- Create: `docs/verification/telegram-live.md`
- Modify: deployment files only if live evidence reveals a defect.

**Interfaces:**
- Consumes: an explicit approval for the concrete deployment bundle and production values supplied outside Git.
- Produces: backed-up, reversible live services and end-to-end evidence.

- [ ] **Step 1: Present the exact change set for approval**

Show commit SHA, destination paths, named services, port, nginx location, OpenClaw agent/hook changes, Hermes endpoint use, required secret names, expected downtime, health checks, and rollback commands. Wait for explicit approval before the next step.

- [ ] **Step 2: Back up and deploy the approved commit**

Confirm the remote absolute paths and disk headroom, create timestamped backups, deploy only the approved commit, set secrets through the existing protected environment mechanism, and start only the named services.

- [ ] **Step 3: Configure the approved OpenClaw route**

Add the allowlisted workflow agent and signed hook, validate OpenClaw configuration, then restart only the OpenClaw gateway if configuration validation passes. Keep the previous config and service state as immediate rollback.

- [ ] **Step 4: Run end-to-end live acceptance**

From an allowlisted Telegram account: create a project, approve words, select a look, approve a zero-cost or explicitly approved preview, monitor status, and receive a working short-lived video link. Verify a duplicate Telegram update does not duplicate the project or job.

- [ ] **Step 5: Verify failure and rollback paths**

Send an invalid signature, disallowed sender, stale timestamp, and unknown project request. Confirm safe client copy and no state mutation. Exercise the documented service/config rollback if any health check fails.

- [ ] **Step 6: Record evidence**

Write timestamps, deployed commit, backup location, service states, local/public health results, OpenClaw validation, Hermes review result, real Telegram request/reply, and rollback readiness to `docs/verification/telegram-live.md`. Redact all tokens and signatures.

- [ ] **Step 7: Commit only verified documentation fixes**

```bash
git add docs/verification/telegram-live.md
git commit -m "docs: verify live creator workflow delivery"
```
