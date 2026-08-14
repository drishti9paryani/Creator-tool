import { describe, expect, it } from "vitest";
import {
  deriveAssets,
  deriveOutlines,
  deriveScenes,
  deriveTitle,
  keyTerms,
  subjectOf,
} from "@/lib/ai/story";
import { placeholderArt, placeholderFrame } from "@/lib/ai/placeholder";
import { chargeImage } from "@/lib/ai/budget";

const IDEA_A = "A retired postman discovers the letters he never delivered";
const IDEA_B = "Two rival chefs open competing food trucks in Lagos";

describe("story engine", () => {
  it("produces three outlines for any idea", () => {
    const out = deriveOutlines(IDEA_A, "video");
    expect(out).toHaveLength(3);
    for (const o of out) {
      expect(o.id).toBeTruthy();
      expect(o.title).toBeTruthy();
      expect(o.description.length).toBeGreaterThan(60);
      expect(o.characters).toHaveLength(2);
      expect(o.settings).toHaveLength(2);
    }
  });

  it("is deterministic — the same idea always yields the same story", () => {
    expect(deriveOutlines(IDEA_A, "video")).toEqual(deriveOutlines(IDEA_A, "video"));
  });

  // The defect this whole module exists to fix: the old mock ignored the idea
  // and returned the same canned story to every tester.
  // (Outline ids stay `<archetype>-<variant>-<n>` regardless of idea — that
  // shape is what deriveScenes reads back to pick the arc. The idea shows up in
  // the prose, which is what a tester actually judges.)
  it("responds to the idea — different ideas yield different stories", () => {
    const a = deriveOutlines(IDEA_A, "video");
    const b = deriveOutlines(IDEA_B, "video");
    expect(a[0].description).not.toEqual(b[0].description);
    expect(a[0].characters).not.toEqual(b[0].characters);
    expect(a[0].settings).not.toEqual(b[0].settings);
    // Titles come from curated pools and MAY coincide across ideas — that's the
    // deliberate trade for names that always read as authored English.
  });

  it("regenerate returns a different trio for the same idea", () => {
    const first = deriveOutlines(IDEA_A, "video", 0);
    const second = deriveOutlines(IDEA_A, "video", 1);
    expect(first.map((o) => o.id)).not.toEqual(second.map((o) => o.id));
    // Titles must visibly change too — ids alone changing looks like nothing
    // happened when a tester clicks "Regenerate options".
    expect(first.map((o) => o.title)).not.toEqual(second.map((o) => o.title));
  });

  it("uses proper nouns from the idea as character names", () => {
    const out = deriveOutlines("Mira and Dorian argue about a lighthouse", "video");
    expect(out[0].characters.join(" ")).toContain("MIRA");
    expect(out[0].characters.join(" ")).toContain("DORIAN");
  });

  // A city is not a person: "…food trucks in Lagos" must not cast Lagos.
  it("routes place-names after a preposition to locations, not characters", () => {
    const out = deriveOutlines(IDEA_B, "video")[0];
    expect(out.characters.join(" ")).not.toContain("LAGOS");
    expect(out.settings.join(" ")).toContain("Lagos");
  });

  it("shorts get a tighter arc than long-form", () => {
    const short = deriveOutlines(IDEA_A, "short")[0];
    const video = deriveOutlines(IDEA_A, "video")[0];
    expect(short.description.length).toBeLessThan(video.description.length);
  });

  it("builds scenes with shots that each carry a screenplay", () => {
    const outline = deriveOutlines(IDEA_A, "video")[0];
    const scenes = deriveScenes(outline, "video");
    expect(scenes.length).toBeGreaterThanOrEqual(3);
    for (const sc of scenes) {
      expect(sc.title).toBeTruthy();
      expect(sc.shots.length).toBeGreaterThan(0);
      for (const sh of sc.shots) {
        // Storyboard quality depends entirely on this being non-empty.
        expect(sh.screenplay && sh.screenplay.length).toBeGreaterThan(20);
        expect(sh.status).toBe("empty");
      }
    }
  });

  it("shorts get fewer scenes and shots than long-form", () => {
    const outline = deriveOutlines(IDEA_A, "short")[0];
    const shortScenes = deriveScenes(outline, "short");
    const videoScenes = deriveScenes(deriveOutlines(IDEA_A, "video")[0], "video");
    const count = (s: typeof shortScenes) =>
      s.reduce((n, x) => n + x.shots.length, 0);
    expect(count(shortScenes)).toBeLessThan(count(videoScenes));
  });

  it("derives characters, locations and at least one prop", () => {
    const outline = deriveOutlines(IDEA_A, "video")[0];
    const assets = deriveAssets(outline);
    expect(assets.filter((a) => a.type === "character").length).toBe(2);
    expect(assets.filter((a) => a.type === "location").length).toBe(2);
    // The old mock left the Props row permanently empty.
    expect(assets.filter((a) => a.type === "prop").length).toBeGreaterThan(0);
    expect(assets.every((a) => a.status === "generating")).toBe(true);
    expect(new Set(assets.map((a) => a.id)).size).toBe(assets.length);
  });

  // Regression: an earlier version spliced the idea's keywords into names and
  // produced titles like "The Two Moment After" and a prop called "RETIRED".
  // Names must come from curated pools; only descriptions carry the idea.
  it("never splices raw idea keywords into names", () => {
    for (const idea of [IDEA_A, IDEA_B, "retired two lighthouse things"]) {
      const outline = deriveOutlines(idea, "video")[0];
      const terms = keyTerms(idea);
      const assets = deriveAssets(outline);

      const nameOf = (line: string) => line.split(":")[0].trim();
      // Locations are exempt: a place the user actually named ("…in Lagos")
      // SHOULD become a location. Only people, titles and props must come
      // from the pools.
      const names = [
        outline.title,
        ...outline.characters.map(nameOf),
        ...assets.filter((a) => a.type !== "location").map((a) => a.name),
      ];

      for (const name of names) {
        for (const term of terms) {
          expect(
            name.toLowerCase().split(/\s+/),
            `"${name}" should not be built from the raw keyword "${term}"`
          ).not.toContain(term);
        }
      }
      // But the idea MUST still show up in the prose.
      expect(outline.description.toLowerCase()).toContain(terms[0]);
    }
  });

  it("scenes are set in the project's own locations", () => {
    const outline = deriveOutlines(IDEA_A, "video")[0];
    const places = outline.settings.map((s) => s.split(":")[0].trim());
    const scenes = deriveScenes(outline, "video");
    const allText = scenes.map((s) => s.description).join(" ");
    // At least one scene must reference a location the project actually has.
    expect(places.some((p) => allText.includes(p))).toBe(true);
  });

  it("handles empty and junk input without throwing", () => {
    for (const junk of ["", "   ", "!!!", "a", "🙂🙂🙂"]) {
      const out = deriveOutlines(junk, "video");
      expect(out).toHaveLength(3);
      expect(out[0].title).toBeTruthy();
      expect(deriveAssets(out[0]).length).toBeGreaterThan(0);
      expect(deriveScenes(out[0], "video").length).toBeGreaterThan(0);
    }
  });

  it("titles a project from its outline", () => {
    const outline = deriveOutlines(IDEA_A, "video")[0];
    expect(deriveTitle(outline, IDEA_A)).toBe(outline.title);
  });

  it("keyTerms strips stopwords, subjectOf truncates long ideas", () => {
    expect(keyTerms("the a of and postman letters")).toEqual(["postman", "letters"]);
    expect(subjectOf("one two three four", 2)).toBe("one two…");
    expect(subjectOf("")).toBe("an untold story");
  });
});

