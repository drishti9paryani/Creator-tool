// Runs once when the Next.js server boots. When AI_PROVIDER=real, it pings both
// backends and logs their health, so a missing key or unfunded account shows up
// immediately at startup instead of silently falling back mid-demo.
// Never throws — a failed check must not stop the server.

export async function register() {
  // Only the Node.js server runtime, and only for the real provider.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if ((process.env.AI_PROVIDER ?? "mock") !== "real") {
    console.log("[health] AI_PROVIDER=mock — skipping live provider checks");
    return;
  }

  await Promise.all([checkImages(), checkText()]);
}

// OpenAI: /v1/models is a free GET — verifies the key is valid and active.
async function checkImages() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return console.warn("[health] images: FAIL — OPENAI_API_KEY not set");
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.ok) console.log("[health] images (OpenAI): ok");
    else console.warn(`[health] images (OpenAI): FAIL — HTTP ${res.status}`);
  } catch (e) {
    console.warn("[health] images (OpenAI): FAIL —", (e as Error).message);
  }
}

// opencode: a 1-token completion. An auth/credits failure returns non-OK
// without billing tokens, so this doubles as a balance check.
async function checkText() {
  const key = process.env.OPENCODE_API_KEY;
  if (!key) return console.warn("[health] text: FAIL — OPENCODE_API_KEY not set");
  const base = process.env.OPENCODE_BASE_URL ?? "https://opencode.ai/zen/v1";
  const model = process.env.OPENCODE_MODEL ?? "gemini-3.5-flash-lite";
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, max_tokens: 1, messages: [{ role: "user", content: "ping" }] }),
    });
    if (res.ok) {
      console.log(`[health] text (opencode/${model}): ok`);
    } else {
      const body = await res.text().catch(() => "");
      console.warn(`[health] text (opencode/${model}): FAIL — HTTP ${res.status} ${body.slice(0, 160)}`);
    }
  } catch (e) {
    console.warn("[health] text (opencode): FAIL —", (e as Error).message);
  }
}
