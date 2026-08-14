"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "@/lib/store/idbStorage";
import type {
  Asset,
  Format,
  Project,
  Scene,
  Shot,
  StoryOutline,
  VisualStyle,
} from "@/lib/ai/types";

export interface Toast {
  id: string;
  message: string;
  variant?: "loading" | "success" | "warning" | "error";
  /** Optional second line, e.g. why a live call fell back to sample output. */
  detail?: string;
}

interface WizardDraft {
  format?: Format;
  idea: string;
  outlines: StoryOutline[];
  selectedStoryId?: string;
  summary: string; // editable flattened story ("Take a pass at the summary")
  styles: VisualStyle[];
  selectedStyleId?: string;
}

interface State {
  draft: WizardDraft;
  projects: Project[];
  // Persisted cache of generated asset images, keyed by `${projectId}:${assetId}`.
  // Scoped per-project so a re-run of a project's init effect (e.g. React
  // StrictMode double-invoke) doesn't re-bill the image API, while every
  // distinct new project still always generates fresh art.
  assetCache: Record<string, string>;

  // draft actions
  setFormat: (f: Format) => void;
  setIdea: (idea: string) => void;
  setOutlines: (o: StoryOutline[]) => void;
  selectStory: (id: string) => void;
  setSummary: (summary: string) => void;
  setStyles: (s: VisualStyle[]) => void;
  selectStyle: (id: string) => void;
  resetDraft: () => void;

  // project actions
  addProject: (p: Project) => void;
  hydrateProject: (id: string, data: Pick<Project, "title" | "assets" | "scenes">) => void;
  getProject: (id: string) => Project | undefined;
  updateProjectTitle: (id: string, title: string) => void;
  revealAsset: (projectId: string, assetId: string, image: string) => void;
  setAssetImage: (projectId: string, assetId: string, image: string) => void;
  // Asset-image cache helpers.
  assetCacheKey: (projectId: string, assetId: string) => string;
  getCachedAsset: (projectId: string, assetId: string) => string | undefined;
  cacheAsset: (projectId: string, assetId: string, image: string) => void;
  deleteAsset: (projectId: string, assetId: string) => void;
  addAsset: (projectId: string, asset: Asset) => void;
  updateAsset: (projectId: string, assetId: string, patch: Partial<Asset>) => void;
  deleteShot: (projectId: string, sceneId: string, shotId: string) => void;
  deleteProject: (id: string) => void;
  addScene: (projectId: string) => void;
  updateScene: (projectId: string, sceneId: string, patch: Partial<Scene>) => void;
  deleteScene: (projectId: string, sceneId: string) => void;
  addShot: (projectId: string, sceneId: string) => void;
  updateShot: (
    projectId: string,
    sceneId: string,
    shotId: string,
    patch: Partial<Shot>
  ) => void;

  // toasts (transient, not persisted)
  toasts: Toast[];
  pushToast: (t: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
}

const emptyDraft: WizardDraft = {
  idea: "",
  outlines: [],
  summary: "",
  styles: [],
};

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

function patchProject(
  projects: Project[],
  id: string,
  fn: (p: Project) => Project
): Project[] {
  return projects.map((p) => (p.id === id ? fn(p) : p));
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      draft: { ...emptyDraft },
      projects: [],
      assetCache: {},
      toasts: [],

      setFormat: (format) => set((s) => ({ draft: { ...s.draft, format } })),
      setIdea: (idea) => set((s) => ({ draft: { ...s.draft, idea } })),
      setOutlines: (outlines) => set((s) => ({ draft: { ...s.draft, outlines } })),
      selectStory: (selectedStoryId) =>
        set((s) => ({ draft: { ...s.draft, selectedStoryId } })),
      setSummary: (summary) => set((s) => ({ draft: { ...s.draft, summary } })),
      setStyles: (styles) => set((s) => ({ draft: { ...s.draft, styles } })),
      selectStyle: (selectedStyleId) =>
        set((s) => ({ draft: { ...s.draft, selectedStyleId } })),
      resetDraft: () => set({ draft: { ...emptyDraft } }),

      addProject: (p) => set((s) => ({ projects: [p, ...s.projects] })),
      hydrateProject: (id, data) =>
        set((s) => ({
          projects: patchProject(s.projects, id, (p) => ({ ...p, ...data })),
        })),
      getProject: (id) => get().projects.find((p) => p.id === id),
      updateProjectTitle: (id, title) =>
        set((s) => ({
          projects: patchProject(s.projects, id, (p) => ({ ...p, title })),
        })),
      revealAsset: (projectId, assetId, image) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            assets: p.assets.map((a) =>
              a.id === assetId ? { ...a, image, status: "ready" as const } : a
            ),
          })),
        })),
      setAssetImage: (projectId, assetId, image) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            assets: p.assets.map((a) => (a.id === assetId ? { ...a, image } : a)),
          })),
        })),
      assetCacheKey: (projectId, assetId) => `${projectId}:${assetId}`,
      getCachedAsset: (projectId, assetId) =>
        get().assetCache[`${projectId}:${assetId}`],
      cacheAsset: (projectId, assetId, image) =>
        set((s) => ({
          assetCache: { ...s.assetCache, [`${projectId}:${assetId}`]: image },
        })),
      deleteAsset: (projectId, assetId) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            assets: p.assets.filter((a) => a.id !== assetId),
          })),
        })),
      addAsset: (projectId, asset) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            assets: [...p.assets, asset],
          })),
        })),
      updateAsset: (projectId, assetId, patch) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            assets: p.assets.map((a) => (a.id === assetId ? { ...a, ...patch } : a)),
          })),
        })),
      deleteShot: (projectId, sceneId, shotId) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            scenes: p.scenes.map((sc) =>
              sc.id === sceneId
                ? { ...sc, shots: sc.shots.filter((sh) => sh.id !== shotId) }
                : sc
            ),
          })),
        })),
      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
      addScene: (projectId) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            scenes: [
              ...p.scenes,
              { id: uid("scene"), title: "Untitled Scene", description: "", shots: [] },
            ],
          })),
        })),
      updateScene: (projectId, sceneId, patch) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            scenes: p.scenes.map((sc) =>
              sc.id === sceneId ? { ...sc, ...patch } : sc
            ),
          })),
        })),
      deleteScene: (projectId, sceneId) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            scenes: p.scenes.filter((sc) => sc.id !== sceneId),
          })),
        })),
      addShot: (projectId, sceneId) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            scenes: p.scenes.map((sc) =>
              sc.id === sceneId
                ? {
                    ...sc,
                    shots: [
                      ...sc.shots,
                      { id: uid("shot"), title: "Unnamed Shot", status: "empty" as const },
                    ],
                  }
                : sc
            ),
          })),
        })),
      updateShot: (projectId, sceneId, shotId, patch) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            scenes: p.scenes.map((sc) =>
              sc.id === sceneId
                ? {
                    ...sc,
                    shots: sc.shots.map((sh) =>
                      sh.id === shotId ? { ...sh, ...patch } : sh
                    ),
                  }
                : sc
            ),
          })),
        })),

      pushToast: (t) => {
        const id = uid("toast");
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
        return id;
      },
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: "prototype-studio",
      // IndexedDB (not localStorage): persisted asset images are base64 data
      // URLs that exceed localStorage's ~5MB quota.
      storage: createJSONStorage(() => idbStorage),
      // Persist only durable data; toasts + wizard draft stay in-session.
      partialize: (s) =>
        ({ projects: s.projects, assetCache: s.assetCache }) as unknown as State,
    }
  )
);
