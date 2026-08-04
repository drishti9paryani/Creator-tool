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
import { DotsLoader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store/project";
import { ai } from "@/lib/ai/client";
import { FORMATS } from "@/data/formats";
import { SUGGESTIONS } from "@/data/suggestions";
import { STYLES } from "@/data/styles";

type Step = 0 | 1 | 2 | 3;

export default function CreateWizard() {
  const router = useRouter();
  const draft = useStore((s) => s.draft);
  const { setFormat, setIdea, setOutlines, selectStory, setStyles, selectStyle } =
    useStore();
  const addProject = useStore((s) => s.addProject);

  const [step, setStep] = useState<Step>(0);
  const [loadingOutlines, setLoadingOutlines] = useState(false);

  // Fetch outlines when entering step 2 without any loaded yet.
  useEffect(() => {
    if (step === 2 && draft.outlines.length === 0 && !loadingOutlines) {
      void loadOutlines(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Preload styles when reaching step 3.
  useEffect(() => {
    if (step === 3 && draft.styles.length === 0) setStyles(STYLES);
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
    const story =
      draft.outlines.find((o) => o.id === draft.selectedStoryId) ?? draft.outlines[0];
    const style = STYLES.find((s) => s.id === draft.selectedStyleId) ?? STYLES[0];
    if (!story || !style) return;
    // Project is created by the workspace init sequence; pass selection via draft.
    const id = `proj_${Date.now()}`;
    addProject({
      id,
      title: "Title of the project",
      format: draft.format ?? "video",
      styleId: style.id,
      storyId: story.id,
      assets: [],
      scenes: [],
      createdAt: Date.now(),
    });
    router.push(`/project/${id}/assets?init=1`);
  }

  // ---- Step 1: Format ----
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
        <div className="mx-auto flex max-w-[640px] justify-center gap-6">
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

  // ---- Step 2: Describe ----
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
          <div className="grid grid-cols-2 gap-3">
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

  // ---- Step 3: Select story ----
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
            <div className="grid grid-cols-3 gap-5">
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

  // ---- Step 4: Visual style ----
  return (
    <WizardShell heading="Establish your visual style"
      footer={
        <WizardFooter
          nextLabel="Create project"
          nextDisabled={!draft.selectedStyleId}
          onPrev={() => setStep(2)}
          onNext={finish}
          onSkip={finish}
        />
      }
    >
      <div className="scroll-thin mx-auto max-h-[62vh] max-w-[760px] overflow-y-auto pr-2">
        <div className="grid grid-cols-4 gap-x-6 gap-y-6">
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
