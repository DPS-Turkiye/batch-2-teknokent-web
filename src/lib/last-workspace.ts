import type { Workspace } from "@/interfaces/workspace";
import { isWorkspace } from "@/lib/workspaces";

/** The workspace last switched to, kept in this browser past sign-out so the next sign-in opens it again. */
export const LAST_WORKSPACE_KEY = "menton_last_workspace";

// Storage can be missing (server render) or throw (blocked site data, private mode); the first workspace then opens.
function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readLastWorkspace(): Workspace | undefined {
  try {
    const saved = storage()?.getItem(LAST_WORKSPACE_KEY);
    return isWorkspace(saved) ? saved : undefined;
  } catch {
    return undefined;
  }
}

export function saveLastWorkspace(workspace: Workspace) {
  try {
    storage()?.setItem(LAST_WORKSPACE_KEY, workspace);
  } catch {
    // A full or blocked storage only means the next sign-in opens the first workspace.
  }
}
