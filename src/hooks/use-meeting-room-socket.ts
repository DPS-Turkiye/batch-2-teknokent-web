"use client";

import { Client } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { meetingTodosQueryKey } from "@/hooks/use-meeting-notes";
import {
  MeetingRoomEventType,
  type MeetingRoomEvent,
} from "@/interfaces/meeting-note";
import { postRealtimeToken } from "@/lib/client/meeting-notes";
import {
  getMeetingDocumentDestination,
  getMeetingPresenceDestination,
  getMeetingRoomTopic,
  getRealtimeUrl,
} from "@/lib/const";

export enum RealtimeStatus {
  Connecting = "connecting",
  Connected = "connected",
  Offline = "offline",
}

type RealtimeUpdateListener = (update: string) => void;

export function useMeetingRoomSocket(meetingId: string, enabled = true) {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState(
    RealtimeStatus.Connecting,
  );
  const clientRef = useRef<Client | null>(null);
  const listeners = useRef(new Set<RealtimeUpdateListener>());
  const presenceListeners = useRef(new Set<RealtimeUpdateListener>());

  useEffect(() => {
    if (!meetingId || !enabled) return;

    const client = new Client({
      brokerURL: getRealtimeUrl(),
      reconnectDelay: 4000,
      beforeConnect: async () => {
        try {
          const { token } = await postRealtimeToken();
          client.brokerURL = `${getRealtimeUrl()}?token=${encodeURIComponent(token)}`;
        } catch (error) {
          console.error("Realtime token could not be issued", error);
          setConnectionStatus(RealtimeStatus.Offline);
        }
      },
      onConnect: () => {
        setConnectionStatus(RealtimeStatus.Connected);
        client.subscribe(getMeetingRoomTopic(meetingId), (message) => {
          const event = JSON.parse(message.body) as MeetingRoomEvent;
          if (
            event.type === MeetingRoomEventType.DocumentUpdated &&
            event.update
          ) {
            const update = event.update;
            listeners.current.forEach((listener) => listener(update));
          }
          if (
            event.type === MeetingRoomEventType.PresenceUpdated &&
            event.update
          ) {
            const update = event.update;
            presenceListeners.current.forEach((listener) => listener(update));
          }
          if (event.type === MeetingRoomEventType.TodosUpdated && event.todos) {
            queryClient.setQueryData(
              meetingTodosQueryKey(meetingId),
              event.todos,
            );
          }
        });
      },
      onWebSocketClose: () => setConnectionStatus(RealtimeStatus.Offline),
      onStompError: () => setConnectionStatus(RealtimeStatus.Offline),
    });

    clientRef.current = client;
    client.activate();
    return () => {
      clientRef.current = null;
      void client.deactivate();
    };
  }, [enabled, meetingId, queryClient]);

  const subscribeToDocumentUpdates = useCallback(
    (listener: RealtimeUpdateListener) => {
      listeners.current.add(listener);
      return () => {
        listeners.current.delete(listener);
      };
    },
    [],
  );

  const subscribeToPresenceUpdates = useCallback(
    (listener: RealtimeUpdateListener) => {
      presenceListeners.current.add(listener);
      return () => {
        presenceListeners.current.delete(listener);
      };
    },
    [],
  );

  const publishDocumentUpdate = useCallback(
    (update: string, fullState: boolean) => {
      const client = clientRef.current;
      if (!client?.connected) return;
      client.publish({
        destination: getMeetingDocumentDestination(meetingId),
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ update, fullState }),
      });
    },
    [meetingId],
  );

  const publishPresenceUpdate = useCallback(
    (update: string) => {
      const client = clientRef.current;
      if (!client?.connected) return;
      client.publish({
        destination: getMeetingPresenceDestination(meetingId),
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ update }),
      });
    },
    [meetingId],
  );

  return {
    status: enabled && meetingId ? connectionStatus : RealtimeStatus.Offline,
    subscribeToDocumentUpdates,
    publishDocumentUpdate,
    subscribeToPresenceUpdates,
    publishPresenceUpdate,
  };
}
