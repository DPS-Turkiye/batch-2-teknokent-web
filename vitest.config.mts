import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globals: true,
    css: false,
    include: ["test/**/*.{test,spec}.{ts,tsx}"],
    // The multi-step signup and onboarding walks type dozens of characters
    // through userEvent, which is slow enough in jsdom to trip the 5s default.
    testTimeout: 20000,
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
