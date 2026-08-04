"use client";

// A small pointer callout (video's "You're almost there!" hint). Controlled via
// `open` so callers can show it once and dismiss on click.
export function Callout({
  title,
  body,
  onDismiss,
  className = "",
}: {
  title: string;
  body: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`animate-fade-up relative w-60 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-left shadow-xl shadow-black/50 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{body}</p>
    </div>
  );
}
