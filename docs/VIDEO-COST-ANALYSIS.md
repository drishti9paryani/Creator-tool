# Video generation — cost analysis & integration plan

**Written 2026-08-15.** Target: one 6-minute video per week, cut every 3–5s,
generated from storyboard stills (image-to-video).

Prices below marked **[official]** come from `ai.google.dev/gemini-api/docs/pricing`
and `developers.openai.com/api/docs/pricing`, fetched 2026-08-15. Anything marked
**[secondhand]** came from third-party blogs and must be confirmed against the
vendor console before anyone budgets off it.

---

## 1. The constraint that sets the whole budget

Veo bills **per second of video it generates**, and it only generates clips of
**4, 6, or 8 seconds** — nothing else. [official]

You pay for the clip length you asked for, not the length you keep. So a 3-second
cut still costs a 4-second clip, and you throw the extra second away.

A 6-minute film is 360 seconds delivered. What you actually get billed:

| Your cut length | Veo clip you must buy | Clips for 6 min | Seconds billed | Waste |
|---|---|---|---|---|
| 3s | 4s | 120 | 480 | **33%** |
| 4s | 4s | 90 | **360** | **0%** |
| 5s | 6s | 72 | 432 | 20% |
| 6s | 6s | 60 | **360** | **0%** |
| 8s | 8s | 45 | **360** | **0%** |

**Snap the edit to a 4s / 6s / 8s grid.** It costs nothing, changes no code, and
it is the difference between paying for 360 seconds and paying for 480. On the
Standard tier that single decision is $48/video, $2,496/year.

### The 1080p trap

> "The 8-second duration is mandatory when using 1080p, 4k resolutions, or
> reference images." [official]

At 1080p every clip is 8 seconds minimum. If you want 4-second cuts at 1080p you
buy 8 seconds and bin half of it — **double cost**. At 1080p the cheapest edit is
one that cuts every 8 seconds.

720p keeps 4s clips legal, which is why 720p + a 4s grid is the cost floor.

