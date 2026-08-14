#!/usr/bin/env node
/**
 * `npm run keys` — set API keys once, for every project on this machine.
 *
 * Why this exists: hand-editing .env.local per project is the thing nobody
 * keeps doing, so keys end up pasted into chats, commits and screenshots.
 * Node reads process.env before it reads any .env file, so a Windows USER-level
 * environment variable (setx) works everywhere, survives reboots, and lives in
 * exactly one place — no file in any repo to leak.
 *
 * Input is never echoed, never logged, and never printed back. Existing values
 * are only ever shown as a masked fingerprint (sk-…a91f) so you can confirm
 * WHICH key is set without exposing it.
 *
 * Usage:
 *   npm run keys              interactive: shows status, then prompts
 *   npm run keys -- --status  show status only, change nothing
 *   npm run keys -- --local   write to this project's .env.local instead
 *   npm run keys -- --clear   remove the keys from the user environment
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import process from "node:process";

const KEYS = [
  {
    name: "OPENCODE_API_KEY",
    label: "Text / story generation (opencode Zen → Gemini)",
    where: "https://opencode.ai — Zen dashboard",
    cost: "cents per project",
  },
  {
    name: "OPENAI_API_KEY",
    label: "Image generation (characters, locations, storyboards)",
    where: "https://platform.openai.com/api-keys",
    cost: "dollars per project — this is the one that costs real money",
  },
];

const args = new Set(process.argv.slice(2));
const isWindows = process.platform === "win32";
const projectEnv = join(process.cwd(), ".env.local");

// ── helpers ────────────────────────────────────────────────────────────────

/** Masked fingerprint: enough to identify a key, useless if seen. */
function fingerprint(value) {
  if (!value) return null;
  const v = value.trim();
  if (v.length <= 10) return `${v.slice(0, 2)}…(${v.length} chars)`;
  return `${v.slice(0, 5)}…${v.slice(-4)}  (${v.length} chars)`;
}

function readLocalEnv() {
  if (!existsSync(projectEnv)) return {};
  const out = {};
  for (const line of readFileSync(projectEnv, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

/** Read one line without echoing it to the terminal. */
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    // Suppress echo: readline still receives the characters, the terminal
    // just never shows them.
    let muted = false;
    const original = rl._writeToOutput?.bind(rl);
    rl._writeToOutput = function (str) {
      if (!muted && original) return original(str);
      if (str.includes("\n")) process.stdout.write("\n");
    };
    rl.question(question, (answer) => {
      muted = false;
      rl.close();
      resolve(answer.trim());
    });
    muted = true;
  });
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (a) => {
      rl.close();
      resolve(a.trim());
    });
  });
}

/**
 * Persist to the Windows USER environment. setx is used rather than the
 * registry directly because it broadcasts the change; the value is passed as a
 * separate argv entry so it is never interpolated into a shell command line
 * (which would put it in command history).
 */
function setUserEnv(name, value) {
  if (!isWindows) return { ok: false, reason: "not Windows" };
  const res = spawnSync("setx", [name, value], { stdio: ["ignore", "pipe", "pipe"] });
  if (res.status !== 0) {
    return { ok: false, reason: (res.stderr?.toString() || "setx failed").trim() };
  }
  return { ok: true };
}

function clearUserEnv(name) {
  if (!isWindows) return;
  // setx with an empty value leaves an empty var; reg delete removes it.
  spawnSync("reg", ["delete", "HKCU\\Environment", "/F", "/V", name], {
    stdio: "ignore",
  });
}

function writeLocalEnv(values) {
  const existing = readLocalEnv();
  const merged = { ...existing, ...values };
  if (!merged.AI_PROVIDER) merged.AI_PROVIDER = "real";
  const body =
    "# Written by `npm run keys`. Git-ignored — never commit this file.\n" +
    Object.entries(merged)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") +
    "\n";
  writeFileSync(projectEnv, body, { encoding: "utf8", mode: 0o600 });
  try {
    chmodSync(projectEnv, 0o600);
  } catch {
    /* best effort on Windows */
  }
}

// ── status ─────────────────────────────────────────────────────────────────

function status() {
  const local = readLocalEnv();
  console.log("\n  API key status\n  " + "─".repeat(58));
  for (const k of KEYS) {
    const fromEnv = process.env[k.name];
    const fromLocal = local[k.name];
    const value = fromEnv || fromLocal;
    const source = fromEnv ? "user environment" : fromLocal ? ".env.local" : null;
    const fp = fingerprint(value);
    console.log(
      `  ${fp ? "✓" : "✗"} ${k.name.padEnd(20)} ${
        fp ? `${fp}   [${source}]` : "not set"
      }`
    );
    console.log(`      ${k.label}`);
  }
  const provider = process.env.AI_PROVIDER || local.AI_PROVIDER || "mock";
  console.log("  " + "─".repeat(58));
  console.log(
    `  AI_PROVIDER = ${provider}  ${
      provider === "real" ? "(live AI)" : "(demo mode — no keys used)"
    }\n`
  );
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  if (args.has("--clear")) {
    for (const k of KEYS) clearUserEnv(k.name);
    console.log(
      "\n  Cleared from the user environment. Open a NEW terminal for it to take effect.\n" +
        "  Note: this does not touch .env.local in any project.\n"
    );
    return;
  }

  status();
  if (args.has("--status")) return;

  const local = args.has("--local");
  console.log(
    local
      ? "  Writing to this project's .env.local.\n"
      : isWindows
        ? "  Saving to your Windows user environment — every project on this PC\n" +
          "  picks these up automatically, and you never edit a .env again.\n"
        : "  Not on Windows: falling back to this project's .env.local.\n"
  );
  console.log("  Press Enter to skip any key and leave it unchanged.\n");

  const collected = {};
  for (const k of KEYS) {
    console.log(`  ${k.name}`);
    console.log(`    ${k.label}`);
    console.log(`    Get one: ${k.where}`);
    console.log(`    Cost: ${k.cost}`);
    const value = await askHidden("    Paste key (hidden, or Enter to skip): ");
    if (value) collected[k.name] = value;
    console.log("");
  }

  if (Object.keys(collected).length === 0) {
    console.log("  Nothing changed.\n");
    return;
  }

  const useLocal = local || !isWindows;
  if (useLocal) {
    writeLocalEnv(collected);
    console.log(`  Saved to ${projectEnv}`);
  } else {
    for (const [name, value] of Object.entries(collected)) {
      const res = setUserEnv(name, value);
      console.log(
        res.ok
          ? `  ✓ ${name} saved to your user environment`
          : `  ✗ ${name} failed: ${res.reason}`
      );
    }
  }

  const turnOn = await ask("\n  Switch this project to live AI now? [Y/n] ");
  if (turnOn.toLowerCase() !== "n") {
    if (useLocal) {
      writeLocalEnv({ ...collected, AI_PROVIDER: "real" });
    } else {
      const res = setUserEnv("AI_PROVIDER", "real");
      if (!res.ok) console.log(`  ✗ AI_PROVIDER: ${res.reason}`);
    }
    console.log("  AI_PROVIDER = real");
  }

  console.log(
    "\n  Done. Restart the dev server in a NEW terminal:\n" +
      "    npm run dev\n\n" +
      "  A new terminal is required — a running one still holds the old\n" +
      "  environment. Check anytime with:  npm run keys -- --status\n"
  );
}

main().catch((e) => {
  console.error("\n  Failed:", e.message, "\n");
  process.exit(1);
});
