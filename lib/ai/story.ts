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

// A capitalised word after one of these is a PLACE, not a person. Without this
// split, "two rival chefs open food trucks in Lagos" produced a character
// called Lagos.
const LOCATIVE = new Set(
  "in at from near across around outside inside to onto within beyond above below under over".split(" ")
);

/** Capitalised words from the idea, split into likely people and likely places. */
function properNouns(idea: string): { people: string[]; places: string[] } {
  const people: string[] = [];
  const places: string[] = [];
  const lowerIdea = idea.toLowerCase();

  for (const sentence of idea.split(/[.!?]+/)) {
    const tokens = sentence.trim().split(/\s+/);
    tokens.forEach((t, i) => {
      const clean = t.replace(/[^A-Za-z'-]/g, "");
      if (clean.length < 2) return;
      const lower = clean.toLowerCase();
      if (STOPWORDS.has(lower) || NOT_A_NAME.has(lower)) return;
      if (!/^[A-Z][a-z'-]+$/.test(clean)) return;

      // The first word of a sentence is capitalised by grammar, not because
      // it's a name — "Peering into a mirror…" cast a character called
      // PEERING. Accept it only with corroboration: it pairs with another
      // capitalised word ("Mira and Dorian…"), or it recurs later in the text
      // (a real subject gets mentioned more than once).
      if (i === 0) {
        // A gerund/participle/adverb opener is never a name.
        if (/(ing|ed|ly)$/.test(lower)) return;

        const next = (tokens[1] ?? "").replace(/[^A-Za-z]/g, "").toLowerCase();
        const after = (tokens[2] ?? "").replace(/[^A-Za-z'-]/g, "");
        const pairedWithName =
          (next === "and" || next === "&") && /^[A-Z][a-z'-]+$/.test(after);
        const recurs = lowerIdea.split(lower).length - 1 > 1;

        if (!pairedWithName && !recurs) return;
      }

      const prev = (tokens[i - 1] ?? "").replace(/[^A-Za-z]/g, "").toLowerCase();
      (LOCATIVE.has(prev) ? places : people).push(clean);
    });
  }

  return { people: [...new Set(people)], places: [...new Set(places)] };
}

const titleCase = (s: string) =>
  s.replace(/\b([a-z])(\w*)/g, (_, a: string, b: string) => a.toUpperCase() + b);

/** The idea trimmed to a usable subject phrase, without trailing punctuation. */
export function subjectOf(idea: string, maxWords = 20): string {
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
  /** The user's own phrasing, used verbatim as a noun clause. */
  subject: string;
  terms: string[];
  names: string[];
  /** Two evocative place NAMES (not descriptions). */
  places: [string, string];
  /** An evocative prop name. */
  prop: string;
  /** " Design notes: a, b, c." — grammatical in any position, or "" if none. */
  notes: string;
}

// NAMING RULE, learned the hard way: names come from curated pools; the user's
// idea goes in DESCRIPTIONS. Splicing raw keywords into names produced titles
// like "The Two Moment After" and a prop called "RETIRED" — the idea's words
// are rarely nouns, and rarely grammatical where a name has to go. Pools always
// read as authored; descriptions carry the specificity.

const ARCHETYPES: Archetype[] = [
  {
    key: "turning-point",
    titles: [
      "The Turning Point",
      "Everything Changes",
      "The Moment After",
      "One Decision",
      "The Split",
      "Before and After",
    ],
    describe: (c) =>
      `${c.names[0]} is at the centre of it: ${c.subject}. ` +
      `It begins as an ordinary pursuit, until one decision splits the story in two and certainty stops being available. ` +
      `What follows at ${c.places[0]} is not the victory anyone expected, but something harder-won and more honest. ` +
      `The final frame lands on the one thing that survived the change.`,
    beats: (c) => [
      { title: "Ordinary World", description: `Establish ${c.names[0]} inside the familiar rhythm of ${c.places[0]}. Everything works — which is exactly the problem.` },
      { title: "The Break", description: `The rhythm shatters. ${c.names[0]} makes the choice that cannot be unmade.` },
      { title: "The Cost", description: `At ${c.places[1]}, ${c.names[1]} confronts ${c.names[0]} with what the choice actually took. Neither of them is right.` },
      { title: "What Remains", description: `The dust settles over ${c.places[0]}. Hold on the one detail that proves the change was real.` },
    ],
    roles: ["the one who decides", "the one who pays"],
  },
  {
    key: "the-reckoning",
    titles: [
      "The Reckoning",
      "What It Cost",
      "The Price of It",
      "Paid in Full",
      "The Long Bill",
      "Nothing Is Free",
    ],
    describe: (c) =>
      `${c.names[0]} gets exactly what was wanted, and discovers the bill comes later. The premise: ${c.subject}. ` +
      `Early triumph at ${c.places[0]} curdles as the trade behind it becomes impossible to ignore. ` +
      `${c.names[1]} saw it coming and said nothing, and that silence becomes the story's sharpest wound. ` +
      `It ends not with a reversal but with a reckoning: the thing is kept, and it is not enough.`,
    beats: (c) => [
      { title: "The Win", description: `${c.names[0]} succeeds, publicly and completely, at ${c.places[0]}. Let it feel genuinely good.` },
      { title: "First Crack", description: `A detail surfaces that doesn't fit the triumph. ${c.names[0]} looks away.` },
      { title: "The Silence", description: `${c.names[1]} could speak and doesn't. Play the whole beat on faces, not words.` },
      { title: "The Bill", description: `At ${c.places[1]}, the cost lands in full. ${c.names[0]} keeps what was won and understands what it replaced.` },
    ],
    roles: ["the one who wins", "the one who knew"],
  },
  {
    key: "unlikely-allies",
    titles: [
      "Unlikely Allies",
      "Two Ways to Be Right",
      "Common Ground",
      "Opposite Methods",
      "The Truce",
      "Neither One Wins",
    ],
    describe: (c) =>
      `Two people with nothing in common are forced together by the same problem: ${c.subject}. ` +
      `${c.names[0]} works in absolutes; ${c.names[1]} works in exceptions — and neither approach survives alone. ` +
      `Their collision at ${c.places[0]} is funnier and more painful than either expected. ` +
      `Neither converts the other. They simply build something that needed both of them.`,
    beats: (c) => [
      { title: "Collision", description: `${c.names[0]} and ${c.names[1]} meet badly at ${c.places[0]}. Establish both methods as legitimate.` },
      { title: "Forced Together", description: `Going alone stops being possible. Grudging first cooperation.` },
      { title: "The Fracture", description: `At ${c.places[1]}, the old difference resurfaces under pressure and nearly ends it.` },
      { title: "Built Together", description: `The result stands because both were there. Neither one apologises.` },
    ],
    roles: ["the absolutist", "the improviser"],
  },
];

// Fallback names when the idea contains no proper nouns.
const NAME_POOL = [
  ["Mara", "Elias"], ["Nova", "Kade"], ["Iris", "Tomas"], ["Ada", "Rune"],
  ["June", "Osei"], ["Rey", "Petra"],
];

// Indian/mythological register. A story about a cowherd lifting a hill to
// shelter his village should not be cast with "Mara and Elias" — the built-in
// suggestions lead with Hindu narratives, so the default names have to follow.
const INDIC_NAME_POOL = [
  ["Meera", "Arjun"], ["Radha", "Vikram"], ["Sita", "Ishaan"], ["Anaya", "Kabir"],
  ["Devika", "Rohan"], ["Tara", "Aditya"], ["Kavya", "Nakul"], ["Uma", "Bhalu"],
];

// Cues that a story sits in an Indian / mythological register.
const INDIC_CUES = new Set(
  ("cowherd village god goddess deity temple sage rishi hill mountain monsoon " +
    "storm king queen prince princess archer chariot charioteer bow arrow " +
    "devotee prayer blessing curse demon serpent elephant lotus sari dhoti " +
    "krishna shiva vishnu rama sita hanuman ganesha indra durga kali arjuna " +
    "karna eklavya savitri yamuna ganga ashram guru dharma karma avatar mango " +
    "thumb offering ritual festival diya incense")
    .split(" ")
);

function isIndicRegister(idea: string): boolean {
  const words = idea.toLowerCase().split(/[^a-z]+/);
  return words.some((w) => INDIC_CUES.has(w));
}

// Place names that read as real locations in any genre.
const PLACE_NAMES = [
  "The Threshold", "The Long Room", "Open Ground", "The Back Lot",
  "The Far Side", "The Quiet Hour", "The Waiting Floor", "Low Water",
  "The Last Stop", "The Narrow Gate", "High Window", "The Turning Yard",
];

// Objects a story can revolve around, whatever it's about.
const PROP_NAMES = [
  "The Keepsake", "The Ledger", "The Marker", "The Token",
  "The Unsent Letter", "The Worn Key", "The Old Photograph", "The Broken Watch",
];

function buildCtx(idea: string, seed: number): Ctx {
  const terms = keyTerms(idea);
  const found = properNouns(idea);
  const pool = isIndicRegister(idea) ? INDIC_NAME_POOL : NAME_POOL;
  const fallback = pick(pool, seed);
  const names = [found.people[0] ?? fallback[0], found.people[1] ?? fallback[1]];

  // A real place named in the idea beats a pooled one — "Lagos" is a better
  // location than "The Long Room" when the user actually wrote Lagos.
  const p1 = found.places[0] ?? pick(PLACE_NAMES, seed);
  const p2Raw = found.places[1] ?? pick(PLACE_NAMES, seed + 5);
  const p2 = p2Raw === p1 ? pick(PLACE_NAMES, seed + 7) : p2Raw;

  return {
    subject: subjectOf(idea),
    terms,
    names,
    places: [p1, p2],
    prop: pick(PROP_NAMES, seed),
    notes: terms.length ? ` Design notes: ${terms.slice(0, 4).join(", ")}.` : "",
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
    // Title comes from the archetype's pool, never spliced with the idea's
    // keywords — see the NAMING RULE above.
    // Hash the variant rather than adding it: arithmetic offsets kept landing
    // on multiples of the pool size, so "Regenerate options" returned the same
    // three titles and looked like a no-op.
    const title = pick(arc.titles, hash(`${arc.key}|${variant}|${text}`));
    const full = arc.describe(ctx);
    // A 9:16 short can't carry four sentences of setup — drop the last one.
    const description = trim
      ? full.split(/(?<=\.)\s+/).slice(0, 3).join(" ")
      : full;
    return {
      id: `${arc.key}-${variant}-${i + 1}`,
      title,
      description,
      // A comma-separated keyword list is grammatical wherever it lands, unlike
      // the user's raw sentence — which read as "…in a story about A retired
      // postman discovers the letters he never delivered." These lines become
      // image prompts, so concrete keywords serve them better than prose.
      characters: [
        `${ctx.names[0].toUpperCase()}: ${titleCase(arc.roles[0])}. Reads instantly in silhouette; the face carries the whole arc.${ctx.notes}`,
        `${ctx.names[1].toUpperCase()}: ${titleCase(arc.roles[1])}, visually the opposite of ${ctx.names[0]} — softer lines, warmer palette, more room in the frame.${ctx.notes}`,
      ],
      settings: [
        `${ctx.places[0]}: Where the story's pressure is highest. Texture and light should feel specific, never generic.${ctx.notes}`,
        `${ctx.places[1]}: The second location, appearing only once ${ctx.names[0]} has committed — colder, wider, less forgiving.${ctx.notes}`,
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

  // Read the cast and locations back OUT of the outline rather than re-deriving
  // them. Re-deriving picked a different seed and produced scenes set in places
  // that appear nowhere in the project's own location list.
  const nameOf = (line: string) => {
    const idx = line.indexOf(":");
    const raw = (idx >= 0 ? line.slice(0, idx) : line).trim();
    // Asset names are stored uppercase for the tiles; scene prose needs them
    // title-cased or every sentence reads as shouting ("Establish LENA…").
    return raw === raw.toUpperCase() ? titleCase(raw.toLowerCase()) : raw;
  };
  const castNames = (outline.characters ?? []).map(nameOf).filter(Boolean);
  const placeNames = (outline.settings ?? []).map(nameOf).filter(Boolean);

  const base = buildCtx(outline.description || outline.title, seed);
  const ctx: Ctx = {
    ...base,
    names: [castNames[0] ?? base.names[0], castNames[1] ?? base.names[1]],
    places: [placeNames[0] ?? base.places[0], placeNames[1] ?? base.places[1]],
  };

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

  // One prop so the Props row is never empty (the source build shipped it
  // permanently blank in mock mode). Name from the pool, description from the
  // story — see the NAMING RULE.
  const propName = pick(PROP_NAMES, hash(outline.id || outline.title));
  const props: Asset[] = [
    {
      id: slugify(`${propName}-prop`),
      type: "prop",
      name: propName.toUpperCase(),
      subtitle: "Prop",
      description:
        `The object this story keeps returning to. It should read instantly in silhouette, ` +
        `carry visible wear from use, and belong unmistakably to the world of "${outline.title}".`,
      status: "generating" as const,
    },
  ];

  return [...characters, ...locations, ...props];
}

/** Project title from the chosen outline, falling back to the idea itself. */
export function deriveTitle(outline: StoryOutline, idea: string): string {
  return outline.title || titleCase(subjectOf(idea, 5)) || "Untitled Project";
}
