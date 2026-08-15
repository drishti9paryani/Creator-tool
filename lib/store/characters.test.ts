import { describe, it, expect } from "vitest";
import {
  canonPrompt,
  canonNotes,
  mergeBible,
  MAX_REFERENCES,
  type CanonCharacter,
} from "@/lib/store/characters";

function char(over: Partial<CanonCharacter> = {}): CanonCharacter {
  return {
    id: "char_lena_1",
    name: "Lena",
    description: "Mid-fifties, cropped grey hair, deep-set eyes, weathered hands.",
    references: [],
    seed: 42,
    usedIn: [],
    createdAt: 1,
    updatedAt: 1,
    ...over,
  };
}

describe("canonPrompt", () => {
  it("always restates the identity lock, so no call site can paraphrase it away", () => {
    const p = canonPrompt(char());
    expect(p).toContain("Lena");
    expect(p).toContain("cropped grey hair");
    expect(p).toMatch(/identical to previous shots/i);
  });

  it("includes wardrobe only when set", () => {
    expect(canonPrompt(char())).not.toMatch(/Always wearing/);
    expect(canonPrompt(char({ wardrobe: "a navy postal coat" }))).toContain(
      "Always wearing: a navy postal coat."
    );
  });

  it("produces one note per character, in order", () => {
    const notes = canonNotes([char(), char({ name: "Arun", id: "char_arun_1" })]);
    expect(notes).toHaveLength(2);
    expect(notes[0]).toContain("Lena");
    expect(notes[1]).toContain("Arun");
  });

  it("is stable — the same character yields the same string every time", () => {
    const c = char({ wardrobe: "a navy postal coat" });
    expect(canonPrompt(c)).toBe(canonPrompt(c));
  });
});

describe("mergeBible", () => {
  it("adds characters that aren't there yet", () => {
    const r = mergeBible([], [char()]);
    expect(r.added).toBe(1);
    expect(r.merged).toBe(0);
    expect(r.characters).toHaveLength(1);
  });

  it("matches on name, not id, so a character survives across projects", () => {
    const r = mergeBible(
      [char({ id: "local-id", updatedAt: 1 })],
      [char({ id: "other-machine-id", updatedAt: 2, description: "updated" })]
    );
    expect(r.characters).toHaveLength(1);
    expect(r.characters[0].id).toBe("local-id"); // local id is kept
    expect(r.characters[0].description).toBe("updated");
    expect(r.merged).toBe(1);
  });

  it("refuses to let a STALE export overwrite newer work", () => {
    const r = mergeBible(
      [char({ updatedAt: 500, description: "the newer one" })],
      [char({ updatedAt: 100, description: "the stale one" })]
    );
    expect(r.characters[0].description).toBe("the newer one");
    expect(r.merged).toBe(0);
  });

  it("is case-insensitive on names", () => {
    const r = mergeBible([char({ name: "Lena" })], [char({ name: "LENA", updatedAt: 9 })]);
    expect(r.characters).toHaveLength(1);
  });

  it("does not mutate the array it was given", () => {
    const current = [char()];
    mergeBible(current, [char({ name: "Arun" })]);
    expect(current).toHaveLength(1);
  });
});

describe("reference limit", () => {
  it("caps at the practitioner-recommended 3-5 references", () => {
    expect(MAX_REFERENCES).toBe(5);
  });
});
