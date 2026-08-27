import * as Y from "yjs";

import { base64ToBytes, bytesToBase64 } from "@/lib/base64";

const REMOTE_ORIGIN = "remote";
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
