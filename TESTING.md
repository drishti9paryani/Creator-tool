# Testing this prototype with people

A guide for running a structured test round. Give testers the **Tester script**
section; keep the rest for yourself.

---

## Before you start

1. Start the app: `npm run dev`, then open http://localhost:3000
2. Check the header pill: **Demo mode** (free, no keys) or **Live AI** (costs
   money per project). Demo mode is the right setting for most test rounds —
   the story engine is real either way, only the art differs.
3. Each tester needs their **own browser** (or their own profile). Projects are
   stored per-browser; testers on the same browser will see each other's work.

## What you're actually testing

This prototype answers one question: **does turning an idea into a shootable
story package feel useful?** Everything downstream of storyboard — rendered
video, voice, editing — is deliberately absent. Don't let testers spend their
attention there; tell them upfront (the app does too, on first run).

---

## Tester script

*Give this to each tester. Ask them to think aloud.*

> **You have 15 minutes. Don't read ahead — just start.**
>
> 1. Open http://localhost:3000
> 2. Create a project from **your own idea** — something you actually care
>    about, not an example. One sentence is enough.
> 3. Pick a story from the three offered. Try **Regenerate options** at least
>    once.
> 4. Edit the summary so it's closer to what you meant.
> 5. Choose a visual style and create the project.
> 6. On the **Assets** page: open a character, change its visual with a prompt,
>    and add one asset of your own.
> 7. On **Shot Builder**: pick a shot, use **Write for me** for the screenplay,
>    then generate the storyboard frame. Change it with a prompt.
> 8. On **Editor**: play the animatic, then **Export storyboard** and open the
>    downloaded file.
>
> Then answer the five questions below.

### Tester questions

1. At what exact moment did you first think "oh, this is useful"? If never, say
   never.
2. Where did you get stuck, confused, or have to guess what a control did?
3. Was the story it generated *about your idea*? Score 1–5 and say what was off.
4. What did you expect to be able to do that you couldn't?
5. Would you use this for real work as it stands? Yes / No / Not yet — and the
   one change that would flip your answer.

---

## Known boundaries — not bugs

Tell testers these upfront, or you'll collect the same five reports repeatedly.

| Behaviour | Why |
|---|---|
| "Generate Video" says video isn't part of this build | No video model is wired. Deliberate. |
| The Editor plays stills, not footage | It's a storyboard animatic, labelled as such. |
| Art looks like coloured placards (Demo mode) | Placeholder art. Switch to Live AI for generated images. |
| Projects vanish in a different browser | Storage is per-browser (IndexedDB). Use Export. |
| Two testers can't see each other's projects | No accounts, no server storage. |
| "Showing sample output" warning appears | A live call failed or the spend cap was hit. The reason is in the toast. |

## What counts as a real bug

- A control that does nothing when clicked
- A spinner that never resolves
- A story that has nothing to do with the typed idea
- Generated names that read as broken English
- Losing work that was previously visible
- Anything that requires a page refresh to recover from

## Collecting results

The single most useful artifact from each tester is their **exported storyboard
file** plus their answers. The export contains their idea, the story it
generated, the cast and every frame — so you can see what the product actually
produced for them without being in the room.

## Cost, if you run Live AI

Roughly: text is cents per project; images are the real cost. The guard caps
each project at 8 generated images and all users at 60 per hour. Ten testers
doing one project each ≈ 80 images. Set `IMAGE_LIMIT_PER_PROJECT` and
`IMAGE_LIMIT_PER_HOUR` in `.env.local` before a session if you want it tighter.