**Not yet confirmed:** the 8s rule names `referenceImages` (a separate "guide the
style with up to 3 images" parameter), not the first-frame `image` parameter that
image-to-video actually uses — these are documented as two different fields. The
plan below assumes first-frame images do **not** force 8s. Verify this on the
first paid call before committing to a 4s grid; if it turns out they do, every
720p number below doubles.

---

## 2. Cost per 6-minute video — Veo 3.1 via Gemini API

Per-second rates, paid tier: [official]

| Model | 720p | 1080p | 4k |
|---|---|---|---|
| Veo 3.1 **Lite** | $0.05 | $0.08 | — |
| Veo 3.1 **Fast** | $0.10 | $0.12 | $0.30 |
| Veo 3.1 **Standard** | $0.40 | $0.40 | $0.60 |

All tiers include natively generated audio.

### 720p, 4-second cuts (90 clips, 360s billed) — the efficient case

| Tier | Video | + 90 storyboard images | + text | **Per video** | **Per year (×52)** |
|---|---|---|---|---|---|
| Lite | $18.00 | $3.51 | ~$0.20 | **$21.71** | **$1,129** |
| Fast | $36.00 | $3.51 | ~$0.20 | **$39.71** | **$2,065** |
| Standard | $144.00 | $3.51 | ~$0.20 | **$147.71** | **$7,681** |

### Same 6 minutes, other choices

| Setup | Clips | Billed sec | Lite | Fast | Standard |
|---|---|---|---|---|---|
| 720p, 3s cuts | 120 | 480 | $24.00 | $48.00 | $192.00 |
| 720p, 4s cuts | 90 | 360 | $18.00 | $36.00 | $144.00 |
| 720p, 5s cuts | 72 | 432 | $21.60 | $43.20 | $172.80 |
| 720p, 8s cuts | 45 | 360 | $18.00 | $36.00 | $144.00 |
| 1080p, 4s cuts | 90 | **720** | $57.60 | $86.40 | $288.00 |
| 1080p, 8s cuts | 45 | 360 | $28.80 | $43.20 | $144.00 |
| 4k, 8s cuts | 45 | 360 | — | $108.00 | $216.00 |

### Add the reshoot factor

Nobody keeps every generated clip. Budget a 30% regeneration rate on first
production runs (a bad clip costs a full new clip — there is no partial refund):

| Tier, 720p/4s | Clean run | +30% reshoots | Per year |
|---|---|---|---|
| Lite | $21.71 | **$28.11** | $1,462 |
| Fast | $39.71 | **$50.51** | $2,627 |
| Standard | $147.71 | **$190.91** | $9,927 |

**Realistic planning number for weekly output at usable quality: $2,600–3,000/year
on Veo 3.1 Fast at 720p.**

---

## 3. Images and text are noise — don't optimise them

The storyboard frames that feed the video are a rounding error next to the video
itself. 90 frames:

| Model | Per image | 90 frames | Note |
|---|---|---|---|
| Imagen 4 Fast | $0.02 [official] | $1.80 | ⚠️ **shuts down 2026-08-17** — unusable |
| Gemini 3.1 Flash Lite Image | $0.0336 [official] | $3.02 | cheapest live option |
| Gemini 2.5 Flash Image | $0.039 [official] | $3.51 | $1.76 on batch |
| Gemini 3.1 Flash Image | $0.045 [official] | $4.05 | |
| Nano Banana Pro | ~$0.13 [secondhand] | ~$11.70 | not on the official page — verify |
| OpenAI gpt-image-1 (low) | ~$0.011 [secondhand] | ~$0.99 | ⚠️ **retires 2026-10-23** |

Text (story, 90 screenplays) on Gemini 2.5 Flash at $0.30/$2.50 per M tokens
[official] lands around **$0.20 per video**. Ignore it.

**Takeaway: 91% of your spend is Veo.** Choosing a cheaper image model saves $2.
Choosing a 4s grid over a 3s grid saves $12–48.

### Sora 2, for comparison [official]

| Model | Per second | 360s |
|---|---|---|
| sora-2 (720p) | $0.10 | $36.00 |
| sora-2 (720p, batch) | $0.05 | $18.00 |
| sora-2-pro (1080p) | $0.70 | $252.00 |

Sora-2 at 720p is priced identically to Veo 3.1 Fast. Veo wins on fit here because
the Gemini API is already the text backend and Veo's first-frame image-to-video
matches the storyboard-first workflow this app is built around.

---

## 4. The wider model landscape — every model quantizes differently

**Locked with the founder 2026-08-15: 720p, 4-second cuts.** The catch is that a
4-second clip is a *Veo* feature. Every model sells video in its own block sizes,
and the minimum block is what you actually pay for.

| Model | Clip lengths sold | 720p rate | Native audio | First+last frame |
|---|---|---|---|---|
| **Veo 3.1 Lite** | 4 / 6 / 8s [official] | **$0.05/s** | yes | first frame |
| **Veo 3.1 Fast** | 4 / 6 / 8s [official] | **$0.10/s** | yes | first frame |
| **Veo 3.1 Standard** | 4 / 6 / 8s [official] | $0.40/s | yes | first frame |
| **Kling 2.5 Turbo Pro** | **5 or 10s only** [fal] | $0.35 per 5s = $0.07/s | not stated | yes (`tail_image_url`) |
| **Wan 2.5** | **5 or 10s only** [fal] | $0.10/s (480p $0.05, 1080p $0.15) | **no** — you supply it | first frame |
| **Seedance 2.0** | **4–15s, or auto** [fal] | $0.3034/s (1080p $0.682) | yes, incl. lip-sync | yes (`end_image_url`) |
| **Sora 2** | not verified | $0.10/s ($0.05 batch) [official] | yes | — |
| **Kling 3.0** | 3–15s [secondhand] | ~$0.075–0.14/s [secondhand] | optional, costs more | yes |
| **Runway Gen-4.5** | not verified | ~$0.12/s [secondhand] | — | yes |

Kling 2.5 and Wan 2.5 **cannot make a 4-second clip.** On a 4s grid you buy 5s and
bin 20%. They only become efficient if you cut at 5s.

### 6 minutes of finished video, cheapest configuration per model

| Model | Best grid | Clips | Billed | **Cost** | Trade-off |
|---|---|---|---|---|---|
| **Veo 3.1 Lite** | 4s | 90 | 360s | **$18.00** | cheapest with audio; no extend, no 4k |
| **Wan 2.5 @ 480p** | 5s | 72 | 360s | **$18.00** | 480p, and **silent** |
| **Kling 2.5 Turbo Pro** | 5s | 72 | 360s | **$25.20** | audio unconfirmed |
| **Veo 3.1 Fast** | 4s | 90 | 360s | **$36.00** | the balanced pick |
| **Wan 2.5 @ 720p** | 5s | 72 | 360s | **$36.00** | silent |
| **Sora 2 @ 720p** | — | — | 360s | **$36.00** | $18.00 on batch |
| **Seedance 2.0 @ 720p** | 4s | 90 | 360s | **$109.22** | current quality leader |
| **Veo 3.1 Standard** | 4s | 90 | 360s | **$144.00** | |
| **Seedance 2.0 @ 1080p** | 4s | 90 | 360s | **$245.52** | |

Same 4-second cut on the same 6-minute film ranges **$18 to $245** — a 13× spread
driven entirely by model choice.

### If you want to experiment, don't integrate four vendors

Use **one aggregator** (fal.ai, Replicate, OpenRouter) so a single key and a single
`model` string reaches Veo, Kling, Wan and Seedance. Swap models by changing a
string, compare on identical storyboard frames, then integrate the winner
natively if the volume justifies it. Aggregators charge a margin over Google's
direct rate — fine for a bake-off, worth dropping later.

**Caveat on the [fal] and [secondhand] rows:** aggregator prices are that
aggregator's rate, not the vendor's, and third-party blog figures for the same
model disagreed by up to 5× during this research. Confirm in the console before
budgeting.

## 5. Fitting ₹2,000/month — the actual answer

**Budget: ₹2,000/month. Exchange rate ₹95.67/USD (14 Aug 2026) → $20.90/month.**
Output: 4 videos × 6 minutes = **24 minutes = 1,440 seconds of finished video.**

That is a ceiling of **$0.0145 per second of video.** The cheapest per-second rate
anywhere in §4 is $0.05. So the first finding is blunt:

> **Generating AI video for every second is impossible inside this budget.**
> Veo 3.1 Lite — the cheapest option that exists — costs $72/month (₹6,888) for
> 24 minutes. That is 3.4× over budget, and it is the floor, not a mid-tier.

### Do subscriptions fix it? No — and for a reason price doesn't show

| Plan | Price/month | What it actually gives | Verdict |
|---|---|---|---|
| Google AI Plus (India) | **₹399** (₹199 intro) | 200 Flow credits ≈ 20 gens ≈ 2.7 min | ~9× short |
| **Google AI Pro (India)** | **₹1,950** | 1,000 Flow credits ≈ 100 Veo Lite gens ≈ **13 min** | Eats the entire budget, still only half the video |
| Google AI Ultra (India) | ₹6,500–24,500 | plenty | 3–12× over budget |
| Kling Free | ₹0 | 66 credits/day ≈ 99 clips/mo | **watermarked** |
| Kling Standard | ~₹842 | 660 credits ≈ 33 clips ≈ 2.75 min | ~9× short |
| Kling Pro | ~₹3,115 | 3,000 credits ≈ 150 clips | over budget |

Two things kill the subscription route regardless of price:

1. **Nothing in budget delivers 24 minutes.** The best fit, Google AI Pro at
   ₹1,950, delivers 13 minutes and leaves ₹50 for images and text.
2. **Consumer plans are UI-only. There is no API.** Flow and Kling's consumer
   tiers are websites you click. CreatorStudio cannot call them. A subscription
   means *you* manually uploading 90 storyboard frames and downloading 90 clips,
   every week. At 4 videos/month that is 360 manual round-trips.

The published break-even is ~400–500 seconds/month: below it the API is cheaper,
above it subscriptions win. At 1,440 s/month you are well into subscription
territory — and no subscription in this budget goes there. The route is closed.

### What actually fits: stop paying for motion

Motion via ffmpeg pan-and-scan on a still — the Ken Burns effect — costs **₹0**.
A practitioner running this exact pipeline published their receipts: **$10.50 per
video with AI motion on every scene → $0.06 with Ken Burns**, a ~175× cut, on
published work. Their middle setting spends a fixed AI budget on the highest-
priority scenes only ("a tiny greedy knapsack") and Ken-Burns the rest.

Applied here, at 90 shots per 6-minute video:

| Line item | Choice | Per video | Per month (×4) |
|---|---|---|---|
| 90 stills | Gemini 2.5 Flash Image, **batch** ($0.0195) | $1.76 | $7.04 |
| Motion on ~74 shots | ffmpeg Ken Burns | **$0.00** | $0.00 |
| AI motion on ~16 hero shots | Veo 3.1 Lite, 4s each | $3.26 | $13.06 |
| Story + 90 screenplays | Gemini 2.5 Flash | $0.20 | $0.80 |
| **Total** | | **$5.25** | **$20.90 = ₹2,000** |

**That lands exactly on budget, with AI motion on 16 shots per video** — the hook,
the turns, the climax, the closing image. The other 74 shots drift, push in, or
pull back on a still, which is what most of a 6-minute film wants anyway.

Cheaper still if you want headroom for reshoots:

| Setting | AI-motion shots/video | Per month | |
|---|---|---|---|
| Stills only, zero AI motion | 0 | **₹672** | proves the pipeline |
| Conservative | 8 | **₹1,336** | ₹664 spare for reshoots |
| **On budget** | **16** | **₹2,000** | recommended |
| All-AI (for reference) | 90 | ₹6,888 | 3.4× over |

### The part that matters most: this also solves character consistency

Ken Burns motion on a character-consistent still has **perfect** consistency —
it is literally the same image, so the face cannot drift. AI video generation is
where identity breaks.

So the cheap answer and the consistency answer are the same answer. The thing
that costs the money is the same thing that breaks the faces. Spend it on 16
shots where motion genuinely earns it, and hold the other 74 rock-steady for free.

## 6. Two production strategies — they are not the same product

**A. Shot-per-clip** (recommended). Each storyboard frame becomes the first frame
of its own 4s clip. Full creative control per shot, cheapest grid, **all three
tiers available including Lite**. Downside: cuts are hard cuts, and each clip's
audio is generated independently.

**B. Extend-chains.** Veo can extend a clip by up to 7s, up to 20 times — about
148 seconds of continuous motion per chain. Six minutes needs at least three
chains. Extension is **720p only and excluded from Lite**, so the floor rises to
Fast at $0.10/s → $36/video minimum. Buys motion continuity, costs the cheap tier.

---

## 7. What has to change in this codebase

### (a) To make what already exists run live — small

1. **Set keys.** `keys` (Desktop shortcut or `npm run keys` in a real terminal),
   then `AI_PROVIDER=real`, then restart the dev server.
2. **Nothing in live mode has ever executed.** `RealProvider` typechecks and has
   never made a single real call. Treat the first run as untested code and watch
   `dev.err.log` for the `[health]` line.
3. **Change the image model.** `.env.example` pins `OPENAI_IMAGE_MODEL=gpt-image-1`,
   which retires 2026-10-23. For this workflow the images should come from Gemini
   anyway — one API, one key, one bill.
4. **Raise the spend guard.** `IMAGE_LIMIT_PER_PROJECT` defaults to **8**. A
   6-minute film needs ~90 frames, so 82 of them would fall back to placeholder
   art with a warning toast. Set it to ~150 with a matching hourly cap.

### (b)(0) ~~BLOCKER~~ — FIXED 2026-08-15

The story engine was hard-capped at 12 shots:

```ts
// lib/ai/story.ts, before
const beats = arc.beats(ctx).slice(0, format === "short" ? 3 : 4);
const shotsPer = format === "short" ? 2 : 3;   // 4 x 3 = 12 shots = 48 seconds
```

Fixed. The archetype's beats are now treated as **acts**, and the number of
scenes inside each act scales with a `targetSeconds` parameter:

| Target | Scenes | Shots | Runtime |
|---|---|---|---|
| 32s | 4 | 12 | 48s (act-structure floor) |
| **360s** | **30** | **90** | **360s** |
| 600s | 50 | 150 | 600s |

Also changed:

- `SCENE_MOVES` (12 entries) subdivides an act into distinct scenes — walked in
  order, because hashing into the pool produced acts that opened on "Refusal".
- `SHOT_ANGLES` went from 3 entries to 12, offset per scene, so a 90-shot film
  never repeats the same angle back to back.
- Shot titles dropped to two parts; three was unreadable in the Shot Builder.
- `SECONDS_PER_SHOT = 4` and `DEFAULT_TARGET_SECONDS` are exported constants, so
  runtime is a parameter rather than a new hardcode.

6 new tests guard the ceiling (`lib/ai/story.test.ts` → "deriveScenes runtime
length"). **45/45 tests pass, typecheck clean.**

**Still outstanding from this change:** the Shot Builder UI has never been
visually reviewed even at 12 shots, and now renders 90. That needs eyes on it.

### (b) To add video generation — architectural, not a wire-up

The `AIProvider` seam already has `generateVideo()`, but its shape is wrong for
how Veo actually works:

```ts
generateVideo(target: { sceneId?: string; shotId?: string }): Promise<{ url: string }>
```

### (b)(0b) Character consistency — SHIPPED 2026-08-15

`lib/store/characters.ts` — the **Character Bible**. Characters live in their own
persisted store with their own IndexedDB key, so deleting a project does not
delete the cast, and the same character can be reused across every project.

```ts
interface CanonCharacter {
  name: string;         // locked — never regenerated from the idea text
  description: string;  // locked physical description — the identity anchor
  wardrobe?: string;    // restated every shot
  references: string[]; // 1-5 reference images (data URLs)
  seed: number;         // stable seed for backends that accept one
  usedIn: string[];     // which projects this character appears in
}
```

`canonPrompt()` is the **single** place identity text is assembled — no call site
can paraphrase and drift. `mergeBible()` merges an imported bible by name, and a
stale export can never overwrite newer work. 10 tests cover it.

**Two limits, stated rather than implied:**

- Storage is IndexedDB, so it is per-browser and dies with site data.
  `exportBible()` produces the JSON that actually lasts forever — that file is
  the durable artefact, not the browser.
- `references` are **stored but not yet sent anywhere.** `lib/ai/http.ts` calls
  OpenAI's text-only `/images/generations` endpoint, which accepts no reference
  image. Wiring them requires the Gemini image switch first. Until then
  consistency rests on the locked description, which holds wardrobe and
  silhouette well and a face only partially.

| # | Problem | What it needs |
|---|---|---|
| 1 | Veo is a long-running operation: **11 seconds to 6 minutes** of polling per clip. The current signature is fire-and-return. | A job id + a status endpoint the UI polls. |
| 2 | **90 clips run sequentially = 16 minutes to 9 hours.** | A concurrency-limited queue. This decides whether the weekly video is a coffee break or an overnight babysitting job. |
| 3 | Google **deletes generated video after 2 days**. | Download-on-completion. Interacts badly with a 9-hour pipeline. |
| 4 | Storage is IndexedDB, per browser, no server. A 6-min render plus 90 source clips is far past what belongs there. | Real file storage. The handoff already lists "nothing is shareable between testers" as accepted debt — video turns that into a blocker. |
| 5 | **No concatenation step exists.** 90 clips is not a film. | An ffmpeg assembly stage. |
| 6 | Veo generates **audio per clip**, independently. 90 unrelated audio beds stitched end to end will sound discontinuous. | Either accept it, or generate silent and lay one music/VO bed over the cut. Recommend the latter for a 6-min piece. |
| 7 | The spend guard counts images only. A misfire could bill $144 in one click. | Extend the budget guard to video seconds, with a hard per-project ceiling. |

Items 1–5 are the real work. This is roughly a "render farm" feature, not an
afternoon.

### (c) How the Gemini video API actually gets called

Same key and SDK as the text backend, so no new vendor:

1. `POST` a generate-video request with the storyboard frame as the first-frame
   `image`, plus the shot's screenplay as the prompt, `durationSeconds: 4`,
   `resolution: "720p"`, `aspectRatio: "16:9"` (or `"9:16"` for shorts).
2. Receive an **operation object** — not a video.
3. Poll that operation until done (11s–6min).
4. Download the file **within 2 days**.
5. Repeat ×90, then ffmpeg-concat.

The prompt-building code already does the hard part: `generateShotStoryboard`
already assembles scene + screenplay + cast + style into one prompt. The video
prompt is the same string with motion direction added.

---

## 8. Recommendation

Founder has locked **720p and a 4-second grid**, and wants to experiment across
models rather than commit to one. That points at a bake-off, not a build.

1. **Run a bake-off before writing any pipeline code.** One storyboard, 8 shots,
   32 seconds. Generate the same 8 frames through Veo 3.1 Fast, Veo 3.1 Lite,
   Kling 2.5 Turbo Pro and Wan 2.5, and watch them side by side.

   | Model | 8 × 4s shots | Cost |
   |---|---|---|
   | Veo 3.1 Lite | 32s | **$1.60** |
   | Veo 3.1 Fast | 32s | **$3.20** |
   | Kling 2.5 Turbo Pro | 8 × 5s = 40s | **$2.80** |
   | Wan 2.5 @ 720p | 8 × 5s = 40s | **$4.00** |
   | Seedance 2.0 @ 720p | 32s | **$9.71** |
   | **All five** | | **~$21** |

   Twenty-one dollars answers a question no amount of further research will:
   which model actually holds your characters on-model across cuts. That is the
   real failure mode of shot-per-clip production, and it is not in any price
   table.

2. **Do it through one aggregator** (fal.ai or Replicate) so the bake-off is a
   string change, not four integrations.

3. **Default to Veo 3.1 Fast at 720p** unless the bake-off says otherwise —
   ~$50/video with reshoots, ~$2,600/year weekly. Veo 3.1 Lite at $18/video is
   the fallback if quality holds; Seedance is the upgrade if it doesn't.

4. **Fix the two blockers first, they are five minutes each:** raise
   `IMAGE_LIMIT_PER_PROJECT` from 8 to ~150, and move image generation off
   `gpt-image-1` (retires 2026-10-23) to Gemini. Otherwise the bake-off runs on
   placeholder art.

5. **Don't build the video pipeline until §6(b) items 1–5 are scoped.** Wiring
   `generateVideo()` to any of these models without the queue, storage and concat
   stages produces a button that times out.

### The bake-off is a throwaway script, not a feature

There is no video code in this app — `generateVideo()` returns `{url: ""}`. The
bake-off is ~40 lines outside CreatorStudio: read exported storyboard frames, POST
each to one fal.ai endpoint with four different `model` strings, save the results
to a folder, watch them. Delete it afterwards. Don't look for a button.

### Cheaper first half: test the image model before the video models

With first-frame image-to-video, the video model inherits whatever the storyboard
frame gives it. If the image model drifts a character's face across 90 frames, no
video model repairs that — and character consistency across cuts is the actual
failure mode of shot-per-clip production.

So run the image half first: **generate 15–20 frames of the same character and
look at them. $0.60–0.80.** If faces hold, spend the $21 on video models. If they
don't, the video bake-off is premature and the real question is reference-image
conditioning on the image side.

### Still open

- **Audio.** Founder deferred the per-clip-audio vs single-bed decision pending
  the model exploration. It interacts with model choice: Wan 2.5 is silent by
  design, Kling 2.5's audio is unconfirmed, Veo and Seedance generate per clip.
  Decide after hearing the bake-off.
- **Does Veo 3.1 Lite support first-frame image-to-video?** Unconfirmed, and
  load-bearing — Lite is the cheapest row in every table here ($18.00/video,
  $1.60 in the bake-off). The three Veo variants demonstrably lack feature parity:
  extend excludes Lite, 4k excludes Lite. If image-to-video does too, the floor
  moves to Kling at $25.20 or Veo Fast at $36.00. **Treat $18.00 as provisional.**
- Whether the first-frame `image` parameter forces 8s on Veo (§1).
- The 12-shot cap in §6(b)(0) — scope before anything else.

## Sources

- Gemini API pricing — https://ai.google.dev/gemini-api/docs/pricing
- Veo 3.1 in the Gemini API — https://ai.google.dev/gemini-api/docs/veo
- Video generation in the Gemini API — https://ai.google.dev/gemini-api/docs/video
- OpenAI API pricing — https://developers.openai.com/api/docs/pricing
- fal.ai Seedance 2.0 image-to-video — https://fal.ai/models/bytedance/seedance-2.0/image-to-video
- fal.ai Kling 2.5 Turbo Pro image-to-video — https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video
- fal.ai Wan 2.5 image-to-video — https://fal.ai/models/fal-ai/wan-25-preview/image-to-video
