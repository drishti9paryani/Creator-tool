// Spend guard for image generation (SERVER ONLY).
//
// Images are the only call that costs real money at demo scale (text on
// gemini-flash-lite is cents; images are dollars). When a founder shares one
// URL with a room full of testers, an ungoverned app is an open wallet — so
// every image request passes through two ceilings before it reaches OpenAI.
//
// ponytail: in-memory counters, single process. If this ever runs multi-instance
// behind a load balancer, move the counters to Redis — the interface won't change.

const PER_PROJECT_LIMIT = Number(process.env.IMAGE_LIMIT_PER_PROJECT ?? 8);
const PER_HOUR_LIMIT = Number(process.env.IMAGE_LIMIT_PER_HOUR ?? 60);
const HOUR_MS = 60 * 60 * 1000;

const perProject = new Map<string, number>();
let hourlyStamps: number[] = [];

export interface BudgetVerdict {
  ok: boolean;
  reason?: string;
}

/**
 * Ask permission to spend one image credit. Charges immediately on approval —
 * callers that fail afterwards simply forfeit the credit, which is the safe
 * direction to be wrong in.
 */
export function chargeImage(projectKey: string): BudgetVerdict {
  const now = Date.now();

  hourlyStamps = hourlyStamps.filter((t) => now - t < HOUR_MS);
  if (hourlyStamps.length >= PER_HOUR_LIMIT) {
    return {
      ok: false,
      reason: `Hourly image limit reached (${PER_HOUR_LIMIT}/hour across all users). Showing sample art instead — this resets within the hour.`,
    };
  }

  const used = perProject.get(projectKey) ?? 0;
  if (used >= PER_PROJECT_LIMIT) {
    return {
      ok: false,
      reason: `This project has used its ${PER_PROJECT_LIMIT} generated images. Showing sample art instead — start a new project for more.`,
    };
  }

  perProject.set(projectKey, used + 1);
  hourlyStamps.push(now);
  return { ok: true };
}

/** Current usage, for the in-app budget indicator. */
export function budgetStatus(projectKey: string) {
  const now = Date.now();
  hourlyStamps = hourlyStamps.filter((t) => now - t < HOUR_MS);
  return {
    projectUsed: perProject.get(projectKey) ?? 0,
    projectLimit: PER_PROJECT_LIMIT,
    hourUsed: hourlyStamps.length,
    hourLimit: PER_HOUR_LIMIT,
  };
}
