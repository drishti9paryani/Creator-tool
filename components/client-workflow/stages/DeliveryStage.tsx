import { PrimaryAction } from "@/components/client-workflow/PrimaryAction";
import type { WorkflowStatus } from "@/lib/workflow/types";

type DeliveryStageProps = {
  status: WorkflowStatus;
  finalVideoUrl: string | null;
  errorMessage: string | null;
  estimatedMinutes: number;
  onRetry?: () => void;
  onHelp?: () => void;
  onSendToTelegram?: () => void;
};

export function DeliveryStage({
  status,
  finalVideoUrl,
  errorMessage,
  estimatedMinutes,
  onRetry,
  onHelp,
  onSendToTelegram,
}: DeliveryStageProps) {
  if (status === "complete" && finalVideoUrl) {
    return (
      <div className="mt-8 max-w-2xl">
        <p className="text-xl leading-8 text-[#405b70]">Your video is ready.</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a
            href={finalVideoUrl}
            download
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#d98700] px-7 py-3 text-lg font-bold text-[#142737] shadow-[0_3px_0_#9c5f00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1d5b83]"
          >
            Download video
          </a>
          <button
            type="button"
            onClick={onSendToTelegram}
            disabled={!onSendToTelegram}
            className="min-h-12 rounded-xl border-2 border-[#557187] px-6 py-3 text-lg font-bold text-[#294b64] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1d5b83] disabled:opacity-45"
          >
            Send to Telegram
          </button>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="mt-8 max-w-2xl">
        <p role="alert" className="rounded-lg bg-[#fff1d2] px-4 py-4 text-lg font-semibold text-[#6d4300]">
          {errorMessage ?? "The video could not be finished."}
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <PrimaryAction type="button" onClick={onRetry}>Try again</PrimaryAction>
          <button
            type="button"
            onClick={onHelp}
            className="min-h-12 rounded-xl border-2 border-[#557187] px-6 py-3 text-lg font-bold text-[#294b64] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1d5b83]"
          >
            Ask for help
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 max-w-2xl" aria-live="polite">
      <p className="text-2xl font-bold text-[#15324a]">
        Creating your video — about {estimatedMinutes} minutes
      </p>
      <p className="mt-4 text-lg leading-8 text-[#405b70]">
        You can close this page. Your place is saved, and the video will appear here when it is ready.
      </p>
      <div className="mt-7 h-3 overflow-hidden rounded-full bg-[#d9e0e7]">
        <div className="h-full w-2/5 rounded-full bg-[#2f6f67]" />
      </div>
    </div>
  );
}