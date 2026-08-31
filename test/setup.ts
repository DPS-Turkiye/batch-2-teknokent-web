import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  // Wizard drafts persist to sessionStorage, which jsdom shares across tests
  // in a file. Without this, one test's draft is restored by the next.
  try {
    sessionStorage.clear();
  } catch {
    // Not every environment exposes storage; nothing to clear.
  }
});
