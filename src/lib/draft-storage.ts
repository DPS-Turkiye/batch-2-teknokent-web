/**
 * File handles cannot survive JSON (or a round-trip through the server). The
 * surrounding {name, size} is kept so a restore can tell the user to attach
 * the file again rather than pretending it is still there.
 */
export function stripFileHandles<T>(value: T): T {
  try {
    return JSON.parse(
      JSON.stringify(value, (_, entry) =>
        typeof File !== "undefined" && entry instanceof File
          ? undefined
          : entry,
      ),
    ) as T;
  } catch {
    return value;
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
