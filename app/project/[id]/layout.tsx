import { Sidebar } from "@/components/workspace/Sidebar";
import { TopBar } from "@/components/workspace/TopBar";

// Server component: reads AI_PROVIDER so the workspace can tell the user
// whether the art they're looking at is generated or placeholder. Without this
// the only explanation lived in the README, and a tester reasonably reads
// placeholder placards as "the image generation is broken".
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const liveMode = (process.env.AI_PROVIDER ?? "mock") === "real";

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar projectId={id} liveMode={liveMode} />
      <div className="flex flex-1">
        <Sidebar projectId={id} />
        <div className="relative flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
