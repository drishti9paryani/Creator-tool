"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, FileText } from "lucide-react";
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

  const selectedOutline =
    draft.outlines.find((o) => o.id === draft.selectedStoryId) ?? draft.outlines[0];
  const selectedStyle =
    STYLES.find((s) => s.id === draft.selectedStyleId) ?? STYLES[0];

  // Fetch outlines when entering step 2 without any loaded yet.
  useEffect(() => {
    if (step === 2 && draft.outlines.length === 0 && !loadingOutlines) {
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
    setOutlines([]);
    selectStory("");
    const res = regen
      ? await ai.regenerateOutlines(draft.idea, draft.format ?? "video")
      : await ai.generateOutlines(draft.idea, draft.format ?? "video");
    setOutlines(res);
    setLoadingOutlines(false);
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
      title: "Title of the project",
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
      <WizardShell heading="Choose your format" subheading="Specify aspect ratio"
        footer={
          <WizardFooter
            showPrev={false}
            nextLabel="Next: describe story"
            nextDisabled={!draft.format}
            onNext={() => setStep(1)}
            onSkip={() => setStep(1)}
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
    return (
      <WizardShell heading="Describe your story idea"
        subheading="Choose a suggestion or describe your idea"
        footer={
          <WizardFooter
            nextLabel="Next: choose story outline"
            onPrev={() => setStep(0)}
            onNext={() => setStep(2)}
            onSkip={() => setStep(2)}
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
              placeholder="Describe your story idea…"
              className="scroll-thin h-32 w-full resize-none rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/40 p-4 text-sm outline-none placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-border)]"
            />
            <span className="absolute bottom-3 right-3 text-[var(--color-muted)]">
              <ArrowUp size={16} />
            </span>
          </div>
        </div>
      </WizardShell>
    );
  }

  // ---- Step 2: Select story ----
  if (step === 2) {
    return (
      <WizardShell heading="Select a story"
        subheading={
          <Button variant="pill" className="mt-1" onClick={() => setStep(3)}>
            <FileText size={14} /> Use my story without editing it
          </Button>
        }
        footer={
          <WizardFooter
            nextLabel="Next: refine story"
            nextDisabled={!draft.selectedStoryId}
            onPrev={() => setStep(1)}
            onNext={() => setStep(3)}
            onSkip={() => setStep(3)}
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
                ↻ Regenerate options
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
      <WizardShell heading="Take a pass at the summary"
        subheading="You can edit this later in your project"
        footer={
          <WizardFooter
            nextLabel="Next: choose visual style"
            onPrev={() => setStep(2)}
            onNext={() => setStep(4)}
            onSkip={() => setStep(4)}
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
        </div>
      </WizardShell>
    );
  }

  // ---- Step 4: Establish your visual style ----
  if (step === 4) {
    return (
      <WizardShell heading="Establish your visual style"
        footer={
          <WizardFooter
            nextLabel="Next: preview style"
            nextDisabled={!draft.selectedStyleId}
            onPrev={() => setStep(3)}
            onNext={() => setStep(5)}
            onSkip={() => setStep(5)}
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
      <WizardShell heading="Your visual style"
        subheading="A preview of the style applied to your project"
        footer={
          <WizardFooter
            nextLabel="Next: review brief"
            onPrev={() => setStep(4)}
            onNext={() => setStep(6)}
            onSkip={() => setStep(6)}
          />
        }
      >
        <div className="animate-fade-up mx-auto flex max-w-[420px] flex-col items-center text-center">
          <div className="w-[220px] overflow-hidden rounded-2xl border border-[var(--color-border-soft)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedStyle.thumbnail}
              alt={selectedStyle.label}
              className="aspect-square w-full object-cover"
            />
          </div>
          <h3 className="mt-4 text-lg font-bold">{selectedStyle.label}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
            {selectedStyle.description}
          </p>
        </div>
      </WizardShell>
    );
  }

  // ---- Step 6: Review your creative brief ----
  return (
    <WizardShell heading="Review your creative brief"
      subheading="You can access this on the project page later as well"
      footer={
        <WizardFooter
          nextLabel="Create project"
          onPrev={() => setStep(5)}
          onNext={finish}
          onSkip={finish}
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
