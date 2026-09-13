# Creator Workflow Studio - Design Specification

**Date:** 2026-09-14
**Project:** CreatorStudio
**Status:** Approved design, awaiting written-spec review

## Purpose

Extend CreatorStudio into a single-user visual production system for scripts, images, voice, captions, and videos. A creator can start with an idea in the web app or Telegram, edit every stage on a visual canvas, approve the script and storyboard, generate the media, render a final video, and receive it in the studio and Telegram.

The system must keep the human in control of creative and paid steps. Every run shows the actual provider, progress, cost, fallback, and output. A job is complete only when its expected artifact is stored and can be opened.

## Approved decisions

- Extend the existing CreatorStudio repository.
- Give clients a five-step guided journey with large controls and plain language.
- Keep the node canvas, providers, retries, costs, and logs in a private operator view.
- Support short vertical and long-form video.
- Let Telegram create projects, approve gates, monitor, pause, cancel, and receive outputs.
- Use OpenClaw as controller and Codex execution path.
- Use Hermes for review, operational fallback, and secondary Telegram delivery.
- Render hybrid video: animated storyboard images plus selected AI hero clips.
- Include voice-over and captions in version one; add generated music later.
- Keep providers configurable and retain a zero-cost demo mode.
- Store metadata on the application server and media in S3-compatible object storage.
- Build, test, and commit locally. Stop before push, VPS configuration, restarts, or deployment.
- Require human approval after the script and storyboard.

## Verified baseline

CreatorStudio already has idea and format selection, story outlines, cast and location assets, scenes and shots, screenplay generation, storyboard images, IndexedDB persistence, animatic playback, local video export, mock and real AI seams, image spending guards, and visible degraded-mode notices.

On 2026-09-14, the founder-prototype branch was clean, all 45 tests passed, and TypeScript passed. OpenClaw and Hermes were active on the VPS. OpenClaw Telegram and its Codex plugin were enabled. Hermes reported Anthropic as primary with three OpenRouter fallbacks. The VPS was 94 percent full with about 6.1 GB free.

IndexedDB cannot support shared Telegram jobs. The app has a video generation interface but no live video provider. Those are the main structural gaps.

## Product layout

The product has two connected views.

### Client view

The client sees five guided steps:

1. **Tell us the idea:** type, speak, or send it through Telegram.
2. **Approve the words:** read the script and choose Yes, continue or I want a change.
3. **Choose the look:** select from three clear visual directions.
4. **Approve the preview:** watch a short preview before paid rendering.
5. **Receive the video:** download it or receive it through Telegram.

Each screen has one main decision, large type, large controls, a visible Back action, automatic saving, and a Continue where you stopped entry point. Provider names, model settings, node connections, retries, logs, and file handling are hidden. A client may complete every approval through Telegram without opening the technical workspace.

Progress uses plain statements such as Creating your pictures - about four minutes. Errors offer Try again or Ask for help. Paid steps state the maximum rupee amount before the approval button. Dragging is never required. Voice input is available wherever typing would otherwise be necessary.

### Operator view

The operator workspace has three columns:

1. A left rail for Projects, Templates, Character Bible, Runs, Deliveries, and Settings.
2. A central canvas with draggable nodes, directional edges, status rings, artifact previews, minimap, and fit controls.
3. A right inspector for selected-node inputs, provider, quality, estimated cost, dependencies, progress, outputs, versions, and allowed actions.

A fixed top bar shows project title, format, client stage, run state, projected and actual spending, save state, and the primary operator action. The client and operator views read and update the same workflow state.

The default flow is:

Brief -> Script -> Script approval -> Character and style lock -> Storyboard images -> Storyboard approval -> Shot planner -> Hero clips plus animated stills -> Voice-over -> Captions -> Final render -> Delivery

Users may reposition nodes and disable optional nodes. Version one does not allow arbitrary executable nodes or user-supplied code.

Selecting a node opens a focused form rather than raw JSON. Each node explains what it creates, what it needs, what it may cost, what requires approval, and what happens next.

Script approval shows the script, versions, Hermes review, estimated runtime, and Approve or Revise. Storyboard approval shows a scene grid, continuity warnings, missing frames, estimated video cost, and Approve or Revise.

Approvals record actor, source, timestamp, revision hash, and note. Editing approved upstream content invalidates its approval and marks downstream jobs stale.

## Architecture

### Web application

The existing Next.js app owns project editing, the workflow canvas, inspectors, authenticated sessions, API routes, previews, runs, approvals, and Telegram pairing.

### Metadata

Use SQLite in WAL mode for the single-user release. It stores state and metadata only. Repository interfaces keep a future PostgreSQL migration possible.

