"use client";

import Link from "next/link";
import { Spinner } from "@/components/ui/Loader";

/**
 * Shown while the persisted store is still loading from IndexedDB.
 *
 * IndexedDB has no synchronous read, so on a hard refresh or a direct link the
 * store is EMPTY for the first render or two. Without this state every
 * workspace page rendered "This project doesn't exist on this device" before
 * the data arrived — telling a tester their work was gone, milliseconds before
 * it reappeared.
 */
export function ProjectLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <Spinner size={22} />
      <p className="text-sm text-[var(--color-muted)]">Loading your project…</p>
    </div>
  );
}

/** Shown only once hydration has finished and the project is genuinely absent. */
export function ProjectMissing() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-[var(--color-muted)]">
        This project doesn&apos;t exist on this device.
      </p>
      <p className="max-w-[420px] text-sm text-[var(--color-muted-2)]">
        Projects are stored in your browser, so they don&apos;t follow you between
        devices or survive clearing site data.
      </p>
      <Link
        href="/"
        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
      >
        Back to projects
      </Link>
    </div>
  );
}
