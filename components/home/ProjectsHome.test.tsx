import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProjectsHome } from "@/components/home/ProjectsHome";
import { useStore } from "@/lib/store/project";
import type { Project } from "@/lib/ai/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// jsdom has no indexedDB, so the persisted store hydrates almost instantly and
// the pre-hydration window can't be observed by timing. Mock the hook so the
// guard itself can be tested in both states.
let hydratedFlag = true;
vi.mock("@/lib/store/useHydrated", () => ({
  useHydrated: () => hydratedFlag,
}));

const project = (over: Partial<Project> = {}): Project => ({
  id: "proj_1",
  title: "The Turning Point",
  format: "video",
  styleId: "watercolor",
  storyId: "turning-point-0-1",
  assets: [],
  scenes: [],
  createdAt: Date.now(),
  ...over,
});

beforeEach(() => {
  localStorage.clear();
  useStore.setState({ projects: [] });
  hydratedFlag = true;
});

describe("ProjectsHome", () => {
  it("renders the projects heading and the mode pill", async () => {
    render(<ProjectsHome liveMode={false} />);
    expect(screen.getByText("Your projects")).toBeInTheDocument();
    expect(screen.getByText("Demo mode")).toBeInTheDocument();

    render(<ProjectsHome liveMode />);
    expect(await screen.findByText("Live AI")).toBeInTheDocument();
  });

  // Regression: the empty state used to appear before IndexedDB resolved, so a
  // returning tester saw "Start your first project" and believed their work was
  // gone. Nothing may claim there are zero projects until the store has loaded.
  it("does not claim there are no projects before the store has hydrated", () => {
    hydratedFlag = false;
    render(<ProjectsHome liveMode={false} />);
    expect(screen.queryByText("Start your first project")).not.toBeInTheDocument();
  });

  it("shows the empty state once hydration finishes", () => {
    hydratedFlag = true;
    render(<ProjectsHome liveMode={false} />);
    expect(screen.getByText("Start your first project")).toBeInTheDocument();
  });

  it("does not flash the empty state while projects are still loading", () => {
    // Store already holds a project, but hydration is still in flight: the user
    // must never see "no projects" in that window.
    hydratedFlag = false;
    useStore.setState({ projects: [project()] });
    render(<ProjectsHome liveMode={false} />);
    expect(screen.queryByText("Start your first project")).not.toBeInTheDocument();
  });

  it("lists persisted projects with their counts", async () => {
    useStore.setState({
      projects: [
        project({
          assets: [
            { id: "a", type: "character", name: "LENA", subtitle: "Character", status: "ready" },
          ],
          scenes: [
            {
              id: "s1",
              title: "Ordinary World",
              description: "",
              shots: [{ id: "sh1", title: "Establishing", status: "empty" }],
            },
          ],
        }),
      ],
    });

    render(<ProjectsHome liveMode={false} />);
    expect(await screen.findByText("The Turning Point")).toBeInTheDocument();
    expect(screen.getByText(/1 assets · 1 shots/)).toBeInTheDocument();
  });

  it("asks for confirmation before deleting, since there is no undo", async () => {
    useStore.setState({ projects: [project()] });
    render(<ProjectsHome liveMode={false} />);

    fireEvent.click(await screen.findByLabelText("Delete The Turning Point"));

    expect(screen.getByText("Delete this project?")).toBeInTheDocument();
    // Still present — confirming is a separate, deliberate act.
    expect(useStore.getState().projects).toHaveLength(1);
  });
});
