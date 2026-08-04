# PROTOTYPE — AI Video Creation Studio (clone)

A faithful, production-quality clone of the "PROTOTYPE" AI storyboard/video studio, built from a screen recording as the source of truth. Turn a story idea into a project: pick a format, generate story outlines, choose a visual style, then generate character/location/prop art, build scenes and shots, and preview in a timeline editor.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS · Zustand**.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Runs in **mock mode** by default (canned data + images, no API keys needed).

## Live AI (optional)

Real generation runs behind one swappable provider seam (`lib/ai/`), selected by an env var. To enable it:

```bash
cp .env.example .env.local   # then paste your keys into .env.local
```

`.env.local` is git-ignored — keys never reach the browser or git (all provider calls run server-side in `app/api/ai/`).

| Setting | Purpose |
|---------|---------|
| `AI_PROVIDER` | `real` = live AI · `mock` = canned data (default) |
| `OPENCODE_API_KEY` | Text (story outlines, command bar) → opencode Zen / Gemini |
| `OPENAI_API_KEY` | Images (assets, storyboards) → OpenAI |

Full list with defaults is in `.env.example`. On boot, a health check logs each provider as `ok`/`FAIL` so a missing or unfunded key shows immediately.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run test` — Vitest

> Note: don't run `next build` while `next dev` is running — they share `.next` and the build corrupts the dev server's chunks.

## Structure

```
app/                     routes: /, /create (wizard), /project/[id]/{assets,shots,editor}, /api/ai/[op]
components/{wizard,workspace,ui,brand}
lib/ai/                  provider seam — types, selector, mock/, real/, http, prompts
lib/store/               Zustand store (persisted to IndexedDB)
data/                    canned formats, suggestions, outlines, styles, sample project
docs/superpowers/        design spec, plan, verification checklist (vs the source MP4)
```

## Status

The full wizard, asset designer, shot builder, editor, command bar, toasts, and state persistence match the source video (see `docs/superpowers/verification-checklist.md`). Video generation is intentionally stubbed (no cheap text-to-video backend). Remaining polish: purple-shimmer generating state, mock prop art.
