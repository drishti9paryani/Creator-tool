"use client";

import { forwardRef } from "react";

type Variant = "pill" | "ghost" | "solid" | "white";

const variants: Record<Variant, string> = {
  // Neutral dark pill (wizard "Next", "Use my story…").
  pill: "bg-[var(--color-panel-2)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[#26262a]",
  ghost: "text-[var(--color-muted)] hover:text-[var(--color-text)]",
  solid: "bg-[var(--color-accent)] text-white hover:brightness-110",
  // White capsule (workspace "Generate all videos", "Update Visual").
  white: "bg-white text-black hover:bg-white/90",
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "pill", className = "", children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});
