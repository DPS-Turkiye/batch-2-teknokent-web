import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

// Dates render in the browser's zone; pin it so expected clock times match on UTC CI runners too.
process.env.TZ = "Europe/Istanbul";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
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
