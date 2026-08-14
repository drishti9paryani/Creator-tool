"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Shared wizard footer: left "Previous", right-aligned "Next: …" pill.
//
// The "Skip" button is deliberately gone. It let a tester jump past story
// selection and reach "Create project" with nothing chosen, where the button
// silently did nothing — a dead end with no error and no way to tell what was
// wrong. A disabled Next with a reason attached says the same thing honestly.
export function WizardFooter({
  onPrev,
  onNext,
  nextLabel,
  nextDisabled,
  nextHint,
  showPrev = true,
}: {
  onPrev?: () => void;
  onNext?: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  /** Why Next is unavailable — shown beside the button. */
  nextHint?: string;
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

      <div className="flex items-center gap-3">
        {nextHint && (
          <span className="hidden text-xs text-[var(--color-muted)] sm:inline">
            {nextHint}
          </span>
        )}
        <Button onClick={onNext} disabled={nextDisabled} className="px-5">
          {nextLabel}
          <ArrowRight size={15} />
        </Button>
      </div>
    </>
  );
}
