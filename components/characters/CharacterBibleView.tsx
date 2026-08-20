"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Image as ImageIcon,
  ArrowLeft,
  Users,
  Film,
  Sparkles,
  X,
  Check,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import {
  useCharacters,
  MAX_REFERENCES,
  type CanonCharacter,
} from "@/lib/store/characters";
import { useStore } from "@/lib/store/project";
import { useHydrated } from "@/lib/store/useHydrated";

export function CharacterBibleView() {
  const hydrated = useHydrated();
  const characters = useCharacters((s) => s.characters);
  const upsert = useCharacters((s) => s.upsert);
  const remove = useCharacters((s) => s.remove);
  const addReference = useCharacters((s) => s.addReference);
  const removeReference = useCharacters((s) => s.removeReference);
  const exportBible = useCharacters((s) => s.exportBible);
  const importBible = useCharacters((s) => s.importBible);
  const pushToast = useStore((s) => s.pushToast);

  const [editingChar, setEditingChar] = useState<Partial<CanonCharacter> | null>(
    null
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportBible();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `character-bible-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({
      message: "Character Bible exported",
      detail: "Saved as JSON file for offline backup or sharing across devices.",
      variant: "success",
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = importBible(text);
      pushToast({
        message: "Character Bible imported",
        detail: `Added ${res.added} new character${res.added === 1 ? "" : "s"}, updated ${res.merged}.`,
        variant: "success",
      });
    } catch (err) {
      pushToast({
        message: "Failed to import Bible JSON",
        detail: err instanceof Error ? err.message : "Invalid JSON format",
        variant: "error",
      });
    }
    e.target.value = "";
  };

  return (
    <div className="bg-glow-soft min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border-soft)] px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Back to projects"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
          >
            <ArrowLeft size={17} />
          </Link>
          <Logo label="CHARACTER BIBLE" />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-panel)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <Upload size={13} /> Import JSON
          </button>
          <button
            onClick={handleExport}
            disabled={characters.length === 0}
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-panel)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition hover:border-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
          >
            <Download size={13} /> Export JSON
          </button>
          <Button
            variant="white"
            onClick={() =>
              setEditingChar({
                name: "",
                description: "",
                wardrobe: "",
                references: [],
              })
            }
          >
            <Plus size={15} /> New Character
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">The Character Bible</h1>
          <p className="mt-1 max-w-[680px] text-sm text-[var(--color-muted)]">
            Characters defined here are locked and persistent across all your
            projects. Their names, physical traits, and reference images are fed
            directly into every storyboard generation to prevent character drift.
          </p>
        </div>

        {!hydrated ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/30"
              />
            ))}
          </div>
        ) : characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] p-12 text-center">
            <Users size={32} className="text-[var(--color-muted-2)]" />
            <h2 className="mt-4 text-base font-semibold">No canon characters yet</h2>
            <p className="mt-1 max-w-[380px] text-xs text-[var(--color-muted)]">
              Create your first character or import a JSON bible. Once added, you
              can use them seamlessly in any video project.
            </p>
            <Button
              variant="pill"
              className="mt-5"
              onClick={() =>
                setEditingChar({
                  name: "",
                  description: "",
                  wardrobe: "",
                  references: [],
                })
              }
            >
              <Plus size={14} /> Add Character
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((c) => (
              <CharacterCard
                key={c.id}
                character={c}
                onEdit={() => setEditingChar(c)}
                onDelete={() => setConfirmDeleteId(c.id)}
              />
            ))}
            <button
              onClick={() =>
                setEditingChar({
                  name: "",
                  description: "",
                  wardrobe: "",
                  references: [],
                })
              }
              className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] text-[var(--color-muted)] transition hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <Plus size={24} />
              <span className="mt-2 text-xs font-medium">New Character</span>
            </button>
          </div>
        )}
      </main>

      {/* Edit / Create Character Modal */}
      {editingChar && (
        <CharacterEditorModal
          character={editingChar}
          onClose={() => setEditingChar(null)}
          onSave={(data) => {
            const id = upsert({
              id: editingChar.id,
              name: data.name,
              description: data.description,
              wardrobe: data.wardrobe,
              references: data.references ?? [],
            });
            setEditingChar(null);
            pushToast({
              message: editingChar.id ? "Character updated" : "Character created",
              detail: `"${data.name}" is now locked in the Bible.`,
              variant: "success",
            });
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[400px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Delete character?</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              This will remove the character from the Bible. Existing project
              assets already created with this character will not be deleted.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="solid"
                onClick={() => {
                  remove(confirmDeleteId);
                  setConfirmDeleteId(null);
                  pushToast({ message: "Character deleted", variant: "warning" });
                }}
              >
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CharacterCard({
  character,
  onEdit,
  onDelete,
}: {
  character: CanonCharacter;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const primaryImage = character.references?.[0];

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/50 p-5 transition hover:border-[var(--color-border)]">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-panel-2)] text-[var(--color-muted)]">
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryImage}
                  alt={character.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-bold text-sm text-white/70">
                  {character.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--color-text)]">
                {character.name}
              </h3>
              <p className="text-[11px] text-[var(--color-muted)]">
                {character.usedIn.length} project
                {character.usedIn.length === 1 ? "" : "s"} linked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
            <button
              onClick={onEdit}
              aria-label="Edit character"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-white/5 hover:text-white"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={onDelete}
              aria-label="Delete character"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-white/5 hover:text-red-400"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-xs">
          <div>
            <span className="font-semibold text-[var(--color-muted-2)] uppercase tracking-wide text-[10px]">
              Physical Anchor
            </span>
            <p className="mt-0.5 line-clamp-3 text-[var(--color-text)] leading-relaxed">
              {character.description || (
                <span className="italic text-[var(--color-muted-2)]">
                  No locked physical description set
                </span>
              )}
            </p>
          </div>

          {character.wardrobe && (
            <div>
              <span className="font-semibold text-[var(--color-muted-2)] uppercase tracking-wide text-[10px]">
                Wardrobe / Silhouette
              </span>
              <p className="mt-0.5 line-clamp-2 text-[var(--color-muted)]">
                {character.wardrobe}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reference thumbnails */}
      <div className="mt-5 border-t border-[var(--color-border-soft)] pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--color-muted-2)]">
            References ({character.references.length}/{MAX_REFERENCES})
          </span>
          <button
            onClick={onEdit}
            className="text-[11px] text-[var(--color-accent)] hover:underline"
          >
            Manage
          </button>
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto scroll-thin pb-1">
          {character.references.map((img, i) => (
            <span
              key={i}
              className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-[var(--color-border-soft)] bg-black/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-full w-full object-cover" />
            </span>
          ))}
          {character.references.length === 0 && (
            <span className="text-[11px] text-[var(--color-muted-2)] italic">
              No reference images uploaded
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CharacterEditorModal({
  character,
  onClose,
  onSave,
}: {
  character: Partial<CanonCharacter>;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description: string;
    wardrobe?: string;
    references?: string[];
  }) => void;
}) {
  const [name, setName] = useState(character.name ?? "");
  const [description, setDescription] = useState(character.description ?? "");
  const [wardrobe, setWardrobe] = useState(character.wardrobe ?? "");
  const [references, setReferences] = useState<string[]>(
    character.references ?? []
  );

  const fileRef = useRef<HTMLInputElement>(null);

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (references.length >= MAX_REFERENCES) return;
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const result = loadEvt.target?.result as string;
        if (result) {
          setReferences((prev) =>
            prev.length < MAX_REFERENCES ? [...prev, result] : prev
          );
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeRef = (index: number) => {
    setReferences((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      wardrobe: wardrobe.trim() || undefined,
      references,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[560px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-soft)]">
          <h2 className="text-lg font-bold">
            {character.id ? "Edit Canon Character" : "New Canon Character"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[var(--color-muted)] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Character Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya Lin, Commander Rex"
              className="mt-1.5 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)] p-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-border)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Locked Physical Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. South Asian woman in her late 20s, sharp jawline, dark wavy hair in a loose bun, hazel eyes."
              className="scroll-thin mt-1.5 w-full resize-none rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)] p-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-border)]"
            />
            <p className="mt-1 text-[11px] text-[var(--color-muted-2)]">
              This exact text anchors every shot generation to prevent facial drift.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Wardrobe &amp; Silhouette
            </label>
            <input
              type="text"
              value={wardrobe}
              onChange={(e) => setWardrobe(e.target.value)}
              placeholder="e.g. Crimson trench coat with turned-up collar, silver pendant"
              className="mt-1.5 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)] p-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-border)]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Visual References ({references.length}/{MAX_REFERENCES})
              </label>
              {references.length < MAX_REFERENCES && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
                >
                  <Plus size={12} /> Upload Image
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileRef}
              onChange={handleUploadImage}
              accept="image/*"
              multiple
              className="hidden"
            />

            <div className="mt-2 flex flex-wrap gap-2.5">
              {references.map((img, i) => (
                <div
                  key={i}
                  className="group/img relative h-16 w-16 overflow-hidden rounded-xl border border-[var(--color-border)] bg-black"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeRef(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover/img:opacity-100 hover:bg-red-600"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}

              {references.length < MAX_REFERENCES && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] text-[var(--color-muted-2)] transition hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
                >
                  <ImageIcon size={18} />
                  <span className="mt-1 text-[9px]">Add</span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[var(--color-border-soft)]">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="white" type="submit">
              <Check size={14} /> Save Character
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
