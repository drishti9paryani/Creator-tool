import { notFound } from "next/navigation";
import { ClientWorkflow } from "@/components/client-workflow/ClientWorkflow";
import { getWorkflowRepository } from "@/lib/workflow/server-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getWorkflowRepository().get(id);
  if (!project) notFound();
  return <ClientWorkflow initialProject={project} />;
}