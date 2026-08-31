const PREFIX = "metual.draft.";

/**
 * Wizard drafts live in sessionStorage, not localStorage: an in-progress
 * signup should not outlive the tab or be visible to the next person on a
 * shared machine. Every access is guarded — storage throws outright in some
 * privacy modes.
 */
export function saveDraft(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(
      PREFIX + key,
      // File handles cannot survive serialisation; the surrounding
      // {name, size} is kept so the restore can report what was lost.
      JSON.stringify(value, (_, entry) =>
        typeof File !== "undefined" && entry instanceof File
          ? undefined
          : entry,
      ),
    );
  } catch {
    // A draft that cannot be saved must not break the wizard.
  }
}

export function loadDraft<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string): void {
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {
    // Nothing to do; a stale draft is cleared on the next successful submit.
  }
}

export type Attachment = { name: string; size: number; file?: File } | null;

/**
 * An attachment restored without its File would be silently skipped at upload
 * time, so it is dropped and counted instead — the wizard tells the user to
 * attach it again rather than pretending it is still there.
 */
export function dropDetachedFile(value: Attachment): {
  value: Attachment;
  dropped: number;
} {
  if (value && !value.file) return { value: null, dropped: 1 };
  return { value, dropped: 0 };
}
