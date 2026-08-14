// Deterministic story derivation from a user's typed idea.
//
// This module is the reason the app feels alive without an API key: given any
// idea string it produces distinct, on-topic outlines, characters, settings,
// scenes and screenplay beats — all seeded by the idea itself, so the same idea
// always yields the same story (stable demos) while a different idea yields a
// genuinely different one.
//
// Used in two places:
//   • MockProvider — as the generator (keyless demo mode).
//   • RealProvider — as the FALLBACK when the model call fails, and as the
//     scene/shot builder, which no text model call currently covers.

import type { Asset, Format, Scene, StoryOutline } from "@/lib/ai/types";

// ── Text utilities ──────────────────────────────────────────────────────────

const STOPWORDS = new Set(
  ("a an the and or but of to in on at for with from by as is are was were be " +
    "been being it its this that these those i me my we our you your he him his " +
    "she her they them their who whom which what when where why how about into " +
    "over under then than so if while during story about make making video short " +
    "please can could would should will just very really some any all")
    .split(" ")
);

/** Lowercase content words, stopwords and punctuation removed. */
export function keyTerms(idea: string, max = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of idea.toLowerCase().split(/[^a-z0-9']+/)) {
    const w = raw.trim();
    if (w.length < 3 || STOPWORDS.has(w) || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= max) break;
  }
  return out;
}

// Words that are capitalised at the start of a sentence but are never names.
// Skipping position 0 outright was too blunt — it lost the protagonist in
// "Mira and Dorian argue…", which is exactly how people phrase an idea.
const NOT_A_NAME = new Set(
  ("one two three four five six seven eight nine ten first last next another " +
    "every each both many few several once after before during when while " +
    "there here someone somebody something nobody everyone everybody nothing " +
    "his her their its our your my no yes not")
    .split(" ")
);

/** Capitalised words treated as proper names. */
function properNouns(idea: string): string[] {
  const out: string[] = [];
  for (const sentence of idea.split(/[.!?]+/)) {
    for (const t of sentence.trim().split(/\s+/)) {
      const clean = t.replace(/[^A-Za-z'-]/g, "");
      if (clean.length < 2) continue;
      const lower = clean.toLowerCase();
      if (STOPWORDS.has(lower) || NOT_A_NAME.has(lower)) continue;
      if (/^[A-Z][a-z'-]+$/.test(clean)) out.push(clean);
    }
  }
  return [...new Set(out)];
}

const titleCase = (s: string) =>
  s.replace(/\b([a-z])(\w*)/g, (_, a: string, b: string) => a.toUpperCase() + b);

/** The idea trimmed to a usable subject phrase, without trailing punctuation. */
export function subjectOf(idea: string, maxWords = 12): string {
  const clean = idea.trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "");
  if (!clean) return "an untold story";
  const parts = clean.split(" ");
  return parts.length <= maxWords ? clean : parts.slice(0, maxWords).join(" ") + "…";
}

/** Stable 32-bit hash — same idea always produces the same story. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Math.abs matters: callers derive seeds with `>>`, which converts to a SIGNED
// 32-bit int, so any hash above 2^31 produced a negative index and returned
// undefined — which then blew up in titleCase() on junk input.
const pick = <T,>(arr: T[], seed: number): T =>
  arr[Math.abs(Math.trunc(seed)) % arr.length];

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "item";

// ── Story archetypes ────────────────────────────────────────────────────────
// Three arcs with genuinely different emotional shapes, so the trio of options
// on the "Select a story" step feels like a real creative choice rather than
// three rewordings of one idea.

interface Archetype {
  key: string;
  titles: string[];
  /** Builds the 3-4 sentence arc description. */
  describe: (ctx: Ctx) => string;
  /** Scene beats: title + what happens. Drives the Shot Builder. */
  beats: (ctx: Ctx) => { title: string; description: string }[];
  roles: [string, string];
}

interface Ctx {
  subject: string;
  terms: string[];
  names: string[];
  place: string;
  thing: string;
}

const ARCHETYPES: Archetype[] = [
  {
    key: "turning-point",
    titles: ["The Turning Point", "Everything Changes", "The Moment After"],
    describe: (c) =>
      `${titleCase(c.subject)} begins as an ordinary pursuit, until one decision splits the story in two. ` +
      `${c.names[0]} is certain of the path ahead — right up to the moment ${c.thing} makes that certainty impossible to hold. ` +
      `What follows in ${c.place} is not the victory anyone expected, but something harder-won and more honest. ` +
      `The final frame lands on the one thing that survived the change.`,
    beats: (c) => [
      { title: "Ordinary World", description: `Establish ${c.names[0]} inside the familiar rhythm of ${c.place}. Everything works — which is exactly the problem.` },
      { title: "The Break", description: `${c.thing} arrives and the rhythm shatters. ${c.names[0]} makes the choice that cannot be unmade.` },
      { title: "The Cost", description: `${c.names[1]} confronts ${c.names[0]} with what the choice actually took. Neither of them is right.` },
      { title: "What Remains", description: `The dust settles over ${c.place}. Hold on the one detail that proves the change was real.` },
    ],
    roles: ["the one who decides", "the one who pays"],
  },
  {
    key: "the-reckoning",
    titles: ["The Reckoning", "What It Cost", "The Price of It"],
    describe: (c) =>
      `${c.names[0]} gets exactly what ${titleCase(c.subject)} promised — and discovers the bill comes later. ` +
      `Early triumph in ${c.place} curdles as ${c.thing} exposes what was traded away to get here. ` +
      `${c.names[1]} saw it coming and said nothing, and that silence becomes the story's sharpest wound. ` +
      `It ends not with a reversal but with a reckoning: the thing is kept, and it is not enough.`,
    beats: (c) => [
      { title: "The Win", description: `${c.names[0]} succeeds, publicly and completely, in ${c.place}. Let it feel genuinely good.` },
      { title: "First Crack", description: `${c.thing} surfaces a detail that doesn't fit the triumph. ${c.names[0]} looks away.` },
      { title: "The Silence", description: `${c.names[1]} could speak and doesn't. Play the whole beat on faces, not words.` },
      { title: "The Bill", description: `The cost lands in full. ${c.names[0]} keeps what was won and understands what it replaced.` },
    ],
    roles: ["the one who wins", "the one who knew"],
  },
  {
    key: "unlikely-allies",
    titles: ["Unlikely Allies", "Two Ways to Be Right", "Common Ground"],
    describe: (c) =>
      `Two forces with nothing in common are forced together by ${titleCase(c.subject)}. ` +
      `${c.names[0]} works in absolutes; ${c.names[1]} works in exceptions — and ${c.thing} will not yield to either approach alone. ` +
      `Their collision in ${c.place} is funnier and more painful than either expected. ` +
      `Neither converts the other. They simply build something that needed both of them.`,
    beats: (c) => [
      { title: "Collision", description: `${c.names[0]} and ${c.names[1]} meet badly in ${c.place}. Establish both methods as legitimate.` },
      { title: "Forced Together", description: `${c.thing} makes going alone impossible. Grudging first cooperation.` },
      { title: "The Fracture", description: `The old difference resurfaces under pressure and nearly ends it.` },
      { title: "Built Together", description: `The result stands because both were there. Neither one apologises.` },
    ],
    roles: ["the absolutist", "the improviser"],
  },
];

// Fallback names when the idea contains no proper nouns.
const NAME_POOL = [
  ["Mara", "Elias"], ["Nova", "Kade"], ["Iris", "Tomas"], ["Ada", "Rune"],
  ["Sena", "Vikram"], ["June", "Osei"], ["Lena", "Arjun"], ["Rey", "Petra"],
];

const PLACE_TEMPLATES = [
  "a place that remembers everything",
  "a room too small for what happens in it",
  "the edge of somewhere familiar",
  "a landscape that refuses to stay still",
];

function buildCtx(idea: string, seed: number): Ctx {
  const terms = keyTerms(idea);
  const found = properNouns(idea);
  const fallback = pick(NAME_POOL, seed);
  const names = [found[0] ?? fallback[0], found[1] ?? fallback[1]];
  return {
    subject: subjectOf(idea),
    terms,
    names,
    place: terms[1] ? `the world of ${terms[1]}` : pick(PLACE_TEMPLATES, seed >> 3),
    thing: terms[0] ? `the matter of ${terms[0]}` : "the thing nobody wanted to name",
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Three distinct outlines derived from the idea. `variant` shifts the whole set
 * so "Regenerate options" returns a genuinely different trio for the same idea.
 */
export function deriveOutlines(
  idea: string,
  format: Format,
  variant = 0
): StoryOutline[] {
  const text = idea.trim() || "surprise me";
  const seed = hash(text) + variant * 7919;
  const ctx = buildCtx(text, seed);
  // Shorts get a tighter, punchier arc line; long-form gets the full sentence.
  const trim = format === "short";

  return ARCHETYPES.map((arc, i) => {
    const s = seed + i * 131;
    // Weave the idea's own vocabulary into the title. A fixed archetype name
    // ("The Reckoning") reads generic on every project and made two unrelated
    // ideas produce identical titles; "The Lighthouse Reckoning" doesn't.
    const base = pick(arc.titles, s + variant);
    const noun = ctx.terms[i % Math.max(ctx.terms.length, 1)];
    const title =
      noun && base.startsWith("The ")
        ? `The ${titleCase(noun)} ${base.slice(4)}`
        : noun
          ? `${base}: ${titleCase(noun)}`
          : base;
    const full = arc.describe(ctx);
    // A 9:16 short can't carry four sentences of setup — drop the last one.
    const description = trim
      ? full.split(/(?<=\.)\s+/).slice(0, 3).join(" ")
      : full;
    return {
      id: `${arc.key}-${variant}-${i + 1}`,
      title,
      description,
      characters: [
        `${ctx.names[0].toUpperCase()}: ${titleCase(arc.roles[0])} — carries ${ctx.terms[0] ?? "the story"} in every frame; readable at a glance, even in silhouette.`,
        `${ctx.names[1].toUpperCase()}: ${titleCase(arc.roles[1])} — visually the opposite of ${ctx.names[0]}; softer lines, warmer palette.`,
      ],
      settings: [
        `${titleCase(ctx.place)}: Where the story's pressure is highest. ${titleCase(ctx.terms[0] ?? "the subject")} defines its texture and light.`,
        `The Turn: A second location that only appears once ${ctx.names[0]} has committed — colder, wider, less forgiving.`,
      ],
    };
  });
}

/**
 * Scenes + shots derived from the chosen outline's archetype. Every shot gets a
 * screenplay line so the Shot Builder and storyboard generation have real
 * context to work from instead of a bare id.
 */
export function deriveScenes(outline: StoryOutline, format: Format): Scene[] {
  const arcKey = outline.id.split("-").slice(0, -2).join("-");
  const arc = ARCHETYPES.find((a) => a.key === arcKey) ?? ARCHETYPES[0];
  const seed = hash(outline.id);
  const ctx = buildCtx(outline.description || outline.title, seed);

  // Shorts run tighter: fewer scenes, fewer shots each.
  const beats = arc.beats(ctx).slice(0, format === "short" ? 3 : 4);
  const shotsPer = format === "short" ? 2 : 3;

  const SHOT_ANGLES = [
    { label: "Establishing", how: "Wide. Let the location do the talking before anyone speaks." },
    { label: "Close", how: "Tight on the face. The decision happens here, not in dialogue." },
    { label: "Reaction", how: "Cut to what the choice costs — the other person, or the empty space." },
  ];

  return beats.map((beat, i) => ({
    id: `scene-${i + 1}`,
    title: beat.title,
    description: beat.description,
    shots: Array.from({ length: shotsPer }, (_, j) => {
      const angle = SHOT_ANGLES[j % SHOT_ANGLES.length];
      return {
        id: `scene-${i + 1}-shot-${j + 1}`,
        title: `${angle.label} — ${beat.title}`,
        screenplay: `${beat.description} ${angle.how}`,
        status: "empty" as const,
      };
    }),
  }));
}

/**
 * Characters, locations and props for a project, derived from the outline's
 * own "Name: description" lines. Shared by both providers so a project's cast
 * always matches its brief.
 */
export function deriveAssets(outline: StoryOutline): Asset[] {
  const fromLines = (lines: string[], type: Asset["type"]): Asset[] =>
    lines
      .map((line) => line.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf(":");
        const name = (idx >= 0 ? line.slice(0, idx) : line).trim();
        const description = idx >= 0 ? line.slice(idx + 1).trim() : "";
        return {
          id: slugify(name),
          type,
          name: name.toUpperCase(),
          subtitle: type === "character" ? "Character" : type === "location" ? "Location" : "Prop",
          description,
          status: "generating" as const,
        };
      });

  const characters = fromLines(outline.characters ?? [], "character");
  const locations = fromLines(outline.settings ?? [], "location");

  // One prop derived from the story's own vocabulary, so the Props row is never
  // empty (the source build shipped it permanently blank in mock mode).
  const term = keyTerms(outline.description || outline.title, 3)[0];
  const props: Asset[] = term
    ? [
        {
          id: slugify(`${term}-object`),
          type: "prop",
          name: titleCase(term).toUpperCase(),
          subtitle: "Prop",
          description: `The object the story keeps returning to. Should read instantly in silhouette and carry visible wear from use.`,
          status: "generating" as const,
        },
      ]
    : [];

  return [...characters, ...locations, ...props];
}

/** Project title from the chosen outline, falling back to the idea itself. */
export function deriveTitle(outline: StoryOutline, idea: string): string {
  return outline.title || titleCase(subjectOf(idea, 5)) || "Untitled Project";
}
