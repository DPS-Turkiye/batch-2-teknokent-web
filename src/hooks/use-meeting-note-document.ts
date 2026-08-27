"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";

import { getMeetingNoteDocument } from "@/lib/client/meeting-notes";
import {
  bindMeetingNoteDocument,
  type MeetingNoteDocumentBridge,
  type PublishDocumentUpdate,
} from "@/lib/meeting-note-document";

export enum DocumentStatus {
  Loading = "loading",
  Ready = "ready",
  Failed = "failed",
}

type SubscribeToDocumentUpdates = (
  listener: (update: string) => void,
) => () => void;

export function useMeetingNoteDocument(
  meetingId: string,
  connected: boolean,
  subscribeToDocumentUpdates: SubscribeToDocumentUpdates,
  publishDocumentUpdate: PublishDocumentUpdate,
) {
  const [doc] = useState(() => new Y.Doc());
  const [status, setStatus] = useState(DocumentStatus.Loading);
  const [seedFromSnapshot, setSeedFromSnapshot] = useState(false);
  const bridge = useRef<MeetingNoteDocumentBridge | null>(null);

  useEffect(() => {
    if (!meetingId || !connected) return;

    const documentBridge = bindMeetingNoteDocument(doc, publishDocumentUpdate);
    bridge.current = documentBridge;
    const unsubscribe = subscribeToDocumentUpdates(
      documentBridge.applyRemoteUpdate,
    );
    let cancelled = false;

    void getMeetingNoteDocument(meetingId)
      .then((document) => {
        if (cancelled) return;
        if (document.state) {
          documentBridge.applyRemoteUpdate(document.state);
        }
        setSeedFromSnapshot(document.seedFromSnapshot);
        setStatus(DocumentStatus.Ready);
      })
      .catch((error) => {
        console.error("Meeting note document could not be loaded", error);
        if (!cancelled) setStatus(DocumentStatus.Failed);
      });

    return () => {
      cancelled = true;
      unsubscribe();
      documentBridge.destroy();
      bridge.current = null;
    };
  }, [
    connected,
    doc,
    meetingId,
    publishDocumentUpdate,
    subscribeToDocumentUpdates,
  ]);

  const persistFullState = useCallback(
    () => bridge.current?.persistFullState(),
    [],
  );

  return { doc, status, seedFromSnapshot, persistFullState };
}
