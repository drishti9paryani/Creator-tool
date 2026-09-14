import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClientWorkflow } from "@/components/client-workflow/ClientWorkflow";
import type { WorkflowProject } from "@/lib/workflow/types";

function project(overrides: Partial<WorkflowProject> = {}): WorkflowProject {
  return {
    id: "workflow-1",
    title: "Sunday lunch",
    source: "web",
    stage: "idea",
    status: "draft",
    idea: "",
    script: null,
    selectedLookId: null,
    previewAssetIds: [],
    maximumCostInr: null,
    approvedMaximumCostInr: null,
    finalVideoUrl: null,
    errorMessage: null,
    createdAt: "2026-09-14T00:00:00.000Z",
    updatedAt: "2026-09-14T00:00:00.000Z",
    ...overrides,
  };
}

describe("ClientWorkflow", () => {
  it("opens with one clear idea decision and a visible five-step route", () => {
    render(<ClientWorkflow initialProject={project()} onApply={vi.fn()} />);

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tell us your idea" })).toBeInTheDocument();
    expect(screen.getByLabelText("Your idea")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    expect(screen.queryByText(/provider|webhook|node id|stack trace/i)).not.toBeInTheDocument();
  });

  it("saves the idea and shows the returned approval stage", async () => {
    const words = project({
      stage: "words",
      status: "awaiting_approval",
      idea: "A warm family film",
      script: "A family gathers for Sunday lunch.",
    });
    const onApply = vi.fn().mockResolvedValue(words);
    render(<ClientWorkflow initialProject={project()} onApply={onApply} />);

    fireEvent.change(screen.getByLabelText("Your idea"), {
      target: { value: "A warm family film" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith({
        type: "idea.submitted",
        idea: "A warm family film",
      });
    });
    expect(await screen.findByRole("heading", { name: "Approve the words" })).toBeInTheDocument();
    expect(screen.getByText("A family gathers for Sunday lunch.")).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
  });

  it("moves from words to one of three look choices", async () => {
    const words = project({
      stage: "words",
      status: "awaiting_approval",
      script: "A family gathers for Sunday lunch.",
    });
    const look = project({
      stage: "look",
      status: "awaiting_approval",
      script: words.script,
    });
    const onApply = vi.fn().mockResolvedValue(look);
    render(<ClientWorkflow initialProject={words} onApply={onApply} />);

    fireEvent.click(screen.getByRole("button", { name: "Yes, continue" }));

    expect(onApply).toHaveBeenCalledWith({ type: "script.approved" });
    expect(await screen.findByRole("heading", { name: "Choose the look" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });
  it("shows the preview price gate and moves to delivery after approval", async () => {
    const preview = project({
      stage: "preview",
      status: "awaiting_approval",
      script: "A family gathers for Sunday lunch.",
      previewAssetIds: ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"],
      maximumCostInr: 500,
    });
    const delivery = project({
      ...preview,
      stage: "delivery",
      status: "working",
      approvedMaximumCostInr: 500,
    });
    const onApply = vi.fn().mockResolvedValue(delivery);
    render(<ClientWorkflow initialProject={preview} onApply={onApply} />);

    expect(screen.getByText("Maximum charge: ₹500")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Approve and create video" }));

    expect(onApply).toHaveBeenCalledWith({
      type: "preview.approved",
      approvedMaximumCostInr: 500,
    });
    expect(await screen.findByRole("heading", { name: "Receive your video" })).toBeInTheDocument();
    expect(screen.getByText("Step 5 of 5")).toBeInTheDocument();
  });

  it("resumes directly at a completed delivery", () => {
    render(
      <ClientWorkflow
        initialProject={project({
          stage: "delivery",
          status: "complete",
          finalVideoUrl: "https://example.test/video.mp4",
        })}
        onApply={vi.fn()}
      />
    );

    expect(screen.getByRole("link", { name: "Download video" })).toBeInTheDocument();
  });
  it("keeps the useful screen available while saving and explains failures", async () => {
    let rejectRequest: (error: Error) => void = () => undefined;
    const onApply = vi.fn().mockReturnValue(
      new Promise<WorkflowProject>((_resolve, reject) => {
        rejectRequest = reject;
      })
    );
    render(<ClientWorkflow initialProject={project()} onApply={onApply} />);

    fireEvent.change(screen.getByLabelText("Your idea"), {
      target: { value: "A warm family film" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("Your idea")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();

    rejectRequest(new Error("The connection stopped"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The connection stopped. Your idea is still here. Try again."
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });
});