describe("placeholder art", () => {
  it("returns a usable svg data uri", () => {
    const uri = placeholderArt("MARA", "character", "3d-cinematic");
    expect(uri.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    expect(decodeURIComponent(uri)).toContain("<svg");
  });

  it("is stable per asset but different across assets", () => {
    const a = placeholderArt("MARA", "character", "watercolor");
    expect(placeholderArt("MARA", "character", "watercolor")).toBe(a);
    expect(placeholderArt("ELIAS", "character", "watercolor")).not.toBe(a);
  });

  it("escapes names that would otherwise break the svg", () => {
    const uri = decodeURIComponent(placeholderArt('<script>&"', "prop", "watercolor"));
    expect(uri).not.toContain("<script>");
  });

  it("frames are widescreen and captioned", () => {
    const uri = decodeURIComponent(placeholderFrame("Close — The Break", "retro-vhs"));
    expect(uri).toContain('width="960"');
    expect(uri).toContain("Close");
  });
});

describe("image spend guard", () => {
  it("allows up to the per-project limit, then refuses with a reason", () => {
    const project = `test-${Math.random()}`;
    const limit = Number(process.env.IMAGE_LIMIT_PER_PROJECT ?? 8);
    for (let i = 0; i < limit; i++) {
      expect(chargeImage(project).ok).toBe(true);
    }
    const denied = chargeImage(project);
    expect(denied.ok).toBe(false);
    expect(denied.reason).toMatch(/project/i);
  });

  it("counts each project separately", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(chargeImage(a).ok).toBe(true);
    expect(chargeImage(b).ok).toBe(true);
  });
});
