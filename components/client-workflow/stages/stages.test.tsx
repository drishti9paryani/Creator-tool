import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IdeaStage } from "@/components/client-workflow/stages/IdeaStage";
import { WordsStage } from "@/components/client-workflow/stages/WordsStage";
import { LookStage } from "@/components/client-workflow/stages/LookStage";

describe("client decision stages", () => {
  it("keeps idea typing complete when speech input is unavailable", () => {
    render(<IdeaStage value="" onChange={vi.fn()} />);

    expect(screen.getByLabelText("Your idea")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Speak your idea" })).not.toBeInTheDocument();
  });

  it("offers clear approval and revision actions for the words", () => {
    const onSubmit = vi.fn();
    render(<WordsStage script="A family gathers." saving={false} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Yes, continue" }));
    expect(onSubmit).toHaveBeenCalledWith({ type: "script.approved" });

    fireEvent.click(screen.getByRole("button", { name: "I want a change" }));
    expect(screen.getByLabelText("What should change?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send my changes" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("What should change?"), {
      target: { value: "Make it gentler" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send my changes" }));
    expect(onSubmit).toHaveBeenCalledWith({
      type: "script.revision_requested",
      instructions: "Make it gentler",
    });
  });

  it("shows exactly three keyboard-selectable looks and announces selection", () => {
    const onSelect = vi.fn();
    render(<LookStage selectedLookId={null} saving={false} onSelect={onSelect} />);

    const choices = screen.getAllByRole("radio");
    expect(choices).toHaveLength(3);
    expect(choices.map((choice) => choice.textContent)).toEqual([
      expect.stringContaining("Warm and natural"),
      expect.stringContaining("Bold and cinematic"),
      expect.stringContaining("Clean and modern"),
    ]);

    fireEvent.click(screen.getByRole("radio", { name: /Warm and natural/ }));
    expect(onSelect).toHaveBeenCalledWith("warm-natural");

    const { rerender } = render(
      <LookStage selectedLookId="warm-natural" saving={false} onSelect={onSelect} />
    );
    rerender(<LookStage selectedLookId="warm-natural" saving={false} onSelect={onSelect} />);
    expect(screen.getAllByRole("radio", { name: /Warm and natural/ }).at(-1)).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });
});