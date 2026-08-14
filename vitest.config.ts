import { defineConfig } from "vitest/config";
import path from "node:path";

// jsdom for everything: the pure-logic tests don't care, and the component
// tests need a DOM. jsdom has no indexedDB, so lib/store/idbStorage falls back
// to its no-op store — which is exactly the "storage present but empty" state
// the hydration tests want to exercise.
//
// No @vitejs/plugin-react: it requires vite 8 while vitest 2.1.8 pins vite 5.
// esbuild transforms the JSX on its own once told which runtime to use
// (tsconfig says "preserve", which is right for Next and wrong for tests).
export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["lib/**/*.test.ts", "components/**/*.test.tsx", "app/**/*.test.tsx"],
  },
});
