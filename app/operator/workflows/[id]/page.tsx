import { notFound } from "next/navigation";
import { WorkflowBoard } from "@/components/operator-workflow/WorkflowBoard";
import { buildOperatorNodes } from "@/lib/workflow/operator-view";
import { getWorkflowRepository } from "@/lib/workflow/server-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function OperatorWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repository = getWorkflowRepository();
  const project = repository.get(id);
  if (!project) notFound();
  const nodes = buildOperatorNodes(project, repository.events(id));

  return (
    <main className="min-h-screen bg-[#0a0a0b] px-4 py-8 text-[#f5f5f6] sm:px-10 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <a href={`/workflow/${project.id}`} className="text-sm font-bold text-[#e59a13] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e59a13]">
          Open client view
        </a>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#8a8a90]">Operator workflow</p>
            <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em]">{project.title}</h1>
          </div>
          <p className="text-sm text-[#8a8a90]">Stage: {project.stage} · Status: {project.status}</p>
        </div>
        <div className="mt-10">
          <WorkflowBoard nodes={nodes} onRetry={() => undefined} />
        </div>
      </div>
    </main>
  );
}