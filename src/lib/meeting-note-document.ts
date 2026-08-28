import * as Y from "yjs";

import { base64ToBytes, bytesToBase64 } from "@/lib/base64";

export const REMOTE_ORIGIN = "remote";
export const CONTRIBUTORS_KEY = "contributors";
export const CONTRIBUTORS_ORIGIN = "contributors";
const PERSIST_DELAY_MS = 3000;

export type PublishDocumentUpdate = (
  update: string,
  fullState: boolean,
) => void;

export type MeetingNoteDocumentBridge = {
  applyRemoteUpdate: (update: string) => void;
  persistFullState: () => void;
  destroy: () => void;
};

export function addMeetingNoteContributor(
  doc: Y.Doc,
  userId: string,
  name: string,
) {
  const trimmed = name.trim();
  if (!userId || !trimmed) return;
  const contributors = doc.getMap<string>(CONTRIBUTORS_KEY);
  if (contributors.get(userId) === trimmed) return;
  doc.transact(() => {
    contributors.set(userId, trimmed);
  }, CONTRIBUTORS_ORIGIN);
}

export function meetingNoteContributorNames(doc: Y.Doc): string[] {
  return Array.from(doc.getMap<string>(CONTRIBUTORS_KEY).values()).filter(
    Boolean,
  );
}

export function formatMeetingNoteContributors(doc: Y.Doc): string {
  return meetingNoteContributorNames(doc).join(", ");
}

export function bindMeetingNoteContributors(
  doc: Y.Doc,
  contributor: { userId: string; name: string } | null,
  shouldIgnore?: () => boolean,
) {
  const onUpdate = (_update: Uint8Array, origin: unknown) => {
    if (origin === REMOTE_ORIGIN || origin === CONTRIBUTORS_ORIGIN) return;
    if (shouldIgnore?.()) return;
    if (!contributor) return;
    addMeetingNoteContributor(doc, contributor.userId, contributor.name);
  };

  doc.on("update", onUpdate);
  return () => {
    doc.off("update", onUpdate);
  };
}

export function bindMeetingNoteDocument(
  doc: Y.Doc,
  publish: PublishDocumentUpdate,
): MeetingNoteDocumentBridge {
  let persistTimer: ReturnType<typeof setTimeout> | null = null;

  const persistFullState = () => {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    publish(bytesToBase64(Y.encodeStateAsUpdate(doc)), true);
  };

  const schedulePersist = () => {
    if (persistTimer) return;
    persistTimer = setTimeout(persistFullState, PERSIST_DELAY_MS);
  };

  const onUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin !== REMOTE_ORIGIN) {
      publish(bytesToBase64(update), false);
    }
    schedulePersist();
  };

  doc.on("update", onUpdate);

  return {
    applyRemoteUpdate: (update: string) =>
      Y.applyUpdate(doc, base64ToBytes(update), REMOTE_ORIGIN),
    persistFullState,
    destroy: () => {
      if (persistTimer) {
        clearTimeout(persistTimer);
        persistTimer = null;
      }
      doc.off("update", onUpdate);
    },
  };
}
