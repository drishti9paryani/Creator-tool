import { LOOK_OPTIONS } from "@/lib/workflow/look-options";

type LookStageProps = {
  selectedLookId: string | null;
  saving: boolean;
  onSelect: (lookId: string) => void;
};

export function LookStage({ selectedLookId, saving, onSelect }: LookStageProps) {
  return (
    <div className="mt-8 max-w-3xl">
      <p className="text-lg leading-8 text-[#405b70]">
        Choose the direction that feels closest. You can refine it after the preview.
      </p>
      <div role="radiogroup" aria-label="Visual direction" className="mt-7 grid gap-4 md:grid-cols-3">
        {LOOK_OPTIONS.map((option) => {
          const selected = selectedLookId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${option.label}. ${option.description}`}
              disabled={saving}
              onClick={() => onSelect(option.id)}
              className={`min-h-44 rounded-xl border-2 p-5 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1d5b83] disabled:opacity-45 ${
                selected ? "border-[#2f6f67] bg-[#e6f0ee]" : "border-[#b7c4cf] bg-[#fbfcfd]"
              }`}
            >
              <span className="flex gap-2" aria-hidden="true">
                {option.swatches.map((colour) => (
                  <span key={colour} className="h-9 flex-1 rounded-md" style={{ backgroundColor: colour }} />
                ))}
              </span>
              <span className="mt-5 block text-xl font-bold text-[#15324a]">{option.label}</span>
              <span className="mt-2 block text-base leading-6 text-[#405b70]">{option.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}