"use client";

import { useEffect, useState } from "react";
import { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";

import {
  bindMeetingNotePresence,
  type PublishPresenceUpdate,
} from "@/lib/meeting-note-presence";

type SubscribeToPresenceUpdates = (
  listener: (update: string) => void,
) => () => void;

export function useMeetingNotePresence(
  doc: Y.Doc,
  connected: boolean,
  subscribeToPresenceUpdates: SubscribeToPresenceUpdates,
  publishPresenceUpdate: PublishPresenceUpdate,
) {
  const [awareness] = useState(() => new Awareness(doc));

  useEffect(() => () => awareness.destroy(), [awareness]);

  useEffect(() => {
    if (!connected) return;

    const bridge = bindMeetingNotePresence(awareness, publishPresenceUpdate);
    const unsubscribe = subscribeToPresenceUpdates(bridge.applyRemoteUpdate);

    return () => {
      unsubscribe();
      bridge.destroy();
    };
  }, [awareness, connected, publishPresenceUpdate, subscribeToPresenceUpdates]);

  return awareness;
}
