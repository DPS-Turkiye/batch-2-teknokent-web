import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  type Awareness,
} from "y-protocols/awareness";

import { base64ToBytes, bytesToBase64 } from "@/lib/base64";

const REMOTE_ORIGIN = "remote";

const PRESENCE_COLORS = [
  "#4f39f6",
  "#0d9488",
  "#d97706",
  "#db2777",
  "#7c3aed",
  "#2563eb",
];

export type PresenceUser = {
  name: string;
  color: string;
};

export type PublishPresenceUpdate = (update: string) => void;

export type MeetingNotePresenceBridge = {
  applyRemoteUpdate: (update: string) => void;
  destroy: () => void;
};

type AwarenessChanges = {
  added: number[];
  updated: number[];
  removed: number[];
};

function encodeClients(awareness: Awareness, clients: number[]): string {
  return bytesToBase64(encodeAwarenessUpdate(awareness, clients));
}

function hasVisiblePresence(state: Record<string, unknown> | null): boolean {
  return state != null && (state.user != null || state.cursor != null);
}

export function pickPresenceColor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  }
  return PRESENCE_COLORS[hash % PRESENCE_COLORS.length] ?? "#4f39f6";
}

export function bindMeetingNotePresence(
  awareness: Awareness,
  publish: PublishPresenceUpdate,
): MeetingNotePresenceBridge {
  let publishedCursor = false;

  const publishLocal = () => {
    if (!hasVisiblePresence(awareness.getLocalState())) return;
    publish(encodeClients(awareness, [awareness.clientID]));
  };

  const onUpdate = (changes: AwarenessChanges, origin: unknown) => {
    if (origin === REMOTE_ORIGIN) {
      if (changes.added.length > 0) {
        publishLocal();
      }
      return;
    }

    const local = awareness.getLocalState();
    if (
      publishedCursor &&
      local != null &&
      local.cursor == null &&
      !changes.removed.includes(awareness.clientID)
    ) {
      return;
    }

    const clients = [...changes.added, ...changes.updated, ...changes.removed];
    if (clients.length === 0) return;
    publish(encodeClients(awareness, clients));
    publishedCursor = local?.cursor != null;
  };

  awareness.on("update", onUpdate);
  publishLocal();

  return {
    applyRemoteUpdate: (update: string) =>
      applyAwarenessUpdate(awareness, base64ToBytes(update), REMOTE_ORIGIN),
    destroy: () => {
      awareness.setLocalState(null);
      awareness.off("update", onUpdate);
      if (awareness.getLocalState() === null) {
        awareness.setLocalState({});
      }
    },
  };
}
