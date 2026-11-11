import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Dates render in the browser's zone; pin it so expected clock times match on UTC CI runners too.
process.env.TZ = "Europe/Istanbul";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // A fresh forks worker builds jsdom again for every file. vmForks builds
    // it once per worker and still gives each file a fresh window. A child
    // process, unlike vmThreads, starts with the Istanbul TZ pinned above.
    // https://vitest.dev/guide/improving-performance#test-environments
    // Coverage runs (CI) use plain forks instead: under V8 coverage the vm pool
    // was over twice as slow and once crashed a worker with SIGSEGV.
    pool: "vmForks",
    // jsdom defaults to localhost:3000, so an unmocked fetch would reach a
    // local dev server and fail differently than on CI; nothing listens on 9.
    environmentOptions: { jsdom: { url: "http://localhost:9/" } },
    setupFiles: ["./test/setup.ts"],
    globals: true,
    css: false,
    include: ["test/**/*.{test,spec}.{ts,tsx}"],
    // The multi-step signup and onboarding walks type dozens of characters
    // through userEvent, which is slow enough in jsdom to trip the 5s default.
    testTimeout: 20000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/messages/**"],
      reporter: ["text-summary", "json-summary"],
      // A floor just under the measured coverage: a change that drops it fails CI.
      // Raise these as coverage grows; never lower them to make a change pass.
      thresholds: {
        statements: 87,
        branches: 80,
        functions: 86,
        lines: 88,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@test": path.resolve(import.meta.dirname, "./test"),
      "server-only": path.resolve(
        import.meta.dirname,
        "./test/mocks/server-only.ts",
      ),
    },
  },
});
