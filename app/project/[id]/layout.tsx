"use client";

import { use } from "react";
import { Sidebar } from "@/components/workspace/Sidebar";
import { TopBar } from "@/components/workspace/TopBar";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar projectId={id} />
      <div className="flex flex-1">
        <Sidebar projectId={id} />
        <div className="relative flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
