export type AddBotResult = {
  id: string;
  platform: string;
  nativeMeetingId: string;
  status: string;
  title: string;
};

export type TranscriptSegment = {
  id: string;
  speaker: string;
  text: string;
  at: string;
};

export type MeetingStatus =
  "scheduled" | "joining" | "active" | "completed" | "failed";

export type MeetingPlatform = "Google Meet" | "Zoom" | "Teams" | "Jitsi";

export type Meeting = {
  id: string;
  title: string;
  platform: MeetingPlatform;
  platformKey: string;
  nativeMeetingId: string;
  status: MeetingStatus;
  when: string;
  participants: string[];
};

export type TranscriptLine = {
  id: string;
  speaker: string;
  text: string;
  at: string;
};
