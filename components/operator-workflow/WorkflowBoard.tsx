"use client";

import { useState } from "react";
import type { OperatorNode } from "@/lib/workflow/operator-view";

type WorkflowBoardProps = {
  nodes: OperatorNode[];
  onRetry: (nodeId: OperatorNode["id"]) => void;
};

const STATUS_LABEL: Record<OperatorNode["status"], string> = {
  blocked: "Blocked",
  waiting: "Waiting",
  running: "Running",
  complete: "Complete",
  failed: "Failed",
};

export function WorkflowBoard({ nodes, onRetry }: WorkflowBoardProps) {
  const [selectedId, setSelectedId] = useState<OperatorNode["id"]>(nodes.find((node) => node.status === "failed")?.id ?? nodes[0]?.id ?? "idea");
  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0];

  return (
    <section aria-label="Creator workflow" className="rounded-2xl border border-[#2a2a2e] bg-[#161618] p-5 text-[#f5f5f6] sm:p-7">
      <div className="overflow-x-auto pb-3">
        <div className="relative flex min-w-[760px] items-stretch gap-3">
          <div aria-hidden="true" className="absolute left-5 right-5 top-10 h-px bg-[#49494e]" />
          {nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              aria-pressed={selectedId === node.id}
              aria-label={`${node.label} ${STATUS_LABEL[node.status]}`}
              onClick={() => setSelectedId(node.id)}
              className={`relative z-10 flex min-h-24 w-28 flex-col justify-between rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e59a13] ${
                selectedId === node.id ? "border-[#e59a13] bg-[#242428]" : "border-[#3a3a3f] bg-[#1d1d20]"
              }`}
            >
              <span className="text-base font-bold">{node.label}</span>
              <span className={`text-xs font-bold ${node.status === "failed" ? "text-[#ff8b8b]" : node.status === "complete" ? "text-[#8bd3b2]" : "text-[#c4c4c9]"}`}>
                {STATUS_LABEL[node.status]}
              </span>
            </button>
          ))}
        </div>
      </div>
      {selected && (
        <aside className="mt-6 border-t border-[#343439] pt-5" aria-label={`${selected.label} details`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#a8a8ae]">Selected node</p>
              <h2 className="mt-1 text-2xl font-bold">{selected.label}</h2>
              <p className="mt-2 max-w-2xl text-base leading-7 text-[#c4c4c9]">{selected.detail}</p>
              {selected.provider && <p className="mt-2 text-sm text-[#a8a8ae]">Provider: {selected.provider}</p>}
            </div>
            {selected.canRetry && (
              <button
                type="button"
                onClick={() => onRetry(selected.id)}
                className="min-h-11 rounded-lg bg-[#d98700] px-5 py-2 text-base font-bold text-[#142737] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e59a13]"
              >
                Retry {selected.label}
              </button>
            )}
          </div>
        </aside>
      )}
    </section>
  );
}