import type { CreativeBrief, StoryOutline, VisualStyle, Format } from "@/lib/ai/types";

// Assemble the creative brief from the wizard's current selections. The
// editable `summary` overrides the outline's description when the user has
// tweaked it on the "Take a pass at the summary" step.
export function buildBrief(
  outline: StoryOutline | undefined,
  style: VisualStyle | undefined,
  format: Format,
  summary: string
): CreativeBrief {
  return {
    title: outline?.title ?? "Untitled Story",
    summary: summary || outline?.description || "",
    characters: outline?.characters ?? [],
    settings: outline?.settings ?? [],
    format,
    styleId: style?.id ?? "",
    styleLabel: style?.label ?? "",
    styleThumbnail: style?.thumbnail ?? "",
  };
}
