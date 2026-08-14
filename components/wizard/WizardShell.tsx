"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const WIZARD_STEPS = [
  "Format",
  "Idea",
  "Story",
  "Summary",
  "Style",
  "Preview",
  "Brief",
] as const;

// Full-screen dark wizard chrome: top-left logo, step rail, top-right close,
// centered content, and a fixed footer (Previous / Next / Skip).
export function WizardShell({
  heading,
  subheading,
  step,
  children,
  footer,
}: {
  heading: string;
  subheading?: React.ReactNode;
  /** 0-based index into WIZARD_STEPS — drives the progress rail. */
  step: number;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="bg-glow relative flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 px-6 py-4">
        <Logo />

        {/* Progress rail. Seven unlabelled screens with no sense of position was
            the single most disorienting thing about the original flow. */}
        <nav
          aria-label="Progress"
          className="hidden flex-1 items-center justify-center gap-1.5 md:flex"
        >
          {WIZARD_STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <span key={label} className="flex items-center gap-1.5">
                <span
                  aria-current={current ? "step" : undefined}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition ${
                    current
                      ? "bg-[var(--color-accent)]/15 font-semibold text-[var(--color-text)]"
                      : done
                        ? "text-[var(--color-muted)]"
                        : "text-[var(--color-muted-2)]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      current
                        ? "bg-[var(--color-accent)]"
                        : done
                          ? "bg-[var(--color-muted)]"
                          : "bg-[var(--color-border)]"
                    }`}
                  />
                  {label}
                </span>
                {i < WIZARD_STEPS.length - 1 && (
                  <span
                    className={`h-px w-3 ${
                      done ? "bg-[var(--color-muted-2)]" : "bg-[var(--color-border)]"
                    }`}
                  />
                )}
              </span>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {/* Compact position readout for narrow screens. */}
          <span className="text-xs text-[var(--color-muted)] md:hidden">
            Step {step + 1} of {WIZARD_STEPS.length}
          </span>
          <button
            onClick={() => router.push("/")}
            aria-label="Close and return to projects"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 pb-28 pt-6">
        <h1 className="text-center text-[26px] font-bold tracking-tight sm:text-[32px]">
          {heading}
        </h1>
        {subheading && (
          <div className="mt-2 text-center text-[15px] text-[var(--color-muted)]">
            {subheading}
          </div>
        )}
        <div className="mt-8 w-full sm:mt-10">{children}</div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 flex items-center justify-between gap-4 border-t border-[var(--color-border-soft)] bg-[var(--color-bg)]/85 px-5 py-4 backdrop-blur sm:px-8 sm:py-5">
        {footer}
      </footer>
    </div>
  );
}
