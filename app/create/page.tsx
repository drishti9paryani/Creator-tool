"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, FileText, RefreshCw, AlertTriangle, Pencil } from "lucide-react";
import { WizardShell } from "@/components/wizard/WizardShell";
import { WizardFooter } from "@/components/wizard/WizardFooter";
import { FormatCard } from "@/components/wizard/FormatCard";
import { SuggestionChip } from "@/components/wizard/SuggestionChip";
import { StoryOutlineCard } from "@/components/wizard/StoryOutlineCard";
import { StyleCard } from "@/components/wizard/StyleCard";
import { CreativeBrief } from "@/components/wizard/CreativeBrief";
import { DotsLoader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store/project";
import { ai } from "@/lib/ai/client";
import { buildBrief } from "@/lib/brief";
import { FORMATS } from "@/data/formats";
import { SUGGESTIONS } from "@/data/suggestions";
import { STYLES } from "@/data/styles";

// 0 format · 1 describe · 2 select story · 3 summary · 4 visual style ·
// 5 your visual style (confirm) · 6 review creative brief
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const MIN_IDEA_LENGTH = 8;

export default function CreateWizard() {
  const router = useRouter();
  const draft = useStore((s) => s.draft);
  const {
    setFormat,
    setIdea,
    setOutlines,
    selectStory,
    setSummary,
    setStyles,
    selectStyle,
  } = useStore();
  const addProject = useStore((s) => s.addProject);

  const [step, setStep] = useState<Step>(0);
  const [loadingOutlines, setLoadingOutlines] = useState(false);
  const [outlineError, setOutlineError] = useState<string | null>(null);

  const selectedOutline =
    draft.outlines.find((o) => o.id === draft.selectedStoryId) ?? draft.outlines[0];
  const selectedStyle =
    STYLES.find((s) => s.id === draft.selectedStyleId) ?? STYLES[0];

  // Fetch outlines when entering step 2 without any loaded yet.
  useEffect(() => {
    if (step === 2 && draft.outlines.length === 0 && !loadingOutlines && !outlineError) {
      void loadOutlines(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Pre-fill the editable summary from the chosen outline on first entry.
  useEffect(() => {
    if (step === 3 && !draft.summary && selectedOutline?.description) {
      setSummary(selectedOutline.description);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Preload styles when reaching the style grid.
  useEffect(() => {
    if (step === 4 && draft.styles.length === 0) setStyles(STYLES);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function loadOutlines(regen: boolean) {
    setLoadingOutlines(true);
    setOutlineError(null);
    setOutlines([]);
    selectStory("");
    try {
      const res = regen
        ? await ai.regenerateOutlines(draft.idea, draft.format ?? "video")
        : await ai.generateOutlines(draft.idea, draft.format ?? "video");
      setOutlines(res);
      // Pre-select the first option so the flow can never dead-end on a user
      // who skipped this step (the old build let them reach "Create project"
      // with nothing selected, where the button silently did nothing).
      if (res[0]) selectStory(res[0].id);
    } catch (e) {
      // Without this catch, any server error left the spinner running forever —
      // the worst possible failure to hand a tester.
      setOutlineError(
        e instanceof Error ? e.message : "Something went wrong generating stories."
      );
    } finally {
      setLoadingOutlines(false);
    }
  }

  function finish() {
    if (!selectedOutline || !selectedStyle) return;
    const brief = buildBrief(
      selectedOutline,
      selectedStyle,
      draft.format ?? "video",
      draft.summary
    );
    const id = `proj_${Date.now()}`;
    addProject({
      id,
      title: brief.title || "Untitled Project",
      format: draft.format ?? "video",
      styleId: selectedStyle.id,
      storyId: selectedOutline.id,
      brief,
      assets: [],
      scenes: [],
      createdAt: Date.now(),
    });
    router.push(`/project/${id}/assets?init=1`);
  }

  // ---- Step 0: Format ----
  if (step === 0) {
    return (
      <WizardShell
        step={0}
        heading="Choose your format"
        subheading="Specify aspect ratio"
        footer={
          <WizardFooter
            showPrev={false}
            nextLabel="Next: describe story"
            nextDisabled={!draft.format}
            nextHint={!draft.format ? "Pick a format to continue" : undefined}
            onNext={() => setStep(1)}
          />
        }
      >
        <div className="mx-auto flex max-w-[640px] flex-col items-center justify-center gap-6 sm:flex-row">
          {FORMATS.map((f) => (
            <FormatCard
              key={f.id}
              option={f}
              selected={draft.format === f.id}
              onSelect={() => setFormat(f.id)}
            />
          ))}
        </div>
      </WizardShell>
    );
  }

  // ---- Step 1: Describe ----
  if (step === 1) {
    const ideaReady = draft.idea.trim().length >= MIN_IDEA_LENGTH;
    return (
      <WizardShell
        step={1}
        heading="Describe your story idea"
        subheading="Choose a suggestion or describe your idea"
        footer={
          <WizardFooter
            nextLabel="Next: choose story outline"
            nextDisabled={!ideaReady}
            nextHint={
              ideaReady ? undefined : "Write a sentence or pick a suggestion above"
            }
            onPrev={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        }
      >
        <div className="mx-auto max-w-[720px]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SUGGESTIONS.map((s) => (
              <SuggestionChip
                key={s.id}
                icon={s.icon}
                text={s.text}
                onClick={() => setIdea(s.text)}
              />
            ))}
          </div>

          <div className="relative mt-6">
            <textarea
              value={draft.idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => {
                // Enter submits, Shift+Enter makes a new line.
                if (e.key === "Enter" && !e.shiftKey && ideaReady) {
                  e.preventDefault();
                  setStep(2);
                }
              }}
              autoFocus
              maxLength={1200}
              placeholder="e.g. A retired postman discovers the letters he never delivered…"
              className="scroll-thin h-32 w-full resize-none rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/40 p-4 pr-12 text-sm outline-none placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-border)]"
            />
            <button
              onClick={() => ideaReady && setStep(2)}
              disabled={!ideaReady}
              aria-label="Continue"
              className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-panel-2)] text-[var(--color-muted)] transition enabled:hover:text-[var(--color-text)] disabled:opacity-40"
            >
              <ArrowUp size={15} />
            </button>
          </div>
          <p className="mt-2 flex justify-between text-xs text-[var(--color-muted-2)]">
            <span>Press Enter to continue · Shift+Enter for a new line</span>
            <span>{draft.idea.trim().length}/1200</span>
          </p>
        </div>
      </WizardShell>
    );
  }

  // ---- Step 2: Select story ----
  if (step === 2) {
    return (
      <WizardShell
        step={2}
        heading="Select a story"
        subheading={
          <Button variant="pill" className="mt-1" onClick={() => setStep(3)}>
            <FileText size={14} /> Use my story without editing it
          </Button>
        }
        footer={
          <WizardFooter
            nextLabel="Next: refine story"
            nextDisabled={!draft.selectedStoryId}
            nextHint={
              draft.selectedStoryId ? undefined : "Choose one of the three stories"
            }
            onPrev={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        }
      >
        {loadingOutlines ? (
          <div className="flex flex-col items-center pt-24">
            <DotsLoader />
            <p className="mt-6 text-sm text-[var(--color-muted)]">
              Generating outline options…
            </p>
          </div>
        ) : outlineError ? (
          <div className="animate-fade-up mx-auto flex max-w-[460px] flex-col items-center rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/40 p-8 text-center">
            <AlertTriangle size={26} className="text-amber-400" />
            <h3 className="mt-4 font-semibold">Couldn&apos;t generate stories</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{outlineError}</p>
            <div className="mt-5 flex gap-3">
              <Button onClick={() => loadOutlines(false)}>
                <RefreshCw size={14} /> Try again
              </Button>
              <Button variant="ghost" onClick={() => setStep(1)}>
                Edit my idea
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-up mx-auto max-w-[1180px]">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {draft.outlines.map((o) => (
                <StoryOutlineCard
                  key={o.id}
                  outline={o}
                  selected={draft.selectedStoryId === o.id}
                  onSelect={() => selectStory(o.id)}
                />
              ))}
            </div>
            <div className="mt-5 flex justify-center">
              <Button variant="ghost" onClick={() => loadOutlines(true)}>
                <RefreshCw size={14} /> Regenerate options
              </Button>
            </div>
          </div>
        )}
      </WizardShell>
    );
  }

  // ---- Step 3: Take a pass at the summary ----
  if (step === 3) {
    return (
      <WizardShell
        step={3}
        heading="Take a pass at the summary"
        subheading="You can edit this later in your project"
        footer={
          <WizardFooter
            nextLabel="Next: choose visual style"
            onPrev={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        }
      >
        <div className="animate-fade-up mx-auto max-w-[720px]">
          <textarea
            value={draft.summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Your story summary…"
            className="scroll-thin h-[320px] w-full resize-none rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/40 p-5 text-sm leading-relaxed outline-none placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-border)]"
          />
          <p className="mt-2 text-xs text-[var(--color-muted-2)]">
            This summary drives your characters, locations and scenes.
          </p>
        </div>
      </WizardShell>
    );
  }

  // ---- Step 4: Establish your visual style ----
  if (step === 4) {
    return (
      <WizardShell
        step={4}
        heading="Establish your visual style"
        subheading="Every character, location and storyboard frame inherits this look"
        footer={
          <WizardFooter
            nextLabel="Next: preview style"
            nextDisabled={!draft.selectedStyleId}
            nextHint={draft.selectedStyleId ? undefined : "Pick a style to continue"}
            onPrev={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        }
      >
        <div className="scroll-thin mx-auto max-h-[62vh] max-w-[760px] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
            {STYLES.map((s) => (
              <StyleCard
                key={s.id}
                style={s}
                selected={draft.selectedStyleId === s.id}
                onSelect={() => selectStyle(s.id)}
              />
            ))}
          </div>
        </div>
      </WizardShell>
    );
  }

  // ---- Step 5: Your visual style (confirm) ----
  if (step === 5) {
    return (
      <WizardShell
        step={5}
        heading="Your visual style"
        subheading="A preview of the style applied to your project"
        footer={
          <WizardFooter
            nextLabel="Next: review brief"
            onPrev={() => setStep(4)}
            onNext={() => setStep(6)}
          />
        }
      >
        <div className="animate-fade-up mx-auto flex max-w-[420px] flex-col items-center text-center">
          {/* The whole card is a way back to the grid — "Previous" was the only
              route to a different style, which reads as navigation, not editing. */}
          <button
            onClick={() => setStep(4)}
            className="group w-[220px] overflow-hidden rounded-2xl border border-[var(--color-border-soft)] transition hover:border-[var(--color-accent)]"
            aria-label={`Change visual style — currently ${selectedStyle.label}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedStyle.thumbnail}
              alt={selectedStyle.label}
              className="aspect-square w-full object-cover transition group-hover:opacity-80"
            />
          </button>
          <h3 className="mt-4 text-lg font-bold">{selectedStyle.label}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
            {selectedStyle.description}
          </p>
          <Button variant="pill" className="mt-5" onClick={() => setStep(4)}>
            <Pencil size={14} /> Change style
          </Button>
        </div>
      </WizardShell>
    );
  }

  // ---- Step 6: Review your creative brief ----
  return (
    <WizardShell
      step={6}
      heading="Review your creative brief"
      subheading="You can access this on the project page later as well"
      footer={
        <WizardFooter
          nextLabel="Create project"
          nextDisabled={!selectedOutline}
          nextHint={selectedOutline ? undefined : "Go back and choose a story first"}
          onPrev={() => setStep(5)}
          onNext={finish}
        />
      }
    >
      <div className="animate-fade-up scroll-thin mx-auto max-h-[64vh] max-w-[820px] overflow-y-auto pr-1">
        <CreativeBrief
          brief={buildBrief(
            selectedOutline,
            selectedStyle,
            draft.format ?? "video",
            draft.summary
          )}
        />
      </div>
    </WizardShell>
  );
}