Development uses an ignored local database. Production uses a backed-up data directory outside the Git checkout.

### Media storage

Use an S3-compatible adapter, with Cloudflare R2 as the production default because the VPS lacks media capacity. A filesystem adapter supports development and tests.

Artifacts use immutable object keys and SHA-256 hashes. The browser receives short-lived signed URLs. Telegram streams or links the stored artifact without making the bucket public.

### Durable worker

A separate Node worker claims queued jobs from SQLite in transactions. Next.js validates commands and records state but does not hold long provider requests open.

Each job has an idempotency key, bounded retries, timeout, provider attribution, progress, projected and actual cost, cancellation flag, immutable input hash, provider job ID, and artifact verification. Expired job leases return to the queue after restart. Submitted provider jobs reconcile their provider ID before retrying.

### Provider boundaries

The generation layer exposes ScriptProvider, ImageProvider, VideoProvider, VoiceProvider, CaptionProvider, RenderProvider, ReviewProvider, and DeliveryProvider interfaces.

Mock adapters remain default. Live adapters are selected on the server. Credentials never enter client JavaScript or workflow documents.

## OpenClaw and Codex

Production script and planning jobs call the authenticated OpenClaw Gateway /hooks/agent endpoint through loopback or a private service network.

A dedicated studio agent has:

- an explicit allowed-agent entry;
- isolated sessions for independent jobs;
- caller-selected session keys disabled;
- a hook token different from gateway login credentials;
- stable idempotency keys;
- waitForCompletion for bounded script jobs;
- a minimal workspace and tool allowlist.

That agent uses the installed OpenClaw Codex runtime. Prompts contain the brief and approved artifact content without secrets or arbitrary file paths. Results must match a versioned JSON schema. Invalid results may be repaired once before being shown for review.

OpenClaw also handles natural-language Telegram control. Its CreatorStudio tool permits only typed create, status, approve, revise, pause, resume, cancel, and deliver operations.

## Hermes

Hermes is the review agent and secondary delivery path. The worker calls Hermes's OpenAI-compatible API server over loopback with a dedicated bearer key. This API is not exposed through nginx.

Reviews are stateless and identify the exact revision. Hermes returns verdict, summary, continuity issues, factual or policy risks, suggested changes, and confidence. Hermes can recommend but cannot approve for the user.

If OpenClaw is unavailable, Hermes may explain the operational status and deliver it to Telegram. It does not silently replace Codex for creative generation.

## Telegram and web pairing

Wazzirr is the primary bot. Mayaa supplies review summaries and fallback status.

Supported commands and equivalent natural-language requests are:

- /studio new
- /studio status
- /studio open
- /studio approve script
- /studio approve storyboard
- /studio revise
- /studio pause
- /studio resume
- /studio cancel
- /studio deliver
- /studio pair

Approval buttons contain revision-bound callback data. Old buttons cannot approve changed content. Commands are accepted only from allowlisted Telegram users.

Production web login uses Telegram pairing. The browser creates a one-time six-character code. The user sends it to Wazzirr. OpenClaw calls the internal pairing endpoint with the verified Telegram user ID. The server checks the allowlist, code hash, five-minute expiry, and one-time status, then issues a Secure, HttpOnly, SameSite=Strict session cookie. Local development may use an explicit localhost-only bypass.

## Core records

- **Project:** title, format, duration, aspect ratio, state, active workflow revision.
- **WorkflowRevision:** project, revision, nodes, edges, settings, content hash, actor, source.
- **Run:** workflow revision, source, state, projected and actual cost, timing.
- **Job:** node, provider, state, attempts, lease, idempotency key, input hash, provider job ID, progress, cost, error class.
- **Artifact:** project, run, job, type, object key, MIME type, size, hash, dimensions or duration, provider metadata, parents.
- **Approval:** run, gate, revision hash, status, actor, source, note, Telegram message ID, timestamp.
- **AuditEvent:** authentication, edits, runs, approvals, cancellations, deliveries, and administrative actions without secrets.

Run states are draft, queued, running, waiting_for_script_approval, waiting_for_storyboard_approval, paused, degraded, failed, cancelled, and completed.

Node states are idle, blocked, queued, running, waiting_for_approval, stale, completed, degraded, failed, and cancelled.

The web app and Telegram call one server-side transition service so neither surface can bypass approval or spending rules.

## Video production

Ordinary shots use storyboard images with controlled pan, zoom, crop, parallax, and transitions. Selected hero shots use an image-to-video provider. Voice-over is generated by scene or paragraph. Captions align to the approved narration. FFmpeg combines clips, animated stills, voice, captions, and deliberate silence.

Hero shots default to opening, turning point, climax, and closing image. The user can change them before storyboard approval.

