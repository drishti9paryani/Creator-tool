import { defineConfig } from "vitest/config";
import path from "node:path";

// Minimal config: the tests only need the "@/" path alias that tsconfig
// defines. No jsdom environment — the logic under test is pure.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    include: ["lib/**/*.test.ts"],
  },
});
