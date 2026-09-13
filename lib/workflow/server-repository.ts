import { createWorkflowRepository } from "@/lib/workflow/repository";

const globalRepository = globalThis as typeof globalThis & {
  creatorWorkflowRepository?: ReturnType<typeof createWorkflowRepository>;
};

export function getWorkflowRepository() {
  if (!globalRepository.creatorWorkflowRepository) {
    globalRepository.creatorWorkflowRepository = createWorkflowRepository();
  }
  return globalRepository.creatorWorkflowRepository;
}