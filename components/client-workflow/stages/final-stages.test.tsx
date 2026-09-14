import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PreviewStage } from "@/components/client-workflow/stages/PreviewStage";
import { DeliveryStage } from "@/components/client-workflow/stages/DeliveryStage";

describe("preview and delivery stages", () => {
  it("places the exact maximum charge next to preview approval", () => {
    const onSubmit = vi.fn();
    render(
      <PreviewStage
        script="A family gathers for Sunday lunch."
        previewAssetIds={["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"]}
        maximumCostInr={500}
        saving={false}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText("Maximum charge: ₹500")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Approve and create video" }));
    expect(onSubmit).toHaveBeenCalledWith({
      type: "preview.approved",
      approvedMaximumCostInr: 500,
    });
    expect(screen.getByRole("button", { name: "I want a change" })).toBeInTheDocument();
  });

  it("explains active rendering without covering the useful screen", () => {
    render(
      <DeliveryStage
        status="working"
        finalVideoUrl={null}
        errorMessage={null}
        estimatedMinutes={4}
      />
    );

    expect(screen.getByText("Creating your video — about 4 minutes")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("offers download and Telegram delivery after completion", () => {
    const onSendToTelegram = vi.fn();
    render(
      <DeliveryStage
        status="complete"
        finalVideoUrl="https://example.test/video.mp4"
        errorMessage={null}
        estimatedMinutes={4}
        onSendToTelegram={onSendToTelegram}
      />
    );

    expect(screen.getByRole("link", { name: "Download video" })).toHaveAttribute(
      "href",
      "https://example.test/video.mp4"
    );
    fireEvent.click(screen.getByRole("button", { name: "Send to Telegram" }));
    expect(onSendToTelegram).toHaveBeenCalledOnce();
  });

  it("turns render failure into two understandable choices", () => {
    const onRetry = vi.fn();
    const onHelp = vi.fn();
    render(
      <DeliveryStage
        status="failed"
        finalVideoUrl={null}
        errorMessage="The video could not be finished."
        estimatedMinutes={4}
        onRetry={onRetry}
        onHelp={onHelp}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("The video could not be finished.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    fireEvent.click(screen.getByRole("button", { name: "Ask for help" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onHelp).toHaveBeenCalledOnce();
  });
});