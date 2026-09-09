import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom has no layout, so its scrollTo logs "Not implemented" on every wizard
// step change. Tests that assert on scrolling stub this with vi.stubGlobal.
window.scrollTo = () => {};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  // Login persistence, Google Calendar tokens and the transcript-bot-sent
  // flag still live in sessionStorage, which jsdom shares across tests.
  try {
    sessionStorage.clear();
  } catch {
    // Not every environment exposes storage; nothing to clear.
  }
});
