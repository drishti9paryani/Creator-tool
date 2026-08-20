"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, RefreshCw, Users, BookOpen, X, Plus } from "lucide-react";
import { useStore } from "@/lib/store/project";
import { useCharacters, type CanonCharacter } from "@/lib/store/characters";
import { ai } from "@/lib/ai/client";
import { AssetCard } from "@/components/workspace/AssetCard";
import { AddCard } from "@/components/workspace/AddCard";
import { AssetDetail } from "@/components/workspace/AssetDetail";
import { CommandBar } from "@/components/workspace/CommandBar";
import { EditableTitle } from "@/components/ui/EditableTitle";
import { Button } from "@/components/ui/Button";
import { NewAssetDialog } from "@/components/workspace/NewAssetDialog";
import { ProjectLoading, ProjectMissing } from "@/components/workspace/ProjectGate";
import { useHydrated } from "@/lib/store/useHydrated";
import type { Asset, AssetType } from "@/lib/ai/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ||
  `asset-${Date.now()}`;

export default function AssetDesigner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const search = useSearchParams();
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const {
    hydrateProject,
    revealAsset,
    deleteAsset,
    addAsset,
    updateAsset,
    updateProjectTitle,
  } = useStore();
  const pushToast = useStore((s) => s.pushToast);
  const dismissToast = useStore((s) => s.dismissToast);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initState, setInitState] = useState<"idle" | "running" | "failed">("idle");
  const [addingType, setAddingType] = useState<AssetType | null>(null);
  const [biblePickerOpen, setBiblePickerOpen] = useState(false);
  const canonCharacters = useCharacters((s) => s.characters);
  const linkToProject = useCharacters((s) => s.linkToProject);
  const ran = useRef(false);
  const hydrated = useHydrated();

  const styleId = project?.styleId ?? "";

  const importFromBible = async (char: CanonCharacter) => {
    const assetId = `${slugify(char.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const asset: Asset = {
      id: assetId,
      type: "character",
      name: char.name.toUpperCase(),
      subtitle: "Character",
      description: char.description + (char.wardrobe ? ` Wardrobe: ${char.wardrobe}` : ""),
      image: char.references?.[0],
      status: char.references?.[0] ? "ready" : "generating",
    };
    addAsset(id, asset);
    linkToProject(char.id, id);
    setBiblePickerOpen(false);
    pushToast({
      message: `Imported "${char.name}" from Character Bible`,
      variant: "success",
    });

    if (!char.references?.[0]) {
      try {
        const r = await ai.generateAssetImage({
          id: assetId,
          projectId: id,
          name: char.name,
          type: "character",
          description: char.description,
          styleId,
        });
        revealAsset(id, assetId, r.image);
      } catch (e) {
        updateAsset(id, assetId, { status: "ready" });
      }
    }
  };

  // ── Project init: build the cast and generate its art ────────────────────
  const runInit = useCallback(async () => {
    const current = useStore.getState().projects.find((p) => p.id === id);
    if (!current) return;

    setInitState("running");
    const t1 = pushToast({ message: "Initializing new project…", variant: "loading" });

    try {
      const seeded = await ai.initProject({
        format: current.format,
        idea: current.brief?.summary ?? "",
        story: {
          id: current.storyId,
          title: current.brief?.title ?? "",
          description: current.brief?.summary ?? "",
          characters: current.brief?.characters ?? [],
          settings: current.brief?.settings ?? [],
        },
        style: {
          id: current.styleId,
          label: current.brief?.styleLabel ?? "",
          thumbnail: current.brief?.styleThumbnail ?? "",
        },
      });
      hydrateProject(id, {
        title: seeded.title,
        assets: seeded.assets,
        scenes: seeded.scenes,
      });
      dismissToast(t1);

      const t2 = pushToast({
        message: "Applying visual style to characters, locations, and props…",
        variant: "loading",
      });
      const { getCachedAsset, cacheAsset } = useStore.getState();
      for (const a of seeded.assets) {
        const cached = getCachedAsset(id, a.id);
        if (cached) {
          revealAsset(id, a.id, cached);
          continue;
        }
        await delay(250);
        const r = await ai.generateAssetImage({
          id: a.id,
          projectId: id,
          name: a.name,
          type: a.type,
          description: a.description,
          styleId: current.styleId,
        });
        revealAsset(id, a.id, r.image);
        if (r.image) cacheAsset(id, a.id, r.image);
      }
      dismissToast(t2);
      pushToast({ message: "Project ready", variant: "success" });
      setInitState("idle");
    } catch (e) {
      dismissToast(t1);
      // Previously an error here left the project permanently empty with no
      // way back — the tester saw three blank rows and no explanation.
      setInitState("failed");
      pushToast({
        message: "Couldn't finish setting up this project",
        detail: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (search.get("init") !== "1" || ran.current) return;
    if (!project || project.assets.length > 0) return;
    ran.current = true;
    void runInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  /**
   * Finish art for assets left mid-generation. If init dies (or the tab is
   * refreshed) partway through the reveal loop, the remaining tiles keep
   * status "generating" and spin forever — the repair banner used to only
   * cover the assets-are-empty case, which this isn't.
   */
  const resumeArt = useCallback(async () => {
    const current = useStore.getState().projects.find((p) => p.id === id);
    if (!current) return;
    const pending = current.assets.filter((a) => a.status === "generating");
    if (pending.length === 0) return;

    setInitState("running");
    const t = pushToast({
      message: `Finishing art for ${pending.length} asset${pending.length === 1 ? "" : "s"}…`,
      variant: "loading",
    });
    try {
      for (const a of pending) {
        const r = await ai.generateAssetImage({
          id: a.id,
          projectId: id,
          name: a.name,
          type: a.type,
          description: a.description,
          styleId: current.styleId,
        });
        revealAsset(id, a.id, r.image);
      }
      dismissToast(t);
      pushToast({ message: "All assets ready", variant: "success" });
      setInitState("idle");
    } catch (e) {
      dismissToast(t);
      setInitState("failed");
      pushToast({
        message: "Couldn't finish generating art",
        detail: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Add an asset by hand ────────────────────────────────────────────────
  async function createAsset(type: AssetType, name: string, description: string) {
    const assetId = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const asset: Asset = {
      id: assetId,
      type,
      name: name.toUpperCase(),
      subtitle: type === "character" ? "Character" : type === "location" ? "Location" : "Prop",
      description,
      status: "generating",
    };
    addAsset(id, asset);
    setAddingType(null);

    try {
      const r = await ai.generateAssetImage({
        id: assetId,
        projectId: id,
        name,
        type,
        description,
        styleId,
      });
      revealAsset(id, assetId, r.image);
    } catch (e) {
      updateAsset(id, assetId, { status: "ready" });
      pushToast({
        message: `Couldn't generate art for ${name}`,
        detail: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    }
  }

  // ── Regenerate / iterate one asset ──────────────────────────────────────
  async function iterate(assetId: string, prompt: string) {
    const asset = project?.assets.find((a) => a.id === assetId);
    if (!asset) return;
    updateAsset(id, assetId, { status: "generating" });
    try {
      const r = await ai.iterateAsset({
        assetId,
        projectId: id,
        name: asset.name,
        type: asset.type,
        description: asset.description,
        prompt,
        styleId,
      });
      updateAsset(id, assetId, { image: r.image, status: "ready" });
    } catch (e) {
      updateAsset(id, assetId, { status: "ready" });
      pushToast({
        message: "Couldn't update that visual",
        detail: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    }
  }

  // Order matters: the store loads from IndexedDB asynchronously, so "no
  // project" is meaningless until hydration finishes.
  if (!hydrated) return <ProjectLoading />;
  if (!project) return <ProjectMissing />;

  // Detail / iterate view
  if (selectedId) {
    return (
      <>
        <AssetDetail
          assets={project.assets}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onBack={() => setSelectedId(null)}
          onUpdateDescription={(assetId, description) =>
            updateAsset(id, assetId, { description })
          }
          onUpdateVoice={(assetId, voiceDescription) =>
            updateAsset(id, assetId, { voiceDescription })
          }
          onIterate={iterate}
        />
        <CommandBar
          placeholder="Iterate on this asset — e.g. give her a red coat…"
          onSubmit={(prompt) => iterate(selectedId, prompt)}
          submitLabel="Apply to this asset"
        />
      </>
    );
  }

  const byType = (t: AssetType) => project.assets.filter((a) => a.type === t);
  const characters = byType("character");
  const locations = byType("location");
  const props = byType("prop");
  const empty = project.assets.length === 0;
  const stuck = project.assets.filter((a) => a.status === "generating").length;

  return (
    <>
      <div className="h-full overflow-y-auto scroll-thin px-5 py-6 pb-28 sm:px-8">
        <div className="mb-6">
          <EditableTitle
            value={project.title}
            placeholder="Title of the project"
            onCommit={(v) => updateProjectTitle(id, v)}
            className="max-w-[620px] text-2xl font-bold sm:text-3xl"
          />
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {project.format === "short" ? "YouTube Short · 9:16" : "YouTube Video · 16:9"}
            {project.brief?.styleLabel ? ` · ${project.brief.styleLabel}` : ""}
          </p>
        </div>

        {/* A project that never finished initialising is recoverable, not dead.
            Two distinct broken states: nothing was built at all, or the art
            loop stopped partway and tiles are stuck spinning. */}
        {initState !== "running" && (empty || stuck > 0) && (
          <div className="mb-8 flex flex-col items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
              <div>
                <p className="text-sm font-semibold">
                  {empty
                    ? "This project has no assets yet"
                    : `${stuck} asset${stuck === 1 ? "" : "s"} didn't finish generating`}
                </p>
                <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                  {initState === "failed"
                    ? "Setup didn't finish. You can run it again — nothing else is lost."
                    : empty
                      ? "Setup was interrupted, probably by a refresh. Run it again to build your cast."
                      : "Their tiles will keep spinning until you finish them. Everything else is fine."}
                </p>
              </div>
            </div>
            <Button onClick={empty ? runInit : resumeArt}>
              <RefreshCw size={14} /> {empty ? "Set up project" : "Finish generating"}
            </Button>
          </div>
        )}

        <Section
          title="Characters"
          subtitle="Select any character to see details or iterate on them"
          action={
            <button
              onClick={() => setBiblePickerOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-panel-2)] px-3 py-1.5 text-xs text-[var(--color-text)] transition hover:bg-[#26262a]"
            >
              <BookOpen size={13} /> Import from Bible
            </button>
          }
        >
          <Row cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {characters.map((a) => (
              <AssetCard
                key={a.id}
                asset={a}
                onOpen={() => setSelectedId(a.id)}
                onDelete={() => deleteAsset(id, a.id)}
              />
            ))}
            <AddCard
              label="Add Character"
              subtitle="Character"
              onClick={() => setAddingType("character")}
            />
          </Row>
        </Section>

        <Section
          title="Locations"
          subtitle="Select any location to see details or iterate on them"
        >
          <Row cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {locations.map((a) => (
              <AssetCard
                key={a.id}
                asset={a}
                aspect="landscape"
                onOpen={() => setSelectedId(a.id)}
                onDelete={() => deleteAsset(id, a.id)}
              />
            ))}
            <AddCard
              label="Add Location"
              subtitle="Location"
              aspect="landscape"
              onClick={() => setAddingType("location")}
            />
          </Row>
        </Section>

        <Section title="Props" subtitle="Objects the story keeps returning to">
          <Row cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {props.map((a) => (
              <AssetCard
                key={a.id}
                asset={a}
                aspect="landscape"
                onOpen={() => setSelectedId(a.id)}
                onDelete={() => deleteAsset(id, a.id)}
              />
            ))}
            <AddCard
              label="Add Prop"
              subtitle="Prop"
              aspect="landscape"
              onClick={() => setAddingType("prop")}
            />
          </Row>
        </Section>
      </div>

      {addingType && (
        <NewAssetDialog
          type={addingType}
          onCancel={() => setAddingType(null)}
          onCreate={(name, description) => createAsset(addingType, name, description)}
        />
      )}

      {biblePickerOpen && (
        <BiblePickerModal
          characters={canonCharacters}
          onClose={() => setBiblePickerOpen(false)}
          onSelect={importFromBible}
        />
      )}

      <CommandBar placeholder="Ask for a change — e.g. make the palette colder…" />
    </>
  );
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-9">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function BiblePickerModal({
  characters,
  onClose,
  onSelect,
}: {
  characters: CanonCharacter[];
  onClose: () => void;
  onSelect: (c: CanonCharacter) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[600px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-soft)]">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[var(--color-accent)]" />
            <h3 className="text-lg font-bold">Import from Character Bible</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[var(--color-muted)] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 max-h-[400px] overflow-y-auto scroll-thin space-y-3">
          {characters.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[var(--color-muted)]">
                No characters in the Bible yet.
              </p>
              <Link
                href="/characters"
                className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
              >
                Go to Character Bible &rarr;
              </Link>
            </div>
          ) : (
            characters.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)]/60 p-3 transition hover:border-[var(--color-border)]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40 text-xs font-bold text-white/70">
                    {c.references?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.references[0]}
                        alt={c.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      c.name.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[var(--color-text)] truncate">
                      {c.name}
                    </p>
                    <p className="text-xs text-[var(--color-muted)] truncate max-w-[320px]">
                      {c.description || "No description"}
                    </p>
                  </div>
                </div>
                <Button variant="pill" onClick={() => onSelect(c)}>
                  <Plus size={13} /> Add to Cast
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ cols, children }: { cols: string; children: React.ReactNode }) {
  return <div className={`grid ${cols} gap-4`}>{children}</div>;
}
