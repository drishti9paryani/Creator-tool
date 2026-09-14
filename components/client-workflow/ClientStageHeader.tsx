import type { ClientStage } from "@/lib/workflow/types";

const STAGES: Array<{ id: ClientStage; label: string }> = [
  { id: "idea", label: "Idea" },
  { id: "words", label: "Words" },
  { id: "look", label: "Look" },
  { id: "preview", label: "Preview" },
  { id: "delivery", label: "Video" },
];

export function ClientStageHeader({ stage }: { stage: ClientStage }) {
  const current = STAGES.findIndex((item) => item.id === stage);
  return (
    <header className="border-b border-[#c7d1dc] bg-[#f7f9fb] px-5 py-5 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <a
            href="/"
            className="rounded-md text-lg font-bold tracking-[-0.02em] text-[#15324a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f2ae30]"
          >
            Creator Desk
          </a>
          <p className="text-base font-semibold text-[#405b70]">Step {current + 1} of 5</p>
        </div>
        <ol aria-label="Your progress" className="mt-5 grid grid-cols-5 gap-2">
          {STAGES.map((item, index) => {
            const active = index === current;
            const complete = index < current;
            return (
              <li key={item.id} aria-current={active ? "step" : undefined}>
                <div
                  className={`h-2 rounded-full ${
                    active ? "bg-[#e59a13]" : complete ? "bg-[#2f6f67]" : "bg-[#d9e0e7]"
                  }`}
                />
                <span
                  className={`mt-2 hidden text-sm sm:block ${
                    active ? "font-bold text-[#15324a]" : "text-[#607588]"
                  }`}
                >
                  {item.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </header>
  );
}