# Creator Workflow Media Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add resumable script, image, voice, caption, and video jobs behind the approved client workflow.

**Architecture:** A database-backed job queue drives configurable provider adapters and stores large outputs in S3-compatible object storage. The first adapter is deterministic and local so the whole path can be tested without spending money; external image and video providers plug into the same interfaces later. Every paid job is gated by the approved maximum stored in the workflow project.

**Tech Stack:** Next.js 15 route handlers, TypeScript, SQLite, Zod, S3-compatible object storage via `@aws-sdk/client-s3`, FFmpeg/ffprobe, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-14-creator-workflow-studio-design.md`

## Global Constraints

- Script and storyboard approval are mandatory before paid rendering.
- The first working provider is a no-cost deterministic demo provider.
- Provider selection is configuration, never client-facing UI.
- Voice-over and captions are included; music is deferred.
- Final videos and generated media live in external object storage, not on the VPS filesystem.
- Every job is idempotent, resumable, and records cost estimates before execution.
- No provider may charge more than the exact maximum amount approved by the client.

---

### Task 1: Define media jobs and provider contracts

**Files:**
- Create: `lib/media/types.ts`
- Create: `lib/media/provider.ts`
- Create: `lib/media/provider.test.ts`
- Create: `lib/media/demo-provider.ts`

**Interfaces:**
- Produces: `MediaJob`, `MediaArtifact`, `CostEstimate`, `MediaProvider`, `getMediaProvider()`.
- Consumes: workflow IDs and asset concepts from the client-core plan.

- [ ] **Step 1: Write failing provider contract tests**

Assert a demo script is repeatable for the same input/idempotency key, three look previews return artifact descriptors, and a cost estimate is `{ currency: "INR", maximumMinor: 0 }`.

- [ ] **Step 2: Run the focused test**

Run: `npm test -- --run lib/media/provider.test.ts`

Expected: FAIL because the provider types and implementation are missing.

- [ ] **Step 3: Implement exact provider contracts**

```ts
interface MediaProvider {
  estimate(request: MediaRequest): Promise<CostEstimate>;
  generateScript(request: ScriptRequest): Promise<ScriptResult>;
  generateImages(request: ImageRequest): Promise<ImageResult>;
  synthesizeVoice(request: VoiceRequest): Promise<VoiceResult>;
  generateVideo(request: VideoRequest): Promise<VideoResult>;
}
```

Use discriminated request/result unions and an `idempotencyKey` on every request. `getMediaProvider()` reads `MEDIA_PROVIDER`, defaults to `demo`, and throws `Unknown media provider: {name}` for unregistered values.

- [ ] **Step 4: Implement the deterministic demo provider**

Return seeded script text and locally generated SVG preview descriptors. Reuse the existing browser-side video export only as a demo result descriptor; do not claim server rendering.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- --run lib/media/provider.test.ts`

Expected: PASS.

```bash
git add lib/media
git commit -m "feat: add configurable media provider contracts"
```

### Task 2: Add a durable, idempotent job queue

**Files:**
- Create: `lib/jobs/types.ts`
- Create: `lib/jobs/repository.ts`
- Create: `lib/jobs/repository.test.ts`
- Create: `app/api/jobs/[id]/route.ts`
- Modify: `lib/workflow/db.ts`

**Interfaces:**
- Produces: `JobRepository.enqueue`, `claimNext`, `complete`, `fail`, `retry`, and `get`.
- Consumes: `MediaRequest`, project ID, and idempotency key from Task 1.

- [ ] **Step 1: Write failing queue tests**

Cover duplicate enqueue returning the existing job, atomic claim preventing two workers from claiming the same row, retry count, interrupted `running` jobs returning to `queued` after a lease expires, and terminal completion.

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- --run lib/jobs/repository.test.ts`

Expected: FAIL because `JobRepository` is missing.

- [ ] **Step 3: Implement queue persistence**

Create a `media_jobs` table with unique `idempotency_key`, `kind`, JSON request/result, `status`, `attempts`, `lease_until`, `estimated_cost_minor`, timestamps, and a plain failure message. Claim with an immediate SQLite transaction.

- [ ] **Step 4: Add a read-only job status endpoint**

`GET /api/jobs/:id` returns only job ID, kind, status, progress text, result artifact IDs, failure message, and timestamps. It must not return provider keys or raw provider responses.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- --run lib/jobs/repository.test.ts`

Expected: PASS.

```bash
git add lib/jobs app/api/jobs lib/workflow/db.ts
git commit -m "feat: add durable media job queue"
```

### Task 3: Store artifacts outside the application server

**Files:**
- Create: `lib/storage/types.ts`
- Create: `lib/storage/s3.ts`
- Create: `lib/storage/memory.ts`
- Create: `lib/storage/storage.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.env.example`

**Interfaces:**
- Produces: `ArtifactStorage.put`, `getSignedDownloadUrl`, `remove`; `getArtifactStorage()`.
- Consumes: job/project identifiers and artifact byte streams.

- [ ] **Step 1: Install and test the storage contract**

Run: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`

Write tests proving keys follow `projects/{projectId}/{jobId}/{artifactId}.{extension}`, uploads preserve MIME type, and signed URLs expire after 15 minutes.

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- --run lib/storage/storage.test.ts`

