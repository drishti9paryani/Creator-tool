"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Shared wizard footer: left "Previous", centered "Next: …" pill, right "Skip".
export function WizardFooter({
  onPrev,
  onNext,
  onSkip,
  nextLabel,
  nextDisabled,
  showPrev = true,
}: {
  onPrev?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  showPrev?: boolean;
}) {
  return (
    <>
      <button
        onClick={onPrev}
        className={`text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)] ${
          showPrev ? "" : "invisible"
        }`}
      >
        Previous
      </button>

      <Button onClick={onNext} disabled={nextDisabled} className="px-5">
        {nextLabel}
        <ArrowRight size={15} />
      </Button>

      <button
        onClick={onSkip}
        className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
      >
        Skip
      </button>
    </>
  );
}
