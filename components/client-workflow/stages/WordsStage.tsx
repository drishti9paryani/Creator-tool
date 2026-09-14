import { useState } from "react";
import { PrimaryAction } from "@/components/client-workflow/PrimaryAction";
import type { WorkflowEvent } from "@/lib/workflow/types";

type WordsEvent = Extract<
  WorkflowEvent,
  { type: "script.approved" | "script.revision_requested" }
>;

type WordsStageProps = {
  script: string;
  saving: boolean;
  onSubmit: (event: WordsEvent) => void;
};

export function WordsStage({ script, saving, onSubmit }: WordsStageProps) {
  const [editing, setEditing] = useState(false);
  const [instructions, setInstructions] = useState("");

  return (
    <div className="mt-8 max-w-2xl">
      <p className="text-lg leading-8 text-[#405b70]">
        Read this at your own pace. You can approve it or ask for a change.
      </p>
      <div className="mt-6 border-y-2 border-[#d9e0e7] py-6 text-xl leading-9 text-[#183247]">
        {script}
      </div>
      {editing ? (
        <div className="mt-7">
          <label htmlFor="script-change" className="block text-lg font-bold">
            What should change?
          </label>
          <textarea
            id="script-change"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            rows={4}
            className="mt-3 w-full rounded-xl border-2 border-[#8ea1b2] px-4 py-3 text-lg leading-7 outline-none focus:border-[#1d5b83] focus:ring-4 focus:ring-[#bdd9ec]"
          />
          <PrimaryAction
            type="button"
            className="mt-4"
            disabled={!instructions.trim() || saving}
            onClick={() =>
              onSubmit({
                type: "script.revision_requested",
                instructions: instructions.trim(),
              })
            }
          >
            Send my changes
          </PrimaryAction>
        </div>
      ) : (
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <PrimaryAction
            type="button"
            disabled={saving}
            onClick={() => onSubmit({ type: "script.approved" })}
          >
            Yes, continue
          </PrimaryAction>
          <button
            type="button"
            disabled={saving}
            onClick={() => setEditing(true)}
            className="min-h-12 rounded-xl border-2 border-[#557187] px-6 py-3 text-lg font-bold text-[#294b64] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1d5b83] disabled:opacity-45"
          >
            I want a change
          </button>
        </div>
      )}
    </div>
  );
}