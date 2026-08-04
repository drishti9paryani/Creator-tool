"use client";

import { use, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Upload } from "lucide-react";
import { useStore } from "@/lib/store/project";
import { ai } from "@/lib/ai/client";
import { AssetCard } from "@/components/workspace/AssetCard";
import { AddCard } from "@/components/workspace/AddCard";
import { AssetDetail } from "@/components/workspace/AssetDetail";
import { CommandBar } from "@/components/workspace/CommandBar";
import { EditableTitle } from "@/components/ui/EditableTitle";
import type { Asset } from "@/lib/ai/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function AssetDesigner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const search = useSearchParams();
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const { hydrateProject, revealAsset, deleteAsset, updateProjectTitle } = useStore();
  const pushToast = useStore((s) => s.pushToast);
  const dismissToast = useStore((s) => s.dismissToast);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const ran = useRef(false);

  // One-time project init sequence (toasts + progressive asset reveal).
  useEffect(() => {
    if (search.get("init") !== "1" || ran.current) return;
    if (!project || project.assets.length > 0) return;
    ran.current = true;

    (async () => {
      const t1 = pushToast({ message: "Initializing new project…", variant: "loading" });
      const seeded = await ai.initProject({
        format: project.format,
        idea: "",
        story: { id: project.storyId, title: "", description: "", characters: [], settings: [] },
        style: { id: project.styleId, label: "", thumbnail: "" },
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
        // Reuse a previously generated image for this style+asset if we have
        // one, so re-creating identical projects doesn't re-bill the image API.
        const cached = getCachedAsset(project.styleId, a.id);
        if (cached) {
          revealAsset(id, a.id, cached);
          continue;
        }
        await delay(500);
        const r = await ai.generateAssetImage(a.id);
        revealAsset(id, a.id, r.image);
        if (r.image) cacheAsset(project.styleId, a.id, r.image);
      }
      dismissToast(t2);

      const t3 = pushToast({ message: "Saving…", variant: "loading" });
      await delay(900);
      dismissToast(t3);
      pushToast({ message: "Project ready", variant: "success" });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-muted)]">
        Project not found.
      </div>
    );
  }

  // Detail / iterate view
  if (selectedId) {
    return (
      <>
        <AssetDetail
          assets={project.assets}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onBack={() => setSelectedId(null)}
          onUpdateDescription={() => {}}
        />
        <CommandBar placeholder="Iterate on this asset…" />
      </>
    );
  }

  const byType = (t: Asset["type"]) => project.assets.filter((a) => a.type === t);
  const characters = byType("character");
  const locations = byType("location");
  const props = byType("prop");

  return (
    <>
      <div className="h-full overflow-y-auto scroll-thin px-8 py-6 pb-28">
        <div className="mb-6 flex items-center justify-between">
          <EditableTitle
            value={project.title}
            placeholder="Title of the project"
            onCommit={(v) => updateProjectTitle(id, v)}
            className="max-w-[520px] text-3xl font-bold"
          />
          <button className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
            <Upload size={18} />
          </button>
        </div>

        <Section title="Characters" subtitle="Select any character to see details or iterate on them">
          <Row cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {characters.map((a) => (
              <AssetCard
                key={a.id}
                asset={a}
                onOpen={() => setSelectedId(a.id)}
                onDelete={() => deleteAsset(id, a.id)}
              />
            ))}
            <AddCard label="Add Character" subtitle="Character" />
          </Row>
        </Section>

        <Section title="Locations" subtitle="Select any location to see details or iterate on them">
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
            <AddCard label="Add Location" subtitle="Location" aspect="landscape" />
          </Row>
        </Section>

        <Section title="Props" subtitle="Select any prop to see details or iterate on them">
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
            <AddCard label="Add Prop" subtitle="Prop" aspect="landscape" />
          </Row>
        </Section>
      </div>
      <CommandBar placeholder="Make all characters talk like pirates…" />
    </>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-9">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>
        </div>
        <button className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]">
          Show All
        </button>
      </div>
      {children}
    </section>
  );
}

function Row({ cols, children }: { cols: string; children: React.ReactNode }) {
  return <div className={`grid ${cols} gap-4`}>{children}</div>;
}
