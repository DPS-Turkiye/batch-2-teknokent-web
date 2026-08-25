export type MeetingNote = {
  meetingId: string;
  content: string;
  version: number;
  updatedById?: string | null;
  updatedByName?: string | null;
  updatedAt?: string | null;
};

export type MeetingTodo = {
  id: string;
  meetingId: string;
  title: string;
  done: boolean;
  displayOrder: number;
  createdByName?: string | null;
  updatedAt?: string | null;
};

export enum MeetingRoomEventType {
  NoteUpdated = "NOTE_UPDATED",
  TodosUpdated = "TODOS_UPDATED",
}

export type MeetingRoomEvent = {
  type: MeetingRoomEventType;
  note?: MeetingNote | null;
  todos?: MeetingTodo[] | null;
};

export type RealtimeToken = {
  token: string;
  expiresAt: string;
};
