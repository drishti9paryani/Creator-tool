# PROTOTYPE — AI Video Creation Studio Clone — Design Spec

**Date:** 2026-08-04
**Source of truth:** `C:\Users\Dell\Videos\Screen Recordings\Screen Recording 2026-08-03 232255.mp4` (339s, 1908×838, 30fps)
**Goal:** Faithful, production-ready clone. Mock the AI now behind a swappable provider layer; drop in real Gemini/other model keys later with no rewrite.

---

## 1. Product Overview

"PROTOTYPE" is a YouTube-branded AI film-studio web app. User flow:

1. **Onboarding wizard** turns a story idea into a project (format → describe → pick story → pick visual style).
2. **Workspace** where the project is fleshed out: characters/locations/props are generated as images, scenes and shots are built, and videos are generated.

The video shows a Krishna/Govardhan-Hill mythological story used as the example. Two cutaways to ChatGPT appear in the recording — those are the *user* fetching text externally and are **out of scope** (not part of the app).

---

## 2. Tech Stack & Rationale

- **Next.js 15 (App Router) + TypeScript + Tailwind CSS.** SSR + API routes let model keys stay server-side; matches the user's other projects; deploys to Vercel easily.
- **State:** Zustand store for the active project, persisted to `localStorage` (video shows state surviving reloads / "Saving…" toasts). Swappable for a DB later.
- **Testing:** Vitest + React Testing Library for store logic and key components (kept lightweight).
- **Icons:** `lucide-react` (close matches the thin line icons in the video).
- **Fonts:** Roboto / system sans (matches the YouTube-family look).

---

## 3. Core Architecture — Swappable AI Provider

The single most important design decision. All "AI" work goes through one interface so mock-now / real-later is a config flip, not a rewrite.

```
lib/ai/
  types.ts          // shared request/response types
  provider.ts       // AIProvider interface + getProvider() selector (env-driven)
  mock/             // MockProvider — canned data + artificial delays + extracted images
  gemini/           // (later) GeminiProvider and friends — real API calls
```

`AIProvider` interface (initial surface):

- `generateOutlines(idea, format): StoryOutline[]` — returns 3 outline cards
- `regenerateOutlines(...)` — new trio
- `listStyles(): VisualStyle[]` — style grid with thumbnails
- `initProject(story, style): Project` — creates characters/locations/props stubs
- `generateAssetImage(assetType, asset): imageUrl` — character/location/prop image
- `iterateAsset(asset, prompt): imageUrl` — refine an asset via prompt
- `generateShotStoryboard(shot): imageUrl`
- `generateVideo(shot | scene): videoUrl`
- `runCommand(prompt, context)` — the bottom AI command bar

**Security:** all provider calls execute in Next.js server API routes (`app/api/ai/*`). API keys read from server env only; never shipped to the browser. Provider chosen by `AI_PROVIDER=mock|gemini` env var.

**Mock behavior:** each method resolves after a realistic delay and emits the same status toasts seen in the video ("Initializing new project…", "Applying visual style to characters, locations, and props…", "Generating…", "Saving…"). Images come from frames snipped out of the source video at full resolution, stored in `public/assets/`.

---

## 4. Pages / Routes

| Route | Purpose |
|-------|---------|
| `/` | **Home** — projects dashboard + "New project" entry (sidebar item "Home") |
| `/create` | **Wizard** — 4 steps (format, describe, story, style) with Prev/Next/Skip footer + close (X) |
| `/project/[id]/assets` | **Asset Designer** (default workspace view) |
| `/project/[id]/shots` | **Shot Builder** |
| `/project/[id]/editor` | **Editor** (only briefly shown — inferred, labeled as assumption) |

Workspace routes share a layout: left **Sidebar** (Home, Asset Designer, Shot Builder, Editor), top **TopBar** (hamburger, red logo + project title, Creative Brief button, notifications bell, book/library icon, avatar), and the bottom floating **CommandBar** (text input + mic + send).

---

## 5. Screen-by-Screen Spec

### 5.1 Wizard — Step 1: Choose your format
- Centered heading "Choose your format", subtext "Specify aspect ratio".
- Two large selectable cards: **YouTube Short (9:16)** and **YouTube Video (16:9)**, each with a proportioned placeholder graphic. Selected card = highlighted border.
- Footer: "Previous" (left), "Next: describe story →" (center pill), "Skip" (right).
- Top-left red play logo + "PROTOTYPE"; top-right close X.

### 5.2 Wizard — Step 2: Describe your story idea
- Heading "Describe your story idea", subtext "Choose a suggestion or describe your idea".
- 6 suggestion chips (2 cols × 3 rows) each with an icon + one-line prompt (canned list).
- Large textarea "Describe your story idea…" with a send arrow.
- Footer: Previous / "Next: choose story outline →" / Skip.

### 5.3 Wizard — Step 3: Select a story
- Heading "Select a story"; pill button "Use my story without editing it".
- Loading state: centered animated dots + "Generating outline options…".
- Result: **3 outline cards** side by side, each: **title** (e.g. "The Divine Umbrella"), a description paragraph, **Characters:** bullet list, **Settings:** bullet list. Cards are tall/scrollable.
- Regenerating yields a fresh trio (video shows a second set: "The Playful Hill", "Seven Nights of Light", "The Mountain's Mercy"). Selecting a card highlights it.
- Footer: Previous / "Next: refine story →" / Skip.

