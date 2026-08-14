"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Wrench, Scissors } from "lucide-react";

// Left workspace navigation. Active item gets a filled pill.
//
// Collapses to an icon rail below `lg` — the fixed 210px column ate half the
// viewport on a laptop split-screen and most of a tablet.
export function Sidebar({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const items = [
    { label: "Home", href: "/", icon: Home, exact: true },
    { label: "Asset Designer", href: `/project/${projectId}/assets`, icon: LayoutGrid },
    { label: "Shot Builder", href: `/project/${projectId}/shots`, icon: Wrench },
    { label: "Editor", href: `/project/${projectId}/editor`, icon: Scissors },
  ];

  return (
    <nav
      aria-label="Project sections"
      className="flex w-[62px] shrink-0 flex-col gap-1 border-r border-[var(--color-border-soft)] px-2 py-4 lg:w-[210px] lg:border-r-0 lg:px-3"
    >
      {items.map(({ label, href, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={label}
            href={href}
            title={label}
            aria-current={active ? "page" : undefined}
            className={`flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm transition lg:justify-start ${
              active
                ? "bg-[var(--color-panel)] font-medium text-[var(--color-text)]"
                : "text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
            }`}
          >
            <Icon size={17} className="shrink-0" />
            <span className="hidden lg:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
