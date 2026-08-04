"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

// Full-screen dark wizard chrome: top-left logo, top-right close, centered
// content, and a fixed footer (Previous / Next / Skip).
export function WizardShell({
  heading,
  subheading,
  children,
  footer,
}: {
  heading: string;
  subheading?: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="bg-glow relative flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Logo />
        <button
          onClick={() => router.push("/")}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
        >
          <X size={18} />
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 pb-28 pt-6">
        <h1 className="text-center text-[32px] font-bold tracking-tight">{heading}</h1>
        {subheading && (
          <div className="mt-2 text-center text-[15px] text-[var(--color-muted)]">
            {subheading}
          </div>
        )}
        <div className="mt-10 w-full">{children}</div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 flex items-center justify-between px-8 py-5">
        {footer}
      </footer>
    </div>
  );
}
