# PROTOTYPE Clone — Verification Checklist (vs source MP4)

**Date:** 2026-08-05
**Source:** `Screen Recording 2026-08-03 232255.mp4` (339s, 1908×838, 30fps)
**Method:** Extracted 85 frames (1 per 4s) with ffmpeg + two contact-sheet montages, cross-checked against the running app and the design spec (`specs/2026-08-04-prototype-studio-clone-design.md`). Spec was itself transcribed from the video, so conflicts between spec and frames are flagged.

Legend: ✅ matches · ⚠️ partial / cosmetic diff · ❌ missing · ➕ inferred (not clearly in video)

## Page-by-page

| # | Screen / feature | In video | In build | Status |
|---|------------------|----------|----------|--------|
| 1 | Wizard — Choose your format (Short/Video cards, Prev/Next/Skip, X) | yes | yes | ✅ |
| 2 | Wizard — Describe your story idea (6 chips, textarea, send) | yes | yes | ✅ |
| 3 | Wizard — Select a story (loading → 3 outline cards; regenerate → 2nd trio; select highlights) | yes | yes | ✅ |
| 4 | Wizard — **Take a pass at the summary** (editable story summary/refine step after selecting) | yes | yes | ✅ (added, commit ce546d0) |
| 5 | Wizard — Establish your visual style (style grid, select highlights) | yes | yes | ✅ |
| 6 | Wizard — **Your visual style** (confirmation of chosen style) | yes | yes | ✅ (added, commit ce546d0) |
| 7 | Wizard — **Review your creative brief** (brief text + hero image before create) | yes | yes | ✅ (added, commit ce546d0) |
| 8 | Project init toasts (Initializing → Applying style → Saving → Project ready) | yes | yes | ✅ |
| 9 | Asset Designer — Characters row (Indra/Yashoda/Krishna/Nandu + Add) | yes | yes | ✅ |
| 10 | Asset Designer — Locations row (storm/village/hill/cave + Add) | yes | yes | ✅ |
| 11 | Asset Designer — Props row (wooden cow, Airavata elephant + Add) | yes (with art) | yes | ⚠️ prop art only via real provider; mock shows placeholder |
| 12 | Asset generating state | purple gradient **shimmer** | circular **spinner** | ⚠️ cosmetic |
| 13 | Asset detail / iterate view (larger image + command bar) | glimpsed | yes | ➕ |
| 14 | Shot Builder — Storyline panel, scenes, Add Shots / Add scene, empty state | yes | yes | ✅ |
| 15 | Shot Builder — Scene detail (title, description, Generate all videos, delete) | yes | yes | ✅ |
| 16 | Shot Builder — Shot detail (Assets, Screenplay, Regenerate Storyboard, Generate Video, Edit-with-prompt, one-time tooltip) | yes | yes | ✅ |
| 17 | Editor (timeline + preview player) | briefly | yes | ➕ inferred (spec §9) |
| 18 | Global — bottom Command Bar (all workspace pages) | yes | yes | ✅ |
| 19 | Global — bottom-right toasts | yes | yes | ✅ |
| 20 | TopBar — **Creative Brief** button opens the brief | yes (button + brief screen) | opens brief modal | ✅ (added, commit ce546d0) |
| 21 | State persistence across reloads | yes ("Saving…") | yes (IndexedDB) | ✅ |
| 22 | Responsiveness | (desktop recording) | responsive grids added | ✅ |

## Gaps to close (ranked)

1. ~~**Wizard refine + brief steps (#4, #6, #7, #20).**~~ **DONE (commit ce546d0).** Full flow now matches the video: *story → Take a pass at the summary → visual style → Your visual style → Review your creative brief → create*; the TopBar **Creative Brief** button opens the brief in a modal. Verified end to end in the browser.
2. **Generating shimmer (#12).** Replace the plain spinner on generating asset/shot tiles with the purple gradient shimmer seen in the video. *(open, cosmetic)*
3. **Prop art in mock (#11).** Props only get images from the real provider; mock shows a placeholder. Source shows a wooden cow + white elephant. Add snipped prop images to `public/assets/props/` for a faithful keyless demo. *(open)*

## Out of scope (per spec §10, confirmed against video)

- ChatGPT cutaways in the recording — the user fetching text externally, not part of the app.
- Real video rendering/export — no cheap video model wired; `generateVideo` is honestly stubbed ("video preview unavailable").
- Auth / multi-user / billing.

## Verified faithful

Format, describe, select-story (incl. regenerate trio), visual-style grid, project init sequence + toasts, all three asset rows, asset detail/iterate, full Shot Builder (scene + shot detail, tooltip), editor timeline, command bar, persistence, dark theme + red accent. Build is green (`next build`).
