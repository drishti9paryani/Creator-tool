import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkflowBoard } from "@/components/operator-workflow/WorkflowBoard";
import type { OperatorNode } from "@/lib/workflow/operator-view";

const nodes: OperatorNode[] = [
  { id: "idea", label: "Idea", status: "complete", detail: "A family film.", canRetry: false },
  { id: "script", label: "Script", status: "complete", detail: "Approved.", canRetry: false },
  { id: "look", label: "Look", status: "complete", detail: "Warm and natural.", canRetry: false },
  { id: "preview", label: "Preview", status: "complete", detail: "Maximum: ₹0", provider: "Demo", canRetry: false },
  { id: "render", label: "Render", status: "failed", detail: "Encoder stopped.", provider: "Video provider", canRetry: true },
  { id: "delivery", label: "Delivery", status: "waiting", detail: "Waiting for render.", canRetry: false },
];

describe("WorkflowBoard", () => {
  it("shows connected nodes and a plain status for each", () => {
    render(<WorkflowBoard nodes={nodes} onRetry={vi.fn()} />);

    expect(screen.getByRole("region", { name: "Creator workflow" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^(Idea|Script|Look|Preview|Render|Delivery)/ })).toHaveLength(6);
    expect(screen.getByText("Encoder stopped.")).toBeInTheDocument();
  });

  it("opens operator details and keeps retry controls out of the client screen", () => {
    const onRetry = vi.fn();
    render(<WorkflowBoard nodes={nodes} onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: /Render.*failed/i }));
    expect(screen.getByText(/Provider: Video provider/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry Render" }));
    expect(onRetry).toHaveBeenCalledWith("render");
  });
});