Expected: FAIL because storage implementations are missing.

- [ ] **Step 3: Implement memory and S3-compatible storage**

Use memory storage in tests and `STORAGE_DRIVER=s3` outside tests. Require `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` for S3. Return a controlled configuration error listing only missing variable names.

- [ ] **Step 4: Document variables without secrets**

Add variable names and safe sample values to `.env.example`; never place credentials or signed production URLs in Git.

- [ ] **Step 5: Run and commit**

Run: `npm test -- --run lib/storage/storage.test.ts`

Expected: PASS.

```bash
git add package.json package-lock.json .env.example lib/storage
git commit -m "feat: add external media artifact storage"
```

### Task 4: Build the worker and approval gate

**Files:**
- Create: `scripts/media-worker.ts`
- Create: `lib/jobs/execute.ts`
- Create: `lib/jobs/execute.test.ts`
- Create: `app/api/workflow/projects/[id]/render/route.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: workflow repository, provider, job repository, and artifact storage.
- Produces: `executeJob(jobId)` and `POST /api/workflow/projects/:id/render`.

- [ ] **Step 1: Write failing authorization and idempotency tests**

Cover rejection before script approval, rejection before preview approval, rejection when the fresh estimate exceeds `approvedMaximumCostInr`, a successful zero-cost demo enqueue, and repeat requests returning the same job ID.

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- --run lib/jobs/execute.test.ts`

Expected: FAIL because the executor and route are missing.

- [ ] **Step 3: Implement the render route and executor**

The route builds an idempotency key from project ID plus the approved preview version, requests a fresh estimate, compares integer INR minor units, enqueues, and returns `202 { jobId }`. The worker claims one job, invokes its provider method, uploads artifacts, advances workflow state, and records failure without exposing raw provider output.

- [ ] **Step 4: Add the worker command**

Add `"worker:media": "tsx scripts/media-worker.ts"`. The process polls with bounded backoff, handles SIGTERM, finishes its current database transaction, and leaves the job reclaimable if interrupted during provider I/O.

- [ ] **Step 5: Run and commit**

Run: `npm test -- --run lib/jobs/execute.test.ts`

Expected: PASS.

```bash
git add package.json scripts/media-worker.ts lib/jobs app/api/workflow/projects
git commit -m "feat: execute approved media jobs"
```

### Task 5: Compose voice, captions, and hybrid video

**Files:**
- Create: `lib/render/manifest.ts`
- Create: `lib/render/manifest.test.ts`
- Create: `lib/render/ffmpeg.ts`
- Create: `lib/render/ffmpeg.test.ts`
- Create: `scripts/verify-media-tools.ts`
- Modify: `lib/jobs/execute.ts`

**Interfaces:**
- Produces: `buildRenderManifest(project, artifacts)` and `renderWithFfmpeg(manifest, outputPath)`.
- Consumes: approved script, generated stills or selected AI clips, narration audio, captions, and artifact storage.

- [ ] **Step 1: Write failing manifest tests**

Assert scenes cover the approved script in order, stills receive pan/zoom instructions, selected clips retain duration, voice and captions share one timeline, and no music track is present.

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- --run lib/render/manifest.test.ts`

Expected: FAIL because the manifest builder is missing.

- [ ] **Step 3: Implement the render manifest and FFmpeg command builder**

Represent all timing in integer milliseconds. Escape file paths through argument arrays, never a constructed shell string. Burn captions with high-contrast styling and mix narration as the sole audio track.

- [ ] **Step 4: Add media-tool verification**

`scripts/verify-media-tools.ts` runs `ffmpeg -version` and `ffprobe -version`, then exits with a plain installation message if either is unavailable. Unit-test command construction; run a five-second fixture integration only when `RUN_FFMPEG_TESTS=1`.

- [ ] **Step 5: Run and commit**

Run: `npm test -- --run lib/render`

Expected: PASS.

```bash
git add lib/render scripts/verify-media-tools.ts lib/jobs/execute.ts
git commit -m "feat: compose narrated hybrid videos"
```

### Task 6: Verify the no-cost pipeline end to end

**Files:**
- Create: `docs/verification/media-pipeline.md`
- Modify: only files required to fix verified defects.

**Interfaces:**
- Consumes: every task in this plan.
- Produces: local evidence for a complete demo-provider render.

- [ ] **Step 1: Run a fresh demo project through the queue**

Use a temporary SQLite file, memory artifact storage, and the demo provider. Approve the known ₹0 maximum, enqueue twice, verify one job exists, run the worker, and verify the workflow reaches delivery.

- [ ] **Step 2: Interrupt and resume one job**

Stop the worker after claim, wait for the test lease to expire, restart, and confirm the same job completes without duplicate artifacts.

- [ ] **Step 3: Record scope-accurate evidence**

Document the exact commands and results. Label output as demo/local; do not claim a live AI provider, paid video generation, VPS operation, or Telegram delivery.

- [ ] **Step 4: Run all checks**

Run: `npm test -- --run && npx tsc --noEmit && npm run build`

Expected: all checks pass.

- [ ] **Step 5: Commit verification**

```bash
git add docs/verification/media-pipeline.md
git commit -m "test: verify resumable media pipeline"
```
