"use client";

import { Client } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  meetingNoteQueryKey,
  meetingTodosQueryKey,
} from "@/hooks/use-meeting-notes";
import {
  MeetingRoomEventType,
  type MeetingRoomEvent,
} from "@/interfaces/meeting-note";
import { postRealtimeToken } from "@/lib/client/meeting-notes";
import { getMeetingRoomTopic, getRealtimeUrl } from "@/lib/const";

export enum RealtimeStatus {
  Connecting = "connecting",
  Connected = "connected",
  Offline = "offline",
}

export function useMeetingRoomSocket(meetingId: string) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(RealtimeStatus.Connecting);

  useEffect(() => {
    if (!meetingId) return;

    const client = new Client({
      brokerURL: getRealtimeUrl(),
      reconnectDelay: 4000,
      beforeConnect: async () => {
        try {
          const { token } = await postRealtimeToken();
          client.brokerURL = `${getRealtimeUrl()}?token=${encodeURIComponent(token)}`;
        } catch (error) {
          console.error("Realtime token could not be issued", error);
          setStatus(RealtimeStatus.Offline);
        }
      },
      onConnect: () => {
        setStatus(RealtimeStatus.Connected);
        client.subscribe(getMeetingRoomTopic(meetingId), (message) => {
          const event = JSON.parse(message.body) as MeetingRoomEvent;
          if (event.type === MeetingRoomEventType.NoteUpdated && event.note) {
            queryClient.setQueryData(
              meetingNoteQueryKey(meetingId),
              event.note,
            );
          }
          if (event.type === MeetingRoomEventType.TodosUpdated && event.todos) {
            queryClient.setQueryData(
              meetingTodosQueryKey(meetingId),
              event.todos,
            );
          }
        });
      },
      onWebSocketClose: () => setStatus(RealtimeStatus.Offline),
      onStompError: () => setStatus(RealtimeStatus.Offline),
    });

    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [meetingId, queryClient]);

  return status;
}