Every live video submission shows projected cost and requires an approved storyboard. The worker and provider adapters enforce per-project and hourly limits independently of the UI.

## Failure handling

- Classify failures as authentication, quota, rate limit, rejected input, timeout, unavailable model, or internal.
- Retry only retryable failures with bounded backoff.
- Record every fallback with its provider and cost.
- Never present demo output as live output.
- Keep partial batches visible and resumable.
- Stop unsent jobs on cancellation and request provider cancellation where supported.
- Make Telegram callbacks and webhooks idempotent.
- Complete a job only after its artifact exists, is hashed, and has readable metadata.
- Retry delivery without rerendering.

## Security

- No provider credential in browser storage, workflow JSON, Git, logs, prompts, or Telegram.
- Load server secrets from restricted environment files or secret references.
- Use separate credentials for OpenClaw hooks and Hermes API.
- Bind agent endpoints to loopback or a private service network.
- Allowlist Telegram user IDs.
- Make pairing and approvals expiring, single-use, and revision-bound.
- Validate upload MIME type, extension, size, and decodability.
- Use expiring signed artifact URLs.
- Treat user and external content as untrusted prompt data.
- Give each agent the minimum tool surface needed.
- Enforce budgets in the worker and provider adapters.
- Redact authorization headers, signed URL queries, and sensitive request bodies.

Run tars-secure after implementation because this introduces authenticated APIs, agent hooks, uploads, and paid calls.

## Observability

The studio shows queue position, node, provider, elapsed time, progress, retry and fallback history, projected and actual spending, degraded reason, artifact verification, and delivery state.

Structured logs carry request, project, run, job, and provider correlation IDs. Health checks separately cover web, worker, database, object storage, OpenClaw, Hermes, and provider configuration. Health checks never spend money.

## Delivery slices

### Slice 1 - Local workflow core

Build server persistence, the canvas and inspector, default flow, durable worker, mock providers, approvals, filesystem artifacts, explicit IndexedDB export/import, localhost development access, tests, and browser verification.

### Slice 2 - Media production

Add S3 storage, live image and video adapters, the hybrid FFmpeg renderer, voice-over, captions, cost enforcement, artifact validation, resumable failures, and one separately approved bounded live-provider test.

### Slice 3 - Agents and Telegram

Add the dedicated OpenClaw studio agent and tool, Codex script hooks, Hermes loopback reviews, Telegram pairing, commands, inline approvals, progress, cancellation, delivery, duplicate-event protection, fake-agent integration tests, and a VPS deployment package.

## Deployment gate

Deployment is outside the current approval.

After local implementation:

1. Run tests, typecheck, build, and browser verification.
2. Run tars-secure and resolve findings.
3. Produce a manifest of files, services, ports, secrets, storage, backups, and rollback.
4. Confirm object storage and spending limits.
5. Back up OpenClaw, Hermes, nginx, and application metadata.
6. Stage without replacing bot routes.
7. Validate proposed agent configurations.
8. Request final approval for VPS writes, services, nginx changes, and restarts.
9. Deploy one component at a time.
10. Test Telegram idea -> script approval -> storyboard approval -> bounded render -> delivery.
11. Confirm both existing bots still answer and retain rollback files.

Disk use must be reduced or a strict cache ceiling proven before deployment.

## Acceptance criteria

The release is accepted when:

- an older non-technical client can complete the five-step journey without seeing provider settings or node controls;
- the client always sees one primary action, a Back action, saved progress, and plain-language status;
- every action is keyboard accessible, has a visible focus state, and meets a minimum 44 by 44 pixel target;
- text remains usable at 200 percent browser zoom and at mobile width;
- projects can start from web and Telegram;
- both surfaces show the same state;
- the canvas reports truthful node states;
- Codex through OpenClaw returns a schema-valid script;
- Hermes returns a structured review;
- approvals work in web and Telegram;
- stale buttons cannot approve changed content;
- image jobs create verified artifacts;
- a hybrid video with voice and captions renders;
- hero shots may use live video while ordinary shots use animated stills;
- server-side budget checks block excess spending;
- pause, resume, cancel, retry, and fallback are visible;
- final output opens in the studio and reaches Telegram;
- failures do not lose approved work;
- no secret appears in browser bundles, Git, logs, workflows, or Telegram;
- tests cover transitions, idempotency, approval invalidation, pairing, budgets, and artifacts;
- production build passes and desktop and mobile flows are visually verified.

## Exclusions

Version one excludes multi-user teams, arbitrary executable nodes, marketplaces, automatic social publishing, generated music, live collaborative editing, model training, unrestricted agent shell access, and bulk media storage on the current VPS disk.