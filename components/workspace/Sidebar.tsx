"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Wrench, Scissors } from "lucide-react";

// Left workspace navigation. Active item gets a filled pill.
export function Sidebar({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const items = [
    { label: "Home", href: "/", icon: Home, exact: true },
    { label: "Asset Designer", href: `/project/${projectId}/assets`, icon: LayoutGrid },
    { label: "Shot Builder", href: `/project/${projectId}/shots`, icon: Wrench },
    { label: "Editor", href: `/project/${projectId}/editor`, icon: Scissors },
  ];

  return (
    <nav className="flex w-[210px] shrink-0 flex-col gap-1 px-3 py-4">
      {items.map(({ label, href, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              active
                ? "bg-[var(--color-panel)] font-medium text-[var(--color-text)]"
                : "text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
            }`}
          >
            <Icon size={17} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
