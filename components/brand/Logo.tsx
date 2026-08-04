import { Play } from "lucide-react";

// Red YouTube-style play mark + PROTOTYPE / project wordmark.
export function Logo({ label = "PROTOTYPE" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <span className="flex h-[22px] w-[32px] items-center justify-center rounded-[6px] bg-[var(--color-accent-red)]">
        <Play size={12} className="ml-[1px] fill-white text-white" />
      </span>
      <span className="text-[15px] font-bold tracking-tight text-[var(--color-text)]">
        {label}
      </span>
    </div>
  );
}
