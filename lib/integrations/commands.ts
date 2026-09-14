export type TelegramCommand =
  | { type: "project.create"; title: string; idea: string }
  | { type: "project.status" }
  | { type: "script.approve" }
  | { type: "script.revision"; instructions: string }
  | { type: "look.select"; lookId: string }
  | { type: "preview.approve"; maximumCostInr: number }
  | { type: "delivery.link" };

export function parseTelegramAction(input: string): TelegramCommand | null {
  const text = input.trim();
  if (!text) return null;
  if (text.toLowerCase() === "status") return { type: "project.status" };
  if (text.toLowerCase() === "send video") return { type: "delivery.link" };

  if (text.toLowerCase().startsWith("new:")) {
    const [title, idea] = text.slice(4).split("|").map((part) => part.trim());
    if (!title || !idea) return null;
    return { type: "project.create", title, idea };
  }

  if (text.toLowerCase() === "approve:script") return { type: "script.approve" };
  if (text.toLowerCase().startsWith("change:script:")) {
    const instructions = text.slice("change:script:".length).trim();
    return instructions ? { type: "script.revision", instructions } : null;
  }
  if (text.toLowerCase().startsWith("look:")) {
    const lookId = text.slice("look:".length).trim();
    return lookId ? { type: "look.select", lookId } : null;
  }
  if (text.toLowerCase().startsWith("approve:preview:")) {
    const amount = Number(text.slice("approve:preview:".length).trim());
    return Number.isInteger(amount) && amount >= 0
      ? { type: "preview.approve", maximumCostInr: amount }
      : null;
  }
  return null;
}