"use client";

// ── The Character Bible ─────────────────────────────────────────────────────
//
// Characters live HERE, not inside a project. A project references a canon
// character by id; deleting the project does not delete the character.
//
// Why this exists: character drift is the failure mode of shot-per-clip
// production. Every generated clip starts from scratch with no memory of the
// last one, so a face that is re-derived per project — or worse, re-invented
// per shot — will not survive 90 cuts. The fix practitioners converge on is a
// locked reference: a fixed name, a fixed physical description, and 3-5
// reference images fed into every single generation.
//
// So this store is deliberately boring and deliberately separate:
//   • its own persist key, so it survives project deletion and project churn
//   • `canonPrompt()` is the ONE place the identity text is assembled, so no
//     call site can drift by paraphrasing
//   • export/import JSON, because IndexedDB is per-browser and "forever" is a
//     promise this app cannot keep on its own (see LIMITS below)
//
// LIMITS, stated plainly rather than implied away:
//   • Storage is IndexedDB. Clearing site data deletes the bible. `exportBible()`
//     is the durable copy — that file is the thing that actually lasts forever.
//   • `references` are stored but not yet SENT anywhere: lib/ai/http.ts calls
//     OpenAI's text-only /images/generations endpoint, which accepts no
//     reference image. Wiring them requires the Gemini image switch first.
//     Until then consistency rests on the locked description alone, which holds
//     wardrobe and silhouette far better than it holds a face.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "@/lib/store/idbStorage";

export interface CanonCharacter {
  id: string;
  /** Locked. Never regenerated, never derived from the user's idea text. */
  name: string;
  /** Locked physical description. This is the identity anchor in every prompt. */
  description: string;
  /** Wardrobe/silhouette notes kept apart so they can be restated every shot. */
  wardrobe?: string;
  /** 1-5 reference images as data URLs. The real anchor, once wired. */
  references: string[];
  /** Stable seed for backends that accept one. */
  seed: number;
  /** Projects that have used this character, for "where does she appear?". */
  usedIn: string[];
  createdAt: number;
  updatedAt: number;
}

/** Practitioner guidance converges on 3-5 references; more stops helping. */
export const MAX_REFERENCES = 5;

interface CharacterState {
  characters: CanonCharacter[];
  upsert(input: Partial<CanonCharacter> & { name: string }): string;
  remove(id: string): void;
  addReference(id: string, dataUrl: string): void;
  removeReference(id: string, index: number): void;
  linkToProject(id: string, projectId: string): void;
  exportBible(): string;
  importBible(json: string): { added: number; merged: number };
}

function newId(name: string): string {
  return `char_${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}_${Date.now()}`;
}

export const useCharacters = create<CharacterState>()(
  persist(
    (set, get) => ({
      characters: [],

      upsert(input) {
        const now = Date.now();
        const existing = input.id
          ? get().characters.find((c) => c.id === input.id)
          : // Matching on name is what makes a character reusable across
            // projects without the user having to think about ids.
            get().characters.find(
              (c) => c.name.toLowerCase() === input.name.toLowerCase()
            );

        if (existing) {
          set({
            characters: get().characters.map((c) =>
              c.id === existing.id ? { ...c, ...input, id: c.id, updatedAt: now } : c
            ),
          });
          return existing.id;
        }

        const id = input.id ?? newId(input.name);
        set({
          characters: [
            ...get().characters,
            {
              references: [],
              usedIn: [],
              seed: Math.floor(Math.random() * 2 ** 31),
              description: "",
              ...input,
              id,
              createdAt: now,
              updatedAt: now,
            } as CanonCharacter,
          ],
        });
        return id;
      },

      remove(id) {
        set({ characters: get().characters.filter((c) => c.id !== id) });
      },

      addReference(id, dataUrl) {
        set({
          characters: get().characters.map((c) =>
            c.id === id && c.references.length < MAX_REFERENCES
              ? { ...c, references: [...c.references, dataUrl], updatedAt: Date.now() }
              : c
          ),
        });
      },

      removeReference(id, index) {
        set({
          characters: get().characters.map((c) =>
            c.id === id
              ? {
                  ...c,
                  references: c.references.filter((_, i) => i !== index),
                  updatedAt: Date.now(),
                }
              : c
          ),
        });
      },

      linkToProject(id, projectId) {
        set({
          characters: get().characters.map((c) =>
            c.id === id && !c.usedIn.includes(projectId)
              ? { ...c, usedIn: [...c.usedIn, projectId] }
              : c
          ),
        });
      },

      exportBible() {
        return JSON.stringify(
          { version: 1, exportedAt: Date.now(), characters: get().characters },
          null,
          2
        );
      },

      importBible(json) {
        const parsed = JSON.parse(json) as { characters?: CanonCharacter[] };
        const result = mergeBible(get().characters, parsed.characters ?? []);
        set({ characters: result.characters });
        return { added: result.added, merged: result.merged };
      },
    }),
    {
      // Its own key. The project store uses a different one, which is the whole
      // point — wiping projects must not wipe the cast.
      name: "character-bible",
      storage: createJSONStorage(() => idbStorage),
    }
  )
);

/**
 * Merge an imported bible into the current one, matching on name.
 *
 * Pure and exported so it can be tested without IndexedDB. Newer `updatedAt`
 * wins, so importing a stale export can never silently undo newer work — the
 * failure mode that makes people stop trusting an import button.
 */
export function mergeBible(
  current: CanonCharacter[],
  incoming: CanonCharacter[]
): { characters: CanonCharacter[]; added: number; merged: number } {
  const next = [...current];
  let added = 0;
  let merged = 0;

  for (const c of incoming) {
    const i = next.findIndex(
      (x) => x.name.toLowerCase() === c.name.toLowerCase()
    );
    if (i === -1) {
      next.push(c);
      added++;
    } else if (c.updatedAt > next[i].updatedAt) {
      next[i] = { ...next[i], ...c, id: next[i].id };
      merged++;
    }
  }

  return { characters: next, added, merged };
}

/**
 * The single source of identity text for a character.
 *
 * Every prompt that features this character must go through here. Call sites
 * paraphrasing the description in their own words is exactly how drift starts,
 * so there is one builder and no alternative.
 */
export function canonPrompt(c: CanonCharacter): string {
  return [
    `${c.name}: ${c.description}`,
    c.wardrobe ? `Always wearing: ${c.wardrobe}.` : "",
    "Keep this character's face, build and wardrobe identical to previous shots.",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Canon notes for a set of characters, ready for StoryboardInput.castNotes. */
export function canonNotes(characters: CanonCharacter[]): string[] {
  return characters.map(canonPrompt);
}
