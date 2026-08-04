"use client";

// Animated three-dot loader used in the wizard ("Generating outline options…").
export function DotsLoader({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]"
          style={{
            animation: "spinnerDots 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </span>
  );
}

// Circular spinner (asset/shot generation tiles).
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-muted)]"
      style={{ width: size, height: size }}
    />
  );
}
