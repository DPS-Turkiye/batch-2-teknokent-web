export type AddBotResult = {
  id: string;
  assistantSessionId: string;
  platform: string;
  status: string;
  title: string;
};

export type TranscriptSegment = {
  id: string;
  speaker: string;
  text: string;
  at: string;
};

export enum BotStatus {
  Sending = "sending",
  Ok = "ok",
  Err = "err",
}

export enum MeetingStatus {
  Scheduled = "scheduled",
  Joining = "joining",
  Active = "active",
  Completed = "completed",
  Failed = "failed",
}

export type MeetingStatusColor =
  | "var(--ma-blue)"
  | "var(--ma-accent)"
  | "var(--ma-green)"
  | "var(--ma-danger)";

export type MeetingStatusBg =
  | "var(--ma-bluebg)"
  | "var(--ma-accentbg)"
  | "var(--ma-greenbg)"
  | "var(--ma-dangerbg)";

export type MeetingStatusMeta = {
  label: string;
  color: MeetingStatusColor;
  bg: MeetingStatusBg;
};

export enum MeetingPlatform {
  GoogleMeet = "Google Meet",
  Zoom = "Zoom",
  Teams = "Teams",
  Jitsi = "Jitsi",
}

export type Meeting = {
  id: string;
  title: string;
  platform: MeetingPlatform;
  platformKey: string;
  assistantSessionId?: string;
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

export type MeetingReportActionItem = {
  owner: string | null;
  task: string;
  due: string | null;
};

export type MeetingReport = {
  title: string;
  meetingDate: string | null;
  topic: string | null;
  summary: string;
  topicsDiscussed: string[];
  decisions: string[];
  actionItems: MeetingReportActionItem[];
  risksOrBlockers: string[];
  nextSteps: string[];
  model: string;
};