### 5.4 Wizard — Step 4: Establish your visual style
- Heading "Establish your visual style".
- Scrollable grid (4 columns) of style cards, each a thumbnail image + label: 3D Cinematic, 3D Anime, 2D Anime, Watercolor, Sword and Sorcery, Tactile Claymation, Retro VHS, Y2K Vinyl Toy, Vaporwave Manga, Monochrome Manga, Graphic Pop Cartoon, Modern Vector Graphic, + more rows below. Selected card highlighted.
- Completing the wizard creates the project and transitions into the workspace.

### 5.5 Workspace — Project init
- On entry the project shows an editable title ("Title of the project", auto-renamed e.g. "Silent Sunbearer").
- Sequential toasts: "Initializing new project…" → "Applying visual style to characters, locations, and props…" → "Saving…".
- **Assets** section with three rows: **Characters**, **Locations**, **Props** (each with "Show All"). **Storyline** section below with Scene cards (Scene 1/2/3) + "Add Scene", and "Show in Editor".

### 5.6 Asset Designer
- Rows of asset cards. **Characters**: INDRA, YASHODA, KRISHNA, NANDU, each a tall image card with name + "Character" subtitle; trailing **Add Character** dashed card.
- **Locations**: grid of image cards (storm/village/hill/cave), generating (spinner) → revealed; hover shows a delete (trash) icon top-right; trailing **Add** (+) card.
- **Props** row similar.
- Subtext under Locations: "Select any character to see details or iterate on them."
- Clicking an asset opens a detail/iterate view (infer: larger image + prompt-to-iterate). Bottom CommandBar accepts prompts like "Make all characters talk like p…", "Change the location to a castle".

### 5.7 Shot Builder
- Left mini-panel: **Storyline** (collapsible ‹), scene list ("Untitled Scene") with **Add Shots**, and per-scene **Generate Videos**; shots listed under a scene ("Unnamed Shot") with thumbnail; **Add scene** at bottom.
- Empty right panel: "Select a shot or scene to view details".
- **Scene detail:** "Scene Title" (editable), "Enter scene description…", top-right **Generate all videos** + delete.
- **Shot detail:** "Unnamed Shot" header, **Assets** (with Add), **Screenplay**, **Add Cut**, top-right **Regenerate Storyboard** + **Generate Video**, storyboard preview area with **Edit with prompt**, and a one-time tooltip "You're almost there! Click here to generate your video from the start frame".

### 5.8 Editor (inferred)
- Only glimpsed via "Show in Editor". Build a consistent simple timeline editor: scene/shot clips on a horizontal track, a preview player, and basic play controls. **Clearly documented as inferred** where not shown.

### 5.9 Global — Bottom Command Bar
- Floating pill at bottom-center on all workspace pages: left accent icon, text input (context-aware placeholder), mic icon, send. Submitting runs `provider.runCommand` (mock: toast + plausible effect). Present in Asset Designer, Shot Builder, Editor.

### 5.10 Global — Toasts / Notifications
- Bottom-right transient toasts with a small animated icon + message (init, applying style, saving, generating). Reusable `Toast`/`Toaster`.

---

## 6. Visual Design

- **Theme:** dark, near-black background (`#0a0a0a`-ish) with a subtle warm radial glow center/lower. White primary text, muted gray secondary.
- **Accent:** YouTube red for the logo/play mark; neutral/white for selected states and primary pills.
- **Cards:** rounded corners (~12–16px), faint border, slightly lighter panel fill, soft hover elevation.
- **Typography:** Roboto family; large centered wizard headings (~28–34px bold), small captions.
- Match spacing/sizing to the frames as closely as possible.

---

## 7. Data (canned, drives the mock)

- `data/suggestions.ts` — 6 story-idea chips.
- `data/outlines.ts` — the two outline trios from the video (verbatim titles + text).
- `data/styles.ts` — style grid entries + thumbnail image paths.
- `data/sampleProject.ts` — "Silent Sunbearer": characters (Indra, Yashoda, Krishna, Nandu), locations, props, scenes/shots → mapped to extracted images in `public/assets/`.

---

## 8. Component Inventory (reusable)

Shared: `Button`, `IconButton`, `PillButton`, `Loader` (dots/spinner), `Tooltip`, `Modal`, `Toast`/`Toaster`, `EditableTitle`.
Wizard: `WizardShell` (header + footer + X), `WizardFooter`, `FormatCard`, `SuggestionChip`, `StoryOutlineCard`, `StyleCard`.
Workspace: `Sidebar`, `TopBar`, `CommandBar`, `AssetRow`, `AssetCard`, `AddCard`, `SceneList`, `SceneCard`, `ShotCard`, `DetailPanel`, `StoryboardPanel`.

---

## 9. Assumptions (documented, per brief)

1. **Editor page** is largely inferred — barely shown in the video.
2. **Home/dashboard** layout inferred (sidebar has "Home"; the recording starts mid-wizard).
3. Exact suggestion-chip text, some style labels, and props are partially inferred where frames were unreadable.
4. Real AI generation is mocked; outputs use images snipped from the source video.
5. Asset **detail/iterate** interactions are inferred from partial views + the command bar.
6. Fonts approximated to Roboto; exact brand font not confirmable from video.

---

## 10. Out of Scope (v1)

- Real model API calls (structure ready; keys added later).
- Real video rendering/export.
- Auth / multi-user / billing.
- The ChatGPT cutaways in the recording.

---

## 11. Delivery Checklist (verify against video before "done")

Every wizard step, every workspace section, every toast/loader/empty/hover state, the command bar, state persistence, responsiveness. Produce a final page-by-page comparison table and list anything not reproducible.
