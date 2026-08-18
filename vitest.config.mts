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
