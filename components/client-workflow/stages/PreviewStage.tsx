import { useState } from "react";
import { PrimaryAction } from "@/components/client-workflow/PrimaryAction";
import type { WorkflowEvent } from "@/lib/workflow/types";

type PreviewEvent = Extract<
  WorkflowEvent,
  { type: "preview.approved" | "preview.revision_requested" }
>;

type PreviewStageProps = {
  script: string;
  previewAssetIds: string[];
  maximumCostInr: number;
  saving: boolean;
  onSubmit: (event: PreviewEvent) => void;
};

export function PreviewStage({
  script,
  previewAssetIds,
  maximumCostInr,
  saving,
  onSubmit,
}: PreviewStageProps) {
  const [editing, setEditing] = useState(false);
  const [instructions, setInstructions] = useState("");

  return (
    <div className="mt-8 max-w-3xl">
      <p className="text-lg leading-8 text-[#405b70]">
        Check the pictures and the words together before the video is made.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {previewAssetIds.map((asset, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${asset}-${index}`}
            src={asset}
            alt={`Preview ${index + 1}`}
            className="aspect-video w-full rounded-lg border-2 border-[#b7c4cf] bg-[#e8eef3] object-cover"
          />
        ))}
      </div>
      <p className="mt-6 border-y-2 border-[#d9e0e7] py-5 text-lg leading-8 text-[#294b64]">
        {script}
      </p>

      {editing ? (
        <div className="mt-6">
          <label htmlFor="preview-change" className="block text-lg font-bold">
            What should change?
          </label>
          <textarea
            id="preview-change"
            rows={4}
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            className="mt-3 w-full rounded-xl border-2 border-[#8ea1b2] px-4 py-3 text-lg leading-7 outline-none focus:border-[#1d5b83] focus:ring-4 focus:ring-[#bdd9ec]"
          />
          <PrimaryAction
            type="button"
            className="mt-4"
            disabled={!instructions.trim() || saving}
            onClick={() =>
              onSubmit({
                type: "preview.revision_requested",
                instructions: instructions.trim(),
              })
            }
          >
            Send my changes
          </PrimaryAction>
        </div>
      ) : (
        <div className="mt-7">
          <p className="text-lg font-bold text-[#6d4300]">
            Maximum charge: ₹{maximumCostInr.toLocaleString("en-IN")}
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <PrimaryAction
              type="button"
              disabled={saving}
              onClick={() =>
                onSubmit({
                  type: "preview.approved",
                  approvedMaximumCostInr: maximumCostInr,
                })
              }
            >
              Approve and create video
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
        </div>
      )}
    </div>
  );
}