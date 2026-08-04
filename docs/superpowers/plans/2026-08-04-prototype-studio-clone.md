# PROTOTYPE Studio Clone — Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Executed inline in this session.

**Goal:** Faithful clone of the "PROTOTYPE" YouTube AI video-studio app from the source MP4, with a swappable mock-now/real-later AI provider layer.

**Architecture:** Next.js 15 App Router + TS + Tailwind. All "AI" behind an `AIProvider` interface called from server API routes; a `MockProvider` returns canned data + delays + video-extracted images. Client state in a Zustand store persisted to localStorage.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Zustand, lucide-react, Vitest + RTL.

## Global Constraints

- Dark theme, near-black bg with warm radial glow; YouTube-red accent; Roboto/system font.
- API keys server-side only; provider chosen via `AI_PROVIDER=mock|gemini` env.
- Every wizard step, workspace section, toast, loader, empty/hover state from the video must be present.
- Match spacing/typography/colors to the source frames as closely as possible.

---

### Task 1: Scaffold + design tokens
**Files:** `package.json`, `next.config.ts`, `tsconfig.json`, `app/globals.css`, `app/layout.tsx`, `tailwind`/postcss config, `vitest.config.ts`.
- [ ] Create Next.js TS app (App Router, Tailwind).
- [ ] Add deps: zustand, lucide-react, vitest, @testing-library/react, jsdom.
- [ ] Define CSS tokens (bg, panel, border, text, muted, red accent, radii) + Roboto font, radial-glow body bg.
- [ ] Verify `npm run dev` boots and `npm test` runs.

### Task 2: Extract real assets from video
**Files:** `public/assets/characters/*`, `public/assets/locations/*`, `public/assets/styles/*`, `scripts/extract-assets.sh`.
- [ ] Re-extract full-res frames at timestamps with clean character/location/style images.
- [ ] Crop character cards (Indra, Yashoda, Krishna, Nandu) + location tiles + style thumbnails.
- [ ] Save to `public/assets/`. Document mapping.

### Task 3: Types + AIProvider interface + MockProvider
**Files:** `lib/ai/types.ts`, `lib/ai/provider.ts`, `lib/ai/mock/index.ts`, `data/*.ts`, tests.
- [ ] Define types: `Format`, `StoryOutline`, `VisualStyle`, `Asset`, `Scene`, `Shot`, `Project`.
- [ ] Define `AIProvider` interface (generateOutlines, regenerateOutlines, listStyles, initProject, generateAssetImage, iterateAsset, generateShotStoryboard, generateVideo, runCommand).
- [ ] Canned data files (suggestions, outline trios verbatim from video, styles, sampleProject).
- [ ] `MockProvider` with realistic delays returning canned data + extracted images.
- [ ] `getProvider()` selecting by env, default mock.
- [ ] Test: mock returns 3 outlines; regenerate returns a different trio; initProject builds Silent Sunbearer assets.

### Task 4: Server API routes
**Files:** `app/api/ai/[...op]/route.ts` (or discrete routes).
- [ ] Thin server routes delegating to `getProvider()`; keys never reach client.
- [ ] Client `lib/ai/client.ts` fetch wrapper.

### Task 5: Zustand project store + persistence
**Files:** `lib/store/project.ts`, tests.
- [ ] Store: wizard draft (format/idea/story/style), active project, assets, scenes/shots, toasts.
- [ ] Actions + localStorage persistence.
- [ ] Test: setFormat/selectStory/selectStyle; createProject; persistence round-trip.

### Task 6: Shared UI primitives + Toaster
**Files:** `components/ui/{Button,PillButton,IconButton,Loader,Tooltip,Modal,EditableTitle}.tsx`, `components/ui/Toaster.tsx`.
- [ ] Build primitives matching video styling.
- [ ] Toaster wired to store; animated dot/spinner loaders.

### Task 7: Wizard shell + footer + Step 1 Format
**Files:** `app/create/layout.tsx`, `app/create/page.tsx` (or step routing), `components/wizard/{WizardShell,WizardFooter,FormatCard}.tsx`.
- [ ] Header (logo + PROTOTYPE + X), footer (Previous / Next pill / Skip).
- [ ] Format step: two cards (Short 9:16 / Video 16:9), selectable.

### Task 8: Wizard Step 2 Describe
**Files:** `components/wizard/{SuggestionChip}.tsx`, step view.
- [ ] 6 suggestion chips + textarea with send; feeds store idea.

### Task 9: Wizard Step 3 Select story
**Files:** `components/wizard/{StoryOutlineCard}.tsx`, step view.
- [ ] Loading "Generating outline options…" (dots) → fetch outlines → 3 cards.
- [ ] "Use my story without editing it" pill; regenerate → new trio; select highlights.

### Task 10: Wizard Step 4 Visual style
**Files:** `components/wizard/{StyleCard}.tsx`, step view.
- [ ] Scrollable 4-col style grid from `listStyles()`; select highlights; finish → create project → route to workspace.

### Task 11: Workspace layout (Sidebar, TopBar, CommandBar)
**Files:** `app/project/[id]/layout.tsx`, `components/workspace/{Sidebar,TopBar,CommandBar}.tsx`.
- [ ] Sidebar (Home/Asset Designer/Shot Builder/Editor, active state).
- [ ] TopBar (hamburger, red logo + editable project title, Creative Brief, bell, book, avatar).
- [ ] Bottom floating CommandBar (input + mic + send) → runCommand → toast.

### Task 12: Project init sequence + Home
**Files:** `app/project/[id]/assets/page.tsx` (init toasts), `app/page.tsx` (Home).
- [ ] On new project: sequential toasts (Initializing → Applying visual style → Saving).
- [ ] Home: projects list + New project → `/create`.

### Task 13: Asset Designer
**Files:** `components/workspace/{AssetRow,AssetCard,AddCard,AssetDetail}.tsx`, assets page.
- [ ] Character/Location/Props rows; generating spinner → revealed images; hover delete; Add card.
- [ ] "Select any character to see details or iterate on them" + detail/iterate view via command bar.

### Task 14: Shot Builder
**Files:** `app/project/[id]/shots/page.tsx`, `components/workspace/{SceneList,SceneCard,ShotCard,ShotDetail,StoryboardPanel}.tsx`.
- [ ] Storyline mini-panel (collapsible), scenes + Add Shots + Generate Videos, shots list, Add scene.
- [ ] Empty state; Scene detail (title, description, Generate all videos, delete); Shot detail (Assets, Screenplay, Add Cut, Regenerate Storyboard, Generate Video, storyboard + Edit with prompt, one-time tooltip).

### Task 15: Editor (inferred)
**Files:** `app/project/[id]/editor/page.tsx`, `components/workspace/EditorTimeline.tsx`.
- [ ] Simple timeline (scene/shot clips) + preview player; labeled inferred.

### Task 16: Responsiveness + polish pass
- [ ] Verify layouts at desktop; graceful narrower widths; transitions/hover.

### Task 17: Verification vs video
**Files:** `docs/superpowers/verification-checklist.md`.
- [ ] Page-by-page comparison table vs frames; list anything not reproducible; run `npm run build`.

## Self-Review
Spec sections 5.1–5.10 map to Tasks 7–15; provider seam (§3) → Tasks 3–4; persistence (§2) → Task 5; assets (§7) → Task 2; verification (§11) → Task 17. No placeholders in shipped code; assumptions tracked in spec §9.
