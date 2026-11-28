import { afterEach, describe, expect, it, vi } from "vitest";

import { Workspace } from "@/interfaces/workspace";
import {
  LAST_WORKSPACE_KEY,
  readLastWorkspace,
  saveLastWorkspace,
} from "@/lib/last-workspace";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("last workspace", () => {
  it("remembers the workspace last switched to in this browser", () => {
    expect(readLastWorkspace()).toBeUndefined();
    saveLastWorkspace(Workspace.Coordinator);
    expect(readLastWorkspace()).toBe(Workspace.Coordinator);
  });

  it("ignores anything that is not a workspace", () => {
    localStorage.setItem(LAST_WORKSPACE_KEY, "ROOT");
    expect(readLastWorkspace()).toBeUndefined();
  });

  it("carries on when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveLastWorkspace(Workspace.Admin)).not.toThrow();
    expect(readLastWorkspace()).toBeUndefined();
  });
});
